# Python 特有のお作法と他言語比較

C言語やJavaから受け継がれた「波括弧 `{}` 」文化圏 (JS, PHP, C#等) のエンジニアにとって、Python独自のフィロソフィー (設計思想) に慣れるまではいくつもの落とし穴が存在する。
本稿ではPythonの特有の「お作法 (Pythonic) 」と、他言語からの移行時にハマる罠を解説する。

---

## 1. インデント (字下げ) によるブロック制御

- **参考 (PEP 8)**: [Style Guide for Python Code (Indentation)](https://peps.python.org/pep-0008/#indentation)

JavaScriptやPHPでは、IF文や関数のスコープ (範囲) は `{ }` (波括弧) で囲むため、インデント (改行とスペース) はあくまで「人間が見やすくするための飾り」である。
しかし **Pythonにおいて、インデントは「絶対的な文法ルール」** である。

- **罠**: JS感覚で「とりあえず動くからいいや」とインデントを崩したままにすると、**「IndentationError」として問答無用でプログラム全体がクラッシュ**する。
- **お作法**: PEP 8 (Pythonの公式スタイルガイド) に則り、**「1レベルにつき半角スペース4個」**を厳守すること (タブ文字の使用は厳禁)。VSCode等のエディタフォーマッタ (Blackやautopep8等) を必ず設定し、自動で揃う開発環境を構築するのがプロのたしなみである。

---

## 2. 変数の「参照渡し」とデフォルト引数の恐怖

- **公式リファレンス**: [デフォルト引数値 - Python docs](https://docs.python.org/ja/3/tutorial/controlflow.html#default-argument-values)

Pythonのリストや辞書 (dict) などの「ミュータブル (変更可能) 」なオブジェクトはすべて参照渡し (メモリの共有) となる点はJSの配列等と同じだが、とりわけ関数定義における**「デフォルト引数」にリストを置いた際の挙動**はPython最大の初見殺しトラップである。

### 【危険・絶対禁止の書き方】

```python
# 空のリストをデフォルト値にしている
def add_item(item, target_list=[]):
    target_list.append(item)
    return target_list

print(add_item("Apple"))  # ["Apple"]  ← ここまでは普通
print(add_item("Banana")) # ["Apple", "Banana"] ← え！？
```

- **理由**: Pythonのデフォルト引数は「関数を実行した時」ではなく、**「ファイルが読み込まれて関数が定義された (定義文が解釈された) 瞬間に、たった1回だけ」**評価され、メモリ上に作成されるためである。以降、何回関数を呼んでも、同じメモリのリストが使い回されてしまう。

### 【お作法 (正しい書き方) 】

デフォルト引数には必ず `None` を指定し、関数の中で新しくリストを作成すること。

```python
def add_item(item, target_list=None):
    if target_list is None:
        target_list = [] # 呼ばれるたびに毎回新しいリストを作る
    target_list.append(item)
    return target_list
```

---

## 3. クラスにおける `self` の明示

- **公式チュートリアル**: [クラス定義の構文 - Python docs](https://docs.python.org/ja/3/tutorial/classes.html#class-definition-syntax)

JS/TSやPHPにおいては、クラス内の自分の要素にアクセスする際に `this->name` や `this.name` を使い、その `this` は裏側で言語が勝手に用意 (あるいは文脈から推論) してくれる。

しかし、Pythonは「暗黙の文脈よりも、明示的な記述を好む」という思想 (Zen of Python) を持つため、**インスタンスメソッドの第一引数に必ず自分自身 (慣例として `self` という名前) を人間が書かなければならない**。

```python
class Employee:
    # 第一引数に必ず self を置く
    def __init__(self, name):
        self.name = name

    def introduce(self):
        # 内部で呼び出す際にも prefix として self. が必須
        print(f"My name is {self.name}")
```

- **罠**: JS感覚で `def introduce():` と引数なしで書いてしまうと、呼び出し時に `TypeError: introduce() takes 0 positional arguments but 1 was given` というエラーで弾かれる。

---

## 4. `True` / `False` と `None` の表記規則

Pythonでは、JS等の `true` / `false` / `null` と異なり、これらを表す特別な予約文字は**必ず先頭が大文字**でなければならない。

| 概念   | JS / PHP / C# | Python      |
| :----- | :------------ | :---------- | --- | -------- |
| 真     | `true`        | **`True`**  |
| 偽     | `false`       | **`False`** |
| 空・無 | `null`        | **`None`**  |
| 論理積 | `&&`          | **`and`**   |
| 論理和 | ` |             | `   | **`or`** |
| 否定   | `!`           | **`not`**   |

- **お作法**: FlaskのSQLAlchemyルーティング課題でも遭遇した通り、データベース判定で `del_flag == None` のように `None` を比較で用いるのは日常茶飯事である。
- (※厳格なPEP 8のお作法では、`== None` よりも `is None` や `is not None` といったID比較を用いることが推奨される。)
