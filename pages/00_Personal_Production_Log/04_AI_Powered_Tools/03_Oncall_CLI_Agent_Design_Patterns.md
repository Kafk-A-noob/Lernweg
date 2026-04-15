# Oncall CLI Agent - 実践パターン集

本ドキュメントは、Oncall CLI Agentの開発で実装された設計パターンを「再利用可能なパターン」として整理したものである。各パターンの概要と教訓を記し、詳細な技術解説は自己学習セクションへリンクで誘導する。

---

## 1. 入力正規化パターン（Zod `preprocess`）

### 課題

LLMのFunction Callingにおいて、AIが生成する引数には「表記ゆれ（ひらがな、カタカナ、英語、大文字小文字）」が発生する。この非決定論的な出力をそのまま後続処理に通すとバグの原因となる。

### パターン

Zodの `preprocess` で「バリデーション前に入力を正規化する防波堤」を設ける。

```typescript
const ServiceNameSchema = z.preprocess((val) => {
  const normalized = String(val).trim().toLowerCase();
  // 日本語→英語の強制変換マッピング
  const MAP: Record<string, string> = {
    "ぎっとはぶ": "github", "ギットハブ": "github",
    "すらっく": "slack",     "スラック": "slack",
  };
  return MAP[normalized] ?? normalized;
}, z.nativeEnum(ServiceEnum).default(ServiceEnum.GITHUB));
```

### 得られた教訓

- **LLMの出力を信頼してはならない**: 型上は `string` でも、内容は毎回異なる前提で設計する
- **防波堤は一箇所に集約する**: 各ツール関数内でバラバラに正規化するのではなく、Zodスキーマとして一元管理することで漏れを防ぐ

> 📖 詳細解説: [Zodによる入力バリデーションパイプライン](../../02_SelfStudy/05_AI_Product_Development/04_Zod_Validation_Pipeline)

---

## 2. Interceptionパターン（Security Layer）

### 課題

LLMエージェントは「APIからデータ取得 → LLMに渡して推論」のループを形成する。外部APIが返すRaw JSONデータ（IPアドレス、JWT等）をそのままLLMに渡すと、LLMプロバイダへの機密データ流出に直結する。

### パターン

Tool層（API Fetch）とAgent層（LLM）の間に、**バイパス不可能な介入層（Security Layer）**を挟む。

```
Tool層 ──→ Security層 ──→ Agent層
(API取得)   (マスキング)   (LLM推論)

Security層を通過しないとAgent層にデータが到達できないアーキテクチャ
```

```typescript
// Security層: 正規表現による機密情報の破壊的サニタイズ
export function maskSensitiveData(rawData: string): string {
  let masked = rawData;
  for (const rule of MASKING_RULES) {
    masked = masked.replace(rule.pattern, rule.replacement);
  }
  return masked;
}
```

### 得られた教訓

- **「気をつける」ではなく「構造で強制する」**: プログラマーが「マスキング関数を呼ぶのを忘れない」に頼る設計はいつか破綻する。アーキテクチャとしてバイパスを不可能にすることが真のセキュリティ
- **マスク種別を残す**: 単に `[MASKED]` ではなく `[MASKED_IPV4]` `[MASKED_JWT]` と種別を明記することで、LLMは「IPアドレスが関係するエラーだ」という文脈を維持できる

> 📖 詳細解説: [LLMデータ渡し前のセキュリティ層](../../02_SelfStudy/09_CLI_Agent_Development/02_Data_Masking_and_Security)

---

## 3. Max-Loop Breakerパターン

### 課題

自律エージェントはAPIがダウンしている場合、「情報が足りない」と判断して延々とリクエストを繰り返す無限ループに陥る。これはAPIの高額課金に直結する。

### パターン

`while(true)` を**絶対に使わず**、`for` ループでハードコードされた上限値を設定する。

```typescript
const MAX_ITERATIONS = 5;

for (let i = 0; i < MAX_ITERATIONS; i++) {
  const response = await callLLM();
  if (response.isTextResponse) return response.text;  // 正常終了
  await executeTool(response.functionCall);
}
return "上限に達しました";  // 強制脱出（必ずここに到達する保証がある）
```

### 得られた教訓

- **「AIは暴走する」が前提**: 賢いAIほど「もう少し情報が欲しい」と完璧主義的にループを重ねる傾向がある
- **制限は物理的に**: システムプロンプトで「5回以内で回答せよ」と指示しても、LLMは守らないことがある。`for` ループの上限のようなコードレベルの物理的制約が必須

> 📖 詳細解説: [自律エージェントのフェイルセーフ設計](../../02_SelfStudy/09_CLI_Agent_Development/04_Failsafe_and_Rate_Limiting)

---

## 4. Zero-setup配布パターン（Bun `--compile`）

### 課題

オンコール対応ツールは「緊急時にすぐ使いたい」ため、利用者にNode.jsのインストールや `npm install` を要求するのは現実的でない。

### パターン

Bunの `bun build --compile` で、ランタイムごとパッケージングした**単一の実行可能バイナリ**を生成する。

```bash
bun build --compile ./src/index.ts --outfile ./dist/oncall-agent
# → Node.jsもBunも不要な自己完結型バイナリ
# → ダウンロードして即実行可能
```

### 得られた教訓

- **配布の手軽さ = ツールの普及率**: どんなに優れたツールでも、セットアップが複雑だと使われない。バイナリ1個で動くという手軽さは、チーム全体への普及に直結する
- **サイズのトレードオフは許容可能**: Bunランタイム埋め込みにより50MB超のバイナリになるが、CLIツールの有用性に対して十分に許容できる

> 📖 詳細解説: [Bunの単一バイナリコンパイルと配布戦略](../../02_SelfStudy/09_CLI_Agent_Development/05_Bun_Advanced_Compilation)
