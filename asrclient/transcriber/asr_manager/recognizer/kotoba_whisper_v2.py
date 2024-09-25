from typing import Any
import numpy as np

from asrclient.transcriber.asr_manager.device_manager.device_manager import DeviceManager
from asrclient.transcriber.asr_manager.recognizer.recognizer import Recognizer


from transformers import pipeline
import torch


class KotobaWhisperV2(Recognizer):
    def load_model(
        self,
        device_id,
    ):

        self.dev = DeviceManager.get_instance().get_pytorch_device(device_id)
        self.isHalf = DeviceManager.get_instance().half_precision_available(device_id)

        # config
        kotoba_whisper_v2_model_id = "kotoba-tech/kotoba-whisper-v2.0"
        torch_dtype = torch.bfloat16 if self.isHalf else torch.float32
        device = self.dev
        model_kwargs = {"attn_implementation": "sdpa"} if torch.cuda.is_available() else {}
        self.generate_kwargs = {"language": "japanese", "task": "transcribe"}

        # load model
        self.pipe = pipeline("automatic-speech-recognition", model=kotoba_whisper_v2_model_id, torch_dtype=torch_dtype, device=device, model_kwargs=model_kwargs)

        return self

    def transcribe(self, audio: np.ndarray, language: str, timestamps: bool = False) -> str:
        # 16kで入ってくることを想定

        # int16の場合はfloat32に変換
        if audio.dtype != np.float32:
            audio = audio.astype(np.float32) / 32767

        try:
            result = self.pipe(audio, generate_kwargs=self.generate_kwargs)
            print(result)
        except Exception as e:
            print(e)
            raise e

        return result["text"]

    def get_info(self) -> Any:
        pass

    def get_support_languages(self) -> list[str]:
        available_languages = ["ja"]
        return available_languages
