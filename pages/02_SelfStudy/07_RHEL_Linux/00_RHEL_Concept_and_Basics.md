# 00. RHEL (Red Hat Enterprise Linux) の原点と概念

## 1. 歴史と誕生背景

1993年、Red Hat社が設立され、Linuxの商用ディストリビューションとして**RHEL (Red Hat Enterprise Linux)** を展開しました。
Ubuntuが「個人開発者やスタートアップに愛されるLinux」であるのに対し、RHELは**「エンタープライズ（大企業・官公庁・金融機関）領域における絶対的な商用Linux」**として君臨しています。

### UbuntuとRHELの系統の違い

Linuxは「ディストリビューション（ディストロ）」と呼ばれる無数の流派に分かれていますが、大きく2つの系統に分類されます。

| 系統 | 代表 | パッケージ管理 | 設定ファイルの流儀 |
| :--- | :--- | :--- | :--- |
| **Debian系** | Ubuntu, Debian | `apt` / `.deb` | `/etc/apache2/` 等 |
| **Red Hat系** | RHEL, CentOS, Rocky, AlmaLinux, Fedora | `dnf` (旧`yum`) / `.rpm` | `/etc/httpd/` 等 |

訓練校で学んだUbuntuは「Debian系」です。RHELは「Red Hat系」であり、**パッケージのインストールコマンドが `apt` ではなく `dnf`（旧 `yum`）**になり、設定ファイルの配置場所もApacheが `/etc/httpd/` になるなど、見た目レベルで差異があります。ただし、中身のLinuxカーネル自体は同じものです。

### CentOSの終焉とRocky / AlmaLinuxの台頭

かつてはRHELの無償版クローンとして「**CentOS**」が広く使われていましたが、2020年にRed Hat社がCentOSを実質的に開発終了（CentOS Stream化）させたため、代替としてコミュニティが立ち上げた **Rocky Linux** と **AlmaLinux** が急速に普及しています。

## 2. 概念と動作原理（Ubuntu との主要な違い）

### パッケージ管理: `dnf` (旧 `yum`)

```bash
# パッケージの情報を最新に更新する (apt update に相当)
sudo dnf check-update

# パッケージのインストール (apt install に相当)
sudo dnf install httpd    # Apache（RHELではhttpdという名前）

# インストール済みパッケージの全更新 (apt upgrade に相当)
sudo dnf upgrade

# パッケージの削除
sudo dnf remove httpd
```

### サービス管理: `systemctl` (Ubuntu と共通)

systemd は Debian系も Red Hat系も共通なため、`systemctl` コマンドは同一です。

```bash
# Apacheの起動・自動起動有効化
sudo systemctl start httpd
sudo systemctl enable httpd
```

### ファイアウォール: `firewalld` (UFW ではない)

RHELのファイアウォールはUFWではなく **`firewalld`** が標準です。

```bash
# 現在の設定一覧を表示
sudo firewall-cmd --list-all

# HTTPとHTTPSポートを恒久的に許可する
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# 設定の再読み込み（恒久ルールを即時反映）
sudo firewall-cmd --reload
```

### SELinux (Security-Enhanced Linux)

RHELにはUbuntuにない**SELinux**という強制アクセス制御(MAC)が標準で有効化されています。
Apacheの設定にミスが無いのに「Permission Denied」でWebサイトが表示されない場合、SELinuxがアクセスを阻止しているケースが非常に多いです。

```bash
# SELinuxの現在の動作モード確認
getenforce
# Enforcing（強制）, Permissive（警告のみ）, Disabled（無効）

# 一時的にPermissive(警告のみ)モードに変更して動作検証する
sudo setenforce 0

# Webコンテンツとして正しいSELinuxラベルをファイルに設定する
sudo chcon -R -t httpd_sys_content_t /var/www/html/
```

## 3. 強みと弱み (Pros/Cons)

- **強み (Pros)**: 10年以上の超長期サポート（LTS）が提供されます。金融機関のシステムなど「10年間OSを絶対にアップグレードしない」ことが要件となるエンタープライズ環境では、RHELの安定性と有償サポートの手厚さが圧倒的な信頼を勝ち取っています。
- **弱み (Cons)**: 有償ライセンスが必要です（開発者向けの無料プログラムは存在します）。また、最新のソフトウェアバージョンの採用が遅い（安定性を最優先するため）ので、最新のNode.jsやPythonを使いたい場合に苦労することがあります。

## 4. 本当の基礎事項

- **Ubuntuとコマンドの読み替え表を持て**
  Linuxの基盤（`cd`, `ls`, `grep`, `chmod`, `systemctl` 等）は共通です。違うのは「パッケージマネージャー（apt ↔ dnf）」「ファイアウォール（ufw ↔ firewalld）」「セキュリティ（AppArmor ↔ SELinux）」「設定ファイルの場所（apache2 ↔ httpd）」です。この「翻訳表」さえ頭に入れば、Ubuntu経験者はRHELにすぐ適応できます。
