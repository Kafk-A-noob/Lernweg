# 04. マクロビルダーとVBAの連携

Accessには、VBAという強力な言語の他に、「マクロビルダー」というノーコード/ローコードツールが標準搭載されています。（Excelの「マクロの記録」とは概念が異なります）。

## 1. マクロビルダーとは？

よくある処理（「別のフォームを開く」「クエリを実行する」「エラーメッセージを出す」等）を、プルダウンメニューから選んでブロックを繋げるように組み立てるビルダー画面です。

**設計の鉄則**:
すべてをVBA（コード）で書くのではなく、まずはAccess標準である「マクロビルダー」で済ませられるか？を考えるのが、レガシーを増産しない保守性の高い設計です。

## 2. DoCmd オブジェクト

マクロビルダーで選べるGUI操作の数々を、あえて「VBAのコードから呼び出す」ための特別なオブジェクトが `DoCmd`（ドゥコマンド）です。

### 別のフォーム（画面）を開く

React Routerの `router.push("/next-page")` のような画面遷移です。

```vb
' "frmDetails" という名前のフォームを開く
DoCmd.OpenForm "frmDetails"
```

### レポート（帳票・PDF）をプレビューする

```vb
' "rptInvoice" を印刷プレビューモードで開く
DoCmd.OpenReport "rptInvoice", acViewPreview
```

### アクションクエリをコードから直接実行する

SQLを手書きせずとも、事前に作成済みのクエリを呼び出すことができます。

```vb
' 確認の警告ダイアログ（〜件更新されますがよろしいですか？）をあえて非表示にする
DoCmd.SetWarnings False

' "qryUpdateStock" という名前の更新クエリを実行する
DoCmd.OpenQuery "qryUpdateStock"

' 警告ダイアログの設定を元に戻す
DoCmd.SetWarnings True
```

## 3. SQLの直打ち (RunSQL)

時には、事前にクエリを作成しておくのではなく、VBAのコードの中で動的に文字列として結合したSQL文をそのまま発行（実行）したい場面があります。

```vb
Dim sqlString As String
Dim targetID As Integer

targetID = 105
' 変数を埋め込んだSQL文字列を生成
sqlString = "UPDATE Users SET Status = 'Inactive' WHERE ID = " & targetID

' SQLを直接Accessバックエンドに送信して実行
DoCmd.RunSQL sqlString
```

※SQL文字列に変数を結合する際、文字列型のカラムへ代入する場合は `'` (シングルクォート)で囲むなどの自前でのエスケープ処理が必要になるため、SQLインジェクションのリスクを考慮した設計が求められます。
