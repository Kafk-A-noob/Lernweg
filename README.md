# Lernweg (学習の軌跡) - ナレッジベースプロジェクト

本リポジトリ（ディレクトリ）は、訓練校での学習内容および個人制作の実証実験ログが集約されたMarkdownファイル群を、ポートフォリオ（技術アピール）および個人的な振り返り用のWebサイトとしてセキュアに外部公開するためのNext.jsプロジェクトである。
また、技術選定、構築サポートにAIを活用している。

---

## 1. プロジェクトの経緯と目的

ローカル環境に蓄積された数十ファイルの学習ログ（Frontend, Backend, Infrastructure, Portfolio解析等）をそのまま死蔵させず、「閲覧権限を持った人間がいつでもどこからでも見やすい形」で提供することを主目的とする。

同時に、この「閲覧サイト自体をNext.jsで構築・運用する」プロセスそのものを、フロントエンドエンジニアとしてのポートフォリオ（技術証明）の一部として昇華させる。

---

## 2. アーキテクチャと採用技術 (フェーズ別)

本プロジェクトは、他作業（Project_Last-Standの3Dモデル制作等）とのリソース分散を防ぎつつ、最大のアピール効果を得るために **「段階的移行（フェーズ制）」** のアーキテクチャ設計を採用する。

### 【Phase 1】 運用特化・高速展開フェーズ (現在)

スピードと実用性を最優先し、公式ドキュメントフレームワーク「Nextra」を採用。

- **Framework**: React / Next.js (Pages Router / Nextra環境)
- **Document Engine**: Nextra (MarkdownからのSSG自動生成、全文検索、サイドバー自動構築)
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

## 3. 今後の作業タスク (Phase 1)

1. Next.js + Nextra テンプレートでの初期環境構築 (`npx create-next-app`)
2. `Learning_Log` から本ディレクトリへのMarkdown資産の移動と、Nextraのルーティング（`_meta.json` 等）に向けたフォルダ構造の最適化
3. `middleware.ts` の配置によるBasic認証の適用
4. Vercelへのデプロイと接続テスト
