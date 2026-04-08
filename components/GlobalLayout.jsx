import React from 'react';

// 全ページ共通でNextraレイアウトの外側に適用されるラッパーコンポーネント
// サイドバーがマスクされたり、CSSやコンテキストが衝突するのを防ぐ土台として機能します
export default function GlobalLayout({ children }) {
  return (
    <div className="lernweg-global-wrapper">
      {children}
    </div>
  );
}
