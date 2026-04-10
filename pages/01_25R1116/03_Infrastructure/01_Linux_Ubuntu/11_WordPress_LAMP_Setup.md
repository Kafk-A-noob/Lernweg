# 11. WordPressインストールと初期設定 (LAMP環境)

LAMP環境（Linux + Apache + MySQL/MariaDB + PHP）の集大成として、世界のWebサイトの約40%を動かしている巨大CMS「WordPress」を実際にインストール・設定する手順と、その裏側で何が起きているかを解説します。

## 1. そもそもWordPressとは何か？

WordPressは **PHP** で書かれた「CMS（Content Management System：コンテンツ管理システム）」です。
ブログ記事やお知らせページを、HTMLを書かずにブラウザの管理画面から投稿・編集できます。

### WordPressが動く仕組み（LAMP全要素の連動）

ユーザーがWordPressサイトにアクセスした際、内部では以下が瞬時に連鎖します。

1. **Apache** がHTTPリクエストを受け取る
2. `.htaccess` の `mod_rewrite` がURLを書き換え、全リクエストを `index.php` に転送する
3. **PHP** が `index.php` を実行し、URLに応じたテンプレートファイル（テーマ）を選択する
4. PHPが **MySQL/MariaDB** に接続し、記事データを `SELECT` で取得する
5. 取得したデータをHTMLに組み込み、Apacheを通してブラウザに返す

つまり、LAMP環境で学んだ「Apache → PHP → MySQL → HTMLレスポンス」の伝言ゲームが、WordPressの1回のページ表示ごとに毎回実行されているのです。

## 2. 前提条件の確認

```bash
# Apacheが動いているか
sudo systemctl status apache2

# MySQL (MariaDB) が動いているか
sudo systemctl status mysql   # または mariadb

# PHPがインストールされているか（最低7.4以上、推奨8.x系）
php -v
```

### 必須のPHP拡張モジュール

WordPress本体が内部で使うPHPの追加機能（拡張モジュール）がインストールされていないと、インストール画面で警告が出るか、機能が正常に動きません。

```bash
# 必須のPHP拡張を一括インストール
sudo apt install php-mysql php-curl php-gd php-mbstring php-xml php-zip php-intl

# インストール後、Apacheを再起動して拡張を反映
sudo systemctl restart apache2
```

| 拡張モジュール | 役割 |
| :--- | :--- |
| `php-mysql` | PHPからMySQL/MariaDBに接続するためのドライバ（PDO） |
| `php-curl` | 外部API（プラグインの更新確認等）への通信 |
| `php-gd` | サムネイル画像の自動生成・リサイズ |
| `php-mbstring` | 日本語（マルチバイト文字）の正しい処理 |
| `php-xml` | RSSフィードやサイトマップの生成 |
| `php-zip` | プラグイン・テーマの`.zip`アップロード・展開 |

## 3. WordPress用データベースの作成

```sql
-- MySQLにrootでログイン
-- mysql -u root -p

-- WordPress専用のデータベースを作成
CREATE DATABASE wordpress_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- WordPress専用のDBユーザーを作成し、権限を付与
CREATE USER 'wp_user'@'localhost' IDENTIFIED BY '強力なパスワード';
GRANT ALL PRIVILEGES ON wordpress_db.* TO 'wp_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### なぜ `utf8mb4` を指定するのか？

MySQLの古い `utf8` 文字コードは、実は**本物のUTF-8ではなく、3バイトまでしか格納できない不完全な実装**です。
絵文字（🎉 等）は4バイトの文字であるため、`utf8` だと保存時にエラーになります。
`utf8mb4` が「本物のUTF-8」であり、現代のWebシステムでは必ずこちらを使います。

> ⚠️ **アンチパターン**: rootユーザーでWordPressからDBに接続するのは絶対にNGです。万が一WordPressが乗っ取られた場合、全データベースが破壊されます。必ず専用ユーザーを作り、そのWordPress用DBだけに権限を限定してください。

## 4. WordPressのダウンロードと配置

```bash
# 最新版をダウンロード
cd /tmp
curl -O https://wordpress.org/latest.tar.gz

# 解凍
tar xzvf latest.tar.gz

# Apacheの公開ディレクトリに配置
sudo cp -r wordpress/* /var/www/html/

# ファイルの所有者をApacheユーザーに変更（書き込み権限のため）
sudo chown -R www-data:www-data /var/www/html/
```

### なぜ所有者を `www-data` に変えるのか？

WordPressは「管理画面からプラグインやテーマをインストールする」機能を持っています。
これはつまり、**PHP（Apacheプロセス）がサーバー上のファイルを書き込む**必要があるということです。
Apacheのプロセスは `www-data` ユーザー（Ubuntu）または `apache` ユーザー（CentOS/RHEL）として動いているため、WordPressのファイル群の所有者をこれに合わせないと「Permission denied」で機能が使えなくなります。

## 5. wp-config.php の設定

```bash
# サンプルファイルをコピーして設定ファイルを作成する
cd /var/www/html/
sudo cp wp-config-sample.php wp-config.php
sudo nano wp-config.php
```

以下の箇所を編集します。

```php
define( 'DB_NAME', 'wordpress_db' );       // データベース名
define( 'DB_USER', 'wp_user' );            // DBユーザー名
define( 'DB_PASSWORD', '強力なパスワード' );  // DBパスワード
define( 'DB_HOST', 'localhost' );           // 通常はlocalhost
```

### Authentication Keys and Salts（セキュリティ強化）

`wp-config.php` の中には「認証用ユニークキー」を設定する箇所があります。
これはWordPressのログインセッション（Cookie）を暗号化するための文字列であり、WordPress公式のジェネレーターで自動生成できます。

```bash
# WordPress公式APIからランダムなキーを取得して貼り付ける
curl -s https://api.wordpress.org/secret-key/1.1/salt/
```

出力された8行の `define(...)` を `wp-config.php` の該当箇所にそのまま貼り付けてください。

> ⚠️ **セキュリティ**: `wp-config.php` にはDBのパスワードが平文で記載されます。このファイルのパーミッションは `640` 以下に制限し、外部からHTTP経由で読み取れないようにApacheの設定で保護してください。

```bash
# wp-config.phpのパーミッションを厳格化（所有者のみ読み書き、グループは読み取りのみ）
sudo chmod 640 /var/www/html/wp-config.php
```

## 6. Apache VirtualHostとmod_rewriteの設定

WordPressのパーマリンク（`/2026/04/my-post/` のような綺麗なURL）を動かすには、Apacheの `mod_rewrite` が必須です。

```bash
# mod_rewrite を有効化
sudo a2enmod rewrite

# VirtualHost設定でAllowOverrideを許可する
sudo nano /etc/apache2/sites-available/000-default.conf
```

以下を `<VirtualHost>` ブロック内に追記します。

```apache
<Directory /var/www/html>
    AllowOverride All
</Directory>
```

```bash
# 設定をテストしてApacheを再起動
sudo apache2ctl configtest
sudo systemctl restart apache2
```

### なぜ AllowOverride All が必要なのか？

WordPressは `.htaccess` ファイル（ディレクトリ単位のApache設定ファイル）を使ってURLの書き換え（rewrite）を行います。
`AllowOverride None`（デフォルト）のままでは `.htaccess` が完全に無視され、パーマリンク設定が機能せず全記事が404エラーになります。

## 7. ブラウザからの初期設定

上記が完了したら、ブラウザで `http://サーバーのIPアドレス/` にアクセスすると、WordPressの有名な「5分間インストール画面」が表示されます。
サイト名・管理者ユーザー名・パスワード・メールアドレスを入力すれば完了です。

### 初期設定後にやるべきこと

1. **パーマリンク設定の変更**: 管理画面 → 設定 → パーマリンクで「投稿名」を選択（SEO対策）
2. **不要なプラグインの削除**: デフォルトで入っている `Hello Dolly` は即削除
3. **管理画面のURL変更**: `/wp-admin/` や `/wp-login.php` への不正アクセスを防ぐため、セキュリティプラグインでログインURLを変更する

## 8. WordPressのファイル構造とテーマの仕組み

```
/var/www/html/
├── wp-admin/           ← 管理画面のPHPファイル群（触らない）
├── wp-includes/        ← WordPressのコアエンジン（触らない）
├── wp-content/         ← 【唯一カスタムする場所】
│   ├── themes/         ← テーマ（デザイン）ファイル
│   ├── plugins/        ← プラグイン（追加機能）ファイル
│   └── uploads/        ← メディア（画像等）アップロード先
├── wp-config.php       ← DB接続設定（最重要）
├── .htaccess           ← URLリライトルール（Apache）
└── index.php           ← 全リクエストの入り口
```

`wp-content/` 以外のファイルは、WordPressのアップデート時に上書きされるため、直接編集してはいけません。カスタマイズは必ず `wp-content/themes/` 内の子テーマか、プラグインとして行います。

## 9. トラブルシューティング

- **Q. ブラウザにアクセスしてもPHPのソースコードがそのまま表示される**
  - **A.** ApacheにPHPモジュールがインストールされていないか、有効化されていません。`sudo apt install libapache2-mod-php` → `sudo systemctl restart apache2` を実行してください。
- **Q. 「データベース接続確立エラー」と表示される**
  - **A.** `wp-config.php` のDB名・ユーザー名・パスワードのいずれかが間違っています。MySQLに直接ログインして確認してください。
- **Q. 記事のURLにアクセスすると404 Not Foundになる**
  - **A.** `mod_rewrite` が無効か、`AllowOverride All` が設定されていません。上記の「6. Apache VirtualHost」の手順を実施してください。
- **Q. プラグインのインストール時に「FTP情報を入力してください」と言われる**
  - **A.** WordPressのファイルの所有者がApacheユーザー（`www-data`）になっていません。`sudo chown -R www-data:www-data /var/www/html/` を実行してください。
- **Q. 画像のアップロードに失敗する**
  - **A.** `php-gd` 拡張がインストールされていないか、`wp-content/uploads/` の書き込み権限がありません。`sudo chmod 755 /var/www/html/wp-content/uploads/` で修正してください。

LAMP環境（Linux + Apache + MySQL/MariaDB + PHP）の集大成として、世界のWebサイトの約40%を動かしている巨大CMS「WordPress」を実際にインストール・設定する手順と、その裏側で何が起きているかを解説します。

## 1. 前提条件の確認

WordPressを動かすためには、LAMP環境の全要素が正しくセットアップされている必要があります。

```bash
# Apacheが動いているか
sudo systemctl status apache2

# MySQL (MariaDB) が動いているか
sudo systemctl status mysql   # または mariadb

# PHPがインストールされているか
php -v
```

## 2. WordPress用データベースの作成

WordPressは記事やユーザー情報を全てMySQL/MariaDBに保存します。まず専用のデータベースとユーザーを作成します。

```sql
-- MySQLにrootでログイン
-- mysql -u root -p

-- WordPress専用のデータベースを作成
CREATE DATABASE wordpress_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- WordPress専用のDBユーザーを作成し、権限を付与
CREATE USER 'wp_user'@'localhost' IDENTIFIED BY '強力なパスワード';
GRANT ALL PRIVILEGES ON wordpress_db.* TO 'wp_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> ⚠️ **アンチパターン**: rootユーザーでWordPressからDBに接続するのは絶対にNGです。万が一WordPressが乗っ取られた場合、全データベースが破壊されます。必ず専用ユーザーを作り、そのWordPress用DBだけに権限を限定してください。

## 3. WordPressのダウンロードと配置

```bash
# 最新版をダウンロード
cd /tmp
curl -O https://wordpress.org/latest.tar.gz

# 解凍
tar xzvf latest.tar.gz

# Apacheの公開ディレクトリに配置
sudo cp -r wordpress/* /var/www/html/

# ファイルの所有者をApacheユーザーに変更（書き込み権限のため）
sudo chown -R www-data:www-data /var/www/html/
```

## 4. wp-config.php の設定

WordPressの心臓部である設定ファイルに、先ほど作成したDB接続情報を記述します。

```bash
# サンプルファイルをコピーして設定ファイルを作成
cd /var/www/html/
sudo cp wp-config-sample.php wp-config.php
sudo nano wp-config.php
```

以下の箇所を編集します。

```php
define( 'DB_NAME', 'wordpress_db' );       // データベース名
define( 'DB_USER', 'wp_user' );            // DBユーザー名
define( 'DB_PASSWORD', '強力なパスワード' );  // DBパスワード
define( 'DB_HOST', 'localhost' );           // 通常はlocalhost
```

> ⚠️ **セキュリティ**: `wp-config.php` にはDBのパスワードが平文で記載されます。このファイルのパーミッションは `640` 以下に制限し、外部からHTTP経由で読み取れないようにApacheの設定で保護してください。

## 5. ブラウザからの初期設定

上記が完了したら、ブラウザで `http://サーバーのIPアドレス/` にアクセスすると、WordPressの有名な「5分間インストール画面」が表示されます。
サイト名・管理者ユーザー名・パスワード・メールアドレスを入力すれば完了です。

## 6. トラブルシューティング

- **Q. ブラウザにアクセスしてもPHPのソースコードがそのまま表示される**
  - **A.** ApacheにPHPモジュールがインストールされていないか、有効化されていません。`sudo apt install libapache2-mod-php` → `sudo systemctl restart apache2` を実行してください。
- **Q. 「データベース接続確立エラー」と表示される**
  - **A.** `wp-config.php` のDB名・ユーザー名・パスワードのいずれかが間違っています。MySQLに直接ログインして確認してください。
