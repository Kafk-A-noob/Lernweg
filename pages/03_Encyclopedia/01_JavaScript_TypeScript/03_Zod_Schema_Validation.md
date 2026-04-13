# Zod — TypeScriptファーストのスキーマ宣言とバリデーション

TypeScriptの型システムと完全に連動する、**スキーマ宣言・バリデーション（入力値検証）ライブラリ**です。
外部APIのレスポンスやLLMの出力など、「型が保証されていないデータ」を安全に扱うためのパイプラインとして使用します。

## 1. なぜZodが必要なのか

### TypeScriptの型は「コンパイル時のみ」の幻

TypeScriptの `interface` や `type` は、コンパイル（ビルド）時にJavaScriptに変換されると**完全に消滅**します。つまり、実行時（ランタイム）には型チェックが一切行われません。

```typescript
// 型を定義しても...
interface User {
  name: string;
  age: number;
}

// 外部APIから取得したデータは、実行時には何が入っているかわからない
const apiData: unknown = await fetch("/api/user").then(r => r.json());

// TypeScriptに「Userだよ」と嘘をつくこともできてしまう（型アサーション）
const user = apiData as User;
// → user.name が実は undefined でも、コンパイラは気づけない
// → 実行時に "Cannot read properties of undefined" でクラッシュ
```

### Zodによる解決: ランタイムでの型保証

```typescript
import { z } from "zod";

// Zodスキーマ: 「コンパイル時の型定義」と「実行時のバリデーション」を1つで兼ねる
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

// .parse() で実行時にデータの形状を検証する
const user = UserSchema.parse(apiData);
// → apiData.name が string でなければ、ここで即座にエラーを投げる
// → 安全にすり抜けた場合、user は { name: string; age: number } 型として確定する
```

## 2. 他のバリデーションツールとの対比

| ツール | 言語 | 特徴 |
| :--- | :--- | :--- |
| **Zod** | TypeScript | スキーマから型を自動導出（`z.infer`）。TS開発の新標準 |
| **WTForms** | Python (Flask) | HTMLフォームのバリデーション専用。サーバーサイドMVC |
| **Joi** | JavaScript | Zodの前世代。TypeScriptとの連携が弱い |
| **Yup** | JavaScript | Formik (React) との組み合わせで有名。Zodに移行が進行中 |

> 📖 Flaskにおけるバリデーション（WTForms）については **[Flask WTForms応用](../../01_25R1116/02_Backend/01_Flask/01_Flask_WTForms_Advanced)** をご参照ください。Zodは「TypeScript版のWTForms」のような存在です。

## 3. 基本スキーマ定義

```typescript
import { z } from "zod";

// プリミティブ型
const nameSchema = z.string();                    // 文字列
const ageSchema = z.number().int().positive();     // 正の整数
const isActiveSchema = z.boolean();                // 真偽値

// オブジェクト型（最も多用する）
const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "名前は必須です"),       // 最低1文字以上
  email: z.string().email("有効なメールアドレスを入力してください"),
  role: z.enum(["admin", "user", "guest"]),        // 許可値を限定
});

// 配列型
const UsersSchema = z.array(UserSchema);           // User[] に相当
```

### `z.infer` — スキーマから型を自動導出

```typescript
// スキーマからTypeScriptの型を自動生成する（手書きのinterfaceが不要になる）
type User = z.infer<typeof UserSchema>;
// ↑ これは以下と完全に等価:
// type User = { id: number; name: string; email: string; role: "admin" | "user" | "guest" }

// 「スキーマ（実行時のバリデーション）」と「型（コンパイル時のチェック）」が
// 単一の定義から生まれるため、両者がズレる事故が原理的に起きない = Single Source of Truth
```

## 4. coerce / transform — LLM出力の表記ゆれ吸収

LLMが返してくる引数は、数値を `"30"` のように文字列で返すことが頻繁にあります（表記ゆれ）。

### coerce: 自動型変換

```typescript
// z.number() だと "30" はバリデーションエラーになる
// z.coerce.number() なら "30" → 30 に自動変換してからバリデーションする
const MinutesSchema = z.coerce.number().int().positive().default(30);

MinutesSchema.parse("30");     // → 30 (string → number に自動変換)
MinutesSchema.parse(30);       // → 30 (そのまま)
MinutesSchema.parse(undefined); // → 30 (default値が適用される)
MinutesSchema.parse("abc");    // → ZodError (数値に変換できない)
```

### transform: カスタム変換パイプライン

```typescript
// 入力値をバリデーション後に独自の変換処理を通す
const ServiceNameSchema = z
  .string()
  .min(1)
  .transform((val) => val.toLowerCase().trim());
  // → "  API-Server  " を "api-server" に正規化する

ServiceNameSchema.parse("  API-Server  "); // → "api-server"
```

## 5. 外部APIレスポンスの型保証パイプライン

```typescript
import { z } from "zod";

// Step 1: 外部APIのレスポンス形状をZodスキーマで定義
const ErrorLogSchema = z.object({
  timestamp: z.string().datetime(),                                // ISO 8601形式
  level: z.enum(["error", "warn", "info"]),                        // 許可値を限定
  message: z.string(),
  metadata: z.record(z.unknown()).optional(),                      // 任意のkey-valueペア
});

type ErrorLog = z.infer<typeof ErrorLogSchema>;

// Step 2: APIから取得したデータを .parse() に通す
async function fetchAndValidate(url: string): Promise<ErrorLog[]> {
  const response = await fetch(url);
  const rawData: unknown = await response.json(); // unknown型 = 何が入っているかわからない

  // Zodが実行時にデータの形状を検証する
  // rawData が ErrorLog[] の形状でなければ、ZodError をスローする
  return z.array(ErrorLogSchema).parse(rawData);
}
```

### .parse() vs .safeParse()

```typescript
// .parse() — バリデーション失敗時に例外をスローする（try-catchで捕捉）
try {
  const data = UserSchema.parse(input);
} catch (err) {
  if (err instanceof z.ZodError) {
    console.error("バリデーションエラー:", err.errors);
  }
}

// .safeParse() — 例外を投げず、成功/失敗を Result 型で返す
const result = UserSchema.safeParse(input);
if (result.success) {
  console.log("有効なデータ:", result.data); // 型が確定した安全なデータ
} else {
  console.error("無効なデータ:", result.error.errors); // エラー詳細の配列
}
```

## 6. Strict Modeとの相性

TypeScript Strictモード (`strict: true`) と Zodは、互いの弱点を補完する「攻守一体」の関係です。

| | TypeScript Strict | Zod |
| :--- | :--- | :--- |
| **守備範囲** | コンパイル時 | 実行時（ランタイム） |
| **チェック対象** | 自分が書いたコード | 外部から来るデータ |
| **`any` の排除** | `noImplicitAny` で禁止 | `.parse()` で `unknown → 型付き` に変換 |

```
外部データ → [Zodでランタイム検証] → 型が確定 → [TypeScript Strictでコンパイル検証] → 安全なコード
```

## 7. トラブルシューティング

- **Q. `z.ZodError` のエラーメッセージが英語で読みにくい**
  - **A.** 各スキーマの引数にカスタムエラーメッセージを指定できます。`z.string().min(1, "名前は必須です")` のように日本語メッセージを渡してください。
- **Q. オプショナル（任意）フィールドの書き方がわからない**
  - **A.** `z.string().optional()` で `string | undefined` になります。デフォルト値を設定する場合は `z.string().default("unknown")` を使います。
