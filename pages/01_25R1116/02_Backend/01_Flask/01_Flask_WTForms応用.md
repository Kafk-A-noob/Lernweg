# フォーム処理とバリデーション (WTForms実践)

本ドキュメントは、Flaskの実務Webアプリケーション開発において、セキュリティと品質を劇的に高める「WTForms」ライブラリの活用方法についての学習総括である。(P02_WTFCalcの知見に基づく)

---

## 1. 従来のフォーム(生HTML)が抱える致命的な問題

HTMLに直接 `<input type="text" name="age">` と書き、Python側で `request.form.get("age")` で受け取る従来の手法には、以下のような多数の課題が存在した。

1. **悪意ある入力（空欄や文字列等）でアプリが落ちる (ValueError等)**
2. **HTML側のタグと、Python側の受け取り処理を二重管理する手間**
3. **エラー時に「どこが間違っていたか」を画面に赤文字で戻す処理の複雑化**
4. **型変換（str型からint型などへの自力変換）の手間**

これらの問題を「バリデーション（入力値の安全チェック機構）」を含め、一気に自動化・堅牢化するのが **WTForms** である。

---

## 2. WTFormsの導入と仕組み

WTFormsを使うと、「どんな入力欄が必要か？」「 어떤ルールで検証(バリデーション)するか？」をPythonのクラス（設計図）として定義できる。

### Python側: フォームの設計とルール定義

```python
from flask_wtf import FlaskForm
from wtforms import IntegerField, StringField, SubmitField
from wtforms.validators import DataRequired, Length

class UserForm(FlaskForm):
    # 1. ユーザー名 (必須入力、長さを2文字以上10文字以下に制限)
    # これを満たさないと絶対に通過できない絶対の関門（バリデーション）となる。
    username = StringField('ユーザー名', validators=[
        DataRequired(message="名前を入力してください"),
        Length(min=2, max=10, message="2〜10文字にしてください")
    ])

    # 2. 年齢 (整数専用枠。あいうえお 等を入れると自動で弾く最強の防御壁)
    age = IntegerField('年齢', validators=[
        DataRequired(message="年齢を数字で入力してください")
    ])

    submit = SubmitField('送信する')
```

### 【実務Tip】 バリデーションの重要性

実務において「ユーザーからの入力値（リクエスト）は**100%全て疑う**こと」がセキュリティの鉄則である。WTFormsの `IntegerField` のような厳密なバリデーターを通すことで、悪意のあるプログラムコードや不正データからデータベースを守ることができる。

---

## 3. アプリケーションロジックとの連携

WTFormsはルーティング（`@app.route`）の中で真価を発揮する。

```python
@app.route('/register', methods=['GET', 'POST'])
def register():
    form = UserForm()

    # 【WTFormsの真骨頂】
    # POSTで送信され、かつ全てのバリデーション(関門)を無傷でクリアした場合のみ中に入れる！
    if form.validate_on_submit():
        # ここの時点で、form.age.data は安全な「int型 (整数)」であることが確定している！
        saved_age = form.age.data

        # データベースへの保存など、本来やりたい「ビジネスロジック」だけを綺麗に書ける
        return "登録成功"

    # GETでアクセスされた時、または入力エラーで弾かれた時は再度同じ画面を返す
    # エラーメッセージもこのformの中に自動的に詰め込まれている
    return render_template('register.html', form=form)
```

---

## 4. テンプレート (Jinja2) 側の負担軽減

HTML側には、生々しい `<input>` タグは一切書かなくてよくなる。

```html
<form method="POST">
  <!-- CSRF保護（不正操作防止）のための隠しチケットを自動生成 (必須) -->
  {{ form.hidden_tag() }}

  <!-- バリデーションエラーがあった場合に赤文字で表示するループ -->
  {% for error in form.username.errors %}
  <span style="color: red;">[{{ error }}]</span>
  {% endfor %}

  <!-- これだけで、HTMLの <input type="text" id="username" name="username"> が自動生成される -->
  <div>{{ form.username.label }} {{ form.username() }}</div>

  {{ form.submit() }}
</form>
```

---

## 学習のまとめ

WTFormsの最大のメリットは、「退屈でバグが起きやすい入力チェック・型変換のコード」を完全に排除し、エンジニアが「計算やデータベース処理といった本質的なコード開発」に集中できる環境を作ることである。Webアプリ開発におけるプロフェッショナルな品質担保の第一歩である。
