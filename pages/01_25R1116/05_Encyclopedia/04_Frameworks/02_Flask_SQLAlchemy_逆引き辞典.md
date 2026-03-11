# Flask / SQLAlchemy 逆引き辞典・陥りやすい罠

Pythonの軽量WebフレームワークであるFlaskと、標準的に使われるO/Rマッパー (ORM) であるSQLAlchemyにおける、実務的な実装パターンと初見殺しのエラー事例をまとめる。

---

## 1. アプリケーションコンテキスト (App Context) の壁

- **公式リファレンス**: [The Application Context - Flask Docs](https://flask.palletsprojects.com/en/stable/appcontext/)

Flaskに備わっている、リクエスト単位などでグローバル変数を安全に扱うための「コンテキスト」という隔離空間の概念。

### 【頻出するエラー】 `RuntimeError: Working outside of application context.`

データベースの初期化時 (`db.create_all()`) や、バックグラウンドでのバッチ処理中など、**「通常のWebリクエスト (URL叩き) を経由せずにアプリを動かそうとした時」**に発生するエラー。

```python
# ❌ エラーになる書き方 (コンテキスト外での実行)
db = SQLAlchemy(app)
db.create_all() # ← ここで落ちる
```

### 【お作法】 `with app.app_context():` ブロックの使用

「今からこのアプリの文脈 (コンテキスト) に乗り込むぞ」とシステムに宣言してから処理を行う。

```python
# ⭕ 正しい書き方
db = SQLAlchemy(app)
with app.app_context():
    db.create_all() # 安全にテーブルが生成される
```

---

## 2. Blueprint (MVCアーキテクチャへの分割)

- **公式リファレンス**: [Modular Applications with Blueprints - Flask Docs](https://flask.palletsprojects.com/en/stable/blueprints/)

肥大化した `main.py` (モノリス) を機能ごとに切り分けるための強力なツール。

### 【お作法】テンプレートにおける罠： `url_for()` のプレフィックス

Blueprintで分割したルーティングは、内部のエンドポイント (URLの登録名) が `[Blueprintの名前].[関数名]` という形式に自動で書き換わる。

```python
# controllers/employee.py
emp_bp = Blueprint("employee", __name__) # 名前が "employee"

@emp_bp.route("/add")
def employee_add(): ...
```

- **罠**: テンプレート (HTML) 側で `{{ url_for('employee_add') }}` と書くと、`werkzeug.routing.BuildError` が発生して画面が真っ白になる。
- **解決策**: 必ず **`{{ url_for('employee.employee_add') }}`** のようにプレフィックスを付けて呼び出すこと。

---

## 3. SQLAlchemy (ORM) のデータベース操作

- **公式リファレンス**: [Flask-SQLAlchemy Documentation](https://flask-sqlalchemy.palletsprojects.com/)

SQL (SELECT / INSERT / UPDATE / DELETE) を書かずに、Pythonのクラスとメソッドとしてデータベースを操作する機能。

### Select (取得)

- **`Model.query.all()`**: テーブルの全レコードを取得。 (※実務ではデータ量が多すぎてクラッシュする可能性があるため、ページネーションで回避する)
- **`Model.query.get(id)`** または **`Model.query.get_or_404(id)`**: 主キー(ID)を指定して1件取得。存在しない場合に安全に404エラーを表示させたい場合は後者を使う。
- **`Model.query.filter(条件).all()`**: 条件絞り込み (WHERE句)。

#### 【罠】論理削除のフィルタリングにおける `NULL` 比較

```python
# ❌ SQL仕様の罠: DB上でNULL(初期状態)のものは、条件 !=1 で弾かれて見えなくなってしまう
data = Employee.query.filter(Employee.del_flag != 1).all()

# ⭕ 正しい書き方 (NULLも条件に加える)
data = Employee.query.filter((Employee.del_flag == None) | (Employee.del_flag != 1)).all()
```

### Insert / Update / Delete (追加・更新・削除)

SQLAlchemyにおける保存は、必ず **「Session領域 (メモリ上) への反映」** と **「Commit (データベース本体への確定) 」** の2段階構成になっている。

```python
# 1. データの用意
new_emp = Employee(name="Alice")

# 2. セッション(メモリ)に追加 (Insertの準備)
db.session.add(new_emp)

# ※Updateの場合は、取得したオブジェクトのプロパティを書き換えるだけで良い
# existing_emp = Employee.query.get(1)
# existing_emp.name = "Bob"

# ※物理削除の場合は delete を使う
# db.session.delete(existing_emp)

# 3. 確定(Commit)を忘れないこと！ (これを呼ばないと一切DBに反映されない)
db.session.commit()
```
