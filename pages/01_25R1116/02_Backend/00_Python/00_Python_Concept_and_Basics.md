# Python 基礎と前提知識 (00_Python)

本ドキュメントは、豊富なライブラリと簡潔な文法を持ち、バックエンド開発やデータ分析、AI領域で広く使われるプログラミング言語Pythonのコアコンセプトをまとめた学習総括である。

---

## 1. 変数とデータ構造の基本

Pythonは動的型付け言語であり、JavaScriptと似た性質を持つが、コードブロックを中括弧 `{}` ではなくインデント (字下げ) で表現することが最大の特徴である。

### 基本的な型

```python
# 変数宣言に let や const は使わない
name = "Yamada"
age = 25

# リスト (配列)
fruits = ["Apple", "Orange", "Banana"]

# 辞書 (Dictionary) ※JSのオブジェクトに相当
user = {
    "name": "Yamada",
    "role": "Admin"
}
```

### 【実務Tip】 F文字列 (f-strings) の多用

文字列の中に変数を埋め込む際、昔は `+` で連結したり `format()` を使っていたが、実務では可読性が最も高いF文字列が標準である。

```python
# NG (保守性が低い)
print("My name is " + name + " and I am " + str(age))

# OK (F文字列: 先頭に f をつける)
print(f"My name is {name} and I am {age}")
```

---

## 2. 制御構文とループ処理

Pythonのインデント (スペース4つ) は見栄えではなく構文の文法ルールそのものである。スペースの数がずれると即エラー (IndentationError) になるため注意する。

### 条件分岐 (if)

```python
if age >= 20:
    print("Adult")
elif age >= 13:
    print("Teenager")
else:
    print("Child")
```

### ループ (for / while)

Pythonの `for` 文は、JSの `forEach` に近いリストから要素を1つずつ取り出す動作を標準とする。

```python
# リストの中身を順番に処理
for fruit in fruits:
    print(fruit)

# 指定回数ループする場合は range() を使う
for i in range(5):
    print(i) # 0から4まで出力される
```

---

## 3. 関数とスコープ

再利用可能な処理の固まり (関数) は `def` キーワードで定義する。

```python
# 型ヒント (Type Hints) の活用
def add_numbers(x: int, y: int) -> int:
    return x + y
```

【実務Tip】 Python自体は動的型付けだが、大規模開発では上記のように型ヒント (Type Hints)を書くことがモダンな現場の常識となっている。これによりVSCode上で強力な入力補完とエラー検知が可能になる (TypeScriptに近づけるアプローチ)。

---

## 4. クラスとオブジェクト指向 (OOP)

Pythonにおいてもシステム設計の根幹はクラスベースのオブジェクト指向である。
コンストラクタは `__init__` という特殊な名前 (ダンダーメソッド) で定義し、自身のプロパティへのアクセスには必ず `self` を使用する。

```python
class Fan:
    # クラス変数 (全インスタンスで共有)
    total_fans = 0

    # コンストラクタ (初期化処理)
    def __init__(self, blades: int = 5):
        # self.〇〇 で自身のインスタンス変数 (状態) にアクセスする
        self.blades = blades
        self.power = False
        Fan.total_fans += 1

    # メソッド (第一引数は必ず self になる)
    def press_swing_button(self):
        self.power = True
        print("電源が入りました")
```

---

## 学習のまとめ

Python単体での計算プログラム作成を終えると、次はWebアプリケーションのバックエンドとしての活用がメインとなる。
クラスや関数の概念、そして何よりもインデントによる厳密なスコープ管理を指に覚え込ませておくことが、次章のFlaskフレームワーク学習における最大の武器となる。
