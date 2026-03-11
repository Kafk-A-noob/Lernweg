# ロジック構築 メソッド図鑑 (JS/TS中心・他言語対比)

アルゴリズムやフロントエンドのデータ加工において必須となる、配列 (Array) と文字列 (String) の操作メソッドをまとめる。TypeScript (TS) 環境での型推論やジェネリクスの観点、および公式リファレンスリンク (MDN Web Docs) を併記する。

---

## 1. ループ・反復処理 (一つずつ取り出して何かする)

### `forEach()` : ただ回すだけ (値を返さない)

- **公式リファレンス**: [Array.prototype.forEach() - MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
- **用途**: 配列の中身を一つずつ取り出し、外部の変数を書き換えたり、画面を更新したりする副作用 (Side Effect) を起こすためのメソッド。
- **注意**: `map`とは異なり、新しい配列を生成しない (戻り値は `undefined`)。途中で `break` (ループから抜ける) ことはできない。
- **TSでの型**: コールバック関数の引数は、配列の型 `<T>` が自動推論される。

  ```typescript
  const arr: number[] = [1, 2, 3];
  // num は自動的に number 型として推論される
  arr.forEach((num) => console.log(num * 2)); // 出力: 2, 4, 6
  ```

- **他言語対比**: 基本的な `for` 文や Python の `for item in lst:`、PHPの `foreach ($arr as $item)` に相当。

### `map()` : 【最頻出】中身をすべて加工して「新しい配列」を作る

- **公式リファレンス**: [Array.prototype.map() - MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
- **用途**: ReactのJSX要素のリストレンダリングや、データ構造の1対1変換で最も多用される。
- **TSでの注意点**: `map` は戻り値から「新しい配列の型 `<U>[]`」を推論する。

  ```typescript
  const users: string[] = ["Alice", "Bob"];
  // greetings は string[] として推論される
  const greetings = users.map((name) => `Hello ${name}`);
  ```

- **他言語対比**: Pythonのリスト内包表記 `[f(x) for x in lst]`。PHPの `array_map()`。

### `filter()` : 【最頻出】条件を満たすものだけ「残した配列」を作る

- **公式リファレンス**: [Array.prototype.filter() - MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
- **用途**: 特定の条件に合致する (`true` を返す) 要素だけを抽出する。「論理削除されていないデータだけを出す」際などに必須。

  ```typescript
  const numbers: number[] = [1, 2, 3, 4, 5];
  const evens = numbers.filter((n) => n % 2 === 0); // [2, 4]
  ```

- **他言語対比**: Pythonの `[x for x in lst if cond]`、PHPの `array_filter()`。

---

## 2. 検索・判定 (あるかないかを探る)

### `includes()` : 入っているか？ (True / False)

- **公式リファレンス**: [Array.prototype.includes() - MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/includes)
- **用途**: 対象のプリミティブ値 (文字や数値) が含まれているかを真偽値で返す。

  ```typescript
  const arr: string[] = ["Apple", "Banana", "Cherry"];
  console.log(arr.includes("Banana")); // true
  ```

- **他言語対比**: Pythonの `in` 演算子 (`"Banana" in lst`)。PHPの `in_array()`。

### `indexOf()` : 何番目に入っているか？ (Index番号)

- **公式リファレンス**: [Array.prototype.indexOf() - MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf)
- **用途**: 位置 (Index: 0始まり) を取得する。存在しない場合は必ず `-1` が返る。

### `some()` / `every()` : 一部でも満たすか？ / 全て満たすか？

- **公式リファレンス**: [Array.prototype.some() - MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/some)
- **用途**: `some` は1つでも条件に合致すれば `true`。`every` は全員クリアで `true`。オブジェクトの配列から特定のプロパティを探りたい場合に `includes` よりも重宝する。

---

## 3. 文字列 ⇔ 配列 の破壊と結合

### `split()` : 文字列を「割って」配列にする

- **公式リファレンス**: [String.prototype.split() - MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/split)
- **用途**: CSVデータや標準入力で受け取った生の文字列データを、扱いやすい配列に変換する。

  ```typescript
  const str = "apple,banana,orange";
  const arr: string[] = str.split(","); // ["apple", "banana", "orange"]
  ```

### `join()` : 配列を「くっつけて」文字列にする

- **公式リファレンス**: [Array.prototype.join() - MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/join)
- **用途**: 分割して処理した配列を、最終的な解答文字列やパスとして連結する。

  ```typescript
  const arr: (number | string)[] = [2026, "03", "11"];
  const str = arr.join("/"); // "2026/03/11"
  ```

---

## 4. 並び替え 【要注意の凶悪トラップ】

### `sort()` : 順番を並び替える

- **公式リファレンス**: [Array.prototype.sort() - MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
- **超危険な罠**: JavaScript/TypeScriptの `sort()` は、**引数を与えないと「中身を一旦すべて文字列に変換した上で、UTF-16コード単位の辞書順で並べる」**仕様になっている。
  - `[10, 2, 30].sort()` → `[10, 2, 30]` となる致命的なバグが起こる。
- **正しい数値ソートの書き方**: 必ず数値を比較して差分を返すコールバック関数を渡す。

  ```typescript
  const arr: number[] = [10, 2, 30];

  // 昇順 (小さい順)
  arr.sort((a, b) => a - b); // [2, 10, 30]

  // 降順 (大きい順)
  arr.sort((a, b) => b - a); // [30, 10, 2]
  ```

---

## 5. 要素の追加・削除 (破壊的・非破壊的メソッド)

### 破壊的メソッド (Mutating)

※元の配列自身の内容を書き換えてしまうため、React等の仮想DOM環境での使用は**厳禁** (再レンダリングが発火しない原因となる)。

- **`push()` / `pop()`** : 要素を**最後**に追加 / 削除する。
- **`unshift()` / `shift()`** : 要素を**最初 (先頭) **に追加 / 削除する。
- **`splice()`** : [MDN: splice()](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/splice)
  - 配列の任意の位置の要素をえぐり取ったり、そこに新たな要素を継ぎ足したりする。

### 非破壊的メソッド (Non-mutating)

※元の配列には傷をつけず、コピーした新しい配列・要素を返すため実務で多用される。

- **`slice(開始位置, 終了位置)`**: [MDN: slice()](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/slice)
  - 指定した範囲のコピーを取得する。
- **スプレッド構文 `[...arr, newItem]`**: `push` の安全な代替として、Reactフック等で要素を追加する際はこちらの新しい配列を作り出す手法を使う。
