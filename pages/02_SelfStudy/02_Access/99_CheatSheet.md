# 99. Access 頻出メソッド・必須スニペット大全

データベースアプリケーション開発において、Access（VBA）で頻繁に使用されるスニペットや必須の知識をまとめました。

## 1. データベース操作 (DAO / ADO)

Access内部のテーブルを直接操作する場合、基本的に「DAO (Data Access Objects)」が推奨されます（外部DBへの接続はADOを使うこともあります）。

### レコードセットのループ処理（最もよく使う）

テーブルやクエリのデータを1行ずつ処理していく王道のスニペットです。

```vba
Dim db As DAO.Database
Dim rs As DAO.Recordset

Set db = CurrentDb()
' テーブルまたはクエリを開く
Set rs = db.OpenRecordset("T_Sales", dbOpenDynaset)

If Not rs.EOF Then
    rs.MoveFirst
    Do Until rs.EOF
        ' 値の取得・更新
        rs.Edit
        rs!TotalPrice = rs!Price * rs!Quantity
        rs.Update
        
        ' 次のレコードへ
        rs.MoveNext
    Loop
End If

' メモリ解放（必須）
rs.Close
Set rs = Nothing
Set db = Nothing
```

## 2. SQLの直接実行

更新クエリ（UPDATE）や追加クエリ（INSERT）、削除クエリ（DELETE）をVBAから直接叩く方法です。

```vba
Dim strSQL As String
Dim strUserId As String

strUserId = "A001"

' 変数をSQLに組み込む場合はシングルクォートに注意
strSQL = "DELETE FROM T_Users WHERE UserID = '" & strUserId & "';"

' 警告メッセージ（「1行削除しますか？」等）を一時的に消す
DoCmd.SetWarnings False

' SQLの実行
DoCmd.RunSQL strSQL
' または CurrentDb.Execute strSQL, dbFailOnError (こちらがより安全で高速)

DoCmd.SetWarnings True
```

## 3. フォーム・コントロール操作

画面（フォーム）上のデータを取得したり、別のフォームを開いたりする操作です。

### 基本的なフォーム起動

```vba
' フォームを開く
DoCmd.OpenForm "F_EmployeeDetails"

' 特定の条件（例：IDが一致するもの）だけをフィルターして開く
DoCmd.OpenForm "F_EmployeeDetails", , , "EmployeeID = 105"

' フォームを閉じる
DoCmd.Close acForm, "F_EmployeeList", acSaveNo
```

### 他のフォームのコントロールの値を参照する

```vba
' 開いている別フォームのテキストボックスの値を取得
Dim empName As String
empName = Forms!F_EmployeeList!txtEmpName.Value
```

## 4. トラブルシューティング（Access特有の罠）

- **Q. データベースの容量が勝手に2GBに到達して壊れた！**
  - **A.** Accessはデータを削除しても内部ファイルサイズが減りません。「データベースの最適化/修復（Compact and Repair）」を定期的に実行するか、VBAで終了時に自動実行する設定が必要です。
- **Q. クエリが遅すぎる！**
  - **A.** 検索条件にしているフィールドに「インデックス」が張られていないか、`DLookup` 関数をループの中で連打している（N+1問題と同じ現象）のが原因です。`DLookup` の多用は避け、クエリのJOINで解決してください。
