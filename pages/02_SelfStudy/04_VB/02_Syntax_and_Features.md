# 02. VB.NETの文法と型の扱い

VBAと文法の基礎は同じですが、Visual Basic 2005以降（VB.NET）は完全なオブジェクト指向言語として進化し、型の扱いも最新のC#と遜色ないほどに厳格かつモダンになりました。

## 1. 変数の宣言と型推論

VBAでは `Dim` キーワードと `As` で型を指定していましたが、VB.NETでは型推論機能が強化されています。

```vb
' 旧来の厳格な記述（VBAと同じ）
Dim userName As String = "Alice"

' 型推論を用いたモダンな記述（JSの let や Javaの var に近い）
Dim age = 25 ' 右辺から勝手にIntegerだと推論される
```

## 2. 厳格な型の比較と変換 (Option Strict)

VB.NETにおけるベストプラクティスは、プロジェクトの設定で `Option Strict On` を有効にしておくことです。これを有効にすると、「暗黙的な型のキャスト（自動変換）」が禁止され、バグを未然に防ぐことができます。

```vb
' 文字列の "10" を整数の変数にいきなり押し込む
Dim numStr As String = "10"
' Dim count As Integer = numStr ' Option Strict Onだと怒られる

' 明示的なキャスト（変換）が必要
Dim count As Integer = Integer.Parse(numStr)  ' もしくは CInt(numStr)
```

## 3. クラスとプロパティ

完全なオブジェクト指向言語であるため、クラスの定義がJava並みにしっかりしています。
特に、クラスのデータにアクセスするための「プロパティ」という概念はVB.NET（およびC#などの.NET言語）特有の強力な機能です。

```vb
Public Class User
    ' 自動実装プロパティ（裏側の面倒なPrivate変数定義を省略できる）
    Public Property Name As String
    Public Property Age As Integer
    
    ' コンストラクタ（Newキーワードで呼ばれる）
    Public Sub New(name As String, age As Integer)
        Me.Name = name ' Me はJSの this に相当
        Me.Age = age
    End Sub
    
    ' メソッド
    Public Sub Introduce()
        Console.WriteLine($"私の名前は {Me.Name} です。") ' テンプレートリテラル相当の $文字列
    End Sub
End Class
```
