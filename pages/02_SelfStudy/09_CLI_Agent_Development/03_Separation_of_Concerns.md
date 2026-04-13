# 03. 関心の分離と4層アーキテクチャ

ソフトウェアを「役割ごとにモジュールを分ける」ことで、保守性・テスト容易性・差し替え可能性を飛躍的に高める設計原則**関心の分離（Separation of Concerns / SoC）**を、CLIエージェントのアーキテクチャを例に解説します。

> 📖 Flask（Python）における関心の分離（Blueprint + MVCアーキテクチャ）については **[FlaskのBlueprintによるMVCアーキテクチャ](../../01_25R1116/02_Backend/01_Flask/06_Flask_Blueprint_MVC_Architecture)** をご参照ください。本稿ではTypeScript/CLIの文脈で、よりレイヤー指向の設計を解説します。

## 1. 関心の分離 (SoC) とは何か

ソフトウェアの各部分が「自分の仕事だけに集中し、他の仕事に口を出さない」ように設計することです。

### 分離されていない場合（アンチパターン）

```typescript
// ❌ 全てが1つのファイルに密結合している
async function main() {
  // UI処理: ユーザー入力を受け取る
  const query = prompt("質問を入力: ");

  // Security処理: マスキング
  const masked = query.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, "[MASKED]");

  // Agent処理: LLMを呼ぶ
  const response = await fetch("https://api.gemini...", { body: masked });
  const json = await response.json();

  // Tool処理: 外部APIを叩く
  if (json.functionCall) {
    const logs = await fetch("https://monitoring.internal/api/logs");
    // ...
  }

  // UI処理: 結果を表示する
  console.log(json.text);
}
```

このコードの問題:
- **テスト不能**: LLMのAPI呼び出しとターミナル表示が混在しているため、単体テストが書けない
- **差し替え不能**: LLMプロバイダをGeminiからClaudeに変えたい場合、この巨大な関数全体を書き直す必要がある
- **読解困難**: 何がUI処理で何がビジネスロジックなのか判別できない

### 分離されている場合（ベストプラクティス）

```
src/
├── ui/          ← UI層: ターミナル入出力だけを担当
├── agent/       ← Agent層: LLM制御だけを担当
├── tools/       ← Tool層: 外部API通信だけを担当
└── security/    ← Security層: データマスキングだけを担当
```

各層は**自分の担当範囲だけ**を知っていればよく、他の層の内部実装を知る必要がありません。

## 2. CLIエージェントの4層アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│ UI層 (ui/)                                                │
│   ターミナルへの表示、ユーザー入力の受付、カラー出力          │
│   「何を表示するか」だけに責任を持つ                         │
├─────────────────────────────────────────────────────────┤
│ Agent層 (agent/)                                          │
│   LLMへのリクエスト構築、Function Callingループ制御          │
│   「LLMとどう会話するか」だけに責任を持つ                    │
├─────────────────────────────────────────────────────────┤
│ Security層 (security/)                                    │
│   Data Masking (IPアドレス、JWT等のサニタイズ)               │
│   「LLMに渡すデータから何を隠すか」だけに責任を持つ           │
├─────────────────────────────────────────────────────────┤
│ Tool層 (tools/)                                           │
│   外部API通信、レスポンスのパース、Zodによるバリデーション     │
│   「外部サービスとどう通信するか」だけに責任を持つ             │
└─────────────────────────────────────────────────────────┘
```

### 依存関係の方向（超重要ルール）

```
UI層 → Agent層 → Security層 → Tool層
 ↓        ↓          ↓          ↓
上位      中間        中間        下位

【鉄則】矢印は上から下への一方通行。下位層が上位層を呼ぶことは絶対にない。
```

- `UI層` は `Agent層` を呼ぶが、`Agent層` は `UI層` の存在を知らない
- `Tool層` は `Security層` や `Agent層` の存在を知らない

この一方通行のルールにより、例えば `Tool層` だけを差し替えても、上位の層に一切影響が出ません。

## 3. 各層の実装例

### UI層 — ターミナルへの入出力

```typescript
// ui/display.ts — 表示に関する処理だけを集約

/** 色付きで情報メッセージを表示する */
export function showInfo(message: string): void {
  console.log(`\x1b[36mℹ ${message}\x1b[0m`);  // シアン色
}

/** 色付きでエラーメッセージを表示する */
export function showError(message: string): void {
  console.error(`\x1b[31m✗ ${message}\x1b[0m`); // 赤色
}

/** 色付きで成功メッセージを表示する */
export function showSuccess(message: string): void {
  console.log(`\x1b[32m✓ ${message}\x1b[0m`);   // 緑色
}

/** LLMの分析結果を整形して表示する */
export function showAnalysis(analysis: string): void {
  console.log("\n── 分析結果 ──────────────────");
  console.log(analysis);
  console.log("──────────────────────────────\n");
}
```

### Agent層 — LLM制御

```typescript
// agent/oncallAgent.ts — LLMとの会話制御だけを担当
import { maskSensitiveData } from "../security/dataMasker";

export class OncallAgent {
  /**
   * ユーザーの質問を受け取り、LLMの最終回答を返す
   * UI層がどう表示するかは知らない（文字列を返すだけ）
   */
  async analyze(userQuery: string): Promise<string> {
    // Function Callingループを実行（詳細は01_Function_Calling参照）
    // ツール実行結果はSecurity層でマスキングしてからLLMに渡す
    const rawResult = await this.executeToolCall(toolName, args);
    const sanitized = maskSensitiveData(JSON.stringify(rawResult));
    // ...
    return finalAnswer;
  }
}
```

### Security層 — Data Masking

```typescript
// security/dataMasker.ts
// → 02_Data_Masking_and_Security.md に詳細実装を記載
export function maskSensitiveData(rawData: string): string { /* ... */ }
```

### Tool層 — 外部API通信

```typescript
// tools/fetchErrorLogs.ts — 特定の外部APIとの通信だけを担当
import { z } from "zod";

// Zodスキーマで外部APIのレスポンス形状を定義・保証する
const ErrorLogSchema = z.object({
  timestamp: z.string(),
  level: z.enum(["error", "warn", "info"]),
  message: z.string(),
  service: z.string(),
});

type ErrorLog = z.infer<typeof ErrorLogSchema>;

/**
 * 監視APIからエラーログを取得する
 * Agent層やUI層の存在は一切知らない（純粋にAPIと通信するだけ）
 */
export async function fetchErrorLogs(
  serviceName: string,
  minutes: number = 30
): Promise<ErrorLog[]> {
  const url = `https://monitoring.internal/api/logs?service=${serviceName}&minutes=${minutes}`;
  const response = await fetch(url);
  const rawData = await response.json();

  // Zodでバリデーション: APIが予期しない形状を返した場合はここでエラーにする
  return z.array(ErrorLogSchema).parse(rawData);
}
```

## 4. エントリーポイント — 全層の結合

```typescript
// src/index.ts — 各層を組み合わせるだけの「接着剤」
import { OncallAgent } from "./agent/oncallAgent";
import { showInfo, showError, showAnalysis } from "./ui/display";

async function main() {
  const query = process.argv.slice(2).join(" ");

  if (!query) {
    showError("使い方: oncall-agent <質問>");
    process.exit(1);
  }

  showInfo("分析を開始します...");

  try {
    const agent = new OncallAgent();
    const result = await agent.analyze(query);
    showAnalysis(result);
  } catch (error) {
    showError(`エラーが発生しました: ${error}`);
    process.exit(1);
  }
}

main();
```

## 5. なぜ分けるのか — 具体的なメリット

### テスト容易性

```typescript
// Security層だけを独立してテストできる（LLMやAPIへの接続不要）
import { maskSensitiveData } from "./security/dataMasker";

it("JWTをマスクすること", () => {
  expect(maskSensitiveData("token: eyJhbG...")).toContain("[MASKED_JWT]");
});
```

### 差し替え可能性

```
                     変更前                    変更後
Agent層:    @google/genai (Gemini)  →  @anthropic/sdk (Claude)
Tool層:     社内監視API               →  Datadog API
Security層: 正規表現マスキング         →  専用マスキングライブラリ

→ 変更した層以外のコードは一切変更不要
```

### Flask MVCとの対比

| Flask MVC | CLIエージェント4層 | 役割 |
| :--- | :--- | :--- |
| View (テンプレート) | UI層 | 表示 |
| Controller (ルート) | Agent層 | リクエスト制御 |
| Model (DB) | Tool層 | データ取得 |
| — (なし) | Security層 | セキュリティ |

Flaskでは「Security層」に相当するものがなかったが、LLMアプリケーションでは**外部にデータを送信する**という特性上、専用のセキュリティ層が必須となる。
