# 99. JavaScript(TypeScript) 頻出メソッド・必須スニペット大全

フロントエンド・バックエンド(Node.js)を問わず、実務で絶対に暗記しておくべきJS/TSの非同期処理や配列操作群です。

## 1. 配列の高階関数 (実務で `for` 文は禁止レベル)

ReactのJSX内やデータの加工において、従来の `for (let i = 0...)` は可読性とスコープの観点からアンチパターンとされます。以下のメソッド群を使います。

### map() : 全要素の変換（React描画の要）

```javascript
const users = [{id: 1, name: "Taro"}, {id: 2, name: "Jiro"}];
// 要素を別の形に生まれ変わらせた新しい配列を作る
const userNames = users.map(user => user.name);
```

### filter() : 条件に合うものだけ抽出

```javascript
// isActive が true のものだけ残した新しい配列
const activeUsers = users.filter(user => user.isActive);
```

### find() と some() : 単一要素の検索と真偽値

```javascript
// idが1の最初のユーザーオブジェクトを返す
const taro = users.find(user => user.id === 1);

// 配列の中に「未成年のユーザー」が1人でもいるか true/false で返す
const hasMinor = users.some(user => user.age < 20);
```

## 2. 非同期処理 (async / await)

API通信を行う際などの、歴史あるJS最大の難所の最終回答です。
`.then()` によるコールバック地獄はアンチパターンです。必ず `async/await` で同期的に書きます。

```javascript
// 非同期関数には必ず async をつける
async function fetchUserData(userId) {
  try {
    // 通信が終わるまで await で処理を「待つ」
    const response = await fetch(`https://api.example.com/users/${userId}`);
    
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    
    // JSONのパース（これも非同期）を待つ
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}
```

## 3. 分割代入 (Destructuring) と スプレッド構文 (...)

ReactのProps受け取りや、ReduxのState更新で常に使う文法です。

```javascript
// --- オブジェクトの分割代入 ---
const user = { id: 1, name: "Taro", age: 25 };
// 中身を同名の変数に直接取り出す
const { name, age } = user; 

// --- スプレッド構文 (...) ---
// 配列のコピーと結合
const arr1 = [1, 2];
const arr2 = [...arr1, 3, 4]; // [1, 2, 3, 4]

// Stateの不変性(Immutability)を保ったオブジェクトの更新
const updatedUser = { ...user, age: 26 }; // 全コピーしつつageだけ上書き
```

## 4. Null安全とオプショナルチェーン (?.)

APIから返ってきたオブジェクトの中身が空（undefined）でエラーになるのを防ぐ、モダンJS必須の演算子です。

```javascript
// user や profile が null/undefined なら、エラーで落ちずに undefined を返す
const zipCode = user?.profile?.address?.zipCode;

// Nullish Coalescing (??) : undefinedかnullの場合のみ右の初期値を使う
const displayName = user?.name ?? "No Name";
```
