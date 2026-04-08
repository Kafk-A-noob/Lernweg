# 99. Database (SQL) 頻出メソッド・必須スニペット大全

実務のバックエンド開発で頻出する、RDB（MySQL / MariaDB等）特有のクエリスニペットやアンチパターンの回避方法のチートシートです。

## 1. データの整合性を守るトランザクション

お金の移動や複数テーブル同時の書き込みなど、途中でエラーが起きたら「すべて無かったことにする」ための必須構文です。

```sql
-- トランザクション開始
START TRANSACTION;

UPDATE Accounts SET balance = balance - 1000 WHERE id = 1;
UPDATE Accounts SET balance = balance + 1000 WHERE id = 2;

-- 両方成功したら確定
COMMIT;
-- エラーが起きたら(プログラム側から)取り消し
-- ROLLBACK;
```

## 2. N+1問題の撲滅 (JOINとIN)

ORM（EloquentやPrisma等）を使っていると気づかずにループの中でクエリを発行し続ける原因になります。必ず一発のクエリでデータを引いてきます。

```sql
-- ❌ アンチパターン (ループの中で何度も発行される)
-- SELECT * FROM Posts WHERE user_id = 1;
-- SELECT * FROM Posts WHERE user_id = 2;

-- ⭕️ ベストプラクティス (JOINを使う)
SELECT Users.name, Posts.title 
FROM Users 
INNER JOIN Posts ON Users.id = Posts.user_id;

-- ⭕️ ベストプラクティス (IN句でまとめて取得)
SELECT * FROM Posts WHERE user_id IN (1, 2, 3, 4, 5);
```

## 3. 実務で多用する高度な集計と条件分岐

### CASE式（SQL内でのIf文）

男女のフラグを文字に変換したり、条件によって集計対象を変える魔法です。

```sql
SELECT 
    name,
    CASE gender
        WHEN 1 THEN '男性'
        WHEN 2 THEN '女性'
        ELSE 'その他'
    END AS gender_text
FROM Users;
```

### GROUP BY と HAVING (グルーピング後の絞り込み)

売上合計が1万円以上のお客さんだけを抽出する時など、`WHERE` だと集計前にフィルターされてしまうケースの解法です。

```sql
SELECT user_id, SUM(price) as total_price
FROM Orders
GROUP BY user_id
HAVING SUM(price) >= 10000;
```

## 4. MySQL管理コマンド

```bash
# MySQLにrootでログインする
mysql -u root -p

# データベース全体のダンプ（バックアップ）を取得する
mysqldump -u root -p mydb > backup.sql

# バックアップしたSQLファイルを流し込んで復元する
mysql -u root -p mydb < backup.sql
```
