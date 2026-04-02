# 04. VBAのプロシージャ (Sub / Function)

VBAにおける処理の塊（メソッドや関数）は、役割に応じて明確に2種類に別れています。JSのように `function` だけで全てをまかなうわけではありません。

## 1. Sub プロシージャ (戻り値を持たない)

`Sub` (Subroutineの略) は、戻り値（返り値）を持たない処理の塊です。
ボタンに登録したり、マクロのショートカットキーから直接実行できるのはこの `Sub` プロシージャのみです。

```vb
Public Sub ExecuteProcess()
    ' 画面を更新しない（高速化のお作法）
    Application.ScreenUpdating = False
    
    Call InitializeData
    
    MsgBox "処理が完了しました"
    Application.ScreenUpdating = True
End Sub
```

## 2. Function プロシージャ (戻り値を持つ)

`Function` は、内部で計算などをした結果を返り値として呼び出し元へ戻す関数です。
JSの `return x;` に相当する処理は、「関数名と同じ変数に値を代入する」という独特の文法で行います。

```vb
' 引数 taxRate を受け取り、Double 型を返す Function
Public Function CalculateTax(price As Double, taxRate As Double) As Double
    Dim result As Double
    result = price * taxRate
    
    ' 戻り値の指定（関数名 = 返したい値）
    CalculateTax = result
End Function
```

## 3. 引数の渡し方 (ByVal / ByRef)

VBAの引数には、値渡し(`ByVal`) と 参照渡し(`ByRef`) の2種類があります。
**VBAは省略すると「参照渡し (ByRef)」になる**という罠があります（他のモダン言語は通常値渡しがデフォルトです）。

そのため、引数を書き換えられたくない場合は明示的に `ByVal` をつけるのが「お作法」です。

```vb
Sub UpdateName(ByVal newName As String)
    ' newName を内部で書き換えても、呼び出し元の変数は影響を受けない
    newName = "Prefix_" & newName
End Sub
```
