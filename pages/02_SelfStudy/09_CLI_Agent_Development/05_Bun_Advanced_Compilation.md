# 05. Bunの単一バイナリコンパイルと配布戦略

CLIツールを「利用者の環境にNode.jsやBunがインストールされていなくても動作する、単一の実行可能ファイル（.exe等）」として配布するための、Bunの `bun build --compile` 機能と、その実務的な活用パターンを解説します。

> 📖 Bunの基礎概念（歴史・Node.jsとの比較・基本API）については **[Bunの実務概念と原点](../10_Bun/00_Bun_Concept_and_Basics)** をご参照ください。
> 📖 Bunの組み込みAPI・テストランナー等については **[Bun深掘り学習](../10_Bun/01_Bun_DeepDive_and_Learning)** をご参照ください。

## 1. なぜバイナリ配布が重要なのか

### 従来の配布方法（npm パッケージ）の問題

```
[配布者] npm publish でパッケージを公開

[利用者が実行するまでの手順]
1. Node.jsをインストールする（バージョン管理にnvmも必要…）
2. npm install -g oncall-agent  （グローバルインストール）
3. 依存パッケージがダウンロードされる（node_modules: 数百MB…）
4. 権限エラーが出たら sudo で再実行…
5. ようやく oncall-agent コマンドが使える

→ 障害対応の緊急時に、こんな手順を踏んでいる余裕はない
```

### バイナリ配布のメリット

```
[配布者] bun build --compile で実行ファイルを生成

[利用者が実行するまでの手順]
1. バイナリファイルをダウンロードする
2. ./oncall-agent check --service api-server

→ 2ステップ。Node.js不要。npm不要。即座に実行可能。
```

オンコール対応ツールのように「緊急時に、サーバーにsshして、すぐにコマンドを叩きたい」場面では、環境構築ゼロで動作するバイナリ配布が圧倒的に有利です。

## 2. `bun build --compile` の仕組み

### 基本コマンド

```bash
bun build --compile ./src/index.ts --outfile ./dist/oncall-agent
```

### 内部で何が起きているのか

```
     ソースコード                  Bunの処理                 出力
┌──────────────┐     ┌───────────────────────────┐     ┌──────────────┐
│ src/index.ts  │     │ 1. TypeScript → JS 変換    │     │ oncall-agent │
│ src/agent.ts  │ ──→ │ 2. 全importを解決・結合     │ ──→ │ (単一バイナリ)│
│ src/tools.ts  │     │ 3. Tree-shaking (不要コード削除) │  │              │
│ node_modules/ │     │ 4. Bunランタイムを埋め込み   │     │ = アプリコード │
└──────────────┘     │ 5. 単一の実行ファイルに圧縮  │     │ + Bunランタイム│
                      └───────────────────────────┘     └──────────────┘

                      ランタイムごとパッケージングされるため
                      実行環境に Node.js も Bun も不要
```

### 生成されるバイナリのサイズ

```
Bunランタイム本体:  約50〜80MB（プラットフォームにより異なる）
アプリケーションコード: 数KB〜数MB
────────────────────────
合計: 約50〜100MB

※ ランタイム埋め込みのため、どんなに小さなアプリでも最低50MB程度になる
※ これはGoやRustのバイナリ（数MB〜十数MB）と比べると大きい
```

## 3. クロスプラットフォームビルド

### ターゲットの指定

Bunは、ビルドを実行するマシンのOSとは異なるプラットフォーム向けのバイナリを生成できます（クロスコンパイル）。

```bash
# Linux x64 向け（本番サーバー向け。最も一般的）
bun build --compile --target=bun-linux-x64 ./src/index.ts --outfile ./dist/oncall-agent-linux

# macOS ARM64 向け（Apple Silicon Mac向け）
bun build --compile --target=bun-darwin-arm64 ./src/index.ts --outfile ./dist/oncall-agent-mac

# Windows x64 向け
bun build --compile --target=bun-windows-x64 ./src/index.ts --outfile ./dist/oncall-agent.exe
```

### 利用可能なターゲット一覧

| ターゲット | OS | CPU |
| :--- | :--- | :--- |
| `bun-linux-x64` | Linux | Intel/AMD 64bit |
| `bun-linux-arm64` | Linux | ARM 64bit (AWS Graviton等) |
| `bun-darwin-x64` | macOS | Intel Mac |
| `bun-darwin-arm64` | macOS | Apple Silicon (M1/M2/M3/M4) |
| `bun-windows-x64` | Windows | Intel/AMD 64bit |

### CI/CDでの自動ビルド例

```yaml
# GitHub Actions での全プラットフォーム一括ビルド
- name: Build binaries
  run: |
    bun build --compile --target=bun-linux-x64 ./src/index.ts --outfile ./dist/oncall-agent-linux
    bun build --compile --target=bun-darwin-arm64 ./src/index.ts --outfile ./dist/oncall-agent-mac
    bun build --compile --target=bun-windows-x64 ./src/index.ts --outfile ./dist/oncall-agent.exe
```

## 4. 環境変数の取り扱い

バイナリにコンパイルした場合、`.env` ファイルの自動読み込みは**引き続き動作します**。
ただし、APIキー等の機密情報をバイナリ内にハードコードすることは厳禁です。

### 推奨パターン

```typescript
// src/config.ts — 環境変数の一元管理

import { z } from "zod";

// Zodで環境変数の存在と型を起動時に一括検証
const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY が設定されていません"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  MAX_LOOP_ITERATIONS: z.coerce.number().int().min(1).max(20).default(5),
});

// 起動時に検証（環境変数が足りなければここでクラッシュして教えてくれる）
export const config = EnvSchema.parse(process.env);
```

### 利用者の実行方法

```bash
# 方法1: 環境変数を直接指定（一時的な利用に便利）
GEMINI_API_KEY=your-key ./oncall-agent check --service api-server

# 方法2: .env ファイルを配置（恒久的に使う場合）
echo "GEMINI_API_KEY=your-key" > .env
./oncall-agent check --service api-server

# 方法3: シェルの export（セッション中ずっと有効）
export GEMINI_API_KEY=your-key
./oncall-agent check --service api-server
```

## 5. バイナリサイズの最適化

### 外部依存の最小化

```json
// package.json — 本当に必要なパッケージだけに絞る
{
  "dependencies": {
    "@google/genai": "^1.0.0",   // LLM SDK（必須）
    "zod": "^3.23.0"             // バリデーション（必須）
    // ↑ この2つだけで CLIエージェントは構築可能
    // chalk, commander, inquirer 等はBunの標準機能で代替できる
  }
}
```

### Bunの標準機能で代替できるパッケージ

| よく使われるパッケージ | Bunの代替 |
| :--- | :--- |
| `dotenv` | Bunが `.env` を自動読み込み（不要） |
| `node-fetch` | グローバルの `fetch()` がBunに標準搭載（不要） |
| `fs-extra` | `Bun.file()`, `Bun.write()` で代替可能 |
| `jest` | `bun:test` で代替（不要） |
| `tsx` / `ts-node` | Bunがネイティブ実行（不要） |

### ソースマップの除外

```bash
# --sourcemap=none を指定するとバイナリサイズが多少縮小
bun build --compile --sourcemap=none ./src/index.ts --outfile ./dist/oncall-agent
```

## 6. Pros/Cons（バイナリ配布 vs 他の手法）

| 手法 | 強み (Pros) | 弱み (Cons) |
| :--- | :--- | :--- |
| **Bun `--compile`** | npm不要で即座に実行可能。TypeScriptからバイナリまで1コマンド | バイナリサイズが50MB超。Node.js固有のC++アドオンは使えない |
| **Node.js + pkg** | Node.jsエコシステムの全パッケージが使える | メンテナンスが停滞。Node.jsバージョンの追従が遅い |
| **Docker コンテナ** | 環境の完全再現性。依存関係の競合が起きない | Docker自体のインストールが必要。オーバーヘッド大 |
| **npm publish** | npmの巨大なエコシステムに乗れる | 利用者にNode.js環境が必須 |
| **Go / Rust で書き直し** | バイナリサイズ小（数MB）。起動が超高速 | TypeScriptから別言語への移植コストが甚大 |

### CLIエージェントの場合の最適解

オンコール対応のように「緊急時にすぐ使いたい」CLIツールでは、**Bun `--compile` によるバイナリ配布が最も実用的**です。
50MBのバイナリサイズは、高速なネットワーク環境であれば数秒でダウンロードでき、ツールの有用性に対して十分に許容可能なトレードオフです。

## 7. トラブルシューティング

- **Q. `bun build --compile` で `Cannot resolve module` エラーが出る**
  - **A.** `bun install` が完了していないか、動的な `import()` を使っている可能性があります。Bunのコンパイラは静的な `import` 文のみを解析するため、動的インポートのパスはコンパイル時に解決できません。

- **Q. 生成されたバイナリが Windows で `Windows Defender` に誤検知される**
  - **A.** 不明な発行元からの実行ファイルは、Windows Defenderがブロックする場合があります。コード署名（Code Signing Certificate）が必要ですが、個人ツールの場合は「詳細情報」→「実行」で回避できます。

- **Q. クロスコンパイルで生成したバイナリが動かない**
  - **A.** ネイティブアドオンや OS 固有の API を使用していないか確認してください。また、ターゲットプラットフォームのBunバージョンと互換性があるか確認してください。

- **Q. `.env` ファイルをバイナリと同じディレクトリに置いたが読み込まれない**
  - **A.** Bunは**カレントディレクトリ（`cwd`）** の `.env` を読み込みます。バイナリの配置場所ではなく、コマンドを実行するディレクトリに `.env` を置いてください。
