# ロジック構築 メソッド図鑑 (Python中心・他言語対比)

機械学習からWebバックエンド (Flask / Django) まで幅広く使われるPythonにおいて、リスト (配列) と文字列を操るための主要なメソッド・構文をまとめる。Pythonの強力な武器であるリスト内包表記を使いこなすことが中級者への第一歩となる。

---

## 1. ループ・反復処理とリスト内包表記

Pythonにおいて、JSの `map()` や `filter()` に相当する処理は、組み込み関数 (`map` / `filter`) を使うよりも **リスト内包表記 (List Comprehensions)** を使うことが推奨・多用される。

- **公式リファレンス**: [データ構造 (リスト内包表記) - Python docs](https://docs.python.org/ja/3/tutorial/datastructures.html#list-comprehensions)

### 全てを加工して新しいリストを作る (JSの `map` 相当)

- **書式**: `[式 for 変数 in リスト]`

```python
users = ["Alice", "Bob"]
# greetings = ["Hello Alice", "Hello Bob"]
greetings = [f"Hello {name}" for name in users]
```

### 条件を満たすものだけ残す (JSの `filter` 相当)

- **書式**: `[式 for 変数 in リスト if 条件]`

```python
numbers = [1, 2, 3, 4, 5]
# evens = [2, 4]
evens = [n for n in numbers if n % 2 == 0]
```

---

## 2. 検索・判定 (あるかないかを探る)

### `in` 演算子 : 入っているか？ (True / False)

- **公式リファレンス**: [帰属テスト演算 - Python docs](https://docs.python.org/ja/3/reference/expressions.html#membership-test-operations)
- **用途**: リストの中にその要素が存在するかを判定する。JSの `includes()` に相当するが、Pythonではメソッドではなく演算子 (予約語) として非常に直感的に書ける。

```python
arr = ["Apple", "Banana", "Cherry"]
print("Banana" in arr) # True
```

### `index()` : 何番目に入っているか？

- **公式リファレンス**: [list.index() - Python docs](https://docs.python.org/ja/3/tutorial/datastructures.html#more-on-lists)
- **用途**: 位置 (0始まり) を取得する。
- **罠**: JSの `indexOf()` と異なり、Pythonの `index()` は**見つからなかった場合に `-1` を返すのではなく `ValueError` でプログラムがクラッシュ (停止) する**。
- **回避策**: `index()` を呼ぶ前に、必ず `if val in arr:` で存在チェックを行うこと。

### `any()` / `all()` : 一部でも満たすか？ / 全て満たすか？

- JSの `some()` / `every()` に相当。引数に直接リストなどのイテラブルオブジェクトを渡す。

---

## 3. 文字列 ⇔ リスト の破壊と結合

### `split()` : 文字列を割ってリストにする

- **公式リファレンス**: [str.split() - Python docs](https://docs.python.org/ja/3/library/stdtypes.html#str.split)
- **用途**: スペースやカンマ区切りの文字列をリスト化する。コーディングテストの標準入力 (`# 10 20 30`等) をパースする際の必須スキル。
- **特徴**: 引数を省略した場合、連続する空白 (スペース、タブ、改行) を自動的に1つの区切りとして賢く分割してくれる。

```python
str_data = "10  20\n30"
arr = str_data.split() # ['10', '20', '30'] (空文字が出ない)
```

### `join()` : リストをくっつけて文字列にする

- **公式リファレンス**: [str.join() - Python docs](https://docs.python.org/ja/3/library/stdtypes.html#str.join)
- **用途**: リスト内の文字列を特定の区切り文字で連結する。
- **罠**: JSでは `arr.join(",")` のように配列側から呼び出すが、Pythonでは **文字列側から呼び出して引数にリストを渡す** ので記述順が逆になる。

```python
arr = ["2026", "03", "11"]
result = "/".join(arr) # "2026/03/11" (※arr.join("/") ではない！)
```

---

## 4. 並び替え (ソート)

PythonのソートはJSのようなキメラな辞書順トラップはなく、非常に扱いやすい。

### `list.sort()` : 破壊的 (元のリストを並べ替える)

- **公式リファレンス**: [list.sort() - Python docs](https://docs.python.org/ja/3/library/stdtypes.html#list.sort)
- **特徴**: 元のリストを書き換え、戻り値としては `None` を返すため、`new_arr = arr.sort()` のように代入してはいけない。

```python
arr = [30, 10, 2]
arr.sort() # arr自身が [2, 10, 30] になる
arr.sort(reverse=True) # 降順にする場合
```

### `sorted()` : 非破壊的 (新しいリストを返す)

- **公式リファレンス**: [sorted() - Python docs](https://docs.python.org/ja/3/library/functions.html#sorted)
- **特徴**: 元のリストを変えずに、並び替え済みの新しいリストを生成する。安全性が高いため実用コードで多用される。

---

## 5. 要素の追加・削除 (破壊的メソッド)

- **公式リファレンス**: [リスト型のメソッド - Python docs](https://docs.python.org/ja/3/tutorial/datastructures.html#more-on-lists)

- **`append()`** : 要素を**最後**に追加する。 (※JSの `push` に相当)
- **`pop()`** : 要素を**最後** (または指定したインデックス) から削除して取得する。
- **`insert(index, x)`** : 指定した位置に要素を割り込ませる。 (※JSの `unshift` などに相当)
- **`remove(x)`** : 指定した**値**と同じ最初の要素を検索して削除する (インデックスではなく値で削除できるのが便利)。

### 【応用】 複数の同階層リストをまとめる `zip()`

JSではインデックス変数を使って頑張ってループを回す必要があった2つの配列を同時に回す処理が、Pythonでは `zip()` 関数を用いて極めて美しく記述できる。

```python
names = ["Alice", "Bob"]
ages = [20, 25]

# 同時に1つずつ取り出す
for name, age in zip(names, ages):
    print(f"{name} is {age} years old.")
```

---

## 6. 実務でのアンチパターンと失敗例

- ❌ **ミュータブル（変更可能）なデフォルト引数の罠**

  ```python
  # ❌ 絶対にやってはいけない
  def add_item(item, target_list=[]):
      target_list.append(item)
      return target_list
  ```

  Pythonのデフォルト引数は「関数が定義された時」に一度だけ評価されるため、この関数を複数回呼ぶと、以前の呼び出しで追加された中身が残ったまま使い回されて激しいバグを生みます。正しくは `target_list=None` とし、関数内で `if target_list is None: target_list = []` と初期化するのが絶対ルールです。
- ❌ **`for i in range(len(arr)):` を使ってしまう**
  - C言語やJavaの出身者がよくやる書き方ですが、Pythonでは著しく可読性が下がります。インデックス番号と中身を同時に回したい場合は、必ず組み込み関数の `enumerate()` を使います。

  ```python
  # ⭕️ Best Practice
  for i, val in enumerate(arr):
      print(f"{i}番目は {val}")
  ```

## 7. 2026年最新のベストプラクティス

1. **型ヒント (Type Hints) の常識化**
   近年のPython（3.9以降）では、引数や戻り値に型ヒントをつけるのが実務の絶対条件になりつつあります（FastAPIやPydanticの普及による恩恵）。

   ```python
   def get_users(user_id: int) -> list[str]: ...
   ```

2. **`dict` 操作における `match` 文の活用 (Python 3.10+)**
   長い `if-elif-else` の代わりに、パターンマッチングを用いた簡潔で強力な条件分岐が推奨されます。APIからの複雑なJSONレスポンスをパースする際に無類の強さを発揮します。

## 8. トラブルシューティング（よくあるエラー）

- **Q. リストをコピーしたのに、元のリストまで書き換わってしまう（浅いコピーの罠）**
  - **A.** Pythonでは `b = a` は「参照渡し」であり、`a`のアドレスを共有しているだけです。`a` を変更すると `b` も変わります。普通のリストなら `b = a.copy()` または `b = a[:]` を使い、多次元のリストなら `copy.deepcopy(a)` を使って安全にクローンしてください。
- **Q. `TypeError: 'tuple' object does not support item assignment`**
  - **A.** リスト `[1, 2]` ではなく、タプル `(1, 2)` の中身を変更しようとしています。タプルはイミュータブル（不変）なため、一度作ったら要素を書き換えられません。定数的な配列や、辞書のキーとして使いたい場合のみタプルを使用します。
