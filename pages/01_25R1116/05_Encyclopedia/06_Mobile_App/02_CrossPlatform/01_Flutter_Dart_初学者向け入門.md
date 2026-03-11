# Flutter (Dart) 初学者向け入門・逆引き辞典

近年、モバイルアプリ (およびWebアプリ・デスクトップアプリ) の受託開発において圧倒的な第一選択肢となっているGoogle製フレームワークFlutter (フラッター)について、Reactの知識を持つ視点から概念を翻訳して解説する。

---

## 1. 概念の翻訳 (Flutter と React)

- **Flutter公式リファレンス**: [Flutter documentation](https://docs.flutter.dev/)
- **Dart公式リファレンス**: [Dart programming language](https://dart.dev/)

Flutterは、Reactから多大なインスピレーションを受けて設計されている。そのため、用語さえマッピングできれば、Reactを学んだエンジニアにとってFlutterのキャッチアップは非常に容易である。

| 概念                   | これまでの知識 (React)          | Flutterでの名称             |
| :--------------------- | :------------------------------ | :-------------------------- |
| **言語**               | JavaScript (TS)                 | **`Dart` (ダート)**         |
| **画面の部品**         | Component (コンポーネント)      | **`Widget` (ウィジェット)** |
| **不変な部品**         | 関数コンポーネント              | **`StatelessWidget`**       |
| **状態を持つ部品**     | `useState` を使うコンポーネント | **`StatefulWidget`**        |
| **状態管理ライブラリ** | Redux, Zustand                  | **Riverpod, Provider** 等   |
| **再描画の命令**       | `setCount(...)` (Stateの更新)   | **`setState(...)`**         |

### Everything is a Widget (すべてはウィジェットである)

Flutter最大の特徴は、ボタンテキストといった目に見える部品だけでなく、中央に寄せる (Center) 余白を開ける (Padding) といった**『レイアウトや修飾の命令』すらもすべて一つのWidget (クラス) として扱う**という点である。

※Reactでは `div` にスタイル (CSS) を当ててレイアウトを作るが、Flutterは`Center` という箱の中に `Text` を入れるというマトリョーシカ構造で画面を作る。

---

## 2. 実装イメージの比較 (React vs Flutter)

ボタンを押すと数字が増えるカウンターアプリで、両者のComponentのツリー構造とWidgetのツリー構造が同じ思想であることを確認する。

### ⚛️ React の場合 (TSX)

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div>
        <p>You clicked {count} times</p>
        <button onClick={() => setCount(count + 1)}>Click me</button>
      </div>
    </div>
  );
}
```

### 🦋 Flutter の場合 (Dart)

※見た目は波括弧とカンマのオバケだが、構造は完全にReactのタグの入れ子と同じである。

```dart
class Counter extends StatefulWidget {
  @override
  _CounterState createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int _count = 0; // Stateに相当

  @override
  Widget build(BuildContext context) {
    return Center(  // div (justifyContent: center) に相当
      child: Column( // div (縦並び) に相当
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('You clicked $_count times'), // p に相当
          ElevatedButton( // button に相当
            onPressed: () {
              // setCount() に相当。これを呼ぶと再レンダリング(build)が走る
              setState(() {
                _count++;
              });
            },
            child: Text('Click me'),
          ),
        ],
      ),
    );
  }
}
```

---

## 3. Webエンジニアのためのレイアウト翻訳 (CSSからFlutterへ)

Web開発者がFlutterを触る際に一番戸惑うのが、CSSが存在しないことである。すべてのレイアウト (Flexbox等) はWidgetの組み合わせで表現する。

- **縦並び / 横並び (Flexbox)**: `display: flex; flex-direction: column` は **`Column`** ウィジェット。`flex-direction: row` は **`Row`** ウィジェットとして表現する。
- **重ね合わせ (Absolute Position)**: CSSの `position: absolute` に相当する重ね合わせ表現は、**`Stack`** ウィジェットの中に部品を並べることで実現する。
- **余白 (Margin / Padding)**: CSSを使わず、**`Padding`** という名前の箱ウィジェットで対象を包み込む。

---

## 4. なぜ受託開発で Flutter が選ばれるのか？

1. **マルチプラットフォーム**: iPad, iPhone, Android, Webブラウザ, Windows, Mac... 全く同じ1つのソースコードから、全てのOS向けのアプリを一瞬で出力 (コンパイル) できる。
2. **圧倒的な開発スピード (Skia/Impeller)**: React Native (JSからOS標準の部品を呼び出して描画する) と異なり、Flutterは内部にゲームエンジンのような描画エンジンを持っており、スマホの画面 (キャンバス) に直接ピクセルを描画する。そのため、古いAndroid端末から最新のiPhoneまで、**絶対にOSによる見た目の崩れが発生しない**という絶大な信頼を作ることができる。
3. **Hot Reload (ホットリロード)**: コードを保存した瞬間に、アプリの画面・状態が0.5秒で更新され、爆速でUI開発を進めることができる。
4. **Dart言語の優秀さ**: TS以上に強力な型システムと、Swift/Kotlin由来の**Null安全 (Null Safety)**を最初から備えており、実行時のクラッシュを防ぎやすい。

これらの強力なメリットにより、限られた予算と短い期間で、高品質なiPhone/Android両対応アプリを作って欲しいという受託開発の現場において、現在最強のツールとなっているのである。
