# 01. Bun 深掘り学習

Bunの基礎概念を踏まえた上で、実務・個人開発でよく使う機能群を深く掘り下げます。

> 📖 Bunの歴史・Node.jsとの比較については **[Bunの実務概念と原点](./00_Bun_Concept_and_Basics)** をご参照ください。

## 1. Bun組み込みAPI — `Bun.*` 名前空間

BunにはNode.jsの `fs` や `http` に相当する機能が、より直感的なAPIとして標準搭載されています。
ただし、これらはBun固有のAPIであるため、Node.jsとの互換性が必要な場合は `node:fs` 等を使用してください。

### `Bun.file()` — ファイルの読み込み

```typescript
// Node.js の場合
import fs from "node:fs";
const content = fs.readFileSync("./data.json", "utf-8");
const json = JSON.parse(content);

// Bun の場合 — よりシンプル
const file = Bun.file("./data.json");
const json = await file.json();  // JSONパースまで一発

// テキストとして読む
const text = await file.text();

// ファイルのメタ情報
console.log(file.size);  // バイト数
console.log(file.type);  // MIMEタイプ (例: "application/json")
```

### `Bun.write()` — ファイルの書き込み

```typescript
// Node.js の場合
import fs from "node:fs";
fs.writeFileSync("./output.txt", "こんにちは", "utf-8");

// Bun の場合
await Bun.write("./output.txt", "こんにちは");

// JSONの書き込み
await Bun.write("./config.json", JSON.stringify({ debug: true }, null, 2));

// レスポンスオブジェクトを直接ファイルに書き込む（ダウンロード用途）
const response = await fetch("https://example.com/data.csv");
await Bun.write("./data.csv", response);
```

### `Bun.serve()` — HTTPサーバー

```typescript
// ワンライナーに近い形でHTTPサーバーを構築できる
const server = Bun.serve({
  port: 3000,
  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({ status: "ok" });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`サーバー起動: http://localhost:${server.port}`);
```

Node.jsの `http.createServer()` + Express に相当する機能が、フレームワーク不要で実現できます。ただし、ルーティングやミドルウェアの仕組みは自分で構築するか、Honoなどの軽量フレームワークを組み合わせる必要があります。

### `Bun.env` — 環境変数

```typescript
// Node.js の場合（dotenv パッケージのインストールが必要）
import dotenv from "dotenv";
dotenv.config();
const apiKey = process.env.API_KEY;

// Bun の場合（.env ファイルを自動で読み込む。追加パッケージ不要）
const apiKey = Bun.env.API_KEY;
// または
const apiKey = process.env.API_KEY;  // Node.js互換の書き方も使える
```

> ⚠️ Bunは `.env` ファイルを**自動的に**読み込みます。`dotenv` パッケージは不要です。

## 2. ネイティブTypeScript実行の仕組み

### 型チェック vs トランスパイル

Bunが「TypeScriptをそのまま実行する」と言った場合、**トランスパイル（構文変換）だけを行い、型チェックは行わない**ことを理解しておく必要があります。

```
        TypeScript の処理を2つに分解すると...

        ┌─────────────────────────┐
        │ 1. 型チェック (Type Check) │ ← tsc が担当（遅い）
        │    「この変数はstring型    │    型のエラーを検出する
        │     なのにnumberを代入    │
        │     してるぞ！」          │
        ├─────────────────────────┤
        │ 2. トランスパイル          │ ← Bun が担当（超高速）
        │    型の記述を取り除いて    │    型を剥がしてJSに変換する
        │    純粋なJSに変換する     │    だけなので一瞬で終わる
        └─────────────────────────┘

Bun は ② だけを行う。① は行わない。
→ 型エラーがあってもBunは何も言わず実行してしまう
→ 型チェックが必要なら別途 tsc --noEmit を実行する
```

### 実務でのワークフロー

```json
// package.json の scripts に型チェックと実行を分離して定義する
{
  "scripts": {
    "dev": "bun run src/index.ts",
    "typecheck": "tsc --noEmit",
    "build": "bun build --compile src/index.ts --outfile dist/myapp",
    "test": "bun test",
    "ci": "bun run typecheck && bun test && bun run build"
  }
}
```

- **開発時**: `bun run dev` で高速に実行（型エラーはエディタ上で確認）
- **CI/CD時**: `bun run ci` で型チェック → テスト → ビルドをまとめて実行

## 3. パッケージマネージャとしてのBun

### 爆速インストールの理由

Bunのパッケージインストール（`bun install`）が npm より圧倒的に速い理由:

1. **ハードリンクベースのキャッシュ**: 一度ダウンロードしたパッケージをグローバルキャッシュにハードリンクで保存。同じパッケージの再インストールでは実体のコピーが発生しない
2. **並列ダウンロード**: 依存関係の解決とダウンロードを同時並行で実行
3. **バイナリ形式のLockfile**: `bun.lockb`（バイナリ形式）でロックファイルの読み書きが高速

```bash
# ベンチマーク例（プロジェクトの規模による）
# npm install   : 30秒〜2分
# bun install   : 1秒〜5秒
```

### `bun.lockb` と `package-lock.json`

```bash
# bun install を実行すると bun.lockb（バイナリ形式）が生成される
# npm の package-lock.json に相当するが、人間が読める形式ではない

# 中身を確認したい場合
bun bun.lockb  # lock ファイルの内容をテキスト出力

# Git で管理する際はバイナリファイルとして .gitattributes に追加
# bun.lockb binary  ← diffを表示しない設定
```

## 4. バンドラ内蔵 — `bun build`

### 基本的なバンドル

```bash
# 複数ファイルにまたがるTypeScriptプロジェクトを1ファイルにまとめる
bun build ./src/index.ts --outdir ./dist

# 出力先:
# dist/index.js  ← 全ての import が解決された単一JSファイル
```

### Tree-shaking（未使用コードの除去）

Bunのバンドラは**Tree-shaking**をデフォルトで実行します。
`import` されていない関数やモジュールは、最終的な出力ファイルから自動的に除去されます。

```typescript
// utils.ts
export function usedFunction() { return "使われている"; }
export function unusedFunction() { return "使われていない"; }

// index.ts
import { usedFunction } from "./utils";
console.log(usedFunction());
// ↑ unusedFunction は import されていないので...

// bun build の結果:
// unusedFunction のコードは出力ファイルに含まれない（Tree-shaking）
```

### 単一バイナリコンパイル — `bun build --compile`

```bash
# CLIツール配布用の最強機能
bun build --compile ./src/index.ts --outfile ./dist/oncall-agent

# 生成されたファイルは...
# - BunランタイムDSLが埋め込まれた自己完結型バイナリ
# - 実行環境に Node.js や Bun のインストールが不要
# - ダブルクリック or ./dist/oncall-agent で即座に実行可能
```

> 📖 CLIエージェント配布のための詳細な活用パターンは **[Bunの単一バイナリコンパイルと配布戦略](../09_CLI_Agent_Development/05_Bun_Advanced_Compilation)** をご参照ください。

## 5. テストランナー — `bun:test`

### Jestとの互換性

BunのテストランナーはJestと同じAPIを提供しています（`describe`, `it`, `expect`）。
Jestからの移行がほぼゼロコストで行えます。

```typescript
// src/utils.test.ts
import { describe, it, expect } from "bun:test";
import { add, multiply } from "./utils";

describe("数学関数", () => {
  it("2 + 3 = 5 であること", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("4 × 5 = 20 であること", () => {
    expect(multiply(4, 5)).toBe(20);
  });

  it("nullの場合にエラーを投げること", () => {
    expect(() => add(null as any, 1)).toThrow();
  });
});
```

```bash
# テスト実行
bun test                  # 全テストファイルを実行
bun test src/utils.test.ts  # 特定ファイルのみ
bun test --watch          # ファイル変更時に自動再実行
```

### モック（テスト用のダミー関数）

```typescript
import { describe, it, expect, mock } from "bun:test";

// fetch をモック（テスト中は本物のHTTPリクエストを送らない）
const mockFetch = mock(() =>
  Promise.resolve(new Response(JSON.stringify({ status: "ok" })))
);

globalThis.fetch = mockFetch;

it("APIを呼び出すこと", async () => {
  await callApi();
  expect(mockFetch).toHaveBeenCalledTimes(1);
});
```

## 6. 得意/不得意の詳細

### Bunが威力を発揮するユースケース

| ユースケース | 理由 |
| :--- | :--- |
| **CLIツール開発** | 起動が速い＋TS直接実行＋バイナリ配布。文句なしの最適解 |
| **スクリプト・自動化** | `bun run script.ts` だけで動く。Python的な手軽さ |
| **プロトタイピング** | 設定ゼロでTS環境が整う。アイデアの検証が最速 |
| **モノレポの開発** | `bun install` の爆速インストールが大規模プロジェクトで効く |

### Bunが適さないユースケース

| ユースケース | 理由 |
| :--- | :--- |
| **大規模本番Webサーバー** | 本番環境での実績がNode.jsに比べてまだ浅い。PM2等の運用ツールの互換性も不完全 |
| **C++ネイティブアドオン依存** | `node-gyp` 系のC++アドオン（sharp, bcrypt等のネイティブ版）は非対応の場合がある |
| **厳格なセキュリティ要件** | Denoのようなパーミッション制御がないため、サンドボックス化が必要な環境には不向き |
| **Windows環境** | Linux/macOSに比べてWindowsサポートは後発であり、一部の機能で不安定さが残る |

## 7. トラブルシューティング

- **Q. `bun install` で特定のパッケージがエラーになる**
  - **A.** C++ネイティブアドオンを含むパッケージ（bcrypt, sharp等）はBun非対応の場合があります。代替パッケージ（bcryptjs, sharp → jimp等）の使用を検討するか、`npm install` にフォールバックしてください。

- **Q. Bunで動くがNode.jsでは動かない**
  - **A.** `Bun.file()` 等のBun固有APIを使っていないか確認してください。Node.jsとの互換性が必要な場合は `node:fs` 等の標準モジュールを使用してください。

- **Q. 型エラーがあるのにBunが何も警告しない**
  - **A.** Bunは型チェックを行いません（仕様）。`tsc --noEmit` を別途実行するか、エディタ（VSCode）の TypeScript Language Server に頼ってください。

- **Q. `bun build --compile` で生成されたバイナリが大きすぎる**
  - **A.** Bunのランタイム自体がバイナリに埋め込まれるため、最低でも約50〜100MBのサイズになります。これはBunの仕様であり、Tree-shakingで削減できるのはアプリケーションコード部分のみです。
