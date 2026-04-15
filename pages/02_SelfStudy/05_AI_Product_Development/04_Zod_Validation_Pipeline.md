# 04. Zodによる入力バリデーションパイプライン — LLMの非決定性を飼いならす

LLM（大規模言語モデル）の出力は、同じ質問をしても毎回微妙に異なる「非決定論的（ノンデターミニスティック）」な性質を持っています。
この揺らぎを吸収し、プログラムが安全に扱える「型安全なデータ」に変換するために、**Zodの `preprocess` パイプライン**を活用する設計を解説します。

> 📖 Zodの基礎知識（スキーマ定義、`.parse()`, `.safeParse()` 等）については **[Zodの実務概念と原点](../11_Zod/00_Zod_Concept_and_Basics)** をご参照ください。
> 📖 Zodの高度な機能（`transform`, `refine`, `discriminatedUnion` 等）については **[Zod深掘り学習](../11_Zod/01_Zod_DeepDive_and_Learning)** をご参照ください。

## 1. なぜAI開発でZodが特に重要なのか

### 通常のWebアプリとの違い

通常のWebアプリケーションでは、フォーム入力の型は比較的予測可能です（HTMLの `<input type="number">` は必ず数値を返す等）。
しかし、LLMの出力は根本的に異なります。

```
        通常のWebアプリ               LLMエージェント
┌────────────────────────┐    ┌────────────────────────────┐
│ ユーザー入力:            │    │ LLMの出力:                   │
│  name: "田中太郎"        │    │  service_name: "github"      │
│  age: 25                │    │  service_name: "GitHub"      │
│                          │    │  service_name: "ギットハブ"    │
│ → 入力の形式は予測可能    │    │  service_name: "ぎっとはぶ"    │
│                          │    │                               │
│                          │    │ → 同じ意味だが表記が毎回違う    │
│                          │    │   （非決定論的出力）            │
└────────────────────────┘    └────────────────────────────┘
```

LLMのFunction Calling（AIが自律的にツールを呼び出す仕組み）において、AIが生成するパラメータ（引数）には**必ず表記ゆれが発生します**。これは仕様であり、バグではありません。

### TypeScriptの型だけでは防げない

```typescript
enum ServiceName {
  GITHUB = "github",
  DISCORD = "discord",
}

// TypeScript の型はコンパイル時に消えるため...
function checkService(name: ServiceName) {
  // この関数の中では name が ServiceName であることが「型上は」保証されている
  // しかし実行時には、LLMが "ギットハブ" を渡してきてもチェックされずに通過する
}

// 実行時（ランタイム）では...
checkService("ギットハブ" as any);  // ← TypeScriptの型チェックをすり抜ける
```

## 2. `preprocess` によるLLM表記ゆれ吸収

### 核心のパターン: 入力の防波堤

Zodの `preprocess` を使って、LLMが返すあらゆる表記ゆれを**バリデーション前に正規化**するパイプラインを構築します。

```typescript
import { z } from "zod";

// 対象のEnum（システム内部で使う正式な値）
enum ServiceEnum {
  GITHUB = "github",
  DISCORD = "discord",
  SLACK = "slack",
}

// Zodパイプライン: LLMの出力を正規化 → Enum型に変換
const ServiceNameSchema = z.preprocess((val) => {
  // Step 1: 文字列化し、トリムし、小文字に統一
  const normalized = String(val).trim().toLowerCase();

  // Step 2: 日本語の表記ゆれを英語に強制変換
  const JAPANESE_MAP: Record<string, string> = {
    "ぎっとはぶ": "github",
    "ギットハブ": "github",
    "でぃすこーど": "discord",
    "ディスコード": "discord",
    "すらっく": "slack",
    "スラック": "slack",
  };

  return JAPANESE_MAP[normalized] ?? normalized;
}, z.nativeEnum(ServiceEnum).default(ServiceEnum.GITHUB));
```

### パイプラインの動作フロー

```
LLMの出力        preprocess         z.nativeEnum()         プログラムへ
─────────────────────────────────────────────────────────────────────
"GitHub"      → "github"       → ServiceEnum.GITHUB   → ✅ 型安全
"ギットハブ"   → "github"       → ServiceEnum.GITHUB   → ✅ 型安全
"GITHUB"      → "github"       → ServiceEnum.GITHUB   → ✅ 型安全
"ぎっとはぶ"   → "github"       → ServiceEnum.GITHUB   → ✅ 型安全
"unknown"     → "unknown"      → ServiceEnum.GITHUB   → ✅ デフォルト値
```

この層を通過したデータは**必ず `ServiceEnum` 型**であることが保証されます。
後続のシステムは「AIがどんなフォーマットで返してきても、厳密な型として扱える」堅牢性を獲得できます。

## 3. Function Callingの引数バリデーション

LLMのFunction Callingでは、AIが「この関数をこの引数で呼んでほしい」とJSON形式でリクエストしてきます。
このJSONの中身をZodで検証・正規化するパターンです。

```typescript
// ツールの引数スキーマ
const FetchErrorLogsArgsSchema = z.object({
  service_name: ServiceNameSchema,  // ← 上で定義した表記ゆれ吸収パイプライン
  minutes: z.preprocess(
    (val) => (val == null ? 30 : Number(val)),  // 未指定時はデフォルト30分
    z.number().int().min(1).max(1440)           // 1分〜24時間
  ),
});

// LLMが生成した引数を安全にパースする
function parseToolArgs(rawArgs: unknown) {
  const result = FetchErrorLogsArgsSchema.safeParse(rawArgs);

  if (!result.success) {
    console.error("引数のバリデーション失敗:", result.error.flatten());
    // LLMに「引数が不正だった」とフィードバックして再生成を促す
    return null;
  }

  return result.data;
  // → { service_name: ServiceEnum; minutes: number }
  //    完全に型安全なデータが手に入る
}
```

### ツール実行のディスパッチャとの統合

```typescript
import { z } from "zod";

async function executeToolCall(
  name: string,
  rawArgs: Record<string, unknown>
): Promise<Record<string, unknown>> {
  switch (name) {
    case "fetch_error_logs": {
      // ① Zodで引数を検証・正規化
      const args = FetchErrorLogsArgsSchema.parse(rawArgs);
      // ② 型安全な引数でツールを実行
      return await fetchErrorLogs(args.service_name, args.minutes);
    }
    case "get_service_health": {
      const args = GetServiceHealthArgsSchema.parse(rawArgs);
      return await getServiceHealth(args.service_name);
    }
    default:
      return { error: `未知のツール: ${name}` };
  }
}
```

> 📖 Function Callingのループ実装全体については **[Function Calling (Tool Use) 実装パターン](../09_CLI_Agent_Development/01_Function_Calling_Implementation)** をご参照ください。

## 4. 外部APIレスポンスの型保証

Tool層で外部APIからデータを取得した際、そのレスポンスのJSONが想定した形状であることをZodで保証するパターンです。

```typescript
// 外部APIのレスポンスのスキーマを定義
const ErrorLogSchema = z.object({
  timestamp: z.string(),
  level: z.enum(["error", "warn", "info"]),
  message: z.string(),
  service: z.string(),
});

// 配列として検証
const ErrorLogsResponseSchema = z.array(ErrorLogSchema);

async function fetchErrorLogs(
  serviceName: string,
  minutes: number
): Promise<z.infer<typeof ErrorLogsResponseSchema>> {
  const response = await fetch(`https://api.monitoring.internal/logs?service=${serviceName}&minutes=${minutes}`);

  if (!response.ok) {
    // APIエラー時はZodを通さず、エラー情報をLLMに返す
    return [{ timestamp: new Date().toISOString(), level: "error", message: `API returned ${response.status}`, service: serviceName }];
  }

  const rawData = await response.json();

  // Zodでレスポンスの形状を検証
  // APIが予期しない形式を返した場合、ここでZodErrorがスローされる
  return ErrorLogsResponseSchema.parse(rawData);
}
```

### なぜAPIレスポンスもバリデーションするのか

外部APIは自分のコントロール下にないため、いつ仕様変更されるかわかりません。
Zodでレスポンスを検証しておくと、APIの仕様変更（フィールドの追加・削除・型変更）が起きた際に、**後続の処理がクラッシュする前に、Zodの段階で明確なエラーメッセージとともに検知**できます。

## 5. Pros/Cons（AI開発文脈）

| 視点 | 強み (Pros) | 弱み (Cons) |
| :--- | :--- | :--- |
| **LLM出力の安定化** | 表記ゆれ・型ゆれを自動で正規化。プログラムが壊れない | 想定外の表記ゆれパターンが出た場合、`preprocess` のマッピングに手動追加が必要 |
| **デバッグ容易性** | ZodErrorのメッセージが「どのフィールドが・何の型を期待して・何が来たか」を明確に教えてくれる | エラーメッセージが英語のため、日本語チームではカスタムメッセージの設定が必要な場合がある |
| **型安全性** | `parse()` 後のデータは完全に型安全。エディタの補完が効く | 過信は禁物。`preprocess` で変換しきれない未知の入力はデフォルト値で隠蔽されるリスク |
| **保守性** | スキーマ＝型＝バリデーションの一元管理（Single Source of Truth） | ツール追加のたびにスキーマ定義が増える。大規模プロジェクトではスキーマファイルの管理戦略が必要 |

## 6. トラブルシューティング

- **Q. LLMが日本語でサービス名を返してきて `preprocess` のマッピングにない**
  - **A.** `preprocess` 内のマッピング辞書に新しいエントリを追加してください。また、システムプロンプトで「引数は必ず英語で返すこと」と指示を追加することで、そもそも日本語が返る頻度を下げることができます（ゼロにはなりません）。

- **Q. `.default()` でデフォルト値を入れたら、LLMのミスに気づけなくなった**
  - **A.** デフォルト値は「エラーで止まるよりは動いた方がマシ」な場面で使います。ミスを検知したい場合は `.default()` を外し、`safeParse()` で失敗を明示的にハンドリングしてください。

- **Q. Zodの `parse()` が意図せず例外をスローして CLIがクラッシュする**
  - **A.** Tool層やAgent層では `safeParse()` を使い、失敗時は `{ error: "..." }` のような疑似JSONをLLMに返却するパターンが堅牢です。LLMはそのエラーメッセージを読んで、ユーザーに自然言語で報告できます。
