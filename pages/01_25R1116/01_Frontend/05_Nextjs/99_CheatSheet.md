# 99. Next.js 頻出メソッド・必須スニペット大全

ReactフレームワークのデファクトスタンダードであるNext.js（App Router時代）の特殊な機能・ルーティングに関する必須知識のまとめです。

## 1. サーバーコンポーネント (RSC) と Client/Server の境界

App Routerでは、デフォルトで全てのコンポーネントが「サーバー側(バックエンド)」で実行されます。これはReactの歴史的な大転換パラダイムです。

### "use client" 宣言

```jsx
// ファイルの1行目に書くことで、従来のReact（ブラウザ上で動く処理）になる
"use client";

import { useState } from 'react'; // "use client" がないとフックは使えない

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Server Component でのデータフェッチ（超高速・SEO最強）

サーバーコンポーネント内では直接DBに繋いだり、非同期通信を待つことができます（`useEffect` も `useState` も不要）。

```jsx
// ページコンポーネント自体を async にできる
export default async function Page() {
  const data = await fetch('https://api.example.com/data');
  const posts = await data.json();
  
  return (
    <ul>
      {posts.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  );
}
```

## 2. Next.js 特有の強力な組み込みコンポーネント

生の `<a>` タグや `<img>` タグを使うのはアンチパターンです。必ずNext.jsのものを使います。

### Link (高速なSPA遷移)

```jsx
import Link from 'next/link';

// 画面がリロードされず、瞬時に次のページへ切り替わる
<Link href="/about" className="text-blue-500">
  Aboutページへ
</Link>
```

### Image (画像の自動最適化)

WebP変換、遅延読み込み、サイズ最適化を完全に自動で行います。

```jsx
import Image from 'next/image';

<Image 
  src="/hero.png" 
  alt="Hero Image" 
  width={800} 
  height={600} 
  priority // ファーストビュー（一番最初に見える画像）にはpriorityをつける
/>
```

## 3. ルーティングと動的パラメータ

`app/blog/[id]/page.jsx` のような動的ルートを処理する際の引数の受け取り方です。

```jsx
// props経由で params が渡ってくる
export default function BlogPost({ params }) {
  // フォルダ名が [id] だった場合
  return <h1>記事ID: {params.id}</h1>;
}
```

## 4. トラブルシューティング（よくあるエラー）

- **Q. `Error: Event handlers cannot be passed to Client Component props.`**
  - **A.** サーバーコンポーネントから、クライアントコンポーネントに対して関数（onClickなど）をPropsで渡そうとしています。境界を越えて関数を送ることはできません（シリアライズ不可能なため）。設計を見直してください。
- **Q. ビルド時（`npm run build`）に特定APIの取得エラーや prerender error が頻発する**
  - **A.** Next.jsは賢すぎるため、ビルド時に全てのページにアクセスして静的なHTMLを作ろうとします（Prerendering）。ローカルのDBが立ち上がっていなかったり、URLがおかしかったりするとビルド自体がコケます。
