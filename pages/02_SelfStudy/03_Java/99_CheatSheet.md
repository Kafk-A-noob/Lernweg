# 99. Java 頻出メソッド・必須スニペット大全

バックエンド開発やシステム刷新でよく使われるJavaの頻出スニペットと、歴史ある言語特有の「お作法」チートシートです。

## 1. 文字列比較の罠 (equals)

Javaにおける絶対的な超頻出アンチパターンの回避です。

```java
String a = new String("Hello");
String b = new String("Hello");

// ❌ 参照（メモリ番地）の比較になってしまい、falseになる
if (a == b) { ... }

// ⭕️ 値そのものの比較（絶対にこれを使うこと）
if (a.equals(b)) { ... }
```

## 2. コレクション (List, Map) の基本操作

配列（`String[]`等）よりも圧倒的に多く使用される、動的配列などのコレクション操作です。

### List (ArrayList)

```java
// 定石の宣言（インターフェースで受ける）
List<String> list = new ArrayList<>();
list.add("Apple");
list.add("Banana");

// ループ処理（拡張for文）
for (String item : list) {
    System.out.println(item);
}
```

### Map (HashMap / 連想配列・辞書)

```java
Map<String, Integer> map = new HashMap<>();
map.put("Taro", 25);
map.put("Hanako", 22);

// 値の取得
int age = map.get("Taro");

// キーの存在確認（非常に重要）
if (map.containsKey("Jiro")) {
    System.out.println("Jiro is present.");
}
```

## 3. 例外処理（try-catch-finally と try-with-resources）

Javaはエラー処理をサボることを一切許しません（チェック例外）。

### モダンなリソース解放 (Java 7+)

ファイルやDB接続など、**「開いたら必ず閉じる」**必要があるものは、`try()` の括弧の中に書くことで `finally` ブロックでの `.close()` を省略できます。

```java
// try-with-resources文
try (BufferedReader br = new BufferedReader(new FileReader("data.txt"))) {
    String line;
    while ((line = br.readLine()) != null) {
        System.out.println(line);
    }
} catch (IOException e) {
    // 例外発生時のロギングと処理
    e.printStackTrace();
}
```

## 4. トラブルシューティング（よくあるエラー）

- **Q. `NullPointerException (NPO)` が頻発する**
  - **A.** Java最大の敵です。オブジェクトを初期化（`new`）する前にメソッドを呼び出したり、メソッドの戻り値が `null` だったのにそのまま使おうとしています。Java 8以降であれば `Optional` クラスを使ってラップするか、事前に `if (obj != null)` でガード節を作ってください。
- **Q. `Exception in thread "main" java.lang.ArrayIndexOutOfBoundsException`**
  - **A.** 配列の要素数を超えてアクセスしようとしています。Javaの配列は0番目から始まるため、要素数が5の配列に対して `array[5]` にアクセスするとこのエラーが出ます。ループ条件が `<= array.length` になっていないか（正しくは `< array.length`）確認してください。
