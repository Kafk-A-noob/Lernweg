# 05. Excelオブジェクト(DOM)の操作

VBAのもっとも強力な部分は、ExcelというUIレイヤー（WebでいうDOM）に対する直接的なAPI制御ができる点です。

## 1. オブジェクト階層構造

Excelのオブジェクトは、以下のような親子の階層構造を持っています。

1. `Application` (Excelアプリ自体)
2. `Workbook` (ファイル)
3. `Worksheet` (シート)
4. `Range` (セル)

JSの `document.getElementById("target").innerText` と同様に、VBAでもこの階層をたどって操作を行います。

```vb
' "Book1.xlsx" というファイルの、"Sheet1" というシートの "A1" セルに値を直接注入する
Application.Workbooks("Book1.xlsx").Worksheets("Sheet1").Range("A1").Value = "Hello"
```

実務では、いちいち `Application` から書くのは冗長なので、自身が書かれているファイルを示す `ThisWorkbook` などを起点とします。

## 2. Workbook / Worksheet オブジェクト

複数のファイルやシートをまたぐ処理では、変数（オブジェクト型）にシートを割り当てて操作します。（これにより、どのシートを操作しているかのバグを防ぎます）

```vb
Dim wb As Workbook
Dim ws As Worksheet

' 現在開いているこのファイルを変数に入れる
Set wb = ThisWorkbook
' そのファイル内の「売上データ」シートを変数に入れる
Set ws = wb.Worksheets("売上データ")

' 変数を使ってセルを操作する
ws.Range("B2").Value = 1000
```

## 3. Range と Cells (セルの操作)

特定のセルを指定するには `Range` と `Cells` の2通りのメソッドがあります。

### Range (A1形式)

直感的に文字列でセルを指定します。固定のセルを操作する際に適しています。

```vb
ws.Range("A1:C10").Interior.Color = vbYellow ' 背景色を黄色にする
```

### Cells (行・列座標形式)

`Cells(行番号, 列番号)` で指定します。Forループなどで「行番号を変数で回す」際によく利用されます。

```vb
Dim rowNum As Integer
For rowNum = 1 To 10
    ' 1行目から10行目の、1列目(A列)に値を書き込む
    ws.Cells(rowNum, 1).Value = "テストデータ-" & rowNum
Next rowNum
```

## 4. 最終行の取得 (VBA特有のイディオム)

WebのAPIでは「配列の `.length`」でデータ数を取得できますが、Excelの場合は「人間がどこまで文字を入力したか」を判定するために、下から上へ探索して最終行を取得する独特のイディオムが使われます。

```vb
Dim lastRow As Long
' A列の一番下（1048576行目）から上にジャンプ(Ctrl+↑)した先の行番号を取得
lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

MsgBox "データは " & lastRow & " 行目まで入っています。"
```
