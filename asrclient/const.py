# GLOBAL CONSTANTS
from pathlib import Path
import sys
from typing import Literal, TypeAlias


TERMINATE_FLAG = False

HERE = Path(__file__).parent.absolute()


def get_version():
    with open(HERE / "version.txt", "r", encoding="utf-8") as f:
        return f.read().strip()


APP_NAME = "ASR Client CUI"
VERSION = get_version()
LOGGER_NAME = "asr-client"
LOG_FILE = Path("asr-client.log")

# Configu Manager
SettingsDir = Path("./settings")
SettingsDir.mkdir(parents=True, exist_ok=True)
ConfigFile = SettingsDir / "asr_conf.json"


SERVER_IO_RECORDING_FILE_IN = "input.wav"
SERVER_IO_RECORDING_FILE_OUT = "output.wav"

SSL_KEY_DIR = Path("ssl_key")

TMP_DIR_STR = "tmp_dir"
TMP_DIR = Path(TMP_DIR_STR)
TMP_DIR.mkdir(exist_ok=True)

UPLOAD_DIR_STR = "upload_dir"
UPLOAD_DIR = Path(UPLOAD_DIR_STR)
UPLOAD_DIR.mkdir(exist_ok=True)


def get_frontend_path():
    frontend_path = "web_front"
    return Path(frontend_path)


# Client
NATIVE_CLIENT_FILE_WIN = Path(sys._MEIPASS, "native_client", "voice-changer-native-client.exe") if hasattr(sys, "_MEIPASS") else Path("native_client", "voice-changer-native-client.exe")
NATIVE_CLIENT_FILE_MAC = Path(
    "voice-changer-native-client.app",
    "Contents",
    "MacOS",
    "voice-changer-native-client",
)


RecognizerType: TypeAlias = Literal[
    "SenseVoiceSmall",
    "whisper",
    "faster-whisper",
    "reazonspeech-nemo-v2",
    "reazonspeech-k2-v2",
    "kotoba-whisper-v2.0",
    "kotoba-whisper-v2.0-faster",
]

WhisperModelType: TypeAlias = Literal[
    "tiny",
    "base",
    "small",
    "medium",
    "large-v3",
]
ComputeType: TypeAlias = Literal[
    "int8",
    "float16",
    "float32",
    "default",
]

ReazonSpeechPrecisionType: TypeAlias = Literal[
    "fp32",
    "int8",
    "int8-fp32",
]
