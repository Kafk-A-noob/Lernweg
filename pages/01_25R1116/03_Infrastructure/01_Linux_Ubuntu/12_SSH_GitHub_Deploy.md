# 12. SSH経由でのGitHub連携とデプロイキー運用

LinuxサーバーからSSH認証を使ってGitHubリポジトリをcloneし、Webサーバー上にコードを展開（デプロイ）する手法です。
パスワード認証ではなく**デプロイキー（SSH公開鍵認証）**を用いることで、セキュアかつ自動化しやすい運用を実現します。

## 1. なぜSSH経由でGitHubに繋ぐのか？

GitHubからリポジトリをcloneする方法は主に2つあります。

| 方式 | URL例 | 認証方法 |
| :--- | :--- | :--- |
| **HTTPS** | `https://github.com/user/repo.git` | Personal Access Token (PAT) |
| **SSH** | `git@github.com:user/repo.git` | 公開鍵認証（デプロイキー） |

HTTPS方式はトークンの管理が煩雑で、サーバー上のスクリプトから自動pullする際にトークンを平文で埋め込む必要があるため、**本番サーバーではSSH方式が絶対的に推奨**されます。

## 2. Linuxサーバー上でのSSH鍵ペア生成

Webサーバー（Apache）のプロセスが動いているユーザー（通常 `www-data` や `apache`）の権限で鍵を生成します。

```bash
# apacheユーザーのホームディレクトリに.sshフォルダを作成
sudo mkdir -p /home/apache/.ssh
sudo chown apache:apache /home/apache/.ssh
sudo chmod 700 /home/apache/.ssh

# apacheユーザーとして鍵を生成
sudo -u apache ssh-keygen -t ed25519 -C "deploy-key-for-server" -f /home/apache/.ssh/id_ed25519 -N ""
```

> `-N ""` はパスフレーズなし（空）で生成するオプションです。自動デプロイ用途ではパスフレーズを空にしないと、clone/pull時に毎回入力を求められて自動化できません。

## 3. GitHubへの公開鍵の登録（Deploy Key）

生成された公開鍵をGitHubのリポジトリに登録します。

```bash
# 公開鍵の中身を表示してコピーする
sudo cat /home/apache/.ssh/id_ed25519.pub
```

1. GitHubのリポジトリページを開く
2. **Settings** → **Deploy keys** → **Add deploy key**
3. コピーした公開鍵の内容を貼り付けて保存

> Deploy Key は「そのリポジトリ専用の鍵」であるため、万が一秘密鍵が漏洩しても被害がそのリポジトリのみに限定されます。個人アカウントのSSH鍵を本番サーバーに置くのはセキュリティ上のアンチパターンです。

## 4. SSH経由でのgit clone実行

Apacheユーザーの権限で、SSH秘密鍵を明示的に指定してcloneを行います。

```bash
# GIT_SSH_COMMAND 環境変数で使用する秘密鍵を指定する
sudo -u apache GIT_SSH_COMMAND="ssh -i /home/apache/.ssh/id_ed25519 -o StrictHostKeyChecking=no" \
  git clone git@github.com:ユーザー名/リポジトリ名.git /home/apache/html/git
```

### コマンドの分解解説

| 部分 | 意味 |
| :--- | :--- |
| `sudo -u apache` | apacheユーザーの権限でコマンドを実行する |
| `GIT_SSH_COMMAND="ssh -i ..."` | gitが内部でSSH接続する際に使う秘密鍵ファイルを明示指定する環境変数 |
| `-o StrictHostKeyChecking=no` | 初回接続時の「本当にこのホストを信用しますか？」プロンプトを自動でスキップする（自動化向け） |
| `git clone git@github.com:...` | SSH方式でリポジトリをクローンする |
| `/home/apache/html/git` | クローン先のディレクトリパス |

## 5. 更新（pull）の自動化

一度cloneが完了すれば、以降のコード更新は `git pull` で行えます。

```bash
# 最新のコードをサーバーに反映する
sudo -u apache GIT_SSH_COMMAND="ssh -i /home/apache/.ssh/id_ed25519" \
  git -C /home/apache/html/git pull origin main
```

これを `cron` に登録すれば、定期的に自動でリポジトリの最新状態を取得する簡易CI/CDの完成です。

```bash
# crontab -e で以下を追加（10分おきに自動pull）
*/10 * * * * sudo -u apache GIT_SSH_COMMAND="ssh -i /home/apache/.ssh/id_ed25519" git -C /home/apache/html/git pull origin main >> /var/log/git-pull.log 2>&1
```

## 6. トラブルシューティング

- **Q. `Permission denied (publickey)` と表示される**
  - **A.** GitHubに登録した公開鍵と、サーバー上の秘密鍵がペアになっていないか、秘密鍵のパスが間違っています。`sudo -u apache ssh -i /home/apache/.ssh/id_ed25519 -T git@github.com` で接続テストしてください。
- **Q. `fatal: Could not read from remote repository.` と出る**
  - **A.** Deploy Keyの登録先リポジトリが間違っているか、リポジトリがprivateでDeploy Keyに読み取り権限がありません。GitHubの Settings > Deploy keys を再確認してください。
- **Q. cloneしたファイルにApacheからアクセスできない（403 Forbidden）**
  - **A.** ファイルの所有者がapacheユーザーになっていることを確認してください。`sudo chown -R apache:apache /home/apache/html/git` で修正できます。
