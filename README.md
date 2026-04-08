# Lernweg (学習の軌跡) - ナレッジベースプロジェクト

本リポジトリ（ディレクトリ）は、訓練校での学習内容および個人制作の実証実験ログが集約されたMarkdownファイル群を、ポートフォリオおよび個人的な振り返り用のWebサイトとしてセキュアに外部公開するためのNext.jsプロジェクトである。
また、技術選定、構築サポートにAIを活用している。

---

## 1. プロジェクトの経緯と目的

ローカル環境に蓄積された数十ファイルの学習ログ（Frontend, Backend, Infrastructure, Portfolio解析等）をそのまま死蔵させず、「閲覧権限を持った人間がいつでもどこからでも見やすい形」で提供することを主目的とする。

同時に、この「閲覧サイト自体をNext.jsで構築・運用する」プロセスそのものを、フロントエンドエンジニアとしてのポートフォリオおよび個人的な振り返り用のWebサイトとしても昇華させる。

---

## 2. アーキテクチャと採用技術 (フェーズ別)

本プロジェクトは、他作業（Project_Last-Standの3Dモデル制作等）とのリソース分散を防ぎつつ、最大のアピール効果を得るために **「段階的移行（フェーズ制）」** のアーキテクチャ設計を採用する。

### 【Phase 1】 運用特化・高速展開フェーズ (現在)

スピードと実用性を最優先し、公式ドキュメントフレームワーク「Nextra」を採用。

- **Framework**: React / Next.js (Pages Router / Nextra環境)
- **Document Engine**: Nextra (MarkdownからのSSG自動生成、全文検索、サイドバー自動構築)
- **Layout**: `components/GlobalLayout.jsx` による全ページ共通レイアウト（サイドバーの安定化）
- **Security**: Next.js Middleware による Basic認証 (パスワードを知る者のみアクセス可)
- **Deployment**: Vercel (CI/CD自動連携)

### 【Phase 2】 学習特化・完全自作フェーズ (将来予定)

他プロジェクトが落ち着いた段階で、Next.jsの最新コア機能の学習・アピールを目的とし、App Routerベースの完全自作UIへとリプレイスする。
（※Markdownファイル群という「データ資産」はそのまま流用できるため、フロント部分のみの差し替えで実現可能）

- **Framework**: React / Next.js (App Router)
- **Styling**: Tailwind CSS
- **Markdown Parse**: `react-markdown`, `gray-matter` (Node.jsの `fs` モジュールによるローカルパース)
- **Routing**: Dynamic Routes (`[slug]`) による完全自作コンポーネント展開

---

## 3. コンテンツ構成 (2026年4月時点)

### 📂 `01_25R1116` — 訓練校カリキュラム

| カテゴリ | 内容 |
| :--- | :--- |
| **01_Frontend** | HTML/CSS, JavaScript, React, Next.js (各言語の歴史・概念・チートシート付き) |
| **02_Backend** | Python, Flask (歴史・概念・チートシート付き) |
| **03_Infrastructure** | Database(SQL), Linux/Ubuntu (hosts, WSL, ユーザー管理, パーミッション, apt/SSH, UFW/ファイアウォール, LAMP DeepDive, systemd, ログ/cron) |

### 📂 `02_SelfStudy` — 自己学習コンテンツ

| カテゴリ | 内容 |
| :--- | :--- |
| **01_ExcelVBA** | VBAの概念、マクロ記録からの脱却、配列処理の高速化 |
| **02_Access** | DAO/ADOによるレコードセット操作、SQL直接実行 |
| **03_Java** | equals比較の罠、コレクション操作、例外処理 |
| **04_VB** | イベントハンドリング、クロススレッド例外 |
| **05_AI_Product_Development** | MCP (Model Context Protocol), Agentic AI, LLMOps, RAG, VectorDB, Generative UI/UX |
| **06_FastAPI** | 歴史・概念、非同期(ASGI)の原理、Pydantic、学習ロードマップ |
| **07_RHEL_Linux** | Red Hat系Linux(dnf, firewalld, SELinux)とUbuntuとの翻訳対照表 |

### 📂 `03_Encyclopedia` — 実務・お作法図鑑

| カテゴリ | 内容 |
| :--- | :--- |
| **01_JavaScript_TypeScript** | ロジック構築メソッド図鑑 |
| **02_Python** | リスト内包表記、アンチパターン、型ヒント |

---

## 4. 今後の作業タスク

- [ ] Phase 2 への移行（App Router化）
- [ ] コンテンツのさらなる拡充（Docker/コンテナ技術、CI/CD、テスト手法等）
