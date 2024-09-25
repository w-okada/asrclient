import socketio
import fire
import asyncio
import json


# カスタム名前空間の定義
class CustomNamespace(socketio.AsyncClientNamespace):
    def __init__(self, namespace):
        super().__init__(namespace)

    async def on_connect(self):
        print("connected!")

    async def on_disconnect(self):
        print("disconnected!")

    async def on_transcribe(self, data):
        data = json.loads(data)
        print("received: ", data)


async def listener(url: str = "http://localhost:20000"):
    sio = socketio.AsyncClient()
    namespace = CustomNamespace("/asr/listener")
    sio.register_namespace(namespace)

    await sio.connect(url)

    try:
        while True:
            await asyncio.sleep(60)
    except asyncio.exceptions.CancelledError as e:
        print("KeyboardInterrupt received, disconnecting...", e)
    finally:
        await sio.disconnect()


def listen(url: str):
    asyncio.run(listener(url))


def main():
    fire.Fire(listen)


if __name__ == "__main__":
    main()
