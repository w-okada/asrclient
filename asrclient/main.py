import logging
import platform
import signal
import time
import fire
import os

from asrclient.logger import setup_logger
from asrclient.app_status import AppStatus
from asrclient.const import LOG_FILE, LOGGER_NAME, VERSION
from asrclient.proxy.ngrok_proxy_manager import NgrokProxyManager
from asrclient.utils.resolve_url import resolve_base_url
from asrclient.utils.parseBoolArg import parse_bool_arg
from asrclient.server.server import Server

from asrclient.transcriber.transcrber import Transcriber


os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
setup_logger(LOGGER_NAME, LOG_FILE)


def start_cui(
    host: str = "0.0.0.0",
    port: int = 20000,
    https: bool = False,
    launch_client: bool = True,
    allow_origins=None,
    no_cui: bool = True,
    ngrok_token: str | None = None,
    ngrok_proxy_url_file: str | None = None,
):
    https = parse_bool_arg(https)
    launch_client = parse_bool_arg(launch_client)
    no_cui = parse_bool_arg(no_cui)

    # --- STYLE start ---
    bold_green_start = "\033[1;32m"
    reset = "\033[0m"
    # --- STYLE end ---

    logging.getLogger(LOGGER_NAME).info(f"Starting ASR Client CUI version:{VERSION}")

    if ngrok_token is not None and https is True:
        print("ngrok with https is not supported.")
        print("use http.")
        return

    # 各種プロセス起動
    app_status = AppStatus.get_instance()

    # (1) transcriber loop起動
    Transcriber.get_instance().start()

    # (2) VCServer 起動
    allow_origins = "*"
    whisper_server = Server.get_instance(host=host, port=port, https=https, allow_origins=allow_origins)
    whisper_server_port = whisper_server.start()

    # # (2)NgrokProxy
    if ngrok_token is not None:
        try:
            proxy_manager = NgrokProxyManager.get_instance()
            proxy_url = proxy_manager.start(port, token=ngrok_token)
            # print(f"NgrokProxy:{proxy_url}")
            logging.getLogger(LOGGER_NAME).info(f"NgrokProxy: {proxy_url}")
            if ngrok_proxy_url_file is not None:
                with open(ngrok_proxy_url_file, "w") as f:
                    f.write(proxy_url)

        except Exception as e:
            logging.getLogger(LOGGER_NAME).error(f"NgrokProxy Error:{e}")
            print("NgrokProxy Error:", e)
            print("")
            print("Ngrok proxy is not launched. Shutdown server... ")
            print("")

            print(f"{bold_green_start}terminating...{reset}")
            # (1) transcriber
            Transcriber.get_instance().stop()
            # (2) Server 終了処理
            whisper_server.stop()
            print(f"{bold_green_start}terminated. [{whisper_server_port}]{reset}")
            return
    else:
        proxy_manager = None
        proxy_url = None

        base_url = resolve_base_url(https, port)

        # bold_start = "\033[1m"
        # bold_blue_start = "\033[1;31;47m"
        # bold_blue_start = "\033[48;2;(5);(5);(5)m"
        bold_green_start = "\033[1;32m"
        reset = "\033[0m"
        title = "    asr-client    "
        urls = [
            ["Application", base_url],
            ["Log(rich)", f"{base_url}/?app_mode=LogViewer"],
            ["Log(text)", f"{base_url}/asr-client.log"],
            ["API", f"{base_url}/docs"],
            ["License(js)", f"{base_url}/licenses-js.json"],
            ["License(py)", f"{base_url}/licenses-py.json"],
        ]

        if proxy_url is not None:
            urls.append(["Ngrok", proxy_url])

        key_max_length = max(len(url[0]) for url in urls)
        url_max_length = max(len(url[1]) for url in urls)

        padding = (key_max_length + url_max_length + 3 - len(title)) // 2

        if platform.system() != "Darwin":

            def gradient_text(text, start_color, end_color):
                text_color = (0, 255, 0)  # Green color for the text
                n = len(text)
                grad_text = ""
                for i, char in enumerate(text):
                    r = int(start_color[0] + (end_color[0] - start_color[0]) * i / n)
                    g = int(start_color[1] + (end_color[1] - start_color[1]) * i / n)
                    b = int(start_color[2] + (end_color[2] - start_color[2]) * i / n)
                    grad_text += f"\033[1m\033[38;2;{text_color[0]};{text_color[1]};{text_color[2]}m\033[48;2;{r};{g};{b}m{char}"
                return grad_text + reset

            start_color = (18, 121, 255)
            end_color = (0, 58, 158)
            print("")
            print(" " * padding + gradient_text(" " * len(title), start_color, end_color))
            print(" " * padding + gradient_text(title, start_color, end_color))
            print(" " * padding + gradient_text(" " * len(title), start_color, end_color))
        else:
            print("")
            print(f"{bold_green_start}{title}{reset}")
            print("")

        print("-" * (key_max_length + url_max_length + 5))
        for url in urls:
            print(f" {bold_green_start}{url[0].ljust(key_max_length)}{reset} | {url[1]} ")
        print("-" * (key_max_length + url_max_length + 5))

        print(f"{bold_green_start}Please press Ctrl+C once to exit asr-client.{reset}")

    # Transcriberのモデル読み込み
    Transcriber.get_instance().check_pipeline_updated_and_update()

    try:
        while True:
            current_time = time.strftime("%Y/%m/%d %H:%M:%S")
            logging.getLogger(LOGGER_NAME).info(f"{current_time}: running...")
            if app_status.end_flag is True:
                break
            time.sleep(60)
    except KeyboardInterrupt:
        err_msg = "KeyboardInterrupt"

    print(f"{bold_green_start}terminate asr client...{reset}")
    # 終了処理

    def ignore_ctrl_c(signum, frame):
        print(f"{bold_green_start}Ctrl+C is disabled during this process{reset}")

    original_handler = signal.getsignal(signal.SIGINT)

    try:
        signal.signal(signal.SIGINT, ignore_ctrl_c)
        print(f"{bold_green_start}terminating...{reset}")
        # (1) transcriber
        Transcriber.get_instance().stop()
        # (2) Server 終了処理
        whisper_server.stop()
        print(f"{bold_green_start}terminated. [{whisper_server_port}]{reset}")

        if len(err_msg) > 0:
            print("msg: ", err_msg)

        # ngrok
        if proxy_manager is not None:
            proxy_manager.stop()
    finally:
        print("")
        # signal.signal(signal.SIGINT, original_handler)

    signal.signal(signal.SIGINT, original_handler)


def main():
    fire.Fire(
        {
            "cui": start_cui,
        }
    )


if __name__ == "__main__":
    main()
