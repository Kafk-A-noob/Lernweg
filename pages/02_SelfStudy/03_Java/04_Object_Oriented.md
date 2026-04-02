# 04. オブジェクト指向 (クラスと継承)

Javaは完全なオブジェクト指向言語です。プログラムの全てを「クラス」という設計図として定義し、そこから「インスタンス（実体）」を生み出して操作します。

## 1. クラスの基本構造

オブジェクト指向の「カプセル化（データの隠蔽）」の原則により、クラスの内部データ（フィールド）と、それを操作する関数（メソッド）を一緒に定義します。

```java
public class User {
    // フィールド（クラス変数のデータ）。
    // 外部から直接書き換えられないよう「private」にする
    private String name;
    private int age;

    // コンストラクタ（インスタンスを生み出す時に実行される初期化処理）
    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // メソッド
    public void introduce() {
        System.out.println("私の名前は " + this.name + " です。");
    }

    // ゲッター (外部から安全にデータを読み取るためのメソッド)
    public String getName() {
        return this.name;
    }
}
```

使う側（メイン処理）：

```java
public class Main {
    public static void main(String[] args) {
        // 設計図(Userクラス) から new でインスタンス(実体) を生成
        User alice = new User("Alice", 25);
        
        // メソッドを呼び出す
        alice.introduce();
        
        // System.out.println(alice.name); 
        // -> フィールドは private なので直接値は見れずコンパイルエラーになる
    }
}
```

## 2. 継承 (Inheritance)

既存のクラスの機能を受け継いで、新しいクラスを作る仕組みです。再利用性（DRY原則）を高めます。

```java
// Userクラスを継承した「AdminUser (管理者)」クラスを作る
public class AdminUser extends User {
    
    public AdminUser(String name, int age) {
        super(name, age); // 親クラスのコンストラクタを呼び出す
    }

    public void banUser(User target) {
        System.out.println(this.getName() + " は、対象者をBANしました。");
    }
}
```

## 3. インターフェース (Interface)

「継承」が実装を受け継ぐのに対し、インターフェースは**「メソッドのルール（契約）」**だけを定義する機能です。TypeScriptの `interface` と完全に同一の概念です。

「このインターフェースを実装(`implements`)するなら、必ずこれらのメソッドの定義が存在しなければならない」と強制させることができます。複数人での開発や、Spring BootにおけるDI（依存性の注入）の根幹をなす非常に重要な考え方です。
