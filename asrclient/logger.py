import logging
from pathlib import Path
import warnings

warnings.filterwarnings("ignore", message="Duplicate Operation ID")


class CustomFormatter(logging.Formatter):
    def format(self, record):
        record.name = record.name.ljust(10)[:10]
        record.module = record.module.ljust(20)[:20]
        return super().format(record)


class LogSuppressFilter(logging.Filter):
    def filter(self, record):
        return False


class IgnoreConvertRequestFilter(logging.Filter):
    def filter(self, record):
        vcclient = "/asr-client.log" not in record.getMessage()
        return all([vcclient])


def setup_logger(logger_name: str, filename: Path, level=logging.DEBUG):
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.DEBUG)
    logger.propagate = False

    custom_datefmt = "%H:%M:%S"
    if level == logging.DEBUG:
        formatter = CustomFormatter("%(asctime)s - %(name)s - %(module)s - %(levelname)s - %(message)s - %(pathname)s - %(lineno)s")
    else:
        formatter = CustomFormatter("%(asctime)s - %(name)s - %(module)s - %(levelname)s - %(message)s - %(module)s - %(lineno)s", datefmt=custom_datefmt)

    file_handler = logging.FileHandler(filename, mode="w", encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    for logger_name in ["uvicorn", "uvicorn.error", "uvicorn.access", "fairseq.tasks.text_to_speech", "fairseq.tasks.hubert_pretraining", "fairseq.models.hubert.hubert", "faster_whisper"]:
        logger = logging.getLogger(logger_name)
        logger.propagate = False
        logger.addHandler(file_handler)

    logging.getLogger("torchaudio").setLevel(logging.ERROR)
    logging.getLogger("uvicorn.access").addFilter(IgnoreConvertRequestFilter())
