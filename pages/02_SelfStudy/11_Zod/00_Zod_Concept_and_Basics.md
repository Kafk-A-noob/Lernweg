# 00. Zodの実務概念と原点

TypeScriptの「型」はコンパイル時（コードを書いている時点）にしか存在せず、実行時（プログラムが動いている時点）には完全に消えてしまいます。
**Zod**は、この「型が消える問題」を解決し、**実行時にもデータの形状を検証・保証する**ためのバリデーション（検証）ライブラリです。

## 1. 歴史と誕生背景

### TypeScriptの「型が消える」問題

TypeScriptの型システムは非常に強力ですが、致命的な制約があります。
TypeScriptのコードは最終的にJavaScript（.js）に変換されて実行されますが、**その変換の過程で、型の定義は全て削除されます**。

```typescript
// コンパイル前（TypeScript）
function greet(name: string): string {
  return `Hello, ${name}`;
}

// コンパイル後（JavaScript） — 型が消えている！
function greet(name) {
  return `Hello, ${name}`;
}
```

つまり、TypeScriptの型は「コードを書いている時にエディタが赤線を出してくれる」仕組みに過ぎず、**実際にプログラムが動いている最中に、外部から飛んでくるデータの型を検証する能力はゼロ**です。

### なぜそれが問題なのか

```typescript
// APIからユーザーデータを取得する関数
interface User {
  id: number;
  name: string;
  email: string;
}

async function getUser(): Promise<User> {
  const response = await fetch("/api/user/123");
  const data = await response.json();
  return data as User;  // ← ここが危険！ "as User" は「嘘をつく呪文」
}

// もしAPIが { id: "abc", name: null } を返してきたら...
// TypeScriptは何もチェックせず、型が合っていると信じて通過する
// → 後続の処理で name.toUpperCase() を呼んだ瞬間にクラッシュ
```

`as User`（型アサーション）は「このデータはUser型だと私が保証する」という宣言ですが、**実際のデータの中身は一切検査されません**。
外部API、ユーザー入力、LLMの出力など、「自分のコードの外から来るデータ」は常に信頼できないため、ランタイムでの検証が必須です。

### Zodの誕生

2020年、**Colin McDonnell**がこの問題を解決するために**Zod**を開発しました。

既存のバリデーションライブラリ（Joi, Yup等）はJavaScript時代に作られたものであり、TypeScriptとの連携が後付けでした。
Zodは最初からTypeScriptのために設計され、**「スキーマを1つ書くだけで、バリデーション関数とTypeScript型が同時に手に入る」** というDRY（Don't Repeat Yourself）原則を実現した初めてのライブラリです。

## 2. 概念と動作原理

### スキーマ = バリデーション + 型定義

```typescript
import { z } from "zod";

// ① スキーマを定義する（これが「バリデーションルール」と「型定義」を兼ねる）
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),  // メール形式であることも検証
});

// ② スキーマからTypeScript型を自動生成する（手書き不要！）
type User = z.infer<typeof UserSchema>;
// → { id: number; name: string; email: string }

// ③ 実行時にデータを検証する
const safeData = UserSchema.parse(unknownData);
// → 成功: User型が保証されたデータが返る
// → 失敗: ZodError がスローされる（クラッシュではなく捕捉可能なエラー）
```

```
         従来の手法（DRY違反）              Zodの手法（DRY）
┌────────────────────────────┐    ┌──────────────────────────┐
│ 1. interface User { ... }   │    │ 1. const UserSchema =     │
│    （型定義を手書き）         │    │    z.object({ ... })      │
│                              │    │    （スキーマ＝型＝検証）    │
│ 2. function validate(data) { │ →  │                            │
│    if (typeof data.id !== ...)│    │ 2. UserSchema.parse(data) │
│    （バリデーションを手書き）  │    │    （これだけで全部やる）    │
│                               │    │                            │
│ ※ 型定義とバリデーションが      │    │ ※ 1箇所を変えれば全て変わる │
│   別々に存在し、ズレが発生する  │    │                            │
└────────────────────────────┘    └──────────────────────────┘
```

### `.parse()` vs `.safeParse()`

```typescript
// parse(): 失敗時に例外をスローする（try-catchで捕捉）
try {
  const user = UserSchema.parse(unknownData);
  // ← ここに到達 = unknownData は User型であることが保証されている
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("バリデーション失敗:", error.errors);
  }
}

// safeParse(): 例外をスローしない（成功/失敗をオブジェクトで返す）
const result = UserSchema.safeParse(unknownData);
if (result.success) {
  console.log("有効なデータ:", result.data);  // User型
} else {
  console.error("無効なデータ:", result.error.errors);
}
```

- `parse()`: 「このデータが正しくなかったらクラッシュしてほしい」場面（CLI起動時の設定読み込み等）
- `safeParse()`: 「エラーを穏やかにハンドリングしたい」場面（ユーザー入力のフォームバリデーション等）

## 3. 他バリデーションライブラリとの比較

| 項目 | **Zod** | **Yup** | **Joi** | **Valibot** |
| :--- | :--- | :--- | :--- | :--- |
| TS-First設計 | ✅ 最初からTS専用 | ⚠️ JS由来、型は後付け | ❌ JS専用 | ✅ TS専用 |
| 型推論 (`infer`) | ✅ 完全自動 | ⚠️ 部分的 | ❌ 手書き必要 | ✅ 完全自動 |
| バンドルサイズ | ⚠️ 約13KB (gzip) | 約7KB | 約25KB | ✅ 約1KB |
| エコシステム | ✅ 最大（React Hook Form, tRPC等） | ✅ 大きい | ⚠️ バックエンド向け | ⚠️ 成長中 |
| 学習リソース | ✅ 豊富 | ✅ 豊富 | ✅ 豊富 | ⚠️ まだ少ない |

### 選定の指針

- **TypeScript + フロントエンド/バックエンド兼用** → **Zod**（2026年のデファクトスタンダード）
- **バンドルサイズが最優先** → **Valibot**（Zodの1/10以下のサイズ）
- **既存のJSプロジェクトに導入** → **Yup**（JS時代からの実績）

## 4. 強みと弱み (Pros/Cons)

| 視点 | 強み (Pros) | 弱み (Cons) |
| :--- | :--- | :--- |
| **型安全性** | スキーマから型を自動推論。「型定義とバリデーションのズレ」が物理的に発生しない | — |
| **開発体験** | エディタの補完が完全に効く。チェーンAPIで直感的に書ける | 初見では `z.` の記法に慣れが必要 |
| **エコシステム** | React Hook Form, tRPC, Prisma, Drizzle 等のメジャーライブラリと深く統合 | Zod前提のライブラリが多くなり、Zodからの移行コストが高くなるリスク |
| **バンドルサイズ** | — | 約13KB（gzip）。フロントエンドのバンドルには影響が出る場合がある |
| **パフォーマンス** | 小〜中規模データでは十分高速 | 巨大なデータセット（数万行のCSVパース等）ではボトルネックになりうる |

## 5. 本当の基礎事項

### 基本的なスキーマ

```typescript
import { z } from "zod";

// プリミティブ型
z.string()             // 文字列
z.number()             // 数値
z.boolean()            // 真偽値
z.date()               // Dateオブジェクト
z.undefined()          // undefined
z.null()               // null
z.any()                // any（バリデーション放棄。非推奨）

// 文字列の追加制約
z.string().min(1)                   // 空文字を禁止
z.string().max(255)                 // 最大255文字
z.string().email()                  // メール形式
z.string().url()                    // URL形式
z.string().uuid()                   // UUID形式
z.string().regex(/^[A-Z]{3}$/)     // 正規表現マッチ

// 数値の追加制約
z.number().int()                    // 整数のみ
z.number().min(0)                   // 0以上
z.number().max(100)                 // 100以下
z.number().positive()               // 正の数のみ
```

### オブジェクトスキーマ

```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),  // 省略可
});

// 型の自動生成
type User = z.infer<typeof UserSchema>;
// → { id: number; name: string; email: string; age?: number }
```

### 列挙型（Enum）

```typescript
// z.enum(): 許可される値の候補を列挙
const StatusSchema = z.enum(["active", "inactive", "pending"]);
type Status = z.infer<typeof StatusSchema>; // "active" | "inactive" | "pending"

// TypeScriptのenumと連携
enum Role { ADMIN = "admin", USER = "user" }
const RoleSchema = z.nativeEnum(Role);
```

> 📖 ZodをAI開発（LLM出力のバリデーション）に特化して活用するパターンについては **[Zodによる入力バリデーションパイプライン](../05_AI_Product_Development/04_Zod_Validation_Pipeline)** をご参照ください。
