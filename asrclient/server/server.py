import logging
import os
import time
import uvicorn
import asyncio

import threading
import portpicker
import importlib.util

from ..const import LOGGER_NAME
from .key_generator import generate_self_signed_cert
from .socketio_server import SocketIOServer


class Server:
    _instance = None
    port = 0
    # fastapi: FastAPI | None = None
    # server_process: Process | None = None
    server_thread: threading.Thread | None = None

    @classmethod
    def get_instance(
        cls,
        host: str = "127.0.0.1",
        port: int | None = None,
        https: bool = False,
        allow_origins: list[str] | None = None,
    ):
        if cls._instance is None:
            cls._instance = Server(host=host, port=port, https=https, allow_origins=allow_origins)
        return cls._instance

    def __init__(self, host: str = "127.0.0.1", port: int | None = None, https: bool = False, allow_origins: list[str] | None = None):
        super().__init__()
        self.host = (host,)
        self.https = https
        self.allow_origins = allow_origins

        if port is not None:
            self.port = port
        else:
            self.port = portpicker.pick_unused_port()

    def start(self):
        this_modeule = importlib.util.find_spec(__name__)
        if this_modeule is None:
            raise Exception("FastAPI instance is not initialized.")

        module_parent = this_modeule.parent
        if self.https is True:
            cert, key = generate_self_signed_cert()

            config = uvicorn.Config(
                f"{module_parent}.socketio:serverio_app",
                host=self.host,
                port=self.port,
                log_level="info",
                log_config=None,
                ssl_keyfile=key,
                ssl_certfile=cert,
            )
        else:
            config = uvicorn.Config(
                f"{module_parent}.socketio:serverio_app",
                host=self.host,
                port=self.port,
                log_level="info",
                log_config=None,
            )

        self.server = uvicorn.Server(config)
        self.server_thread = threading.Thread(target=self.start_server)
        self.server_thread.start()
        return self.port

    async def stop_all_sockets(self):
        sio = SocketIOServer.get_instance()
        for sid in list(sio.eio.sockets.keys()):
            await sio.disconnect(sid)

    def start_server(self):
        if os.name == "nt":
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        logging.getLogger(LOGGER_NAME).info(f"Starting VCServer on port {self.port}")
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)

        self.loop.run_until_complete(self.server.serve())

    def stop(self):
        self.server.should_exit = True
        time.sleep(1)
        # self.server.force_exit = True # これがあると終了処理がなされない可能性がある。あと、run_foreverではなく、.run_until_completeのほうがいいかも。

        logging.getLogger(LOGGER_NAME).info("wait vccserver to stop...")
        self.loop.stop()
        self.server_thread.join()
        logging.getLogger(LOGGER_NAME).info("wait vccserver to stop...done")
