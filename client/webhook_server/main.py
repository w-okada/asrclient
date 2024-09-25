from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict
import fire

import uvicorn


class WebhookPayload(BaseModel):
    data: Dict


def start(port: int):

    app = FastAPI()

    @app.post("/webhook")
    async def handle_webhook(payload: WebhookPayload):
        try:
            # Payloadデータを処理します
            print(f"Received webhook data: {payload.data}")
            # 必要に応じてここでさらに処理を追加
            return {"status": "success", "detail": "Webhook received and processed"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")


def webhook_server(port: int = 8080):

    print("Starting webhook server...")
    print("press ctrl+c to stop")
    start(port)


def main():
    fire.Fire(webhook_server)


if __name__ == "__main__":
    main()
