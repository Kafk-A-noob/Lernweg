# 04. 自律エージェントのフェイルセーフ設計 — 暴走を物理的に防ぐ

LLMを用いた自律エージェントは、目的を達成するまで自分で判断し、APIを叩き、結果を分析してまた次のアクションを決定するループを繰り返します。
しかし、この自律性は「暴走」と紙一重です。本稿では、エージェントの暴走を**物理的・構造的に防止する**フェイルセーフ設計を解説します。

> 📖 Function Callingのループ実装については **[Function Calling (Tool Use) 実装パターン](./01_Function_Calling_Implementation)** をご参照ください。
> 📖 関心の分離アーキテクチャについては **[関心の分離と4層アーキテクチャ](./03_Separation_of_Concerns)** をご参照ください。

## 1. エージェントはなぜ暴走するのか

### 自律ループの特性

Function Callingベースのエージェントは、以下のループを実行します。

```
[ユーザー質問]
    ↓
┌─→ LLMが考える → ツールが必要か判断
│     ├── YES → ツールを実行 → 結果をLLMに返す → ループ先頭へ
│     └── NO  → テキストで最終回答 → ループ終了
└── ↑ この繰り返し
```

### 無限ループの発生メカニズム

以下のシナリオで、エージェントは無限ループに陥ります。

```
[シナリオ1: APIがダウンしている場合]
LLM: 「エラーログを取得しよう」 → fetch_error_logs() → 503エラー
LLM: 「情報が取れなかった。もう一度試そう」 → fetch_error_logs() → 503エラー
LLM: 「まだ取れない。別のAPIも試そう」 → get_service_health() → 503エラー
LLM: 「全然情報が集まらない。もう一度...」 → ∞（無限ループ）

[シナリオ2: 十分な情報を得られない場合]
LLM: 「もっと詳しいログが必要だ」→ fetch_detailed_logs()
LLM: 「まだ足りない。過去60分のログも」→ fetch_historical_logs()
LLM: 「関連サービスのログも確認したい」→ fetch_error_logs("auth-service")
LLM: 「念のためキャッシュサービスも...」→ ∞（完璧主義による暴走）
```

### 暴走の実害

```
┌──────────────────────────────────────────────┐
│ 1ループあたりのコスト（概算）                     │
│                                                │
│   LLM推論: 入力5,000トークン + 出力500トークン     │
│   = 約 ¥1〜5 / 1ループ（Gemini 2.5 Flash想定）    │
│                                                │
│ 暴走時:                                         │
│   1分あたり 約4〜10ループ × 60分                   │
│   = 240〜600ループ ≒ ¥240〜3,000 / 時間           │
│   放置すると1日で数万円の請求に                      │
└──────────────────────────────────────────────┘
```

## 2. Max-Loop Breaker（強制ループ上限）

### 設計思想

「AIがどんなに賢くても、物理的にN回以上はループさせない」という絶対的な制約をコードに埋め込みます。

### 実装

```typescript
const MAX_LOOP_ITERATIONS = 5; // ハードコードされた上限値

async function runAgentLoop(userQuery: string): Promise<string> {
  const chatHistory: ChatMessage[] = [];
  chatHistory.push({ role: "user", parts: [{ text: userQuery }] });

  // === Max-Loop Breaker ===
  for (let iteration = 0; iteration < MAX_LOOP_ITERATIONS; iteration++) {
    console.error(`[Agent] ループ ${iteration + 1}/${MAX_LOOP_ITERATIONS}`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: chatHistory,
      tools: toolDefinitions,
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("LLMからの応答がありません");

    chatHistory.push({ role: "model", parts: candidate.content.parts });

    // Function Callがあるか判定
    const functionCall = candidate.content.parts.find(
      (part: any) => part.functionCall
    );

    if (!functionCall?.functionCall) {
      // テキスト回答 = ループ正常終了
      const textPart = candidate.content.parts.find((p: any) => p.text);
      return textPart?.text ?? "回答を生成できませんでした";
    }

    // ツール実行
    const { name, args } = functionCall.functionCall;
    const toolResult = await executeToolCall(name, args);

    chatHistory.push({
      role: "function",
      parts: [{ functionResponse: { name, response: toolResult } }],
    });
  }

  // === ループ上限到達時の強制脱出 ===
  // これがMax-Loop Breakerの本体
  return "⚠️ ツール呼び出しが上限（5回）に達しました。質問をより具体的にしてください。";
}
```

### なぜ `while(true)` ではなく `for` ループなのか

```typescript
// ❌ while(true) — 脱出条件はLLMの判断に100%依存（危険）
while (true) {
  const response = await callLLM();
  if (response.isTextResponse) break;  // LLMが永遠にツールを呼び続けたら…
  await executeTool(response.functionCall);
}

// ✅ for ループ — 物理的にN回で強制終了（安全）
for (let i = 0; i < MAX_ITERATIONS; i++) {
  const response = await callLLM();
  if (response.isTextResponse) return response.text;
  await executeTool(response.functionCall);
}
return "上限に達しました";  // 必ずここに到達する保証がある
```

## 3. HTTPエラーの Graceful Handling

### 課題

外部APIが `503 (Service Unavailable)` や `429 (Too Many Requests)` を返した場合、そのエラーをそのまま `throw` するとCLIアプリ全体がクラッシュします。
かといって、空データをLLMに渡すと「データがないからもう一度試そう」と無限ループの原因になります。

### 解決策: エラーを「情報」としてLLMに渡す

```typescript
async function fetchErrorLogs(
  serviceName: string,
  minutes: number = 30
): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(
      `https://monitoring.internal/api/logs?service=${serviceName}&minutes=${minutes}`
    );

    // === HTTPステータスコードに応じたハンドリング ===
    if (response.status === 429) {
      // レートリミットに達した場合
      return {
        error: "APIレート制限に達しました。しばらく待ってから再試行してください。",
        status: 429,
        retryable: false,  // LLMに「再試行するな」と伝える
      };
    }

    if (response.status === 503) {
      // サービス停止中の場合
      return {
        error: `${serviceName} の監視APIは現在利用不可能です。`,
        status: 503,
        retryable: false,
      };
    }

    if (!response.ok) {
      return {
        error: `APIがエラーを返しました (HTTP ${response.status})`,
        status: response.status,
        retryable: false,
      };
    }

    return await response.json();

  } catch (networkError) {
    // ネットワーク自体が到達不能な場合（DNS解決失敗、タイムアウト等）
    return {
      error: "ネットワークエラー: 監視APIに接続できませんでした。",
      retryable: false,
    };
  }
}
```

### LLMの挙動

上記のように `{ error: "...", retryable: false }` という構造化されたエラー情報をLLMに返すと、LLMはこれを「APIが落ちている」という事実として理解し、ユーザーに以下のように自然言語で報告します。

```
[LLMの最終回答]
「申し訳ありません。現在 api-server の監視APIに接続できない状態です。
 インフラチームにAPIの稼働状況を確認してください。
 手動での確認方法: curl -I https://monitoring.internal/api/health」
```

## 4. タイムアウトと AbortController

外部APIがレスポンスを返さない（ハングする）場合、`fetch` はデフォルトでは無限に待ち続けます。
**AbortController**を使って、一定時間後に強制的にリクエストを打ち切ります。

```typescript
async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 10000  // デフォルト10秒
): Promise<Response> {
  const controller = new AbortController();

  // タイムアウトタイマーを設定
  const timeoutId = setTimeout(() => {
    controller.abort();  // 指定時間経過でリクエストを強制中断
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,  // AbortControllerのシグナルを渡す
    });
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`リクエストが${timeoutMs / 1000}秒でタイムアウトしました: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);  // 成功時はタイマーをクリア
  }
}
```

### ツール関数への統合

```typescript
async function fetchErrorLogs(serviceName: string): Promise<Record<string, unknown>> {
  try {
    // 10秒以内にレスポンスが返らなければ強制中断
    const response = await fetchWithTimeout(
      `https://monitoring.internal/api/logs?service=${serviceName}`,
      10000
    );
    // ... 通常のHTTPエラーハンドリング
  } catch (error) {
    return {
      error: `エラー: ${error instanceof Error ? error.message : String(error)}`,
      retryable: false,
    };
  }
}
```

## 5. レートリミットの仕組みと対策

### レートリミットとは

外部APIは「1分あたり60リクエストまで」のように、単位時間あたりのリクエスト数を制限しています。
これを超えると `429 Too Many Requests` が返されます。

LLMエージェントは自律的にAPIを叩くため、人間が操作するよりも遥かに速いペースでリクエストを送信し、レートリミットに到達しやすい傾向があります。

### Exponential Backoff（指数バックオフ）

```typescript
/**
 * リトライ回数に応じて待ち時間を指数的に増加させる
 * 1回目: 1秒待つ → 2回目: 2秒待つ → 3回目: 4秒待つ → 4回目: 8秒待つ
 */
async function fetchWithRetry(
  url: string,
  maxRetries: number = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetchWithTimeout(url);

    if (response.status !== 429) {
      return response;  // 429以外はそのまま返す
    }

    if (attempt === maxRetries) {
      throw new Error(`${maxRetries}回リトライしましたがレートリミットが解除されません`);
    }

    // 指数バックオフ: 2^attempt 秒 + ランダムなジッター
    const baseDelay = Math.pow(2, attempt) * 1000;  // 1s, 2s, 4s, 8s...
    const jitter = Math.random() * 1000;            // 0〜1秒のランダム
    const waitMs = baseDelay + jitter;

    console.error(`[Retry] ${waitMs.toFixed(0)}ms後にリトライします (${attempt + 1}/${maxRetries})`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  throw new Error("到達不能なコード");
}
```

### なぜジッター（ランダム揺らぎ）を加えるのか

複数のクライアントが同時に429を受け取った場合、全員が同じタイミング（例: ちょうど2秒後）にリトライすると、再びサーバーに負荷が集中します（**Thundering Herd問題**）。
ランダムな遅延を加えることで、リトライのタイミングを分散させます。

## 6. Pros/Cons（各パターン）

| パターン | 強み (Pros) | 弱み (Cons) |
| :--- | :--- | :--- |
| **Max-Loop Breaker** | 実装が簡単。暴走を100%防止できる | 上限値の設定が難しい（小さすぎると必要な処理が途中で打ち切られる） |
| **Graceful Error Handling** | CLIがクラッシュせず、ユーザーにわかりやすいメッセージを返せる | エラーの握りつぶし（本来検知すべきエラーを隠してしまう）に注意 |
| **AbortController** | ハングを防止。リソースリークを防ぐ | タイムアウト値の設定が難しい（短すぎると正常なレスポンスを切り捨ててしまう） |
| **Exponential Backoff** | レートリミット対策の業界標準パターン | リトライ中はユーザーを待たせることになる。CLIツールでは体感を損なう可能性 |

## 7. トラブルシューティング

- **Q. Max-Loopの上限に頻繁に到達する**
  - **A.** システムプロンプトに「1〜2回のツール呼び出しで回答できる範囲に情報を絞れ」と指示を追加してください。LLMの完璧主義を抑制できます。

- **Q. エラーハンドリングしたのにLLMが「もう一回APIを叩こう」と判断する**
  - **A.** エラーレスポンスに `"retryable": false` を含めていても、LLMがそれを無視するケースがあります。その場合、システムプロンプトに「retryable: false のツール結果を受け取った場合、同じツールを再度呼び出してはならない」と明示的に記述してください。

- **Q. タイムアウト値をどう決めればいいかわからない**
  - **A.** 対象APIの通常レスポンスタイムを計測し、その3〜5倍を設定するのが目安です。例: 通常2秒 → タイムアウト10秒。
