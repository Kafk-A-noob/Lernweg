# 00. 業務システム開発と社内SE基礎

社内向けの業務システム（売上管理・営業支援等）を開発・運用する際に求められる技術と概念の全体像です。

## 1. 社内業務システムの全体像

企業の内部で使われるシステムは大きく以下の3つに分類されます。

| 分類 | 具体例 | 主な技術 |
| :--- | :--- | :--- |
| **SFA (Sales Force Automation)** | 営業活動の記録・分析・案件管理 | CRMプラットフォーム, JavaScript, Python |
| **売上管理・基幹システム** | 受注・売上・在庫のデータ管理 | SQL, Python(バックエンド), Excel連携 |
| **社内インフラ** | ネットワーク管理, ヘルプデスク | Active Directory, VPN, Linux/Windows Server |

## 2. SFA (営業支援システム) の概念

SFAとは、営業部隊の活動を「見える化」し、売上予測やボトルネックの発見を支援するシステムです。

### SFAが解決する問題

- 営業担当がどの顧客にいつ何を提案したか、個人のExcelや記憶に頼っている（属人化）
- 案件の進捗状況がマネージャーに見えない
- 売上見込みの精度が低い

### SFAの主要機能

1. **顧客管理 (Account / Contact)**: 取引先企業と担当者の情報をデータベースで一元管理
2. **商談管理 (Opportunity)**: 案件の金額・確度・ステージ（初回提案→見積→交渉→受注）をパイプラインとして可視化
3. **活動記録 (Activity)**: 電話・メール・訪問等の営業アクションのログ
4. **ダッシュボード**: リアルタイムの売上集計・グラフ（JavaScript等で動的に描画）

## 3. CRMプラットフォーム開発の基礎知識

大規模なSFA/CRM環境では、プラットフォーム上でのカスタマイズ開発が求められることがあります。

### 代表的な開発技術

- **Lightning Web Components (LWC)**: プラットフォームのUI画面をカスタマイズするための、**Web標準準拠のJavaScript + CSSフレームワーク**です。React等と同様にコンポーネント指向であり、HTML/CSS/JavaScriptの知識がそのまま活きます。
- **SOQL (Structured Object Query Language)**: SQLによく似たクエリ言語で、プラットフォーム内のオブジェクト（テーブル）からデータを取得します。`SELECT Name, Amount FROM Opportunity WHERE StageName = 'Closed Won'` のようにSQLとほぼ同じ構文です。
- **API連携 (REST API)**: 外部システム（Pythonスクリプトやバッチ処理等）からCRMのデータを取得・更新するためのREST APIが提供されています。PythonやNode.jsから `requests` / `fetch` で呼び出すのが一般的です。

## 4. Pythonによる業務自動化スクリプト

社内SEの「裏の主力兵器」です。

```python
# 例: CSVの売上データを読み込んで集計レポートを自動生成する
import pandas as pd

df = pd.read_csv("sales_data.csv")

# 部門別の売上合計を集計
summary = df.groupby("department")["amount"].sum().sort_values(ascending=False)

# Excel形式で出力
summary.to_excel("monthly_report.xlsx")
print("レポート生成完了")
```

### よく使うライブラリ

| ライブラリ | 用途 |
| :--- | :--- |
| `pandas` | CSV/Excelデータの読み込み・集計・加工 |
| `openpyxl` | Excelファイルの直接操作（セル書式・グラフ等） |
| `requests` | 外部API（CRM等）との通信 |
| `schedule` / `cron` | 定時バッチ処理の自動実行 |
| `smtplib` | メールの自動送信（レポート配信等） |

## 5. 社内インフラ管理の基礎知識

### Active Directory (AD)

Windows環境における「社員のアカウント管理の司令塔」です。
社員のログインID・パスワード・所属部署・PCへのアクセス権限を一元管理し、「入社したらADにアカウント作成」「退職したらADから即削除」を行います。

### ヘルプデスク・問い合わせ対応

社内SEの業務の大部分を占めるのが、他部署からの「PCが動かない」「メールが送れない」「Excelの関数を教えて」といったサポート対応です。
技術力だけでなく、**「ITリテラシーが高くない人にもわかる言葉で説明し、記録（チケット管理）を残す」**コミュニケーション能力が求められます。
