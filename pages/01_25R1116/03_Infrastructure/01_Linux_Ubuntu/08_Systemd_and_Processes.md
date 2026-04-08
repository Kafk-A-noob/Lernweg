# 08. Linuxプロセス管理・systemd・ジョブ制御

実務のサーバー運用において、「サービスの起動・停止・自動起動」「暴走プロセスの特定と停止」は日常茶飯事です。
systemd（Ubuntuのサービス管理の司令塔）と、プロセスを操る基本技術を徹底解説します。

## 1. プロセスとは何か？

Linuxでは、実行中のプログラムはすべて「プロセス」と呼ばれ、一意のID（**PID: Process ID**）が割り振られます。
Apacheの裏側で動くワーカー、MySQLのデーモン、あなたが打ったコマンドの1つ1つが、すべて独立したプロセスです。

## 2. systemd：サービス管理の司令塔

Ubuntu 16.04以降、すべてのサービス管理は `systemd` が統括しています。
Apache、MySQL、SSH、UFW等のプログラムは、systemdの管理下に置かれた「**ユニット (Unit)**」として登録されており、`systemctl` コマンドで操作します。

### 基本操作

```bash
# サービスの状態確認（最も使う）
sudo systemctl status apache2

# サービスの起動 / 停止 / 再起動
sudo systemctl start apache2
sudo systemctl stop apache2
sudo systemctl restart apache2  # 設定変更の反映（ダウンタイムあり）
sudo systemctl reload apache2   # 設定の再読み込み（ダウンタイムなし・推奨）

# OS起動時の自動起動を有効化 / 無効化
sudo systemctl enable apache2   # サーバー再起動後も自動で起動するようにする
sudo systemctl disable apache2  # 自動起動を停止する
```

### 自分でサービスを登録する（Unit File）

自作のPythonスクリプト（FastAPI等）をsystemdに登録して、サーバー再起動後も自動で動くようにできます。

```ini
# /etc/systemd/system/my-fastapi.service
[Unit]
Description=My FastAPI Application
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/my-app
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

## 3. プロセスの監視と強制終了

```bash
# 実行中の全プロセスを一覧表示し、特定のプロセスを検索する
ps aux | grep python

# リアルタイムでCPU/メモリ使用率を監視する（タスクマネージャーのLinux版）
top
# より見やすいモダン版
htop

# プロセスをPID指定で穏やかに停止させる (SIGTERM)
kill <PID>

# それでも死なない暴走プロセスを強制殺害する (SIGKILL)
kill -9 <PID>
```

## 4. トラブルシューティング

- **Q. `systemctl start` したのに `Active: failed` になる**
  - **A.** `journalctl -u apache2 -n 50 --no-pager` で直近50行のログを確認してください。設定のタイプミス（Syntax Error）やポートの重複（Address already in use）が原因です。
- **Q. サーバーを再起動したらサービスが動いていない**
  - **A.** `systemctl enable` を忘れています。`start` は「今すぐ起動」、`enable` は「次回以降も自動起動」です。両方やることが必要です。
