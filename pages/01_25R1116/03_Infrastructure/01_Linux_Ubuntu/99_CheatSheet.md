# 99. Linux(Ubuntu) 頻出メソッド・必須スニペット大全

実務、およびこれまでの訓練校カリキュラムで学んだLinuxサーバー運用時の必須コマンド一覧です。
インフラを触るエンジニアならば「息をするように」打てなければならないコマンド群です。

## 1. ファイル操作・所有権・パーミッション

Webサーバー（Apache / Nginx等）の所有者権限トラブル時のおまじないです。

```bash
# 所有者に実行権限だけをサクッと追加する（スクリプト実行時）
chmod +x filename.sh

# ディレクトリは755、内部のファイルは644に一括で再帰的に設定する（WordPress復旧等に必須）
find ./ -type d -exec chmod 755 {} \;
find ./ -type f -exec chmod 644 {} \;

# 所有者とグループの両方を再帰的に変更する
sudo chown -R www-data:www-data /var/www/html
```

## 2. ネットワークとホスト管理

AWSのSecurity Groupや、ローカルのVPC間での通信ができるかチェックするためのコマンドです。

```bash
# ドメインへの疎通確認
ping google.com

# DNSのルックアップ（ドメインがどのIPアドレスに向いているか調べる）
dig my-test-app.local

# 使用中のポート（例：80ポートを使っている犯人のプロセス）を特定する
sudo lsof -i :80
# もしくは
sudo netstat -tulpn | grep 80
```

## 3. SSH・認証鍵周り

クラウドサーバーに安全にログインするための認証鍵の生成と転送です。

```bash
# 新しい「秘密鍵・公開鍵」のペアを生成する（現在は ed25519 が絶対基準）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 作成した公開鍵をサーバーに登録(コピー)する
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server_ip

# 秘密鍵（PEMファイル）の権限がガバガバだとSSHに怒られるので直す
chmod 600 ~/.ssh/my-aws-key.pem
```

## 4. プロセス管理・システムログ

サーバーで発生しているエラーの特定や、フリーズしたプログラムのキルを行います。

```bash
# バックグラウンドで動いているサービス（Apache等）の再起動とステータス確認
sudo systemctl restart apache2
sudo systemctl status apache2

# リアルタイムで流れるシステムエラーログを監視する（障害対応時の基本行動）
sudo tail -f /var/log/syslog
sudo tail -f /var/log/apache2/error.log

# 実行中の全てのプロセスを表示して、特定の名前（例: php）で検索する
ps aux | grep php

# 暴走したプロセスをID（PID）指定で強制終了させる
kill -9 <PID>
```

## 5. WSL専用コマンド (Windows PowerShell側で実行)

```powershell
# 起動中のWSLの一覧確認
wsl -l -v

# WSLを完全にシャットダウン（Vmmemによるメモリ枯渇時に必須）
wsl --shutdown

# WSLマシンのバックアップ（tarエクスポート）
wsl --export Ubuntu C:\Backup\ubuntu.tar
```
