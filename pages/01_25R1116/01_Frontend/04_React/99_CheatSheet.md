# 99. React 頻出メソッド・必須スニペット大全

実務のReact（関数コンポーネント + Hooks）開発で、毎日息を吸うように書くことになる必須コード群と概念です。

## 1. 状態管理と副作用 (Hooks)

### useState: 最も基本的な状態管理

```jsx
import { useState } from 'react';

function Counter() {
  // state変数と、それを更新する関数のペア
  const [count, setCount] = useState(0);

  // 関数型の更新（直前のstateをベースに更新する安全な方法）
  const increment = () => setCount(prev => prev + 1);

  return <button onClick={increment}>{count}</button>;
}
```

### useEffect: 画面表示時(マウントロジック)とクリーンアップ

外部APIの呼び出しやイベントリスナの登録に使います。第二引数（依存配列）による発火制御が命です。

```jsx
import { useEffect } from 'react';

function UserProfile({ userId }) {
  useEffect(() => {
    // 第1引数: 実装したい副作用(API通信など)
    let isMounted = true;
    fetchData(userId).then(data => {
      if(isMounted) setData(data);
    });

    // クリーンアップ関数（アンマウント時、または次回再実行前に走る）
    return () => {
      isMounted = false;
    };
  }, [userId]); // 第2引数: userIdが変化した時だけ発火する。[ ] なら初回のみ発火。
  // ...
}
```

## 2. コンポーネント間の連携

### Props の受け渡し (分割代入必須)

```jsx
// ❌ (props) で受けて props.title とするのはモダンではない
// ⭕️ 引数内で { title, onClick } のように分割代入して受け取る
function CustomButton({ title, onClick, color = "blue" }) {
  return (
    <button className={`btn-${color}`} onClick={onClick}>
      {title}
    </button>
  );
}
```

### イベント処理における関数の渡し方の罠

```jsx
// ❌ onClick={handleClick()} だと「描画された瞬間に実行」されて無限ループでクラッシュする
// ⭕️ 関数そのものを渡す
<button onClick={handleClick}>Click</button>

// ⭕️ 引数が必要な場合はアロー関数で包む
<button onClick={() => handleDelete(1)}>Delete</button>
```

## 3. リストレンダリングのカギ (keyプロパティ)

配列データを元に複数の要素を描画する際、Reactが変更箇所を特定するための目印（key）を必ず付与します。

```jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        // Keyには index(インデックス番号) を使わない。必ず一意のIDを使う。
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

## 4. トラブルシューティング（よくあるエラー）

- **Q. `Too many re-renders. React limits the number of renders to prevent an infinite loop.`**
  - **A.** 描画関数の中に直接 `setCount(1)` のような状態更新を書いてしまっているか、`useEffect` の依存配列の設定ミスでループが起きています。
- **Q. 画面が更新されない (オブジェクトや配列のstate)**
  - **A.** `users.push(newUser); setUsers(users);` のようにしてはいけません。Reactは「中身が同じ配列（同じメモリ参照）」だと判断して再描画をサボります。必ず `setUsers([...users, newUser]);` のように新しい配列（別参照）としてセットしてください。
