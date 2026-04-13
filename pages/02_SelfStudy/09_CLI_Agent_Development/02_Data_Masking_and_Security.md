# 02. LLMへのデータ渡し前のセキュリティ層 (Data Masking)

LLMに外部APIから取得した生データを渡す際、機密情報（IPアドレス、JWTトークン、APIキー等）をそのまま送信してしまうと、LLMプロバイダ（Google, OpenAI等）のサーバーに機密データが流出するリスクがあります。
これを防ぐために、LLMへの入力前に**中間処理としてデータをサニタイズ（無害化）**する「Security層」の設計を解説します。

> 📖 LLMのセキュリティ全般（Prompt Injection対策、Guardrails層）については **[LLMOpsとアーキテクチャ](../../02_SelfStudy/05_AI_Product_Development/02_LLMOps_and_Architecture)** をご参照ください。

## 1. なぜData Maskingが必要なのか

### 問題のシナリオ

```
1. CLIエージェントが監視APIからエラーログを取得する
2. ログの中にIPアドレス、JWT、内部APIキーが含まれている
3. そのままLLMに「このログを分析して」と渡す
4. LLMプロバイダのサーバーに生のIPアドレスやトークンが送信される
5. → セキュリティポリシー違反・情報漏洩リスク
```

### Data Maskingによる解決

LLMに渡す**直前**に、正規表現で機密データを検知し `[MASKED]` に強制置換します。
LLMは `[MASKED]` という文字列を見るだけなので、機密情報を学習データに取り込まれるリスクがなくなります。

```
Before: "Error from 192.168.1.100: auth failed with token eyJhbGciOi..."
After:  "Error from [MASKED_IPV4]: auth failed with token [MASKED_JWT]"
```

## 2. 正規表現による機密データ検知パターン

### IPv4アドレス

```typescript
// IPv4: 0.0.0.0 〜 255.255.255.255 のドット区切り4オクテット
const IPV4_PATTERN = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

// 使用例
const masked = raw.replace(IPV4_PATTERN, "[MASKED_IPV4]");
// "Connection from 10.0.3.42 refused" → "Connection from [MASKED_IPV4] refused"
```

### IPv6アドレス

```typescript
// IPv6: コロン区切りの16進数表記（省略形を含む）
const IPV6_PATTERN = /\b(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b/g;

const masked = raw.replace(IPV6_PATTERN, "[MASKED_IPV6]");
// "Source: 2001:0db8:85a3::8a2e:0370:7334" → "Source: [MASKED_IPV6]"
```

### JWT (JSON Web Token)

```typescript
// JWTの構造: header.payload.signature（全てBase64URL）
// headerは必ず {"alg":...} で始まるため、Base64エンコードすると "eyJ" から始まる
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

const masked = raw.replace(JWT_PATTERN, "[MASKED_JWT]");
// "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123"
// → "Bearer [MASKED_JWT]"
```

### メールアドレス

```typescript
// 簡易的なメールアドレスパターン
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const masked = raw.replace(EMAIL_PATTERN, "[MASKED_EMAIL]");
```

### APIキー・シークレット（汎用パターン）

```typescript
// "key=", "token=", "secret=" 等のキーワードに続く英数字列を検知
const API_KEY_PATTERN = /(?:api[_-]?key|token|secret|password)\s*[=:]\s*["']?[A-Za-z0-9_\-./+=]{16,}["']?/gi;

const masked = raw.replace(API_KEY_PATTERN, "[MASKED_CREDENTIAL]");
// "api_key=sk-proj-abc123def456ghi789" → "[MASKED_CREDENTIAL]"
```

## 3. マスキング処理の統合実装

```typescript
// security/dataMasker.ts — Security層の中核モジュール

/** マスキングルールの定義 */
const MASKING_RULES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, replacement: "[MASKED_JWT]" },
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: "[MASKED_IPV4]" },
  { pattern: /\b(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b/g, replacement: "[MASKED_IPV6]" },
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: "[MASKED_EMAIL]" },
  { pattern: /(?:api[_-]?key|token|secret|password)\s*[=:]\s*["']?[A-Za-z0-9_\-./+=]{16,}["']?/gi, replacement: "[MASKED_CREDENTIAL]" },
];

/**
 * 生データ内の機密情報をマスキングする
 * @param rawData - 外部APIから取得した生のテキストデータ
 * @returns マスキング済みのテキストデータ
 */
export function maskSensitiveData(rawData: string): string {
  let masked = rawData;

  for (const rule of MASKING_RULES) {
    // 正規表現にgフラグが付いているため、全出現箇所を一括置換
    masked = masked.replace(rule.pattern, rule.replacement);
  }

  return masked;
}
```

### 使用例（ツール層からLLMへの受け渡し時）

```typescript
import { maskSensitiveData } from "./security/dataMasker";

async function fetchErrorLogs(serviceName: string): Promise<Record<string, unknown>> {
  // Tool層: 外部APIから生データを取得
  const response = await fetch(`https://monitoring.internal/api/logs?service=${serviceName}`);
  const rawJson = await response.text();

  // Security層: LLMに渡す前にマスキング
  const sanitizedJson = maskSensitiveData(rawJson);

  // マスキング済みデータをLLMに返す（生データは絶対に渡さない）
  return JSON.parse(sanitizedJson);
}
```

## 4. テストの書き方

マスキング処理は「漏れ」があると情報漏洩に直結するため、テストコードによる網羅的な検証が必須です。

```typescript
// security/dataMasker.test.ts
import { describe, it, expect } from "bun:test";
import { maskSensitiveData } from "./dataMasker";

describe("maskSensitiveData", () => {
  it("IPv4アドレスをマスクすること", () => {
    const input = "Connection from 192.168.1.100 refused";
    const result = maskSensitiveData(input);
    expect(result).toBe("Connection from [MASKED_IPV4] refused");
    expect(result).not.toContain("192.168.1.100"); // 生IPが残っていないことを確認
  });

  it("JWTトークンをマスクすること", () => {
    const input = "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    const result = maskSensitiveData(input);
    expect(result).toBe("Bearer [MASKED_JWT]");
  });

  it("複数種別の機密データを同時にマスクすること", () => {
    const input = "User admin@example.com from 10.0.0.1 with token eyJhbGci...";
    const result = maskSensitiveData(input);
    expect(result).not.toContain("admin@example.com");
    expect(result).not.toContain("10.0.0.1");
  });

  it("機密データを含まないテキストはそのまま返すこと", () => {
    const input = "Service api-server returned status 200";
    const result = maskSensitiveData(input);
    expect(result).toBe(input); // 変更なし
  });
});
```

## 5. トラブルシューティング

- **Q. マスキングルールが多すぎて処理が遅い**
  - **A.** 正規表現のコンパイルはモジュール読み込み時に1回だけ行われるため、ルール数が増えてもパフォーマンスへの影響は軽微です。ただし、過度に複雑な正規表現（バックトラッキングが多発するもの）はReDoS（正規表現DoS攻撃）の原因となるため、パターンは可能な限りシンプルに保ってください。
- **Q. マスキングにより本来必要だった情報まで消えてしまう**
  - **A.** `[MASKED_IPV4]` のように**何がマスクされたかの種別**を残しておけば、LLMは「IPアドレスが関係するエラーだ」という文脈は維持できます。単に `[MASKED]` だけだと情報が失われすぎます。
