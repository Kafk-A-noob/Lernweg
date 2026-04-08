# 99. FastAPI 頻出メソッド・必須スニペット大全

Next.jsなどのフロントエンドからAPI叩かれることを前提とした、FastAPIの超実践的かつ頻出のスニペット集です。

## 1. 最小構成のAPIと非同期処理

5行でAPIサーバーが立ち上がる、Flaskと似て非なる基本形です。重い処理（DBアクセスや外部API通信）がある場合は必ず `async def` を使います。

```python
from fastapi import FastAPI

app = FastAPI()

# URLパラメーターを受け取る例（/users/25 等）
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    # 型がintと指定されているため、文字を送られると勝手に 422 Validation Error で弾いてくれる
    return {"user_id": user_id, "status": "active"}
```

## 2. Pydanticモデルを用いたPOSTの受け取り

フロントエンドからJSONという「文字列」で送られてくるデータを、安全で便利な「オブジェクト」に変換（パース）させます。

```python
from fastapi import FastAPI
from pydantic import BaseModel, Field

# 受け取るJSONの型をガチガチに定義する
class ItemCreateRequest(BaseModel):
    name: str = Field(..., title="商品名", max_length=50)
    price: int = Field(..., title="価格", gt=0) # 0より大きくないとエラー
    description: str | None = None # 省略可能な文字列 (Python 3.10+)

@app.post("/items/")
async def create_item(item: ItemCreateRequest):
    # item.name や item.price でエディタの補完が効いた状態でアクセスできる
    total_price = item.price * 1.1  # 消費税計算
    return {"message": "登録完了", "item_name": item.name, "total": total_price}
```

## 3. CORS (Cross-Origin Resource Sharing) の許可

実務で「一番最初につまずく罠」の設定です。React(localhost:3000)からFastAPI(localhost:8000)にAPIを投げると、ポートが違うためブラウザのセキュリティにブロック（CORSエラー）されます。これを許可する絶対不可欠な設定です。

```python
from fastapi.middleware.cors import CORSMiddleware

# ... app定義直後 ...

# 許可するフロントエンドのURLリスト (本番環境では '*' は絶対に使わない)
origins = [
    "http://localhost:3000",
    "https://my-frontend-app.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # GET, POST, OPTIONS 等すべて許可
    allow_headers=["*"],
)
```

## 4. トラブルシューティング（よくあるエラー）

- **Q. サーバーを立ち上げようとしたら `ImportError: cannot import name 'FastAPI'`**
  - **A.** そもそもインストールされていません。また、サーバーを動かすためにはFastAPI本体だけでなく、`uvicorn` というASGIサーバーが必要です。`pip install fastapi uvicorn` を実行し、`uvicorn main:app --reload` で起動してください。
- **Q. フロントからPOSTしたら `422 Unprocessable Entity` が返ってくる**
  - **A.** Pydanticで定義した型（ルール）に違反したデータが送られてきています。FastAPIの自動生成ドキュメント（`http://localhost:8000/docs`）を開けば、「何行目のどのデータが原因で弾かれたか」が一目瞭然で確認できます。
