# Laravel (PHP) 初学者向け入門・逆引き辞典

日本国内のWeb受託開発において圧倒的なシェアを誇る、PHPのフルスタックWebフレームワーク「Laravel (ララベル)」について、FlaskやReactを学んだ視点から概念を翻訳して解説する。

---

## 1. 概念の翻訳 (Laravel と Flask/React)

- **公式リファレンス**: [Laravel 11.x - The PHP Framework For Web Artisans](https://laravel.com/docs/11.x)

あなたがこれまで学んできた技術は、Laravelでは以下のように呼ばれ、役割が完全に一致している。

| 概念               | これまでの知識 (Flask / Next.js) | Laravelでの名称                     |
| :----------------- | :------------------------------- | :---------------------------------- |
| **言語**           | Python (Flask), JS/TS (Next.js)  | **PHP**                             |
| **アーキテクチャ** | MVC, Blueprint (Flask)           | **強固なMVC** (強制される)          |
| **ルーティング**   | `@app.route()` (Flask)           | **`routes/web.php`**, **`api.php`** |
| **DB操作 (ORM)**   | SQLAlchemy (Flask)               | **Eloquent (エロクエント)**         |
| **DB構築自動化**   | Pythonスクリプトで作成           | **Migration (マイグレーション)**    |
| **テンプレート**   | Jinja2 (Flask)                   | **Blade (ブレード)**                |

### なぜ受託開発でLaravelが強いのか？

「認証機能 (ログイン) 」「メール送信」「データベース操作 (ORM) 」といった、Webアプリに必要な全ての部品が**最初から全部入り (フルスタック) **で用意されているからである。Flaskのように「自分で部品を選んで組み立てる」必要がないため、誰が書いても同じような構造になり、チーム開発や引き継ぎ (受託開発) に極めて強い。

---

## 2. Eloquent ORM と N+1 問題

- **公式リファレンス**: [Eloquent ORM - Laravel Docs](https://laravel.com/docs/11.x/eloquent)

Laravel最大の強みがこの「Eloquent (データベース操作機能) 」である。SQLAlchemyとほぼ同じ思想で動く。

### データの取得 (SELECT)

```php
// SQLAlchemy: User.query.all()
$users = User::all();

// SQLAlchemy: User.query.get(1)
$user = User::find(1);
$user = User::findOrFail(1); // 見つからなかったら自動で404エラーを返す (超便利)

// SQLAlchemy: User.query.filter(User.age > 20).all()
$adults = User::where('age', '>', 20)->get();
```

### N+1 問題の解決 (Eager Loading)

- **公式リファレンス**: [Eloquent: Relationships - Eager Loading](https://laravel.com/docs/11.x/eloquent-relationships#eager-loading)

SQLDatabase大図鑑で解説したN+1問題は、Laravel開発でも「絶対にやってはいけない御法度」として面接等で頻出する。解決策はSQLAlchemyの `joinedload` と同じく、**「取得時に `with` をつける」**ことである。

```php
// ❌ N+1問題が起きる書き方 (部署名をループの中で取ってしまう)
$employees = Employee::all();
foreach ($employees as $emp) {
    echo $emp->department->name;
}

// ⭕ N+1を解決する書き方 (最初のSQLでJOINしてまとめて持ってくる)
$employees = Employee::with('department')->get();
```

---

## 3. コマンドラインツール `artisan` (アルチザン)

- **公式リファレンス**: [Artisan Console - Laravel Docs](https://laravel.com/docs/11.x/artisan)

LaravelはCLI (黒い画面) から魔法のコマンドを叩くことで、ファイルづくりやDB構築をすべて自動化してくれる。

- `php artisan make:controller UserController`
  - コントローラーの雛形 (クラスファイル) を自動で作成して配置してくれる。
- `php artisan make:model User -m`
  - データベースのテーブル設計図 (Migrationファイル) と、Pythonのクラスに相当するModelファイルを同時に作成する。
- `php artisan migrate`
  - 設計図の内容を元に、**実際のデータベースサーバー (MySQL等) にテーブルを一気に構築**する。

---

## 4. 他言語開発者から見たLaravelの罠 (注意点)

### 連想配列 (Array) と オブジェクト (Object) の混同

データベースからEloquentで取得したデータ `$user` は **オブジェクト** (クラスのインスタンス) であるため、プロパティへのアクセスは `->` (アロー演算子) を使う。

```php
// オブジェクトの生データ
$user = User::find(1);
echo $user->name; // ⭕ 正しい

// もしこれが連想配列(ただのarray)だった場合
echo $user["name"]; // ❌ エラーになる事が多い
```

JS/TSの世界から来ると PHP の `array` と クラスの `object` の違いに悩まされるため、この境界線を意識することがLaravel習得の第一歩となる。
