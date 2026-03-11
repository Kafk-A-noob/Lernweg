# SQLAlchemy応用: 実践的CRUDと更新日時の管理 (04_Flask)

本ドキュメントは、SQLAlchemyの基礎知識 (02*Flask*データベースとORM) から一歩踏み込み、より実用的な「To-Doアプリケーション」の開発を通じて習得した、実践的なCRUD操作とセキュリティ・データ整合性のための実装手法に関する学習総括である。(26'03-05学習分 `P03_ToDoList` に基づく)

---

## 1. タイムスタンプ (作成日時・更新日時) の自動管理

データベースのテーブル設計において、「システムによる操作履歴」を残しておくことは最も重要な運用要件の一つである。

SQLAlchemyでは、モデル定義の段階で `datetime` モジュールと連携させることで、プログラム側に一切の保存処理を書かずとも、フレームワークレベルでこれらを自動管理させることができる。

```python
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Todo(db.Model):
    __tablename__ = "todo"
    id = db.Column(db.Integer, primary_key=True)
    todo = db.Column(db.String())

    # 登録日時 (レコード作成時のみ、自動で現在時刻を設定)
    created_at = db.Column(db.DateTime, default=datetime.now)

    # 更新日時 (作成時だけでなく、データが上書きされたタイミングでも自動で現在時刻を再設定)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
```

【実務Tip】 もしこれを `app.py` 側 (保存直前のロジック) で毎回 `target.updated_at = datetime.now()` のように手書きしてしまうと、「どこか一箇所でも書き忘れたルートがあれば、一生更新日時が反映されないバグ」に繋がる。モデル側 (スキーマレイヤー) で `onupdate` を仕込むのが、バグを未然に防ぐ堅牢な設計である。

---

## 2. データの安全な更新処理 (インライン編集の制御)

既存のデータを「編集 (Update) 」する画面において、ユーザーの誤操作や悪意ある改ざんを防ぐためのフロントとバックの連携である。

### フロントエンド側の防御 (`readonly`属性)

編集画面 (`edit.html`) では、一意の主キーである「ID」を非表示 (`type="hidden"`) にするか、表示しつつも入力不可能な「読取専用 (`readonly`) 」状態にする。

```html
<label>対象ID (編集不可):</label>
<input type="text" name="id" value="{{ data.id }}" readonly />

<label>TODO内容 (編集可能):</label>
<input type="text" name="todo" value="{{ data.todo }}" required />
```

これにより、ユーザーが誤って別人のIDを打ち込み、そちらが更新されてしまう事故をUIの時点である程度防ぐことができる。

### バックエンド側の更新ロジック (インスタンスの直接書き変え)

SQLAlchemyを用いたUPDATE処理は、既存のインスタンスを検索 (抽出) し、そのプロパティを直接書き換えて `commit` するという非常に直感的な操作で行われる。

```python
@app.route('/update', methods=['POST'])
def update():
    target_id = request.form['id']
    new_todo = request.form['todo']

    # DBから該当のIDを持つレコードインスタンスを特定
    target_data = Todo.query.filter_by(id=target_id).first()

    if target_data and new_todo.strip():
        # 【重要】インスタンスのプロパティを直接変更する
        target_data.todo = new_todo

        # 新規作成時に利用する db.session.add() は不要。commitするだけで完了。
        # (この瞬間、モデルで定義した onupdate=datetime.now が発火し、updated_at が自動更新される)
        db.session.commit()

    return redirect(url_for('index'))
```

---

## 学習のまとめ

ORM (SQLAlchemy) を用いた開発の真骨頂は、「データの状態 (タイムスタンプ等) 」に関する関心事をデータベース (モデル定義層) に丸投げし、メインのアプリケーションロジック (`app.py`) を極限までシンプルに保つことにある。

このような「不要なコードを書かずに済む設計 (DRY原則等) 」を実践することが、将来的な保守や機能追加を容易にするクリーンアーキテクチャへの第一歩となる。
