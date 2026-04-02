# 03. 制御構文と強力な例外処理

Javaの制御構文そのものは、JavaScript等のC言語系と非常に似ています。

## 1. 条件分岐 (if, switch)

### if文

```java
int score = 85;

if (score >= 80) {
    System.out.println("合格"); // Console.log相当
} else if (score >= 60) {
    System.out.println("再テスト");
} else {
    System.out.println("不合格");
}
```

### switch文

```java
String rank = "A";

switch (rank) {
    case "S":
    case "A":
        System.out.println("Excellent");
        break; // JS同様にbreakを忘れるとフォールスルーする
    default:
        System.out.println("Normal");
}
```

## 2. 繰り返し処理 (for, while)

### 基本の for ループ

```java
for (int i = 0; i < 5; i++) {
    System.out.println(i);
}
```

### 拡張 for ループ (JSの for...of に相当)

配列やコレクションの中身を順番に取り出す際に多用されます。

```java
int[] numbers = {10, 20, 30};

for (int num : numbers) {
    System.out.println(num);
}
```

## 3. 厳格な例外処理 (try-catch)

Javaの最大の特徴として、例外（エラー）に対する「検査例外 (Checked Exception)」の仕組みがあります。

「この処理はエラーになる可能性があるから、**絶対に** try-catch で囲むか、呼び出し元にエラーを投げる(throws)宣言をしろ」と、コンパイラが強制してきます。（これがないと言語が動かないため、非常に安全なシステムになります）

```java
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

public class ExceptionExample {
    public static void main(String[] args) {
        
        // ファイルを読み込む処理は失敗(IOException)する可能性があるので、
        // try-catchで囲まないとコンパイルエラーになる
        try {
            File file = new File("nonexistent.txt");
            FileReader fr = new FileReader(file);
        } catch (IOException e) {
            System.out.println("ファイルを読み込めませんでした");
            e.printStackTrace();
        } finally {
            // 成功しても失敗しても必ず実行される処理（リソースの解放など）
            System.out.println("処理終了");
        }
    }
}
```
