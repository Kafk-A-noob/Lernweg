# JavaScript/TypeScript 特有のお作法と他言語比較

フルスタックエンジニアとして言語を横断する際、文法 (メソッド) 以上に「言語の根底にある設計思想の違い」を理解していないと深刻なバグを引き起こす。
本稿では JavaScript (JS) および TypeScript (TS) において最も躓きやすい特性 (お作法) と、PythonやPHP等の他言語との思想の違いをまとめる。

---

## 1. 比較演算の罠 (`==` vs `===`) と動的型付け

### JavaScriptにおける暗黙の型変換

JSは「エラーでプログラムを止めないこと (ブラウザの表示を止めないこと) 」を是として設計された歴史があるため、型が違っても無理やり変換して計算・比較しようとする。

- **公式リファレンス**: [厳密等価性 (===) - MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Strict_equality)

```javascript
// 【非常に危険な等価演算子 (==) 】
console.log(1 == "1"); // true (文字列が数値に変換されてしまう)
console.log(0 == false); // true
console.log([] == 0); // true
```

- **お作法 (ベストプラクティス)**: JS/TSにおいては、型変換を行わずにデータ型まで厳密にチェックする **`===` (厳密等価演算子)** および **`!==`** を例外なく使用すること。
- **他言語比較**: PythonやPHP8.x以降では `==` でも直感に近いより厳密な判定が行われるが、JSの場合は致命傷になる。

---

## 2. 変数宣言のお作法 (`let` / `const` の使い分け)

- **公式リファレンス**: [const - MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/const)

JS特有の強力なスコープ管理規則。「とりあえず全部変数で」というPython的発想で `let` (再代入可能) を使いすぎると、値の予期せぬ書き換わり (状態の汚染) を引き起こす。

- **お作法**: 基本は **すべて `const` (再代入不可の定数)** で宣言する。ループのカウンタ (`for (let i = 0; ...)`) など、どうしても書き換わることが前提の変数にのみ `let` を使う。
- **注意点**: `const` は「再代入」を禁止するだけであり、オブジェクトや配列の中身の「変更 (Mutation) 」は防げない。

  ```typescript
  const arr = [1, 2];
  arr.push(3); // ← これはエラーにならず実行される (中身の変更)
  // arr = [1, 2, 3]; // ← これは再代入なのでエラー
  ```

---

## 3. 非同期処理 (`Promise` と `async/await`) の思想

Web開発で他言語 (PHP等) からJSへ移行したエンジニアが最も苦しむのがこの「非同期」である。

- **公式リファレンス**: [async function - MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/async_function)

### シングルスレッドとイベントループ

PHPやPython (伝統的なCGIベース) は、上から下へと1行ずつ実行し、DB接続中などは「待つ (ブロックする) 」。
しかしブラウザで動くJSが「待つ」と画面がフリーズしてしまうため、JSは「時間がかかる処理は裏でやらせておき、次の行を先に実行する (ノンロッキングI/O) 」という設計になっている。

```javascript
// APIからデータを待ちたいが...
const data = fetch("https://api.example.com/users");
console.log(data); // 欲しいデータではなく "Promise {<pending>}"(予約券) が表示される
```

### `async / await` による解決

予約券 (Promise) の完了を「待ってから」次の行へ進める現代的なお作法。

```typescript
async function fetchUsers() {
  // await を付けることで、データ取得が完了するまでこの行で待機する
  const response = await fetch("https://api.example.com/users");
  const data = await response.json();
  console.log(data); // 正しくデータが取得できる
}
```

- **お作法**: API通信 (Fetch / Axios) や一部のファイル操作を行うときは、関数に `async` を付け、非同期処理の前に `await` を付ける。

---

## 4. TypeScript特有のお作法: `type` と `interface` の使い分け

TypeScriptを導入する目的は、「JSの暗黙の型変換やtypoによる実行前エラーをコンパイル段階で検出すること」である。型の宣言方法には2種類ある。

- **公式ハンドブック**: [Everyday Types - TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)

### `interface` (インターフェース)

オブジェクト (連想配列) の定義に特化。クラスの設計図としての意味合いが強く、同じ名前で宣言するとマージ (結合) される特性を持つ。

```typescript
interface User {
  id: number;
  name: string;
}
```

### `type` (型エイリアス)

オブジェクトにとどまらず、あらゆる型 (文字列や複数の型の組み合わせ等) に名前をつけられる。マージはできない。

```typescript
type Status = "success" | "error" | "loading"; // Union型 (文字列リテラルを型として縛る)
```

- **お作法 (React/Next.js開発時)**: プロジェクトチーム内で統一するのが鉄則だが、近年のモダンフロントエンド開発では、機能の柔軟性が高い **`type` をベースに統一** する構成 (Type-only 定義) が主流となりつつある。

---

## 5. オブジェクトの参照渡し (浅いコピーと深いコピー)

JS/TSにおいて、配列やオブジェクトを `=` で別変数に入れると、「中身のコピー」ではなく「同じ住所 (メモリ) へのリンク」が渡される。

```typescript
let a = { name: "Alice" };
let b = a; // 参照(住所)渡し
b.name = "Bob";
console.log(a.name); // "Bob" に変わってしまう！！ (致命的なバグ)
```

- **解決策 (スプレッド構文などによる浅いコピー) **:

  ```typescript
  let b = { ...a }; // ブロックを展開して新しい家を作る
  ```

  Reactの `useState` などで状態 (State) を更新する際、この「直接書き換えず、新しいコピーを作る (Immutability / 不変性) 」というルールを守らないと画面が再レンダリングされない。
