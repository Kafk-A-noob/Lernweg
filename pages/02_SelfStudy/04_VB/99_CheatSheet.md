# 99. Visual Basic(VB.NET) 頻出メソッド・必須スニペット大全

WindowsのGUIアプリケーション（Windows Forms 等）において、VB.NET等で頻出するイベントハンドリングや文字列処理の基本操作です。

## 1. 文字列処理と型変換

VB特有のゆるやかな型変換（自動キャスト）の罠を避け、厳格に扱うためのメソッドです。

```vb
Dim strNumber As String = "123"
Dim result As Integer

' 文字列を数値に変換（TryParseを使うのが最も安全）
If Integer.TryParse(strNumber, result) Then
    MsgBox("変換成功: " & (result * 2))
Else
    MsgBox("数値に変換できませんでした。")
End If

' 文字列の連結 (& または String.Format)
Dim msg As String = String.Format("計算結果は {0} です。", result)
```

## 2. フォームとイベント

ボタンクリック時の処理など、GUI開発の根幹となるスニペットです。

### ボタンが押された時の処理（Event Handler）

```vb
Private Sub btnSubmit_Click(sender As Object, e As EventArgs) Handles btnSubmit.Click
    ' テキストボックスの値を取得
    Dim input = txtName.Text
    
    If String.IsNullOrWhiteSpace(input) Then
        MessageBox.Show("名前を入力してください。", "エラー", MessageBoxButtons.OK, MessageBoxIcon.Warning)
        Exit Sub ' 処理の中断
    End If
    
    ' ラベルに反映
    lblResult.Text = input & " さん、こんにちは！"
End Sub
```

## 3. ファイルの読み書き

テキストファイル（ログやCSVなど）を処理するためのモダンなアプローチ（`System.IO` 名前空間）です。

```vb
Imports System.IO

' 丸ごと読み込み
Dim content As String = File.ReadAllText("C:\temp\log.txt")

' 配列として1行ずつ読み込み
Dim lines() As String = File.ReadAllLines("C:\temp\data.csv")
For Each line As String In lines
    Console.WriteLine(line)
Next

' テキストの追記（ログ書き出し用）
File.AppendAllText("C:\temp\log.txt", DateTime.Now.ToString("yyyy/MM/dd HH:mm:ss") & " - アプリ起動" & vbCrLf)
```

## 4. トラブルシューティング（よくあるエラー）

- **Q. クロススレッド操作エラーが発生する (`InvalidOperationException`)**
  - **A.** バックグラウンド処理（非同期処理等）の中から、画面上のラベルやテキストボックスを直接書き換えようとしています。UIを更新できるのはメインUIスレッドだけです。`Invoke` や `BeginInvoke` メソッドを使って、UIスレッドに処理を委譲してください。
- **Q. VBAの癖で `Set` や `Let` を使ってエラーになる**
  - **A.** VB.NET以降は、オブジェクトを代入するための `Set` は廃止されました。単純に `objA = newObjB` と書いてください。
