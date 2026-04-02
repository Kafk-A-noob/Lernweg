# 05. コレクションとモダンな記法

配列(`[]`)はサイズを後から変更できないため、実際の開発ではほぼ「コレクション(ListやMap)」が使われます。JavaScriptの配列（`Array`）やオブジェクト（`Object`）に相当する機能を持ちます。

## 1. List (リスト型 / JSのArray)

最も一般的な「順序を保持した可変長のデータ群」です。インターフェースである `List` 型で宣言し、汎用的な実装である `ArrayList` で初期化するのが主流です。

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        // Generics(ジェネリクス: <>) で中身の型をStringに制限する
        List<String> userNames = new ArrayList<>();
        
        userNames.add("Alice");
        userNames.add("Bob");
        
        // JSの userNames.length ではなく .size() を使う
        System.out.println(userNames.size()); // -> 2
        
        // JSの userNames[0] ではなく .get() を使う
        System.out.println(userNames.get(0)); // -> Alice
    }
}
```

## 2. Map (マップ型 / JSのObject・連想配列)

キー(Key)と値(Value)のペアでデータを格納します。

```java
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        // キーがString、値がIntegerのMapを生成
        Map<String, Integer> scores = new HashMap<>();
        
        // 追加
        scores.put("Alice", 95);
        scores.put("Bob", 80);
        
        // 取得
        System.out.println(scores.get("Alice")); // -> 95
    }
}
```

## 3. Stream API (Java 8以降のモダンな書き方)

JavaScriptにおける配列の `.map` や `.filter` のような**関数型プログラミング**的なデータ処理が、Javaでも `Stream API` を使うことで可能になりました。（昔はすべてforループで回して処理していました）

```java
import java.util.Arrays;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David");
        
        // "C" から始まる名前だけをフィルターし、大文字に変換して出力する
        names.stream()
             .filter(name -> name.startsWith("C")) // JSのアロー関数 `=>` はJavaでは `->`
             .map(String::toUpperCase)             // メソッド参照
             .forEach(System.out::println);        // -> CHARLIE
    }
}
```

昔からあるJava言語ですが、Stream APIの登場により、モダンなWebフロントエンド技術（TypeScript/React）の思想と非常に相性の良い（同じ思想でロジックが書ける）言語へと進化しています。
