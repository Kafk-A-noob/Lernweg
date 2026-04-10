# 01. JavaScript/CSSを用いた業務画面のカスタマイズ開発

業務システム（SFA/CRM等）の画面をカスタマイズ・拡張する際に必須となる、JavaScript + CSSの実践的な応用知識です。

## 1. コンポーネント指向でのUI開発

業務システムのフロントエンド開発は、Reactと同様の**コンポーネント指向**で行われることがほとんどです。
Lightning Web Components (LWC) や、自社スクラッチ開発のいずれにおいても、以下の3ファイルで1つの画面部品を構成するパターンが基本形です。

```
myComponent/
├── myComponent.html   ← 構造（テンプレート）
├── myComponent.js     ← ロジック（イベント処理・データ取得）
└── myComponent.css    ← スタイリング
```

## 2. 業務画面で頻出するJavaScriptパターン

### データテーブルの動的レンダリング

売上一覧やユーザーリストなどの「行が動的に増減する一覧表」の描画が最も多い仕事です。

```javascript
// APIから取得した売上データを一覧テーブルに描画する
async function loadSalesData() {
  const response = await fetch('/api/sales');
  const data = await response.json();
  
  const tbody = document.getElementById('sales-table-body');
  tbody.innerHTML = ''; // 一度空にしてから再構築

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.customerName}</td>
      <td>${item.amount.toLocaleString()}円</td>
      <td>${item.stage}</td>
    `;
    tbody.appendChild(row);
  });
}
```

### モーダル（ポップアップ）の開閉制御

レコードの詳細表示や編集フォームの表示で多用される基本パターンです。

```javascript
const modal = document.getElementById('detail-modal');
const overlay = document.getElementById('overlay');

function openModal(recordId) {
  // モーダルに表示するデータをAPIから取得
  fetch(`/api/sales/${recordId}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('modal-name').textContent = data.name;
      document.getElementById('modal-amount').textContent = data.amount;
      modal.classList.add('is-active');
      overlay.classList.add('is-active');
    });
}

function closeModal() {
  modal.classList.remove('is-active');
  overlay.classList.remove('is-active');
}
```

## 3. 業務画面のCSS設計

### レスポンシブ対応しない勇気

社内システムは「社内の特定のPCブラウザ」からしかアクセスされないため、一般的なWebサイトとは異なり**スマホ対応（レスポンシブデザイン）が不要**なケースが大半です。
その代わり、「フォームの入力欄が綺麗に横並びになる」「一覧テーブルが崩れない」「ステータスバッジの色分け」といった実用性重視のCSSスキルが求められます。

### ステータスバッジの色分け（頻出）

```css
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: bold;
}
.badge--won     { background: #d4edda; color: #155724; }
.badge--lost    { background: #f8d7da; color: #721c24; }
.badge--pending { background: #fff3cd; color: #856404; }
```
