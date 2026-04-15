# 00. Bunの実務概念と原点

2026年現在、JavaScript/TypeScriptのランタイム（実行環境）は「Node.js一強」の時代から、複数の選択肢が競争する時代に移行しました。
その中でも**Bun**は「速さ」と「オールインワン」を武器に急速に普及が進んでいるランタイムです。

## 1. 歴史と誕生背景

### Node.jsの時代と限界

2009年にRyan Dahlが開発したNode.jsは、それまで「ブラウザの中だけ」で動いていたJavaScriptをサーバーサイドで実行できるようにした革命的なツールでした。
しかし、10年以上の歴史の中で以下のような「レガシー（遺産）」が蓄積していきました。

- **TypeScriptの直接実行ができない**: TypeScriptを書いても、一度JavaScriptに変換（トランスパイル）してからでないと動かせない。`tsc` → `node` の2段階が必要
- **ツールの分散**: パッケージマネージャ（npm）、バンドラ（webpack/esbuild）、テストランナー（Jest）、フォーマッタ…全部別々にインストール・設定が必要
- **パフォーマンスの壁**: `npm install` の遅さ、コールドスタートの遅さなど、速度面での不満

### Bunの誕生

2022年、**Jarred Sumner**がこれらの問題を根本から解決するために**Bun**を公開しました。

重要なポイントは、BunはJavaScriptで書かれていないことです。
Node.jsの内部エンジンであるV8（Chrome由来）の代わりに、**JavaScriptCore**（Safari/WebKit由来）を採用し、ランタイム本体のコードは**Zig**（C言語並みに高速で安全性も高い新興言語）で書かれています。

つまり、Node.jsが「JavaScriptの世界の中で改善を重ねてきた」のに対し、Bunは「JavaScriptの世界の外側（低レベル言語）から再設計し直した」ランタイムです。

## 2. 概念と動作原理

### All-in-One（全部入り）設計

Bunの最大の特徴は、Node.jsでは別々のツールとしてインストールしていた機能が**すべて標準搭載**されていることです。

```
        Node.js の世界                    Bun の世界
┌──────────────────────┐       ┌──────────────────────┐
│ ランタイム: node       │       │ ランタイム: bun       │
│ パッケージ: npm        │       │ パッケージ: bun       │
│ バンドラ:  webpack等   │  →    │ バンドラ:  bun       │
│ テスト:   Jest等       │       │ テスト:   bun       │
│ TS実行:  ts-node等     │       │ TS実行:   bun       │
│ バイナリ化: pkg等      │       │ バイナリ化: bun      │
└──────────────────────┘       └──────────────────────┘
 別々にインストール・設定が必要       全て最初から使える
```

### ネイティブTypeScript実行

```bash
# Node.jsの場合（TypeScriptを動かすまでの道のり）
npm install -D typescript ts-node @types/node  # 3つもインストール
npx tsc --init                                 # tsconfig.jsonを生成
npx ts-node src/index.ts                       # ようやく実行

# Bunの場合（TypeScriptを動かすまでの道のり）
bun run src/index.ts                           # これだけ。設定ファイル不要。
```

BunはTypeScriptのトランスパイル（変換）を内部で超高速に行うため、`.ts` ファイルをそのまま引数に渡すだけで実行できます。
ただし注意点として、Bunはトランスパイル（構文変換）は行いますが、**型チェック（type checking）は行いません**。型の検査が必要な場合は別途 `tsc --noEmit` を実行する必要があります。

### JavaScriptCore エンジン

| エンジン | 由来 | 採用ランタイム | 特徴 |
| :--- | :--- | :--- | :--- |
| **V8** | Google Chrome | Node.js, Deno | JIT最適化に強い。長時間実行に有利 |
| **JavaScriptCore** | Apple Safari | **Bun** | 起動が速い。メモリ効率が良い |
| **SpiderMonkey** | Mozilla Firefox | （サーバーサイドでは未採用） | — |

BunがJavaScriptCoreを選んだ理由は、CLIツールのような「起動→処理→終了」が高速に繰り返されるユースケースにおいて、V8よりも**コールドスタート（初回起動）が圧倒的に速い**ためです。

## 3. Node.js / Deno との比較

```
                Node.js              Deno                  Bun
────────────────────────────────────────────────────────────────────
開発者:         Ryan Dahl            Ryan Dahl             Jarred Sumner
初版リリース:    2009年               2020年                2022年
エンジン:       V8                   V8                    JavaScriptCore
言語:           C++ / JavaScript     Rust / TypeScript     Zig / C++
TS実行:         変換が必要            ネイティブ             ネイティブ
パッケージ:     npm                  npm互換 + URL import  npm互換 (超高速)
セキュリティ:    制限なし             パーミッション制御     制限なし
バンドラ:       外部ツール必須        未搭載                 標準搭載
テスト:         外部ツール必須        標準搭載               標準搭載
バイナリ化:     外部ツール必須        deno compile          bun build --compile
```

### 選定の指針

- **安定性・エコシステム最優先** → Node.js（npmパッケージの互換性が最も広い）
- **セキュリティ・権限制御が重要** → Deno（デフォルトでネットワーク・ファイルアクセスを制限）
- **速度・TypeScript体験・CLIツール** → Bun（起動速度と開発体験が圧倒的）

## 4. 強みと弱み (Pros/Cons)

| 視点 | 強み (Pros) | 弱み (Cons) |
| :--- | :--- | :--- |
| **速度** | npm installが最大30倍速。コールドスタートも最速クラス。 | 長時間稼働のWebサーバー用途ではV8（Node.js）とほぼ差がないケースも。 |
| **開発体験 (DX)** | TS直接実行、テスト・バンドラ標準搭載。ゼロ設定で始められる。 | 型チェック（tsc）は行わないため、別途実行が必要。 |
| **互換性** | Node.jsのAPIの大部分を互換実装。npmパッケージの多くがそのまま動く。 | 一部のNode.js固有API（vm, inspector等）や、C++アドオン（native addon）は非対応。 |
| **エコシステム** | npm互換のため既存パッケージ資産を活用できる。 | Bun固有API（`Bun.file()` 等）を使うとNode.jsでは動かなくなる（ロックイン）。 |
| **単一バイナリ** | `bun build --compile` で配布用バイナリを一発生成。 | クロスコンパイル（例: macOSでLinux用バイナリを作る）の選択肢が限定的。 |

## 5. 本当の基礎事項

### 最低限覚えるべきコマンド

```bash
# プロジェクト初期化（package.jsonの作成）
bun init

# パッケージのインストール
bun install                    # 全依存関係をインストール
bun add zod                    # 新しいパッケージを追加
bun add -D @types/node         # 開発用パッケージを追加

# TypeScriptファイルの実行
bun run src/index.ts

# テスト実行
bun test

# バンドル（フロントエンド用）
bun build ./src/index.ts --outdir ./dist

# 単一バイナリコンパイル（CLI配布用）
bun build --compile ./src/index.ts --outfile ./dist/myapp
```

### `bun run` vs `bunx`

```bash
# bun run: ローカルのスクリプトやpackage.jsonのscriptsを実行
bun run dev              # package.json の "scripts": { "dev": "..." } を実行
bun run src/index.ts     # TypeScriptファイルを直接実行

# bunx: npxと同等。一時的にパッケージをダウンロードして実行
bunx create-next-app     # グローバルにインストールせず一度だけ実行
```

### Node.jsとの互換性ルール

```typescript
// ✅ Node.js互換API（Bunでもそのまま動く）
import fs from "node:fs";        // ファイルシステム
import path from "node:path";    // パス操作
import { Buffer } from "buffer"; // バッファ操作

// ⚠️ Bun固有API（Node.jsでは動かない）
const file = Bun.file("./data.json");  // Bun専用のファイルAPI
const server = Bun.serve({ ... });     // Bun専用のHTTPサーバー

// 💡 方針: 移植性が必要ならnode:xxxを使い、Bun専用でよいならBun.xxxを使う
```

> 📖 Bunの `bun build --compile` を活用したCLIツール配布戦略については **[Bunの単一バイナリコンパイルと配布戦略](../09_CLI_Agent_Development/05_Bun_Advanced_Compilation)** をご参照ください。
