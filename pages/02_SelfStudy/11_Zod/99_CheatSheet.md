# 99. Zod チートシート

よく使うZodのメソッド・パターンをまとめたクイックリファレンスです。

## プリミティブ型スキーマ

```typescript
import { z } from "zod";

z.string()       // 文字列
z.number()       // 数値
z.boolean()      // 真偽値
z.date()         // Date
z.bigint()       // BigInt
z.undefined()    // undefined
z.null()         // null
z.any()          // any (非推奨)
z.unknown()      // unknown (anyより安全)
z.never()        // never (マッチしない)
z.void()         // void
```

## 文字列の制約

```typescript
z.string().min(n)           // 最小文字数
z.string().max(n)           // 最大文字数
z.string().length(n)        // 固定文字数
z.string().email()          // メール形式
z.string().url()            // URL形式
z.string().uuid()           // UUID形式
z.string().regex(/pattern/) // 正規表現マッチ
z.string().startsWith(s)    // 接頭辞が一致
z.string().endsWith(s)      // 接尾辞が一致
z.string().trim()           // 前後の空白を自動除去
z.string().toLowerCase()    // 小文字に自動変換
z.string().toUpperCase()    // 大文字に自動変換
```

## 数値の制約

```typescript
z.number().int()         // 整数のみ
z.number().positive()    // 正の数
z.number().negative()    // 負の数
z.number().nonnegative() // 0以上
z.number().min(n)        // n以上
z.number().max(n)        // n以下
z.number().finite()      // Infinity除外
z.number().safe()        // Number.MAX_SAFE_INTEGER 以下
```

## オブジェクト操作

```typescript
const Schema = z.object({ ... });

Schema.partial()          // 全フィールドをオプショナル
Schema.partial({ a: true }) // 一部だけオプショナル
Schema.required()         // 全フィールドを必須に
Schema.pick({ a: true })  // 指定フィールドのみ抽出
Schema.omit({ a: true })  // 指定フィールドを除外
Schema.extend({ b: z.string() }) // フィールド追加
Schema.merge(OtherSchema) // 2つのスキーマを合体
Schema.keyof()            // キーのユニオン型

Schema.strict()           // 未知のキーがあればエラー
Schema.passthrough()      // 未知のキーをそのまま通す
Schema.strip()            // 未知のキーを除去 (デフォルト)
```

## 配列・タプル

```typescript
z.array(z.string())           // string[]
z.array(z.string()).min(1)    // 最低1要素
z.array(z.string()).max(10)   // 最大10要素
z.array(z.string()).length(3) // ちょうど3要素
z.array(z.string()).nonempty() // 空配列禁止

z.tuple([z.string(), z.number()])  // [string, number]
```

## ユニオン・判別ユニオン

```typescript
z.union([z.string(), z.number()])  // string | number
z.string().or(z.number())          // 同上（短縮記法）

z.discriminatedUnion("type", [     // 判別ユニオン（高速）
  z.object({ type: z.literal("a"), ... }),
  z.object({ type: z.literal("b"), ... }),
])
```

## オプショナル・デフォルト値・Nullable

```typescript
z.string().optional()         // string | undefined
z.string().nullable()         // string | null
z.string().nullish()          // string | null | undefined
z.string().default("hello")   // undefined時にデフォルト値
```

## 変換・前処理

```typescript
// transform: バリデーション通過後に変換
z.string().transform((val) => val.toUpperCase())

// preprocess: バリデーション前に入力を加工
z.preprocess((val) => String(val), z.string())

// pipe: 変換後の値を別のスキーマに通す
z.string().transform(Number).pipe(z.number().min(0))
```

## カスタム検証

```typescript
// refine: カスタム条件
z.string().refine((val) => val.includes("@"), {
  message: "@が必要です",
})

// superRefine: 複数エラー発行・フィールド横断検証
z.object({ ... }).superRefine((data, ctx) => {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "エラー",
    path: ["fieldName"],
  });
})
```

## 型推論

```typescript
type T = z.infer<typeof Schema>;   // 出力型 (transformが適用された型)
type I = z.input<typeof Schema>;   // 入力型 (transform前の型)
type O = z.output<typeof Schema>;  // 出力型 (z.inferと同じ)
```

## パース

```typescript
Schema.parse(data)           // 成功: データ返却 / 失敗: ZodError投げる
Schema.safeParse(data)       // { success: true, data } | { success: false, error }
Schema.parseAsync(data)      // 非同期 parse
Schema.safeParseAsync(data)  // 非同期 safeParse
```

## エラー処理

```typescript
try {
  Schema.parse(data);
} catch (e) {
  if (e instanceof z.ZodError) {
    e.errors;           // ZodIssue[] (各エラーの配列)
    e.flatten();        // { formErrors, fieldErrors } に整理
    e.format();         // ネスト構造でフォーマット
  }
}
```

## 列挙型

```typescript
z.enum(["a", "b", "c"])         // Zodの列挙型
z.nativeEnum(TypeScriptEnum)    // TSのenumと連携

z.literal("exact_value")        // 特定の値のみ許可
```
