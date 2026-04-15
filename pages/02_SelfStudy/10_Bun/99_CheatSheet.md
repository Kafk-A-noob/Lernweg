# 99. Bun チートシート

よく使うBunのコマンド・API・設定をまとめたクイックリファレンスです。

## コマンド一覧

### プロジェクト管理

```bash
bun init                          # プロジェクト初期化 (package.json作成)
bun install                       # 全依存パッケージのインストール
bun add <package>                 # パッケージ追加
bun add -D <package>              # 開発用パッケージ追加
bun remove <package>              # パッケージ削除
bun update                        # 全パッケージを最新に更新
```

### 実行

```bash
bun run <file.ts>                 # TypeScript/JavaScriptファイルを実行
bun run <script-name>             # package.json の scripts を実行
bunx <package>                    # npx相当。パッケージを一時的にDL実行
bun --watch run <file.ts>         # ファイル変更時に自動再実行
```

### テスト

```bash
bun test                          # 全テストを実行
bun test <file>                   # 特定ファイルのテスト実行
bun test --watch                  # ウォッチモード
bun test --timeout 10000          # タイムアウト設定 (ms)
```

### ビルド

```bash
bun build ./src/index.ts --outdir ./dist              # バンドル
bun build --compile ./src/index.ts --outfile ./myapp   # 単一バイナリ化
bun build --compile --target=bun-linux-x64 ...         # クロスビルド
```

## Bun固有API

```typescript
// ファイル操作
const file = Bun.file("path");    // BunFileオブジェクト取得
await file.text();                // テキスト読み込み
await file.json();                // JSONパース読み込み
file.size;                        // ファイルサイズ (bytes)
file.type;                        // MIMEタイプ

await Bun.write("path", data);    // ファイル書き込み

// HTTPサーバー
Bun.serve({
  port: 3000,
  fetch(req) { return new Response("OK"); }
});

// 環境変数 (.env を自動読み込み)
Bun.env.API_KEY;                  // dotenvパッケージ不要

// ハッシュ
const hash = Bun.hash("text");   // 高速ハッシュ値
new Bun.CryptoHasher("sha256");  // 暗号学的ハッシュ

// シェルコマンド実行
const result = Bun.spawnSync(["ls", "-la"]);
```

## テストAPI (`bun:test`)

```typescript
import { describe, it, expect, mock, beforeAll, afterEach } from "bun:test";

describe("グループ名", () => {
  beforeAll(() => { /* 初期化処理 */ });
  afterEach(() => { /* 各テスト後の片付け */ });

  it("テスト名", () => {
    expect(value).toBe(expected);         // 厳密等価
    expect(value).toEqual(expected);      // 深い等価
    expect(value).toBeTruthy();           // truthy判定
    expect(value).toContain(item);        // 含有判定
    expect(fn).toThrow();                 // 例外判定
    expect(fn).toHaveBeenCalledTimes(n);  // 呼び出し回数
  });
});

// モック
const fn = mock(() => "mocked");
```

## tsconfig.json (推奨設定)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["bun-types"],
    "noEmit": true
  }
}
```

## .env ファイル読み込み優先順位

```
.env.local          ← 最優先（Git管理外にする）
.env.development    ← NODE_ENV=development 時
.env.production     ← NODE_ENV=production 時
.env                ← 共通のデフォルト値
```
