# 99. Excel VBA 頻出メソッド・必須スニペット大全

実務でVBAを書く際、「これだけは暗記しておくべき」、あるいは「必ずコピペで使い回す」王道のメソッドやスニペットのまとめです。

## 1. ワークブック・ワークシート操作の基本

### 最終行・最終列の取得（最もよく使う）

動的に増減するデータの「一番最後の行」を取得する、VBAにおける絶対的な定石です。

```vba
' A列の最終行を取得
Dim lastRow As Long
lastRow = Cells(Rows.Count, 1).End(xlUp).Row

' 1行目の最終列を取得
Dim lastCol As Long
lastCol = Cells(1, Columns.Count).End(xlToLeft).Column
```

### 別のブックを開いて閉じる

```vba
Dim wb As Workbook
' 画面をちらつかせずに開く
Application.ScreenUpdating = False

Set wb = Workbooks.Open("C:\Data\Sales.xlsx")
' 処理...
MsgBox wb.Sheets(1).Range("A1").Value

' 保存せずに閉じる
wb.Close SaveChanges:=False

Application.ScreenUpdating = True
```

## 2. 実務向け高速化のおまじない

VBAは画面描画や自動計算をその都度行うため、大量のループ処理をするとフリーズします。処理の前後に以下を挟むのがプロの作法です。

```vba
Public Sub OptimizeMacroStart()
    Application.ScreenUpdating = False      ' 画面更新の停止
    Application.Calculation = xlCalculationManual ' 自動計算の手動化
    Application.EnableEvents = False        ' イベント連鎖の停止
End Sub

Public Sub OptimizeMacroEnd()
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    Application.EnableEvents = True
End Sub
```

## 3. 配列を用いた超高速データ処理

セルを1つずつ読み書きする `Cells(i, j).Value` は致命的に遅いです。実務の巨大データ処理では、**「シートを一気に2次元配列に取り込む」**アプローチが必須になります。

```vba
Dim dataArray As Variant
Dim i As Long

' 1. シート全体を一瞬で配列に格納（激速）
dataArray = Range("A1:C10000").Value

' 2. メモリ上で計算処理ループ
For i = LBound(dataArray, 1) To UBound(dataArray, 1)
    ' B列(2)の値を10倍にしてC列(3)に格納
    dataArray(i, 3) = dataArray(i, 2) * 10
Next i

' 3. 配列を一瞬でシートに吐き出す（激速）
Range("A1:C10000").Value = dataArray
```

## 4. トラブルシューティング用：エラーハンドリング

実行時エラーでマクロが止まるのを防ぎ、安全に終了させる構成です。

```vba
Sub SafeExecution()
    On Error GoTo ErrorHandler
    
    ' --- メイン処理 ---
    Dim x As Long
    x = 1 / 0 ' わざとゼロ除算エラー
    ' ------------------
    
    Exit Sub ' 正常終了時はここで抜ける

ErrorHandler:
    MsgBox "予期せぬエラーが発生しました。" & vbCrLf & _
           "エラー番号: " & Err.Number & vbCrLf & _
           "内容: " & Err.Description, vbCritical
    ' エラー後も必ず設定を戻す（前述の高速化のおまじない等）
End Sub
```
