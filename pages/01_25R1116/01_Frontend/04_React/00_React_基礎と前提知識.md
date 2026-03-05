# React 基礎と前提知識 (00_React)

本ドキュメントは、世界中で最も採用されているUI（ユーザーインターフェース）構築のためのJavaScript/TypeScriptライブラリ「React」のコア概念と、特徴的なシステム設計についての学習総括である。

---

## 1. 宣言的UIとコンポーネント指向

Reactの最大の特徴は、従来の「JavaScriptでHTMLの要素（DOM）を直接探し出し、命令して書き換える（命令的UI）」というアプローチを完全に捨てた点にある。

### コンポーネント指向 (部品化)

Reactでは、画面のすべての要素（ボタン、ヘッダー、検索バー等）を「コンポーネント」という独立したパーツ（実態はただの関数）として定義し、それらをレゴブロックのように組み合わせて1つの画面を作る。

```tsx
// 「ボタン」という独立したコンポーネント（部品）を作る
const CustomButton = () => {
  return (
    <button className="bg-blue-500 text-white p-2 rounded">
      クリックしてね
    </button>
  );
};

// 別の場所（画面全体など）で、部品として呼び出す
const App = () => {
  return (
    <div>
      <h1>ようこそ</h1>
      <CustomButton /> {/* 定義したボタン部品を配置 */}
    </div>
  );
};
```

このように「HTMLのような見た目のコードを、JavaScriptの中に直書きする」記法を **JSX (TSX)** と呼ぶ。

---

## 2. Props (部品へのデータ受け渡し)

コンポーネント（部品）は、外側からデータを受け取って見た目を変えることができる。この引き渡すデータを `Props` (プロップス) と呼ぶ。

```tsx
// Propsとして「title」という文字と「isActive」という真偽値を受け取るボタン
type ButtonProps = {
  title: string;
  isActive: boolean;
};

const StatusButton = (props: ButtonProps) => {
  return (
    <button style={{ backgroundColor: props.isActive ? "red" : "gray" }}>
      {props.title}
    </button>
  );
};

// 呼び出し側でデータを渡す
<StatusButton title="削除" isActive={true} />;
```

---

## 3. State (状態管理) と Hooks

Reactにおいて最も重要かつ躓きやすい概念が「State（状態）」である。
Reactは「State（データ）が変化した時だけ、そのデータを使っている部品だけを自動で再描画する」という強力なシステムを持っている。

このStateを管理するための専用ツール（Hooks）が `useState` である。

```tsx
import { useState } from "react";

const Counter = () => {
  // countが「現在のデータ」、setCountが「データを書き換える専用の魔法の杖」
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // 【重要】絶対に count = count + 1 と直接書き換えてはいけない！
    // 専用の杖 (setCount) を使って書き換えないと、Reactは「データが変わった」ことに気づけず、画面が更新されない
    setCount(count + 1);
  };

  return (
    <div>
      <p>現在のカウント: {count}</p>
      <button onClick={handleClick}>増やす</button>
    </div>
  );
};
```

### 【実務Tip】 状態の不変性 (Immutability)

`useState` において「変数（count）を直接いじらず、必ず専用の更新関数（setCount）を使う」というルールは、実務において絶対の鉄則である。
これを破って直接データを書き換えた場合、画面の値が更新されなかったり、過去のデータに戻る（Undo）機能が壊れたりするなど、追跡不能な重篤なバグを引き起こす。常に「新しいデータを作って、丸ごと上書きする」という「不変性（イミュータビリティ）」の意識を持つこと。

---

## 学習のまとめ

Reactの学習における最大の壁は「DOM（HTMLタグ）を直接操作しない」というパラダイムシフト（思考の転換）を受け入れることにある。
「データ（State）が変われば、勝手に画面（UI）が変化する（＝宣言的UI）」というReactの魔法を使いこなせるようになれば、バグが少なく保守性に優れた大規模フロントエンド開発への道が開かれる。
