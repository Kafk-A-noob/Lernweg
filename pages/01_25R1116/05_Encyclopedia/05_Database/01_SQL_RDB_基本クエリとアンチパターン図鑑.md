# SQL (RDB) 基本クエリとアンチパターン図鑑

ORM (SQLAlchemy等) に頼り切っていると、裏側で発行されているSQLのコストに気づかず、実務でとんでもないパフォーマンス低下を引き起こす。
本稿ではリレーショナルデータベース (RDB) における普遍的なSQLの知識と、全世界の開発者を苦しめるN+1問題を解説する。

---

## 1. データベース操作の基本 (CRUD)

- **公式リファレンス (PostgreSQL)**: [DML (Data Manipulation Language)](https://www.postgresql.jp/document/current/html/dml.html)

すべてのORMメソッドは、最終的に以下の4つのSQL文に翻訳されてデータベース・エンジンに送信される。

- **C**reate (`INSERT`): `INSERT INTO users (name, age) VALUES ('Alice', 20);`
- **R**ead (`SELECT`): `SELECT * FROM users WHERE age >= 20;`
- **U**pdate (`UPDATE`): `UPDATE users SET age = 21 WHERE name = 'Alice';`
- **D**elete (`DELETE`): `DELETE FROM users WHERE name = 'Alice';`

### 【罠】WHERE句の付け忘れ

`UPDATE` や `DELETE` を実行する際、`WHERE` (対象を特定する条件) を書き忘れると、**テーブルの全データが一瞬にして書き換わる (または消し飛ぶ) **という大惨事になる。

---

## 2. テーブルの結合 (JOIN) の使い分け

- **公式リファレンス**: [テーブル式 (JOIN)](https://www.postgresql.jp/document/current/html/queries-table-expressions.html)

データが複数のテーブル (従業員テーブルと部署テーブルなど) に分かれている場合、これを合体して1つの結果にするのが `JOIN` である。

### `INNER JOIN` (内部結合)

両方のテーブルにデータが存在するもの**だけ**を取り出す。

- 例：部署に所属している従業員のみ出力する。 (※未配属の従業員は一覧から消滅する)

```sql
SELECT employee.name, department.dept_name
FROM employee
INNER JOIN department ON employee.dept_id = department.id;
```

### `LEFT JOIN` または `LEFT OUTER JOIN` (左外部結合)

**左側のテーブル (FROMで指定したテーブル) のデータはすべて必ず出す**。右側に該当データが無ければ `NULL` にする。

- 例：未配属の従業員も一覧に出す。

```sql
SELECT employee.name, department.dept_name
FROM employee
LEFT JOIN department ON employee.dept_id = department.id;
```

---

## 3. 全開発者の永遠の敵N+1 問題

すべてのORM環境 (Laravel, Django, Ruby on Rails, Flask 等) において、必ず発生する凶悪なパフォーマンス問題。

### N+1 問題とは何か？

例えば従業員 (100人) の一覧と、それぞれの所属部署名を表示したいとする。
直感的に ORM を書くと以下のようになる。

```python
# 1. 従業員 全員を1回で取得する (1回のSQL)
# SELECT * FROM employee;
employees = Employee.query.all()

for emp in employees:
    # 2. ループの中で、所属部署の名前を取りに行く (N回のSQL)
    # SELECT * FROM department WHERE id = ?;
    print(emp.name, emp.department.name)
```

このコードだと、従業員をとってくる1回のSQLに加えて、ループの中で各従業員の部署をとるために**人数分 (N回) のSQLがデータベースに叩き込まれてしまう**。
もし従業員が1万人いれば、ページを開くたびに10,001回のSQLが走り、サーバーは確実にダウンする。これが N+1 問題である。

### 【お作法】解決策：イーガーローディング (Eager Loading)

ループの中 (後から) で関連データを引くのではなく、最初の1回目のSQLの段階で `JOIN` を使ってまとめて全部持ってくるようORMに指示を出す必要がある。

```python
# [Flask/SQLAlchemyでの解決例]
# .options(joinedload(...)) を付けることで、裏側で JOIN句 が発行され、SQLは1回で済む。
from sqlalchemy.orm import joinedload
employees = Employee.query.options(joinedload(Employee.department)).all()
```
