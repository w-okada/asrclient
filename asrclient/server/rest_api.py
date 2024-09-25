import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.datastructures import URL
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import swagger_ui_default_parameters

from ..const import LOGGER_NAME, TMP_DIR, UPLOAD_DIR
from .rest_api_configuration_manager import RestAPIConfigurationManager
from .rest_api_gpu_device_manager import RestAPIGPUDeviceManager
from .rest_api_hello import RestHello
from .rest_api_transcriber import RestAPITranscriber
from .validation_error_logging_route import ValidationErrorLoggingRoute

from starlette.middleware.base import BaseHTTPMiddleware

from threading import Lock
from fastapi import Request
from urllib.parse import urlencode


# original is get_swagger_ui_html of fastapi.openapi.docs
def get_custom_swagger_ui_html(
    *,
    openapi_url: str,
    title: str,
    swagger_js_url: str = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
    swagger_css_url: str = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css",
    swagger_favicon_url: str = "https://fastapi.tiangolo.com/img/favicon.png",
    oauth2_redirect_url: Optional[str] = None,
    init_oauth: Optional[Dict[str, Any]] = None,
    swagger_ui_parameters: Optional[Dict[str, Any]] = None,
) -> HTMLResponse:

    current_swagger_ui_parameters = swagger_ui_default_parameters.copy()
    if swagger_ui_parameters:
        current_swagger_ui_parameters.update(swagger_ui_parameters)

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
    <link type="text/css" rel="stylesheet" href="{swagger_css_url}">
    <link rel="shortcut icon" href="{swagger_favicon_url}">
    <title>{title}</title>
    </head>
    <body>
    <div style="color:red;font-weight: 600;">Note: API may be subject to change in the future.</div>
    <div id="swagger-ui">
    </div>
    <script src="{swagger_js_url}"></script>
    <!-- `SwaggerUIBundle` is now available on the page -->
    <script>
    const ui = SwaggerUIBundle({{
        url: '{openapi_url}',
    """

    for key, value in current_swagger_ui_parameters.items():
        html += f"{json.dumps(key)}: {json.dumps(jsonable_encoder(value))},\n"

    if oauth2_redirect_url:
        html += f"oauth2RedirectUrl: window.location.origin + '{oauth2_redirect_url}',"

    html += """
    presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
    })"""

    if init_oauth:
        html += f"""
        ui.initOAuth({json.dumps(jsonable_encoder(init_oauth))})
        """

    html += """
    </script>
    </body>
    </html>
    """
    return HTMLResponse(html)


# ↓非同期処理にしたので使わない
class RequestLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int, limited_path: str):
        super().__init__(app)
        self.max_requests = max_requests
        self.limited_path = limited_path
        self.current_requests = 0
        self.lock = Lock()  # スレッドセーフなカウンターを使用

    async def dispatch(self, request: Request, call_next):
        # 特定のエンドポイントに対する判定
        print(f"request.url.path:{request.url.path}")
        if request.url.path == self.limited_path:
            with self.lock:
                if self.current_requests >= self.max_requests:
                    query_params = dict(request.query_params)
                    query_params["skip"] = "True"
                    new_query_string = urlencode(query_params)
                    new_url = str(request.url).split("?")[0] + "?" + new_query_string
                    request._url = URL(new_url)
                    request.scope["query_string"] = new_query_string.encode("ascii")
                self.current_requests += 1

            try:
                response = await call_next(request)
            finally:
                with self.lock:
                    self.current_requests -= 1
        else:
            # 他のエンドポイントの場合は通常の処理を行う
            response = await call_next(request)

        return response


class RestAPI:
    _instance = None

    @classmethod
    def get_instance(
        cls,
    ):
        if cls._instance is None:
            app_fastapi = FastAPI(title="VCClient REST API", docs_url=None, redoc_url=None)
            app_fastapi.router.route_class = ValidationErrorLoggingRoute

            # app_fastapi.router.add_api_route("/docs", get_custom_swagger_ui_html, methods=["GET"])
            @app_fastapi.get("/docs", include_in_schema=False)
            def custom_swagger_ui_html():
                logging.getLogger(LOGGER_NAME).info("CUSTOM UI")

                return get_custom_swagger_ui_html(
                    openapi_url=app_fastapi.openapi_url,
                    title="VCClient API Docs",
                )

            # app_fastapi.add_middleware(RequestLimitMiddleware, max_requests=1, limited_path="/api/voice-changer/convert_chunk")
            # app_fastapi.add_middleware(
            #     CORSMiddleware,
            #     allow_origins=["*"],
            #     allow_credentials=True,
            #     allow_methods=["*"],
            #     allow_headers=["*"],
            # )

            app_fastapi.mount("/tmp", StaticFiles(directory=f"{TMP_DIR}"), name="static")
            app_fastapi.mount("/upload_dir", StaticFiles(directory=f"{UPLOAD_DIR}"), name="static")

            rest_hello = RestHello()
            app_fastapi.include_router(rest_hello.router)
            rest_configuration_manager = RestAPIConfigurationManager()
            app_fastapi.include_router(rest_configuration_manager.router)
            rest_gpu_device_manager = RestAPIGPUDeviceManager()
            app_fastapi.include_router(rest_gpu_device_manager.router)
            rest_whisper = RestAPITranscriber()
            app_fastapi.include_router(rest_whisper.router)

            app_fastapi.router.add_api_route("/api/operation/initialize", initialize, methods=["POST"])
            app_fastapi.router.add_api_route("/api_operation_initialize", initialize, methods=["POST"])
            app_fastapi.router.add_api_route("/get_proxy", get_proxy, methods=["GET"])

            cls._instance = app_fastapi
            return cls._instance

        return cls._instance


def get_proxy(path: str):

    if path.startswith("/"):
        path = path[1:]

    if path.startswith("assets"):
        file_path = Path(f"web_front/{path}")
    elif path.startswith("models"):
        file_path = Path(f"{path}")
    elif path.startswith("voice_characters"):
        file_path = Path(f"{path}")
    else:
        file_path = Path(f"web_front/{path}")

    logging.getLogger(LOGGER_NAME).info(f"GET_PROXY_PATH:{path} -> {file_path}")

    # ファイルが存在するかチェック
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    # ファイルがディレクトリでないかチェック
    if file_path.is_dir():
        raise HTTPException(status_code=400, detail="Path is a directory, not a file")

    return FileResponse(file_path)
    logging.getLogger(LOGGER_NAME).info(f"GET_PROXY_PATH:{path}")
    return {"message": f"proxy. path:{path}"}


def initialize():
    return {"message": "initialized."}
