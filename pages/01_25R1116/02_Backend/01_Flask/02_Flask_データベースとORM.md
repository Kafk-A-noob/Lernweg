# データベース操作とORM (SQLAlchemy実践)

本ドキュメントは、Flask等のバックエンドシステムにおいて不可欠なデータの永続化 (データベースアクセス) において、生SQLの直書きから脱却し、最新の標準である「ORM (オブジェクト・リレーショナル・マッピング) 」を利用する手法の学習総括である。

---

## 1. 従来の「生SQL (Raw SQL)」が抱える問題

これまでのデータベース講義 (`P04_Database`の初期状態など) では、Pythonの中にデータベース言語 (SQL) を文字列として直接記述し、実行していた。

```python
# NG (従来の生SQL直書き)
import sqlite3

# ...接続処理後...
cursor.execute("SELECT * FROM persons WHERE age > ?", (20,))
rows = cursor.fetchall()
# 結果はタプル (1, 'Yamada', 25) のような形で返ってくるため、何番目が「名前」なのか分かりづらい
print(rows[0][1])
```

### 🔴 生SQLのデメリット

1. **セキュリティの脆弱性**: SQLインジェクションという攻撃を受けやすい。
2. **保守性の低さ**: プログラムの中にSQLが散らばり、後から読むのが辛い。データベースの種類 (SQLiteからMySQL等) を変更した瞬間に全てのSQLを手書きで修正する必要がある。
3. **扱いにくさ**: 結果が単なるデータの羅列 (配列やタプル) で返ってくるため、Pythonの「クラス・オブジェクト」として扱えず相性が悪い。

---

## 2. ORM (SQLAlchemy) という救世主

ORM (Object-Relational Mapping) は、**「リレーショナルデータベース (表データ) 」と「Pythonのクラスオブジェクト」を自動で翻訳・連携してくれる魔法の仕組み** である。
PythonのデファクトスタンダードORMが **SQLAlchemy** である。

ORMを導入すると、SQL文を一切書かずに、Pythonの「メソッド呼び出し」だけでデータベースを操作できるようになる。

### テーブルの設計図をクラスで定義する

```python
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# データベースの「Personテーブル」を、Pythonの「Personクラス」として定義する
class Person(db.Model):
    # テーブル名
    __tablename__ = 'persons'

    # カラム (列) の設定
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    age = db.Column(db.Integer)
```

---

## 3. ORMを使った画期的なデータ操作

クラスを定義した後は、「まるでリストやオブジェクトを操作しているかのような直感的なコード」でデータベースが読み書きできる。ここにもはやSQLの影はない。

### データの取得 (SELECT)

```python
# 従来の「SELECT * FROM persons」と同じ意味
all_users = Person.query.all()

# 生SQLのような (1, 'Yamada', 25) ではなく、完全な Pythonオブジェクト の状態で手に入る！
for user in all_users:
    # ドット記法で直感的に値を取り出せる (これが最大のメリット)
    print(user.name)
    print(user.age)

# 条件をつけて検索 (20歳以上を全て取得)
adults = Person.query.filter(Person.age >= 20).all()

# IDが1の人物をピンポイントで取得
user_1 = Person.query.get(1)
```

### データの追加 (INSERT)

```python
# Pythonのオブジェクトを1つ作る
new_user = Person(name="Suzuki", age=30)

# データーベースという箱に追加して、変更を確定 (コミット) するだけ
db.session.add(new_user)
db.session.commit()
```

### データの更新 (UPDATE)

```python
# 変更したい人を検索して引っ張ってくる
target_user = Person.query.filter_by(name="Suzuki").first()

# プロパティを書き換える
target_user.age = 31

# 保存 (確定) するだけ。なんてスマート！
db.session.commit()
```

---

## 学習のまとめ

「SQLAlchemy (ORM) 」の導入による最大の恩恵は、**「フロントエンドからバックエンド、そしてデータベースに至るまで、データを一貫して『オブジェクト (プロパティを持った1つの塊) 』として扱えるようになること」** にある。
これにより、プログラマーの思考ロジックが途切れることなく、安全で拡張性の高いエンタープライズ級のアプリケーションを組むことが可能になる。
