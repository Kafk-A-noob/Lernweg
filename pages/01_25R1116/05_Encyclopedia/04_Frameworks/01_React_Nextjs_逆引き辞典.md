# React / Next.js 逆引き辞典・陥りやすい罠

モダンなフロントエンド開発においてデファクトスタンダードとなっている React と Next.js (App Router) の主要概念と、初学者が99%ハマる罠 (アンチパターン) を整理する。

---

## 1. 状態管理の絶対ルール (`useState` と Immutability)

- **公式リファレンス**: [useState - React Docs](https://ja.react.dev/reference/react/useState)

ReactのコンポーネントはState (状態) が変わった時に再レンダリング (画面の描き直し) を行うというサイクルで動く。このStateを管理するのが `useState` フックである。

### 【致命的な罠】Stateの直接変更 (ミューテーション)

```typescript
const [users, setUsers] = useState(["Alice", "Bob"]);

// ❌ 絶対にやってはいけない書き方 (破壊的変更)
users.push("Charlie");
setUsers(users); // これを呼んでも、メモリの参照が変わってないため画面は更新されない！
```

### 【お作法】スプレッド構文による浅いコピーの作成

配列やオブジェクトのStateを更新する際は、必ず**別の新しい配列 (オブジェクト) を作成して**セットしなければならない (イミュータビリティの維持)。JSのメソッド図鑑で破壊的メソッドの利用を控えるよう記載したのはこのためである。

```typescript
// ⭕ 正しい書き方 (新しい配列を作り出してセットする)
setUsers([...users, "Charlie"]);
```

---

## 2. 副作用の制御 (`useEffect` と依存配列の無限ループ)

- **公式リファレンス**: [useEffect - React Docs](https://ja.react.dev/reference/react/useEffect)

APIからデータを取得したり、外部システム (Three.js / R3F等) と同期したりするコンポーネントの描画とは直接関係ない処理 (副作用 = Side Effect) を記述するためのフック。

### 【致命的な罠】依存配列 (Dependency Array) の指定漏れ

```typescript
const [count, setCount] = useState(0);

//  ❌ 第二引数の [] を書き忘れた場合
useEffect(() => {
  // コンポーネントが再レンダリングされる【たびに】走ってしまう！
  setCount(count + 1);
  // 結果： setCount が走る → 再レンダリングが起こる → また useEffect が走る → 無限ループでブラウザがクラッシュする
});
```

### 【お作法】依存配列を正しく設定する

```typescript
// 1. 初回マウント (表示) 時の一回だけ実行したい場合
useEffect(() => {
  fetchData();
}, []); // ← 空の配列を渡す

// 2. 特定の値 (userId) が変わった時だけ再実行したい場合
useEffect(() => {
  fetchData(userId);
}, [userId]); // ← 監視したい変数を渡す
```

---

## 3. Next.js (App Router) の Server vs Client コンポーネント

- **公式ドキュメント**: [Server Components - Next.js Docs](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

従来のReactはすべてブラウザ上で処理 (Client-Side Rendering) していたが、新しいNext.jsのApp Routerでは**デフォルトで全てのコンポーネントがサーバー側でHTML化されてから (Server Component) 送られる**という極めて重要な設計変更がなされた。

### 【罠】サーバーコンポーネント内でフックを使おうとする

デフォルトの状態 (Server Component) のファイル内で、`useState` や `useEffect` レンダリング系フック、あるいは `onClick` のようなブラウザのイベントリスナを書くと、コンパイルエラー (ビルドエラー) となる。
(※サーバー側ではユーザーがクリックするという概念が存在しないため)

### 【お作法】`"use client"` ディレクティブの明記

インタラクティブな動き (ボタンクリック、状態変化、R3FのCanvas描画など) が必要なコンポーネントファイルの**一番上の行 (1行目) **に、必ず `"use client";` と呪文を記述する。

```typescript
"use client"; // ← これを書くことで初めてブラウザ側で動作するコンポーネントになる

import { useState } from "react";

export default function Counter() {
    const [count, setCount] = useState(0);
    return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

- **アーキテクチャ設計論**: プロジェクト全体を `"use client"` にしてしまうとNext.jsの恩恵 (SEOや初期描画速度の向上) が失われる。極力外枠やデータ取得部分はServer Componentとし、ボタンなどの細部のみを別ファイルに切り出してClient Componentとするのがモダンな設計である。
