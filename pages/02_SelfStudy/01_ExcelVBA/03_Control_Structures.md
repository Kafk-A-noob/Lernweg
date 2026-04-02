# 03. VBAの制御構文とエラートラップ

プログラムの流れを制御する `If` や `For` ループについて解説します。

## 1. 条件分岐 (If / Select Case)

### If 文

VBAのIf文は `Then` と `End If` でブロックを囲みます。（JSの `{}` が `If...End If` に相当します）

```vb
Dim score As Integer
score = 85

If score >= 80 Then
    MsgBox "合格"
ElseIf score >= 60 Then
    MsgBox "再テスト"
Else
    MsgBox "不合格"
End If
```

### Select Case 文 (JSの switch文 に相当)

複雑な条件分岐では `Select Case` が推奨されます。VBAのCaseは `break` を書かなくても次のCaseへはフォールスルーしません。

```vb
Dim rank As String
rank = "A"

Select Case rank
    Case "A"
        MsgBox "Excellent"
    Case "B", "C"    ' カンマ区切りでOR条件が書ける
        MsgBox "Good"
    Case Else
        MsgBox "Try Again"
End Select
```

## 2. 繰り返し処理 (For / Do Loop)

### For Next ループ

配列やコレクションを回すのに特化しています。

```vb
Dim i As Integer
' 1から10まで繰り返す
For i = 1 To 10
    Debug.Print "現在のカウント: " & i
Next i
```

### Do While / Do Until ループ

「特定の条件を満たすまで」回すのに使います。データの最終行までセルを探索する際などによく使われます。

```vb
Dim count As Integer
count = 1

' countが5より小さい間、ループを継続
Do While count < 5
    count = count + 1
Loop
```

## 3. エラートラップ (Error Handling)

VBAには JS の `try...catch` のようなモダンな例外処理構文はありません。代わりに `On Error Goto` を使った少し古いパラダイムが存在します。

```vb
Sub TryCatchExample()
    ' JSの tryブロック開始 に相当
    On Error GoTo ErrorHandler
    
    Dim x As Integer
    x = 10 / 0 ' ゼロ除算で意図的にエラー発生
    
    ' 正常終了時はエラー処理ブロックに入らないよう関数を抜ける
    Exit Sub
    
ErrorHandler:
    ' JSの catchブロック に相当
    MsgBox "エラーが発生しました: " & Err.Description
    ' 必要に応じて後処理を記述する
End Sub
```
