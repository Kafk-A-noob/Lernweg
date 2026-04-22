# ロジック構築 メソッド図鑑 (PHP中心・他言語対比)

Webの黎明期から現代のWordPressや素のWebアプリケーション構築まで広く使われるPHPにおいて、配列 (連想配列) と文字列を操作する主要な関数群をまとめる。PHPの組み込み関数は歴史的な経緯から引数の順番に統一感がない (針関数) ことが多いため、公式リファレンスを手元に置きながら記述するのが基本となる。

---

## 1. ループ・反復処理 (一つずつ取り出して何かする)

### `foreach` : ただ回すだけ (値を返さない)

- **公式リファレンス**: [foreach - PHP Manual](https://www.php.net/manual/ja/control-structures.foreach.php)
- **用途**: JSの `forEach` やPythonの `for...in` と同じく、配列を頭から順番に取り出す。インデックスやキー (連想配列のキー) も同時に取り出せる仕様が非常に便利である。

```php
$arr = ["apple", "banana"];
// 値だけ取り出す
foreach ($arr as $value) {
    echo $value;
}

// キー(インデックス)と値の両方を取り出す
foreach ($arr as $key => $value) {
    echo "{$key}: {$value}\n"; // 0: apple, 1: banana
}
```

### `array_map()` : 中身をすべて加工して新しい配列を作る

- **公式リファレンス**: [array_map - PHP Manual](https://www.php.net/manual/ja/function.array-map.php)
- **罠 (引数の順番) **: 第一引数にコールバック関数、**第二引数に配列** を渡す (他のarray系関数と逆の順番になっていることが多いので絶対注意)。

```php
$users = ["alice", "bob"];
// 全て大文字にする
$greetings = array_map(function($name) {
    return strtoupper($name);
}, $users);
```

### `array_filter()` : 条件を満たすものだけ残した配列を作る

- **公式リファレンス**: [array_filter - PHP Manual](https://www.php.net/manual/ja/function.array-filter.php)
- **罠 (引数の順番) **: こちらは **第一引数に配列**、第二引数にコールバック関数を渡す。

```php
$numbers = [1, 2, 3, 4, 5];
$evens = array_filter($numbers, function($n) {
    return $n % 2 === 0;
});
```

---

## 2. 検索・判定 (あるかないかを探る)

### `in_array()` : 入っているか？ (True / False)

- **公式リファレンス**: [in_array - PHP Manual](https://www.php.net/manual/ja/function.in-array.php)
- **用途**: 指定した値が配列の中に存在するかを真偽値で返す。JSの `includes()` に相当。
- **罠**: 第三引数の `$strict` を `true` にしないと、型を無視したゆるい比較 (`==`) が行われてしまうため、必ず `in_array($search, $arr, true)` と書くのがお作法である。

### `array_search()` : 何番目 (どのキー) に入っているか？

- **公式リファレンス**: [array_search - PHP Manual](https://www.php.net/manual/ja/function.array-search.php)
- **用途**: 値が最初に見つかったキー (Index番号または文字列キー) を返す。これも第三引数 `true` (厳密比較) を忘れずに。

---

## 3. 文字列 ⇔ 配列 の破壊と結合

### `explode()` : 文字列を割って配列にする

- **公式リファレンス**: [explode - PHP Manual](https://www.php.net/manual/ja/function.explode.php)
- **用途**: 区切り文字を指定して文字列を配列化する。JSやPythonの `split()` に該当。

```php
$str_data = "apple,banana,orange";
$arr = explode(",", $str_data);
```

### `implode()` : 配列をくっつけて文字列にする

- **公式リファレンス**: [implode - PHP Manual](https://www.php.net/manual/ja/function.implode.php)
- **用途**: 配列の要素を特定の文字列で連結する。JSの `join()` に該当。

```php
$arr = ["2026", "03", "11"];
$str = implode("/", $arr); // "2026/03/11"
```

---

## 4. 並び替え (ソート)

PHPの配列は普通の配列と連想配列 (キーが文字列) が混在するため、ソート関数が極めて細かく分かれている。これらはすべて**破壊的 (元の配列を並べ替える) **メソッドである。

- **公式リファレンス**: [配列のソート - PHP Manual](https://www.php.net/manual/ja/array.sorting.php)

- **`sort()`**: 値を取り出して昇順に並べ替える。**キーは0から振り直されて破壊される**。
- **`asort()`**: 【連想配列用】連想配列のキーと値の関係を維持したまま、**値**を使って昇順に並べ替える。
- **`ksort()`**: 【連想配列用】連想配列のキーと値の関係を維持したまま、**キー**を使って昇順に並べ替える。
- (※それぞれ降順にしたい場合は `rsort()`, `arsort()`, `krsort()` といった `r (reverse)` が付いた関数を使用する)。

---

## 5. 要素の追加・削除 (破壊的メソッド)

- **公式リファレンス**: [配列関数 - PHP Manual](https://www.php.net/manual/ja/ref.array.php)

- **`array_push()`**: 要素を最後に追加する。ただし、単発で要素を追加する場合は関数を呼ぶよりも `$arr[] = "apple";` のように直接代入する文法の方が高速かつ一般的。
- **`array_pop()`**: 要素を最後から取り出して削除する。
- **`array_unshift()`**: 要素を最初に追加する。
- **`array_shift()`**: 要素を最初から取り出して削除する。
