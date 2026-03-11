# FlaskにおけるBlueprintによるモジュール分割とMVCアーキテクチャ

本ドキュメントでは、肥大化しやすいFlaskアプリケーションを機能ごとに分割し、保守性の高い構造で管理するための「Blueprint」機能の実装手法を解説する。

---

## 1. モノリス(一枚岩)構造の限界とBlueprintの必要性

### `app.py` / `main.py` 集中型の問題点

学習段階や小規模なアプリケーションでは、1つの `main.py` ファイルにあらゆる機能 (ユーザー管理、商品管理、注文処理など) のルーティングとロジックを詰め込むことが多い。しかし、この手法 (モノリス構造) は機能拡張に伴い以下の技術的負債を引き起こす。

- **可読性の著しい低下**: ファイルが数千行に肥大化し、目的の処理を探すのが困難になる。
- **チーム開発 (Git) の阻害**: 複数人のエンジニアが同時に1つのファイルを編集するため、コンフリクト (競合) が多発する。
- **障害の広域化**: ある機能の軽微な構文エラーが、無関係の機能を含むアプリケーション全体をダウンさせる。

### Blueprintによる解決 (MVCアーキテクチャの導入)

Flaskの **Blueprint (設計図)** 機能を用いることで、アプリケーション全体を「機能群」という単位 (モジュール) に安全に切り分けることができる。標準的なMVC (Model-View-Controller) アーキテクチャにおいては、このBlueprintを用いてルーティング処理を `Controller` 階層へ物理的に分割配置するのが定石である。

---

## 2. Blueprintの実装手順

機能 (例: 従業員管理 / 部署管理) ごとにファイルを分割し、それぞれでBlueprintを定義したのち、大元のアプリケーションで結合 (Register) する。

### Step 1: 機能別コントローラーファイルでのBlueprint宣言

それぞれのモジュールファイル内で `Blueprint` クラスをインポートしてインスタンス化する。

```python
# app/src/Controller/employee.py
from flask import Blueprint, render_template

# Blueprintインスタンスを作成。
# 第一引数の "employee" は、プレフィックス(接頭辞)となる重要な名前空間である。
emp_bp = Blueprint("employee", __name__)

# @app.route ではなく、自身のBlueprint変数のデコレータを使用する
@emp_bp.route("/")
def index():
    return render_template("index.html")
```

### Step 2: メイン (`__init__.py` 等) での登録 (Register)

設計図 (Blueprint) を定義しただけではFlaskは認識しないため、初期化処理を行うメインファイルにて、それらをインポートして本体 (`app`) へ合体させる。

```python
# app/__init__.py
from flask import Flask

app = Flask(__name__)

# モジュール分割した各コントローラーから設計図変数をインポートする
from app.src.Controller.employee import emp_bp
from app.src.Controller.department import dept_bp

# 本体アプリに設計図を登録し、ルーティングを有効化する
app.register_blueprint(emp_bp)
app.register_blueprint(dept_bp)
```

これにより、各機能が独立したモジュールとして安全に起動する構造が完成する。

---

## 3. 【最重要】 テンプレート(HTML)側における `url_for` のプレフィックス対応

Blueprintを導入する際、最も発生しやすいエラーが**HTML側のリンク切れ (`BuildError`) **である。

Blueprintを利用すると、Flask内部のURLルーティングリスト (エンドポイント) において、各関数名が **`[モジュールのPrefix名].[関数名]`** という形に自動でリネームされて登録される。

すなわち、これまでHTML側で単に `url_for('index')` や `url_for('department_delete')` と記述していたものはすべて無効となる。これを防ぐため、HTML側の記述を以下のように**ドット繋ぎの名前空間付き指定**に修正しなければならない。

```html
<!-- 【変更前】(Blueprint導入前。エラーになる) -->
<a href="{{ url_for('employee_detail', id=emp.id) }}">詳細</a>
<a href="{{ url_for('departments') }}">部署一覧へ</a>

<!-- 【変更後】(名前空間のプレフィックスを付ける) -->
<a href="{{ url_for('employee.employee_detail', id=emp.id) }}">詳細</a>
<a href="{{ url_for('department.departments') }}">部署一覧へ</a>
```

モジュール分割を実施した際は、付随して機能する `app/templates` 配下のすべてのHTMLファイルを走査し、この命名規則の書き換えを漏れなく行うことが不可欠である。
