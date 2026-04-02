# 03. 制御構文とLINQ

VB.NETの制御構文はVBAとほぼ同じです。しかし、データの加工・抽出に関しては、.NET環境特有のスーパーパワーである「LINQ」が存在します。

## 1. 基本の制御構文のおさらい

### 条件分岐 (If / Select Case)

```vb
Dim score = 85

If score >= 80 Then
    Console.WriteLine("合格")
ElseIf score >= 60 Then
    Console.WriteLine("再テスト")
Else
    Console.WriteLine("不合格")
End If
```

### 繰り返し処理 (For / For Each)

VBAと全く同じ感覚で書けます。JSの `for...of` に当たるのが `For Each` です。

```vb
Dim names As New List(Of String) From {"Alice", "Bob", "Charlie"}

For Each name As String In names
    Console.WriteLine(name)
Next
```

## 2. LINQ (Language Integrated Query)

LINQは、VB.NETのコードの中に「SQLのような検索クエリ」を直接埋め込むことができる、.NET固有の革命的な機能です。
配列やコレクション（リスト）、さらにはデータベースのテーブルに対しても、全く同じ文法でデータ加工ができます。（JavaScriptの `.filter()` や `.map()` 以上の表現力があります）

### 例：名前の中に "A" が含まれる人のみ抽出し、大文字に変換する

```vb
Dim names As New List(Of String) From {"Alice", "Bob", "Charlie", "David"}

' クエリ構文（SQLに似た形式）
Dim filteredNames = From n In names
                    Where n.Contains("A")
                    Select n.ToUpper()

For Each fn In filteredNames
    Console.WriteLine(fn) ' ALICE が出力される
Next
```

### メソッド構文 (ラムダ式)

JSのArrayメソッドや、JavaのStream APIとほぼ同じ書き方（モダンなアプローチ）も可能です。
VB.NETでのアロー関数(`=>`)に相当するのは `Function(n)` です。

```vb
' メソッド構文での記述（上記のクエリ構文と完全に等価）
Dim filteredNames2 = names.Where(Function(n) n.Contains("A")).Select(Function(n) n.ToUpper())
```

LINQを使いこなすことで、従来の「無駄なForループ」を激減させ、可読性を大幅に（Vue.jsやReactのような宣言的UIのレベルに）引き上げることができます。
