# 12. SSH経由でのGitHub連携とデプロイキー運用

LinuxサーバーからSSH認証を使ってGitHubリポジトリをcloneし、Webサーバー上にコードを展開（デプロイ）する手法です。
パスワード認証ではなく**デプロイキー（SSH公開鍵認証）**を用いることで、セキュアかつ自動化しやすい運用を実現します。

## 1. なぜSSH経由でGitHubに繋ぐのか？

GitHubからリポジトリをcloneする方法は主に2つあります。

| 方式 | URL例 | 認証方法 |
| :--- | :--- | :--- |
| **HTTPS** | `https://github.com/user/repo.git` | Personal Access Token (PAT) |
| **SSH** | `git@github.com:user/repo.git` | 公開鍵認証（デプロイキー） |

### HTTPS方式の問題

HTTPS方式では、GitHubの認証にPersonal Access Token（PAT）を使います。しかし、サーバー上のスクリプトから自動pullする際に**トークン文字列をスクリプト内やURLに平文で埋め込む必要**があり、漏洩リスクが極めて高くなります。
また、PATにはリポジトリだけでなくアカウント全体への権限が付与されるため、万が一漏洩した場合の被害範囲が広大です。

### SSH方式の優位性

SSH方式では、秘密鍵はサーバー内のファイルとして保管され、ネットワーク上に一切流れません。
さらに「Deploy Key」を使えば**特定の1リポジトリだけ**にアクセス権を限定でき、セキュリティの「最小権限の原則」を守れます。

## 2. 公開鍵暗号の仕組み（おさらい）

SSH認証の要は「鍵ペア」です。改めてその仕組みを確認します。

### 暗号化アルゴリズムの選択

```bash
# 2026年の推奨: ed25519（最速・最強・最短）
ssh-keygen -t ed25519

# 古い環境で互換性が必要な場合: RSA 4096ビット
ssh-keygen -t rsa -b 4096
```

> 📖 各暗号アルゴリズム（ed25519 / RSA / DSA）の安全性・速度の比較や、公開鍵認証の「南京錠と鍵のたとえ」による仕組み解説は **[SSH深掘りとOpenSSH vs PuTTY](./10_SSH_DeepDive)** をご参照ください。

## 3. Linuxサーバー上でのSSH鍵ペア生成

Webサーバー（Apache）のプロセスが動いているユーザーの権限で鍵を生成します。

### なぜ「apacheユーザー」で生成するのか？

`git clone` や `git pull` を実行するのはApacheのプロセス（またはcronジョブ）です。
rootユーザーの鍵で生成してしまうと、apacheユーザーからはその秘密鍵ファイルに**読み取り権限がない（Permission denied）**ため、clone時に認証エラーになります。
「誰が実行するのか」を常に意識して、そのユーザーの `.ssh/` 配下に鍵を置くのが鉄則です。

```bash
# apacheユーザーのホームディレクトリに.sshフォルダを作成
sudo mkdir -p /home/apache/.ssh
sudo chown apache:apache /home/apache/.ssh
sudo chmod 700 /home/apache/.ssh

# apacheユーザーとして鍵を生成
sudo -u apache ssh-keygen -t ed25519 -C "deploy-key-for-server" -f /home/apache/.ssh/id_ed25519 -N ""
```

### 各オプションの意味

| オプション | 説明 |
| :--- | :--- |
| `-t ed25519` | 暗号アルゴリズムを指定（最推奨） |
| `-C "deploy-key-..."` | 鍵に付けるコメント（何のための鍵か識別用） |
| `-f /home/apache/.ssh/id_ed25519` | 出力先ファイルパスを明示指定 |
| `-N ""` | パスフレーズを空にする（自動化のため必須） |

### パーミッション設定の確認（超重要）

SSHは秘密鍵のパーミッションが緩いと接続を拒否します。

```bash
# .sshディレクトリ: 700 (所有者のみ全権限)
sudo chmod 700 /home/apache/.ssh

# 秘密鍵: 600 (所有者のみ読み書き)
sudo chmod 600 /home/apache/.ssh/id_ed25519

# 公開鍵: 644 (誰でも読める、書き込みは所有者のみ)
sudo chmod 644 /home/apache/.ssh/id_ed25519.pub
```

## 4. GitHubへの公開鍵の登録（Deploy Key）

生成された公開鍵をGitHubのリポジトリに登録します。

```bash
# 公開鍵の中身を表示してコピーする
sudo cat /home/apache/.ssh/id_ed25519.pub
```

### GitHubでの登録手順

1. GitHubのリポジトリページを開く
2. **Settings** → **Deploy keys** → **Add deploy key**
3. Title: 「Production Server Deploy Key」等のわかりやすい名前
4. Key: コピーした公開鍵の内容を貼り付け
5. **Allow write access**: 書き込み（push）も必要ならチェック（通常はclone/pullのみなのでチェック不要）
6. **Add key** をクリック

### Deploy Key vs Personal SSH Key の違い

| | Deploy Key | 個人アカウントのSSH Key |
| :--- | :--- | :--- |
| **アクセス範囲** | 登録した1リポジトリのみ | アカウント内の全リポジトリ |
| **漏洩時の被害** | そのリポジトリだけ | 全リポジトリが危険 |
| **本番サーバーでの使用** | ★ 推奨 | ✕ アンチパターン |

## 5. SSH経由でのgit clone実行

Apacheユーザーの権限で、SSH秘密鍵を明示的に指定してcloneを行います。

```bash
sudo -u apache GIT_SSH_COMMAND="ssh -i /home/apache/.ssh/id_ed25519 -o StrictHostKeyChecking=no" \
  git clone git@github.com:ユーザー名/リポジトリ名.git /home/apache/html/git
```

### コマンドの完全分解解説

| 部分 | 意味 | なぜ必要か |
| :--- | :--- | :--- |
| `sudo -u apache` | apacheユーザーの権限でコマンドを実行する | Apacheが読めるファイル所有権でcloneするため |
| `GIT_SSH_COMMAND="..."` | gitが内部で呼ぶSSHコマンドを上書き指定する環境変数 | デフォルトだと `~/.ssh/id_rsa` を探しに行ってしまうため、鍵ファイルを明示するため |
| `ssh -i /home/apache/.ssh/id_ed25519` | 使用する秘密鍵ファイルを指定 | apacheユーザー専用のデプロイキーを使わせるため |
| `-o StrictHostKeyChecking=no` | 初回接続時の「信用しますか？」プロンプトをスキップ | 自動化スクリプトやcronでは人間が応答できないため |
| `git clone git@github.com:...` | SSH方式でリポジトリをクローン | SSH認証を経由してセキュアにデータ転送するため |
| `/home/apache/html/git` | クローン先のディレクトリパス | Apacheの `DocumentRoot` 配下に配置するため |

### 初回接続時の known_hosts について

`StrictHostKeyChecking=no` は初回セットアップの便宜上使いますが、本番運用では**事前に `known_hosts` にGitHubのホスト鍵を登録しておく**方がセキュアです。

```bash
# GitHubのホスト鍵を事前に登録する（推奨）
sudo -u apache ssh-keyscan github.com >> /home/apache/.ssh/known_hosts
sudo chown apache:apache /home/apache/.ssh/known_hosts
```

## 6. 更新（pull）と自動化

一度cloneが完了すれば、以降のコード更新は `git pull` で行えます。

```bash
# 最新のコードをサーバーに反映する
sudo -u apache GIT_SSH_COMMAND="ssh -i /home/apache/.ssh/id_ed25519" \
  git -C /home/apache/html/git pull origin main
```

### git -C オプションの意味

`git -C /path/to/repo` は、「そのディレクトリに移動してからgitコマンドを実行する」という意味です。
`cd /path/to/repo && git pull` と同じ結果ですが、1コマンドで完結するためcronに書きやすいです。

### cronによる定期自動デプロイ

```bash
# crontab -e で以下を追加（10分おきに自動pull）
*/10 * * * * sudo -u apache GIT_SSH_COMMAND="ssh -i /home/apache/.ssh/id_ed25519" git -C /home/apache/html/git pull origin main >> /var/log/git-pull.log 2>&1
```

### Webhookによる即時デプロイ（発展）

cronでの「定期pull」は最大10分の遅延が発生します。
GitHubのWebhook機能を使えば、pushイベントが発生した瞬間にサーバーへHTTPリクエストを送信し、即座に `git pull` を実行するスクリプトをキックすることが可能です。これが現代的なCI/CDの原型です。

## 7. 実務でのアンチパターンと失敗例

- ❌ **rootユーザーの秘密鍵を本番サーバーに置く**
  - root権限の秘密鍵が漏洩すると、全GitHubリポジトリ + サーバー全体が危険にさらされます。必ず最小権限のDeploy Keyを使用してください。
- ❌ **秘密鍵をリポジトリ内にコミットする**
  - `.gitignore` に秘密鍵のパスを追加し忘れ、GitHubのpublicリポジトリに秘密鍵をpushしてしまう事故が後を絶ちません。GitHub側のSecret Scanning機能がある程度検知してくれますが、根本対策として**秘密鍵は常にサーバーの `.ssh/` 配下にのみ存在させる**ことを徹底してください。
- ❌ **パーミッション `777` で.sshに設定する**
  - SSHクライアントは秘密鍵のパーミッションが `600` でないと接続を拒否します。`WARNING: UNPROTECTED PRIVATE KEY FILE!` というエラーが出ます。

## 8. トラブルシューティング

- **Q. `Permission denied (publickey)` と表示される**
  - **A.** 以下を順番に確認してください。
    1. `sudo -u apache ssh -i /home/apache/.ssh/id_ed25519 -T git@github.com` で接続テスト
    2. 秘密鍵のパーミッションが `600` であるか（`ls -la /home/apache/.ssh/`）
    3. 公開鍵がGitHubの正しいリポジトリのDeploy Keyに登録されているか
    4. 秘密鍵と公開鍵がペアであるか（`ssh-keygen -l -f /home/apache/.ssh/id_ed25519` で確認）
- **Q. `fatal: Could not read from remote repository.` と出る**
  - **A.** Deploy Keyの登録先リポジトリが間違っているか、リポジトリがprivateでDeploy Keyに読み取り権限がありません。
- **Q. cloneしたファイルにApacheからアクセスできない（403 Forbidden）**
  - **A.** `sudo chown -R apache:apache /home/apache/html/git` で所有者を修正してください。
- **Q. `Host key verification failed.` と出る**
  - **A.** `known_hosts` にGitHubのホスト鍵が未登録です。`sudo -u apache ssh-keyscan github.com >> /home/apache/.ssh/known_hosts` で登録してください。
