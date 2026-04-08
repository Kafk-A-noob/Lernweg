# 09. Linuxログ管理・ディスク管理・cron

サーバー障害が起きた際に「何が起きたか」を追跡するログの読み方、ディスク容量の監視、そして定期実行タスク（cron）の設定方法です。

## 1. ログ管理 (journalctl / /var/log)

Ubuntu(systemd)環境でのログ管理は `journalctl` が中心ですが、従来のテキストベースのログファイル（`/var/log/`配下）も併用されます。

### journalctl (systemdの統合ログ)

```bash
# 全体のログを最新から逆順で確認する
journalctl -r

# 特定サービスのログだけを抽出する（例：Apache）
journalctl -u apache2

# リアルタイムでログを流し見する（tail -f の代替）
journalctl -f

# 今日のログだけを表示する
journalctl --since today
```

### 従来型のログファイル (/var/log/)

```bash
# Apacheのエラーログ
sudo tail -f /var/log/apache2/error.log

# 認証系のログ（SSHのブルートフォース攻撃の痕跡がここに出る）
sudo tail -f /var/log/auth.log

# カーネルメッセージ（ハードウェア障害やメモリ不足の兆候）
sudo dmesg | tail -30
```

## 2. ディスク管理

サーバーのディスクが100%になると、ログの書き込みすらできなくなり、全サービスが沈黙します。

```bash
# ファイルシステムの使用量と残量を人間が読みやすい形式で表示する
df -h

# 今いるディレクトリ配下で、容量を食っている犯人を特定する
du -sh ./* | sort -rh | head -10

# 巨大なログファイルを安全に空にする（deleteではなくtruncate）
sudo truncate -s 0 /var/log/apache2/access.log
```

## 3. cron (定時タスクの自動実行)

サーバーの「目覚まし時計」です。毎日深夜にバックアップを取る、1時間おきにログをローテーションする、などの定期タスク（ジョブ）を設定します。

### 基本操作

```bash
# 現在のユーザーのcron設定を編集する
crontab -e

# 現在のcronジョブを一覧表示する
crontab -l
```

### cron式の読み方

```
分 時 日 月 曜日 コマンド
*  *  *  *  *    (実行したいコマンド)
```

```bash
# 毎日午前3時にバックアップスクリプトを実行する
0 3 * * * /home/user/scripts/backup.sh

# 毎月1日の午前0時にログを圧縮する
0 0 1 * * tar czf /backup/logs_$(date +\%Y\%m).tar.gz /var/log/apache2/

# 5分おきにヘルスチェックスクリプトを実行する
*/5 * * * * /usr/local/bin/health_check.sh
```

## 4. トラブルシューティング

- **Q. cronが動いていない（スクリプトが実行されない）**
  - **A.** cronの中では `PATH` 環境変数が最小限しか設定されていないため、コマンドを「フルパス（`/usr/bin/python3` 等）」で書く必要があります。また、スクリプトに実行権限（`chmod +x`）を付与し忘れていないか確認してください。
