# 11. WordPressインストールと初期設定 (LAMP環境)

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
