# 06. LAMP環境とApache/PHPの深掘り

シラバスに記されている「LAMP環境」の真髄、および実務を見据えたApache（Webサーバー）やPHPの連携・設定ファイル（Config）の深掘りを行います。

## 1. LAMP環境とは？

昔から現在に至るまで、Web世界を支えてきた最強にして最もポピュラーなインフラ構成の頭文字です。

- **L (Linux)**: 全体のOS。土台。
- **A (Apache HTTP Server)**: Webサーバー。外部から来るHTTPリクエスト（URL）を受け止め、正しいファイルへと案内する門番。
- **M (MySQL / MariaDB)**: データベース。ユーザー情報などの保存。
- **P (PHP / Python / Perl)**: バックエンドのプログラミング言語。

JS界隈の「MERNスタック（MongoDB, Express, React, Node.js）」のご先祖様であり、WordPressをはじめ多くのシステムが今なおこのLAMP環境で動いています。

## 2. Apacheの真の役割と設定ファイル

ただブラウザに表示させるだけなら簡単なApacheですが、実務で触る場合は「どのURLから来た人を、サーバー内のどのフォルダのファイルへ転送するか」という**ルーティング（VirtualHost設計）**が主な業務になります。

### apache2.conf (設定の大元)
Ubuntuの場合、Apacheの心臓部となる設定ファイルは `/etc/apache2/apache2.conf` にあります。ここにサーバー全体の挙動やセキュリティ設定を書きます。

### バーチャルホスト (VirtualHost)
通常、1台のLinuxサーバーの中には「コーポレートサイト」「社員用システム」「ブログ」など、複数の異なるシステムが同居しています。

Apacheの設定ファイルに以下のように記述することで、「ブラウザに入力されたドメイン（URL）」によって、サーバー内の別のフォルダへと接続先を交通整理できます。

```apache
# /etc/apache2/sites-available/my-site.conf
<VirtualHost *:80>
    ServerName www.my-test-app.local
    DocumentRoot /var/www/my-test-app/public

    <Directory /var/www/my-test-app/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```
※先ほど `hosts` ファイルを変更して `my-test-app.local` というローカルDNSを作ったのは、まさにこの「バーチャルホストでドメインごとに振り分けるテスト」を行うためです。

## 3. ApacheとPHPの連携

Apache自身は「指定されたURLにあるファイルを、そのままブラウザに返す（配信する）」ことしかできません。
`.html` ファイルならそのまま返せますが、`.php` ファイルをそのまま返すと、ただのプログラムのソースコードが露呈してしまいます。

そこで、Apacheに「PHPモジュール」を組み込みます。
これにより、Apacheが `.php` ファイルを見つけた際、いったん**PHPのエンジンにファイルを渡して実行（解析）させ、その結果生成されたHTMLだけを受け取ってブラウザに返す**という連携システムが完成します。

これがバックエンド処理が「サーバーサイド・レンダリング」と呼ばれる所以です。
