# Flask 基礎とルーティング (00_Flask)

本ドキュメントは、Pythonを用いた軽量かつ強力なWebアプリケーションフレームワークFlask (フラスク)の基礎概念と、Webシステムの土台となるルーティング機構についての学習総括である。

---

## 1. フレームワークとしてのFlaskのメリット

素のPythonだけでブラウザからのアクセスを受け付け、HTMLを組み立てて返すというWebサーバー機能を作るのは非常に困難である。
Flaskは、数行のコードを書くだけで簡単にWebサーバーを立ち上げ、ユーザーのアクセスに応答する (レスポンスを返す) ことができる。Djangoなど他の巨大フレームワークに比べ、非常にシンプルで自由度が高いのが特徴である。

```python
from flask import Flask

app = Flask(__name__)

# /hello というURLにアクセスが来た場合の処理
@app.route('/hello')
def hello_world():
    return "ここはHelloページです。"

# サーバーの起動
if __name__ == '__main__':
    app.run(debug=True, port=8000)
```

---

## 2. ルーティングとデコレータ

Webアプリケーションの基本機構は、特定のURLとPythonの関数を紐付けること (ルーティング) である。

### デコレータ (`@app.route`) の仕組み

関数定義の直上にある `@` から始まる記述をデコレータと呼ぶ。
以下の関数は、特定のURLにアクセスされた時に自動で呼び出してくださいというFlaskへの指示書として機能する。

### 動的ルーティング (ダイナミックルート)

URLの一部を変数 (パラメータ) として受け取り、処理を変化させることができる。

```python
@app.route('/user/<username>')
def show_user_profile(username):
    # 例: /user/YAMADA にアクセスすると、username変数に "YAMADA" が入る
    return f"{username}さんのプロフィール画面"
```

---

## 3. GETとPOST (HTTPメソッド)

ユーザーがWebブラウザからサーバーに通信を送る際、目的に応じてGETとPOSTの2種類の通信手段 (HTTPメソッド) を使い分ける。

### ① GET (取得・参照)

- **用途**: URLを指定してページを表示する、検索結果を表示するなどデータを取得するだけの通信。
- **特徴**: URLの後ろにデータが付与される (`?q=検索文字`など)。目に見えるため、パスワードなどの機密情報を送ってはいけない。

### ② POST (送信・変更)

- **用途**: ログイン処理、お問い合わせフォームの送信、個人情報の登録など。
- **特徴**: データがURLではなく、通信の裏側 (ボディ部) に隠されて送信される。安全に大容量の文字やデータを送ることができる。

### Flaskでのメソッド制御

デフォルトでは `@app.route` はGETしか受け付けない。POST (フォーム送信等) を受け付ける画面には、明示的な許可が必要である。

```python
from flask import request

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # フォームから送られたデータを受け取る
        user_id = request.form['user_id']
        return f"{user_id}さんでログインを試みます"
    else:
        # GET通信の場合 (ただページを見に来た時) はログイン画面のHTMLを見せる
        return render_template('login.html')
```

---

## 学習のまとめ

Flask開発の第一歩は、URLを作る (ルーティング) とHTMLを返すテンプレート連携の仕組みを理解することである。
ここでGETとPOSTの役割分担を完璧に理解していなければ、セキュリティ事故 (パスワードをGETで送ってしまう等) を引き起こすため、Webエンジニアとして必須の前提知識となる。
