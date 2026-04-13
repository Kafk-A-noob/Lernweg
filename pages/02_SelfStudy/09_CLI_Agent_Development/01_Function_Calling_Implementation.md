# 01. Function Calling (Tool Use) 実装パターン

LLM（大規模言語モデル）に外部ツール（関数）の定義を渡し、AIが自律的にどのツールをどの引数で呼ぶかを判断・実行させる設計手法です。
ハルシネーション（もっともらしい嘘）を抑止し、**正確な一次情報**を取得するために使用します。

> 📖 Function Callingの歴史的な位置づけや、MCPとの関係については **[MCPとAgentic AI](../../02_SelfStudy/05_AI_Product_Development/01_MCP_and_Agentic_AI)** をご参照ください。

## 1. なぜFunction Callingが必要なのか

### LLMの致命的な弱点

LLMは「訓練データに含まれない情報」を知りません。例えば：

- 「今このサーバーのCPU使用率は？」→ **知るわけがない**（リアルタイムデータ）
- 「社内のアラート一覧を見せて」→ **アクセスできない**（社内システム）

にもかかわらず、LLMは「知らない」と正直に言わず、それらしい数値を**でっち上げて**回答してしまう（ハルシネーション）。

### Function Callingによる解決

「お前が直接答えるな。代わりにこの関数（ツール）を呼べ。結果を見てから答えろ」とLLMに指示する仕組みです。

```
ユーザー: 「api-serverの直近のエラーログを見せて」

  ┌─────────────────────────────────────────────────────┐
  │ LLM (Gemini)  「自分では知らないが、                     │
  │                 fetch_error_logs というツールがある。     │
  │                 service_name="api-server" で呼ぼう」    │
  └──────────────────────┬──────────────────────────────┘
                         │ Function Call リクエスト
                         ↓
  ┌─────────────────────────────────────────────────────┐
  │ Tool層  fetch_error_logs("api-server") を実行          │
  │         → 外部APIに問い合わせ → 生データ取得             │
  └──────────────────────┬──────────────────────────────┘
                         │ ツール実行結果（JSON）
                         ↓
  ┌─────────────────────────────────────────────────────┐
  │ LLM (Gemini)  取得した生データを読み解き、                │
  │                人間にわかりやすく要約して回答する           │
  └─────────────────────────────────────────────────────┘
```

## 2. @google/genai SDK の基本セットアップ

Google Gemini APIを操作するための公式最新SDKです。

```typescript
import { GoogleGenAI } from "@google/genai";

// APIキーでクライアントを初期化
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY, // 環境変数から取得（ハードコード厳禁）
});
```

### モデルの選定

```typescript
// Gemini 2.5 Flash: 高速・低コスト・Function Calling対応
// → CLIツールのような「即座に応答が欲しい」用途に最適
const modelName = "gemini-2.5-flash";
```

| モデル | 特徴 | 向いている用途 |
| :--- | :--- | :--- |
| **Gemini 2.5 Flash** | 高速・安価 | CLIツール、リアルタイム応答 |
| **Gemini 2.5 Pro** | 高精度・高コスト | 複雑な推論、長文分析 |

## 3. ツール定義（Function Declaration）

LLMに「こういう関数が使えるぞ」と**メニュー表**を渡す工程です。

```typescript
// ツール定義: LLMが呼べる関数の「メニュー表」
const tools = [
  {
    functionDeclarations: [
      {
        name: "fetch_error_logs",
        description: "指定されたサービスの直近のエラーログを取得する",
        parameters: {
          type: "object",
          properties: {
            service_name: {
              type: "string",
              description: "調査対象のサービス名 (例: api-server, auth-service)",
            },
            minutes: {
              type: "number",
              description: "何分前までのログを取得するか (デフォルト: 30)",
            },
          },
          required: ["service_name"], // service_name は必須、minutesは任意
        },
      },
      {
        name: "get_service_health",
        description: "指定されたサービスの現在の死活状態とレスポンスタイムを取得する",
        parameters: {
          type: "object",
          properties: {
            service_name: {
              type: "string",
              description: "調査対象のサービス名",
            },
          },
          required: ["service_name"],
        },
      },
    ],
  },
];
```

### 設計のコツ: `description` が全てを決める

LLMはこの `description` の文章だけを読んで「どのツールを呼ぶか」を判断します。
曖昧な記述をすると、LLMが間違ったツールを選択するか、ツールを呼ばずにハルシネーションで回答してしまいます。

- ❌ `"ログを取得する"` — 曖昧すぎてLLMが適切に判断できない
- ✅ `"指定されたサービスの直近のエラーログをJSON形式で取得する"` — 具体的

## 4. Function Callingループの実装

LLMとツール実行を**往復ループ**させる仕組みが核心です。

```typescript
import { GoogleGenAI, FunctionCallingMode } from "@google/genai";

async function runAgent(userQuery: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // チャット履歴を保持する配列
  const chatHistory: Array<{ role: string; parts: unknown[] }> = [];

  // ユーザーのメッセージを履歴に追加
  chatHistory.push({ role: "user", parts: [{ text: userQuery }] });

  // Function Callingループ（最大5回まで）
  for (let i = 0; i < 5; i++) {
    // LLMにリクエスト送信
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: chatHistory,
      tools: tools,
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingMode.AUTO, // LLMが自律的にツール使用を判断
        },
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("LLMからの応答がありません");

    // LLMの応答を履歴に追加
    chatHistory.push({ role: "model", parts: candidate.content.parts });

    // Function Callが含まれているか判定
    const functionCall = candidate.content.parts.find(
      (part: any) => part.functionCall
    );

    if (!functionCall?.functionCall) {
      // Function Callがない = LLMが最終回答を返した
      const textPart = candidate.content.parts.find((part: any) => part.text);
      return textPart?.text ?? "回答を生成できませんでした";
    }

    // ツールを実際に実行する
    const { name, args } = functionCall.functionCall;
    console.error(`[Agent] ツール実行中: ${name}(${JSON.stringify(args)})`);

    const toolResult = await executeToolByName(name, args);

    // ツールの実行結果をLLMに返す（次のループでLLMが結果を読む）
    chatHistory.push({
      role: "function",
      parts: [{ functionResponse: { name, response: toolResult } }],
    });
  }

  return "ツール呼び出しが上限に達しました。質問を具体的にしてください。";
}
```

### ループの流れ（図解）

```
[1回目] ユーザー質問 → LLM判断 → functionCall: fetch_error_logs → 実行 → 結果をLLMへ
[2回目] LLMが結果を読む → 追加調査が必要 → functionCall: get_service_health → 実行 → 結果をLLMへ
[3回目] LLMが全結果を総合 → テキストで最終回答を生成 → ループ終了
```

## 5. ツール実行のディスパッチャ

```typescript
// ツール名から実際の関数にルーティングする
async function executeToolByName(
  name: string,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  switch (name) {
    case "fetch_error_logs":
      return await fetchErrorLogs(args.service_name as string, args.minutes as number);
    case "get_service_health":
      return await getServiceHealth(args.service_name as string);
    default:
      return { error: `未知のツール: ${name}` };
  }
}
```

## 6. トラブルシューティング

- **Q. LLMがツールを呼ばずに自分で回答してしまう（ハルシネーション）**
  - **A.** `description` が曖昧な可能性があります。また、`functionCallingConfig.mode` を `ANY` にすると、ツール使用を強制できます（ただし最終回答もツール経由になるため注意）。
- **Q. LLMが存在しないツール名を呼ぼうとする**
  - **A.** ツール定義の `name` にタイポがないか確認してください。また、ディスパッチャの `default` ケースで必ずエラーハンドリングしてください。
- **Q. ループが5回の上限に達してしまう**
  - **A.** ユーザーの質問が広すぎる可能性があります。システムプロンプトで「1〜2回のツール呼び出しで回答できる範囲に絞れ」と指示を追加してください。
