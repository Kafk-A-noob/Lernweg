# 02. VBAの文法・変数・データ型

VBAは静的型付けの世界を持っています。JS/Pythonのようなゆるい変数管理ではなく、厳格に型を宣言する文化があります。

## 1. 変数の宣言 (Dim)

VBAでは `Dim` (Dimensionの略) を使って変数を宣言します。JSの `let` や `const` に相当しますが、同時に型（データタイプ）を指定するのが基本です。

```vb
' JavaScript: let userName = "John";
Dim userName As String
userName = "John"

' JavaScript: let userAge = 25;
Dim userAge As Integer
userAge = 25
```

### Option Explicit の重要性

JSにおける `'use strict'` と同様、VBAにはモジュールの先頭に `Option Explicit` を記述するルールがあります。これを書くことで「Dimで宣言されていない変数の使用」をコンパイルエラーとして弾くことができ、タイポによるバグを未然に防ぎます。

## 2. 代表的なデータ型

- `Integer` : 整数（-32,768 ～ 32,767）※現代のPCでは `Long` を使うのが一般的。
- `Long` : 長整数（JSのNumberの整数部分に近い）。行番号などを扱う際によく使います。
- `String` : 文字列。
- `Boolean` : 真偽値 (`True` または `False`)。
- `Variant` : 何でも入る型（JSの `let` のような動的型）。非常に便利ですが処理速度が落ち、バグの温床になりやすいため特別な理由がない限り避けるのが「VBAのお作法」です。
- `Object` : ワークシートやセル（Range）などのオブジェクトを突っ込むための型。オブジェクトを代入する際は `Set` キーワードが必須長です。

## 3. 代入のルール (Set句)

プリミティブ型（文字列や数値）と、オブジェクト型（セルやシート）で代入の文法が異なります。

```vb
' プリミティブ型はそのまま代入（Letが省略されている）
Dim msg As String
msg = "Hello World"

' オブジェクト型は「Set」が必須（この仕様で躓く人が多いです）
Dim targetSheet As Worksheet
Set targetSheet = ThisWorkbook.Worksheets("Sheet1")
```
