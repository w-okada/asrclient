import logging
from typing import Any
import numpy as np

from ....const import LOGGER_NAME, ReazonSpeechPrecisionType
from ..device_manager.device_manager import DeviceManager
from .recognizer import Recognizer

from reazonspeech.k2.asr import load_model, transcribe, audio_from_numpy


class ReazonSpeechK2V2(Recognizer):
    def load_model(
        self,
        device_id,
        reazon_speech_precision_type: ReazonSpeechPrecisionType = "fp32",
    ):

        self.dev = DeviceManager.get_instance().get_pytorch_device(device_id)
        self.isHalf = DeviceManager.get_instance().half_precision_available(device_id)

        try:
            device = "cpu" if device_id < 0 else "cuda"
            self.reason_model = load_model(device=device, precision=reazon_speech_precision_type)
            logging.getLogger(LOGGER_NAME).info(f"[reazonspeech_nemo_v2] initialize with device {device}")
        except Exception as e:
            logging.getLogger(LOGGER_NAME).error(f"[reazonspeech_nemo_v2] load reason model failed {e}")

            import traceback

            traceback.print_exc()

        return self

    def transcribe(self, audio: np.ndarray, language: str, timestamps: bool = False) -> str:
        # 16kで入ってくることを想定

        # int16の場合はfloat32に変換
        if audio.dtype != np.float32:
            audio = audio.astype(np.float32) / 32767

        try:
            audio_data = audio_from_numpy(audio, 16000)
            res2 = transcribe(self.reason_model, audio_data)
        except Exception as e:
            print(e)
            raise e

        return res2.text

    def get_info(self) -> Any:
        pass

    def get_support_languages(self) -> list[str]:
        available_languages = ["ja"]
        return available_languages
