# 99. Python 頻出メソッド・必須スニペット大全

AI開発やスクリプト処理、バックエンド開発(Flask/Django/FastAPI)で頻繁に使う、Python特有の美しい構文（Pythonic）群です。

## 1. コレクション操作（リスト内包表記）

Pythonにおいて `for` 文を何行も使って新しいリストを作るのはC言語的であり「かっこ悪い（Not Pythonic）」とされます。

```python
# ❌ 旧式（他言語風のアプローチ）
numbers = [1, 2, 3, 4, 5]
squares = []
for n in numbers:
    squares.append(n * 2)

# ⭕️ リスト内包表記 (List Comprehensions) - 激速・超推奨
squares = [n * 2 for n in numbers]

# 条件（IF）もつけられる（偶数だけを2倍にする）
even_squares = [n * 2 for n in numbers if n % 2 == 0]
```

## 2. 辞書 (Dict) の安全な操作

APIのJSONやDBの結果を扱う際、最も多用するデータ構造です。

```python
user = { "name": "Taro", "age": 25 }

# ❌ 存在しないキーにアクセスすると KeyError でプログラムが落ちる！
# print(user["address"]) 

# ⭕️ get() メソッドを使う（安全！無ければ None が返る）
print(user.get("address"))

# 存在しない場合のデフォルト値を設定する
print(user.get("status", "未設定")) # "未設定" が返る
```

## 3. ファイルの読み書きにおける神構文 (with)

Javaの `try-with-resources` と同じく、**「開いたファイルを自動で確実に閉じる」**ための絶対の作法です。

```python
# ❌ f.close() を忘れる、または途中でエラーが起きると永続的にファイルがロックされる
f = open('data.txt', 'w')
f.write('Hello')
f.close()

# ⭕️ with 構文を使う（ブロックを抜ける際に勝手に閉じてくれる）
with open('data.txt', 'r', encoding='utf-8') as f:
    text = f.read()
    print(text)
```

## 4. トラブルシューティング（よくあるエラー）

- **Q. `IndentationError: expected an indented block`**
  - **A.** Pythonはタブやスペースによる「インデント（字下げ）」でブロックを認識します（`{}` の代わり）。インデントがズレていたり、空白とタブが混在しているとこのエラーで即死します。
- **Q. モジュールが見つからない (`ModuleNotFoundError`)**
  - **A.** `pip install requests` 等で入れたはずのパッケージがないと言われる場合、システム全体のPythonと仮想環境（`venv` や `conda` 等）のPythonが複数混在してすれ違っている可能性が99%です。`which python` やVSCode右下のインタプリタ選択を確認してください。
