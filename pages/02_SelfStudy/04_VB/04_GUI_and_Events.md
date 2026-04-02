# 04. Windows FormsのGUIとイベント

VB.NETが企業内で長年覇権を握っていた理由であり、現在もC# (WPF/Windows Forms) などで使われ続けている「Windowsアプリケーション開発」のUI部分について解説します。

## 1. 2つのUI技術

Visual Studioを使ってデスクトップアプリを作る際、古くから存在する技術とモダンな技術の2つの選択肢があります。

- **Windows Forms (WinForms)**:
  最も古く、最も直感的な技術です。画面にボタンやテキストボックスの部品をマウスでペタペタと貼り付けて作ります。HTML/CSSの知識が一切なくてもリッチな画面が作れるため、VB.NETでの開発の大半はこれに該当します。
- **WPF (Windows Presentation Foundation)**:
  後発のモダンなGUI技術です。画面設計を「XAML」というXML（HTMLに近いタグベース）で記述します。デザインとロジックを完全に分離できるため、Webのフロントエンド開発に近いパラダイムを持ちます。

## 2. イベント駆動モデル

WinFormsの最大のパラダイムは**「イベント駆動（Event-Driven）」**です。
ロジックは「ボタンが押された」「画面が読み込まれた」というイベントごとに発火します。

```vb
' [保存]ボタン(btnSave)がクリックされた時のイベントハンドラ
Private Sub btnSave_Click(sender As Object, e As EventArgs) Handles btnSave.Click
    ' テキストボックス(txtUserName)の値を取得
    Dim name As String = txtUserName.Text
    
    If String.IsNullOrEmpty(name) Then
        MessageBox.Show("名前を入力してください。")
        Return ' 処理を中断（早期リターン）
    End If
    
    MessageBox.Show($"ようこそ、{name} さん！")
End Sub
```

## 3. Web技術との違いと注意点

### 「状態（State）」の扱い

React等のコンポーネント指向では、State（データ）が変更されれば画面が自動で書き換わります。
しかしWinFormsの世界では、状態は「自分自身でテキストボックスの値をピンポイントで書き換える」必要があります。

```vb
' Webのパラダイム: setName("Taro") とすれば、テキストボックスも勝手にTaroに変わる
' WinFormsのパラダイム: テキストボックスの部品そのものを直接指定して文字を流し込む
txtUserName.Text = "Taro"
```

この違いを理解していないと、複雑な画面を作る際に「どこでUIが更新されるのか」が分からなくなり、スパゲッティコード（いわゆるFat Form問題）を引き起こします。そのため、C#等ではMVVM（Model-View-ViewModel）といった設計パターンが積極的に導入されます。
