# 01. Zod 深掘り学習

Zodの基礎概念を踏まえた上で、実務で頻出するスキーマパターンと高度な機能を深掘りします。

> 📖 Zodの歴史・他ライブラリとの比較・基本的なスキーマ定義については **[Zodの実務概念と原点](./00_Zod_Concept_and_Basics)** をご参照ください。

## 1. オブジェクトスキーマの操作

### 基本の `z.object()`

```typescript
import { z } from "zod";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "user", "guest"]),
});

type User = z.infer<typeof UserSchema>;
```

### `.partial()` — 全フィールドをオプショナルにする

TypeScriptの `Partial<T>` と同じ機能です。更新用のAPIリクエストボディに便利です。

```typescript
const UpdateUserSchema = UserSchema.partial();
// → { id?: number; name?: string; email?: string; role?: "admin" | "user" | "guest" }

// 特定のフィールドだけpartialにすることも可能
const PartialUserSchema = UserSchema.partial({ email: true, role: true });
// → { id: number; name: string; email?: string; role?: "admin" | "user" | "guest" }
```

### `.pick()` / `.omit()` — フィールドの選択/除外

```typescript
// pick: 必要なフィールドだけ抽出
const UserNameSchema = UserSchema.pick({ name: true, email: true });
// → { name: string; email: string }

// omit: 特定のフィールドを除外
const CreateUserSchema = UserSchema.omit({ id: true });
// → { name: string; email: string; role: "admin" | "user" | "guest" }
// （IDはサーバー側で自動生成するため、作成時は不要）
```

### `.extend()` — フィールドの追加

```typescript
const AdminUserSchema = UserSchema.extend({
  permissions: z.array(z.string()),  // 新しいフィールドを追加
  lastLogin: z.date().optional(),
});
```

### `.merge()` — 2つのスキーマを合体

```typescript
const AddressSchema = z.object({
  zipCode: z.string(),
  city: z.string(),
});

const UserWithAddressSchema = UserSchema.merge(AddressSchema);
// → User の全フィールド + Address の全フィールド
```

## 2. 配列・タプル・ユニオン

### `z.array()` — 配列

```typescript
const TagsSchema = z.array(z.string());
// → string[]

// 要素数の制約
z.array(z.string()).min(1)           // 最低1要素
z.array(z.string()).max(10)          // 最大10要素
z.array(z.string()).length(3)        // ちょうど3要素
z.array(z.string()).nonempty()       // 空配列を禁止 (.min(1) と同等)
```

### `z.tuple()` — タプル（固定長で各要素の型が異なる配列）

```typescript
const CoordinateSchema = z.tuple([
  z.number(),  // 緯度
  z.number(),  // 経度
]);
// → [number, number]

const result = CoordinateSchema.parse([35.6762, 139.6503]);
// ✅ OK
```

### `z.union()` — 「AまたはB」

```typescript
// 文字列または数値
const StringOrNumberSchema = z.union([z.string(), z.number()]);
// → string | number

// 短縮記法（.or()）
const schema = z.string().or(z.number());
// → 同じ結果
```

### `z.discriminatedUnion()` — 判別ユニオン（推奨）

共通のフィールド（判別子）を持つオブジェクトの集合に対して、高速にバリデーションを行います。

```typescript
const EventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("click"),
    x: z.number(),
    y: z.number(),
  }),
  z.object({
    type: z.literal("keypress"),
    key: z.string(),
  }),
  z.object({
    type: z.literal("scroll"),
    direction: z.enum(["up", "down"]),
  }),
]);

// "type" フィールドの値を見て、どのスキーマで検証するかを即座に判断する
// z.union() よりも高速（全スキーマを順番に試す必要がないため）
```

## 3. `transform` — 入力の型変換

バリデーションと同時に、データの型を変換するパイプラインを構築できます。

```typescript
// 文字列を数値に変換（フォーム入力の処理に頻出）
const StringToNumberSchema = z.string().transform((val) => parseInt(val, 10));

const result = StringToNumberSchema.parse("42");
// → 42 (number型)

// 実用例: APIレスポンスの日付文字列をDateオブジェクトに変換
const DateStringSchema = z.string().transform((val) => new Date(val));
const date = DateStringSchema.parse("2026-04-15T00:00:00Z");
// → Date オブジェクト
```

### transform の連鎖

```typescript
// 入力 → トリム → 小文字化 → 長さ検証 のパイプライン
const NormalizedStringSchema = z.string()
  .transform((val) => val.trim())        // 前後の空白を除去
  .transform((val) => val.toLowerCase()) // 小文字に統一
  .pipe(z.string().min(1).max(50));      // 変換後の値で長さを検証

NormalizedStringSchema.parse("  Hello World  ");
// → "hello world"
```

## 4. `preprocess` — 入力の前処理

`transform` が「バリデーション通過後に変換する」のに対し、`preprocess` は「バリデーションの前に入力を加工する」機能です。

```typescript
// 入力が文字列でも数値でも受け付けて、必ず数値に変換してからバリデーション
const FlexibleNumberSchema = z.preprocess(
  (val) => {
    if (typeof val === "string") return Number(val);
    return val;
  },
  z.number().min(0).max(100)
);

FlexibleNumberSchema.parse("42");   // ✅ → 42
FlexibleNumberSchema.parse(42);     // ✅ → 42
FlexibleNumberSchema.parse("abc");  // ❌ → NaN は number だがバリデーション失敗
```

> 📖 `preprocess` をLLM出力の表記ゆれ吸収（ひらがな→英語変換等）に活用するパターンについては **[Zodによる入力バリデーションパイプライン](../05_AI_Product_Development/04_Zod_Validation_Pipeline)** をご参照ください。

## 5. `refine` / `superRefine` — カスタムバリデーション

Zodの基本メソッド（`.min()`, `.email()` 等）では表現できない、ビジネスロジック固有の検証を追加します。

### `.refine()` — シンプルなカスタム検証

```typescript
// パスワードの強度チェック
const PasswordSchema = z.string()
  .min(8, "8文字以上必須")
  .refine(
    (val) => /[A-Z]/.test(val),
    { message: "大文字を1つ以上含めてください" }
  )
  .refine(
    (val) => /[0-9]/.test(val),
    { message: "数字を1つ以上含めてください" }
  );
```

### `.superRefine()` — 複数フィールドにまたがる検証

```typescript
const RegistrationSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "パスワードが一致しません",
      path: ["confirmPassword"],  // エラーの対象フィールドを指定
    });
  }
});
```

## 6. `z.infer` — スキーマからTypeScript型を自動生成

Zodの最大のパワーは、スキーマ定義から**TypeScriptの型が自動的に推論される**ことです。
これにより、「型定義」と「バリデーションロジック」を二重管理する必要がなくなります。

```typescript
// ❌ DRY違反: 型とバリデーションが別々に存在し、ズレのリスクがある
interface User {   // ← ① 型定義
  id: number;
  name: string;
}
function validate(data: unknown): User {  // ← ② バリデーション
  if (typeof data !== "object") throw new Error();
  // ... 長い検証コード
}

// ✅ Zodならスキーマ1つで両方手に入る（Single Source of Truth）
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
});
type User = z.infer<typeof UserSchema>;  // ← 型はスキーマから自動生成
// バリデーションは UserSchema.parse(data) で実行
```

### input型 と output型

`transform` を使っている場合、入力の型と出力の型が異なります。

```typescript
const Schema = z.string().transform((val) => parseInt(val, 10));

type Input = z.input<typeof Schema>;   // → string（バリデーション前）
type Output = z.output<typeof Schema>; // → number（transform後）
// z.infer は z.output のエイリアス
```

## 7. エラーハンドリング

### ZodError の構造

```typescript
try {
  UserSchema.parse({ id: "abc", name: "" });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(error.errors);
    // [
    //   {
    //     code: "invalid_type",
    //     expected: "number",
    //     received: "string",
    //     path: ["id"],                ← どのフィールドでエラーが起きたか
    //     message: "Expected number, received string"
    //   },
    //   {
    //     code: "too_small",
    //     minimum: 1,
    //     path: ["name"],
    //     message: "String must contain at least 1 character(s)"
    //   }
    // ]

    // フラット化して使いやすくする
    const flat = error.flatten();
    console.log(flat.fieldErrors);
    // { id: ["Expected number, received string"], name: ["String must..."] }
  }
}
```

### カスタムエラーメッセージ

```typescript
const UserSchema = z.object({
  name: z.string({
    required_error: "名前は必須です",        // undefined の場合
    invalid_type_error: "名前は文字列です",   // 型が違う場合
  }).min(1, "名前を入力してください"),        // 空文字の場合
  age: z.number().min(0, "年齢は0以上で入力してください"),
});
```

## 8. 得意/不得意の詳細

### Zodが威力を発揮するユースケース

| ユースケース | 理由 |
| :--- | :--- |
| **APIレスポンスの型保証** | `fetch` で取得した `unknown` なJSONを安全に型付きオブジェクトに変換 |
| **フォームバリデーション** | React Hook Form + Zod で型安全なフォーム検証が実現 |
| **LLM出力のパース** | AIが返す不定形な出力を型安全なデータに変換（`preprocess` + `parse`） |
| **環境変数の検証** | `process.env` の存在チェックと型変換を起動時に一括実行 |
| **設定ファイルのパース** | JSON/YAML設定ファイルの型安全な読み込み |

### Zodが適さないユースケース

| ユースケース | 理由 |
| :--- | :--- |
| **巨大データのバッチ処理** | 数万行のCSVを1行ずつ `.parse()` するとオーバーヘッドが無視できない |
| **バンドルサイズ最小化** | 約13KB（gzip）は小さなウィジェットやライブラリには過剰。Valibotを検討 |
| **フレームワーク独自バリデーション** | DjangoやRailsなど、フレームワークが強力なバリデーション機構を持っている場合は不要 |

## 9. トラブルシューティング

- **Q. `.parse()` でエラーが出るが、どのフィールドが原因かわからない**
  - **A.** `error.errors` 配列の `path` プロパティにフィールドのパスが入っています。`error.flatten()` を使うとフィールドごとのエラーメッセージに整理されます。

- **Q. `transform` の中でバリデーションエラーを出したい**
  - **A.** `transform` の中では直接エラーを出せません。代わりに `.pipe()` で変換後の値を別のスキーマに通すか、`.superRefine()` を使ってください。

- **Q. オプショナルなフィールドのデフォルト値を設定したい**
  - **A.** `.default()` を使います: `z.string().default("unknown")`。入力が `undefined` の場合にデフォルト値が使われます。

- **Q. Zodスキーマをネストさせると型推論が遅くなる**
  - **A.** 深くネストしたスキーマ（5階層以上）ではTypeScriptの型推論が遅くなる場合があります。スキーマを分割し、`z.lazy()` の使用を検討してください。
