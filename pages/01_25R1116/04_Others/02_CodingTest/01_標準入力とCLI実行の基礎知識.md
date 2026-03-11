# コーディングテスト対策: 標準入力とCLI実行の基礎知識

就職活動やカジュアル面談の選考フローで出題されるコーディングテスト (Track, paiza, AtCoder 等)では、Webアプリケーションの開発スキルとは全く異なる**標準入力 (Standard Input) を受け取り、標準出力 (Standard Output) に結果を返すCLIアプリケーション**の実装が求められる。

未経験者が最も躓きやすい標準入力の受け取り方について、各言語ごとのテンプレートと実行方法を解説する。

---

## 1. なぜWebアプリではなく標準入力なのか？

企業側は、仕様通りにアルゴリズムを組めるか計算量 (パフォーマンス) を意識できているかを自動採点システムで判定したい。ブラウザのボタンクリック (`onClick`) やAPIリクエスト (`req.body`) は自動採点が難しいため、最も原始的で確実な **テキストの流し込み (標準入力) とテキストの一致判定 (標準出力) ** がテスト環境として採用されている。

テスト環境では、プログラムに対して以下のようなテキストが裏側から流し込まれる。

```text
3
10 20 30
```

これを適切に変数 (`N = 3`, `array = [10, 20, 30]`) として受け取る処理が最初に必要となる。

---

## 2. 各言語の標準入力テンプレート

### 🟡 JavaScript (Node.js)

フロントエンドエンジニア志望者が最も苦戦するのがJSの標準入力である。ブラウザには標準入力が存在しないため、Node.jsの `fs` (File System) モジュールを使って一括で読み込むのが主流である。

- **公式リファレンス**: [Node.js fs.readFileSync](https://nodejs.org/api/fs.html#fsreadfilesyncpath-options)

```javascript
// /dev/stdin (標準入力ルート) から全ての入力を文字列として読み込む
const fs = require("fs");
const input = fs.readFileSync("/dev/stdin", "utf-8");

// 改行で分割して行ごとの配列にする
const lines = input.trim().split("\n");

// 1行目のデータ (例: 3)
const N = parseInt(lines[0], 10);
// 2行目のデータ (例: 10 20 30) を数値の配列にする
const numbers = lines[1].split(" ").map(Number); // [10, 20, 30]

console.log(`要素数は ${N}、合計は ${numbers[0] + numbers[1]} です`);
```

- **ローカルでの実行テスト方法**:
  `node app.js < input.txt` (`input.txt` にテストケースを書いておく)

### 🔵 Python

データサイエンスやアルゴリズム問題で最も有利とされる言語。組み込み関数 `input()` が1行だけを読み取ってくれるため、非常にシンプルに書ける。

- **公式リファレンス**: [Python Docs - input()](https://docs.python.org/ja/3/library/functions.html#input)

```python
# 1行目を読み込み、整数に変換
N = int(input())

# 2行目を読み込み、スペースで分割し、全て整数に変換してリストにする
numbers = list(map(int, input().split())) # [10, 20, 30]

print(f"要素数は {N}、合計は {numbers[0] + numbers[1]} です")
```

- **ローカルでの実行テスト方法**:
  `python app.py < input.txt`

### 🐘 PHP

PHPもWebのリクエスト処理が主戦場だが、CLI実行時には `fgets(STDIN)` や `trim()` を組み合わせる。

- **公式リファレンス**: [PHP Manual - I/O ストリーム](https://www.php.net/manual/ja/wrappers.php.php)

```php
<?php
// 1行目を読み込み
$N = (int)trim(fgets(STDIN));

// 2行目を読み込み、スペースで分割
$line2 = trim(fgets(STDIN));
$numbers = explode(" ", $line2);

// 配列の中身を整数にキャストする (array_mapを使うと美しい)
$numbers = array_map('intval', $numbers);

echo "要素数は {$N}、合計は " . ($numbers[0] + $numbers[1]) . " です\n";
```

- **ローカルでの実行テスト方法**:
  `php app.php < input.txt`

---

## 3. 面接官の視点: なぜこのテストを受けさせるのか？

このテストは単なるパズル解きにとどまらず、以下の能力を見られている。

1. **言語の標準ライブラリ (組み込み関数) を理解しているか**
   - JSなら `map`, Pythonなら `リスト内包表記`, PHPなら `array_map` など、言語の得意なデータ処理方法を知っているか。
2. **境界値テスト (Edge cases) を想像できるか**
   - もし配列が空だったら？数値が0だったら？というエラー対策をコードに組み込めるか (実務のバグ予防能力)。
3. **計算量 (Big O notation) を意識できているか**
   - ループ (for) を2重、3重にネストさせると、データが10万件になった時にタイムアウト (TLE) してしまう。ハッシュマップ (連想配列) などを使って処理を軽くする工夫ができるか。

未経験から実務へステップアップするためには、これらフレームワークの魔法に頼らない、純粋なプログラミング基礎力が必須となるため、定期的な練習が推奨される。
