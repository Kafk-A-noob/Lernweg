# 00. CLIアプリケーション設計とBunランタイム

ターミナル上で動作するCLI（Command Line Interface）アプリケーションの設計思想と、TypeScriptを直接実行できる高速ランタイム「Bun」の特徴を解説します。

## 1. CLIアプリケーションとは何か

アプリケーションのUI（ユーザーインターフェース）には大きく3つの形態があります。

| 形態 | 操作方法 | 代表例 |
| :--- | :--- | :--- |
| **GUI** | マウスクリック・タッチ操作 | VSCode, Chrome, Slack |
| **Web** | ブラウザ上でHTTPリクエスト | WordPress管理画面, Vercelダッシュボード |
| **CLI** | ターミナルにコマンドを打ち込む | `git`, `npm`, `docker`, `curl` |

CLIアプリケーションは「ターミナル（黒い画面）にコマンドを入力し、テキストで結果を受け取る」形式のプログラムです。
GUIと比べて華やかさはありませんが、**自動化（スクリプトやcronとの連携）**と**他のCLIツールとの組み合わせ（パイプライン）**に圧倒的な強みを持ちます。

### なぜCLIで作るのか？

例えば「障害発生時の初動調査ツール」を考えた場合：

- **Web UIで作る場合**: ブラウザを開く → ログインする → ダッシュボードを探す → ボタンを押す（5ステップ）
- **CLIで作る場合**: `oncall check --service api-server`（1コマンド）

緊急対応の現場では、キーボードから手を離さず即座にコマンドを叩けるCLIの方が圧倒的に素早く行動でき、かつsshでリモートサーバー上からも実行できます。

## 2. CLIの基本的な入出力設計

### stdin / stdout / stderr（標準入力・標準出力・標準エラー出力）

CLIアプリケーションは、OSが用意する3つの「パイプ（管）」を通じてデータをやり取りします。

```
┌──────────┐      stdin       ┌──────────────┐      stdout      ┌──────────┐
│ ユーザー   │ ─────────────→ │  CLIアプリ     │ ─────────────→ │ ターミナル │
│ (キーボード)│                │  (プログラム)  │                │ (画面表示) │
└──────────┘                 └──────┬───────┘                └──────────┘
                                     │ stderr
                                     ↓
                              ┌──────────┐
                              │ エラー出力  │
                              └──────────┘
```

```typescript
// stdoutへの出力（正常な結果）
console.log("分析結果: サービスは正常です");

// stderrへの出力（エラーや警告）
console.error("警告: APIレート制限に近づいています");
```

### 終了コード（Exit Code）

CLIアプリケーションは終了時に「数値」を返します。これにより、呼び出し側のスクリプトが成功/失敗を判定できます。

```typescript
// 正常終了 (exit code: 0)
process.exit(0);

// エラー終了 (exit code: 1 以上は全てエラー)
process.exit(1);
```

```bash
# シェルスクリプトでの活用例: 前のコマンドが成功した場合のみ次を実行
oncall check --service api && echo "問題なし" || echo "異常検知"
```

### コマンドライン引数の設計

```bash
# よくあるCLIの引数パターン
mycli <サブコマンド> [オプション] [引数]

# 実例
git commit -m "fix: バグ修正"
#    ↑サブコマンド ↑オプション  ↑引数
```

```typescript
// Bunでのコマンドライン引数の取得
const args = process.argv.slice(2); // 最初の2要素はランタイムとスクリプトパスなので除外

// args[0] = サブコマンド (例: "check")
// args[1] = オプション (例: "--service")
// args[2] = 引数 (例: "api-server")
```

## 3. Bun — 次世代のJavaScript/TypeScriptランタイム

### Node.js との比較

```
                  Node.js                           Bun
実行エンジン:      V8 (Chrome)                       JavaScriptCore (Safari)
TS実行:           tsc → node (2段階)                 bun run file.ts (直接実行)
パッケージ管理:    npm install (遅い)                  bun install (爆速)
テストランナー:    Jest等を別途インストール              bun test (標準搭載)
バンドラ:         webpack/esbuild等を別途設定          bun build (標準搭載)
単一バイナリ化:    pkg等のサードパーティ                 bun build --compile (標準機能)
```

### Bunの最大の武器: 単一バイナリコンパイル

```bash
# TypeScriptのソースコードを1つの実行可能ファイルにコンパイル
bun build --compile ./src/index.ts --outfile ./dist/oncall-agent

# 生成された実行ファイルはNode.jsやBunがインストールされていない環境でも動作する
./dist/oncall-agent check --service api-server
```

これにより、CLIツールを配布する際に「まずNode.jsをインストールして、次に`npm install`して…」という手順が不要になります。
**バイナリ1個を渡すだけ**でどのLinux/Mac環境でも即座に動作するため、オンコール対応ツールのような「すぐ使いたい」場面で非常に有利です。

### Bunのテストランナー

```typescript
// sum.test.ts — Bun標準のテストランナーを使用
import { describe, it, expect } from "bun:test";
import { sum } from "./sum";

describe("sum関数", () => {
  it("正の数の加算が正しく動作すること", () => {
    expect(sum(1, 2)).toBe(3);
  });

  it("負の数を含む加算が正しく動作すること", () => {
    expect(sum(-1, 1)).toBe(0);
  });
});
```

```bash
# テスト実行（Jestと同じ感覚で使えるが、別途インストール不要）
bun test
```

## 4. TypeScript Strictモードの有効化

CLIエージェントのように外部APIのレスポンスやLLMの出力を扱うプログラムでは、型の安全性が生命線です。

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,           // 全ての厳格チェックを一括で有効化
    "noUncheckedIndexedAccess": true, // 配列アクセス時にundefinedの可能性を強制チェック
    "noImplicitAny": true     // 型推論できない変数に暗黙のany型を許さない
  }
}
```

### `strict: true` が防ぐバグの例

```typescript
// strict: false の場合 → コンパイルは通るが実行時にクラッシュする
function greet(name) {          // name の型が暗黙的に any
  return name.toUpperCase();    // name が null でもコンパイラは何も言わない
}
greet(null); // 実行時エラー: Cannot read properties of null

// strict: true の場合 → コンパイル時点でエラーになる（事前に防げる）
function greet(name: string) {  // 型の明示が強制される
  return name.toUpperCase();
}
greet(null); // コンパイルエラー: Argument of type 'null' is not assignable
```

## 5. トラブルシューティング

- **Q. `bun build --compile` で `Cannot find module` エラーが出る**
  - **A.** `bun install` が完了していないか、`tsconfig.json` の `paths` 設定にBun非対応のエイリアスが含まれている可能性があります。`bun install` を再実行してください。
- **Q. Bunで動くがNode.jsでは動かないコードがある**
  - **A.** BunにはNode.jsとの互換性がない独自APIが一部存在します（`Bun.file()` 等）。Node.jsとの互換性が必要な場合は、`node:fs` 等の標準モジュールを使用してください。
