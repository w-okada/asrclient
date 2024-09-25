import logging
from typing import Any
import numpy as np

import whisper
from whisper.tokenizer import LANGUAGES

from asrclient.const import LOGGER_NAME, WhisperModelType
from asrclient.transcriber.asr_manager.device_manager.device_manager import DeviceManager
from asrclient.transcriber.asr_manager.recognizer.recognizer import Recognizer


class WhisperRecognizer(Recognizer):
    def load_model(
        self,
        device_id,
        model_type: WhisperModelType,
    ):

        self.dev = DeviceManager.get_instance().get_pytorch_device(device_id)
        self.isHalf = DeviceManager.get_instance().half_precision_available(device_id)

        self.model = whisper.load_model(model_type, device=self.dev)

        logging.getLogger(LOGGER_NAME).info(f"[whisper_recognizer] initialize with device {self.model.device}")

        return self

    def transcribe(self, audio: np.ndarray, language: str, timestamps: bool = False) -> str:
        # 16kで入ってくることを想定

        # int16の場合はfloat32に変換
        if audio.dtype != np.float32:
            audio = audio.astype(np.float32) / 32767

        logging.getLogger(LOGGER_NAME).info(f"[whisper_recognizer] transcribe audio.dtype {audio.dtype}")

        result = self.model.transcribe(audio, language=language, word_timestamps=False, beam_size=5, best_of=5, temperature=(0.0, 0.2, 0.4))
        # result = self.model.transcribe(audio, language=language, word_timestamps=False)

        return result["text"]

    def get_info(self) -> Any:
        pass

    def get_support_languages(self) -> list[str]:
        available_languages = list(LANGUAGES.keys())
        return available_languages
