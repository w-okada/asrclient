import logging
import re
from typing import Any
import numpy as np
from funasr import AutoModel

from asrclient.const import LOGGER_NAME
from asrclient.transcriber.asr_manager.device_manager.device_manager import DeviceManager
from asrclient.transcriber.asr_manager.recognizer.recognizer import Recognizer


class SenseVoiceRecognizer(Recognizer):
    regex = r"<\|.*\|>"

    def load_model(self, device_id):

        self.dev = DeviceManager.get_instance().get_pytorch_device(device_id)
        self.isHalf = DeviceManager.get_instance().half_precision_available(device_id)

        model = "iic/SenseVoiceSmall"
        if device_id < 0:
            model, kwargs = AutoModel.build_model(model=model, device="cpu")
        else:
            # model, kwargs = AutoModel.build_model(model=model, device=self.dev)
            model, kwargs = AutoModel.build_model(model=model, device=device_id)
        model.eval()
        self.model_svs = model
        self.kwargs = kwargs
        logging.getLogger(LOGGER_NAME).info(f"[whisper_recognizer] sensevoice initialize with device {device_id}")

        return self

    def transcribe(self, audio: np.ndarray, language: str, timestamps: bool = False) -> str:
        # 16kで入ってくることを想定

        # int16の場合はfloat32に変換
        if audio.dtype != np.float32:
            audio = audio.astype(np.float32) / 32767

        logging.getLogger(LOGGER_NAME).info(f"[whisper_recognizer] transcribe audio.dtype {audio.dtype}")

        res = self.model_svs.inference(
            data_in=audio,
            language="ja",
            use_itn=False,
            ban_emo_unk=False,
            # key=key,
            fs=16000,
            **self.kwargs,
        )
        # print(res)
        res_clean_text = ""
        if len(res) > 0:
            for it in res[0]:
                clean_text = re.sub(self.regex, "", it["text"], 0, re.MULTILINE)
                res_clean_text += clean_text
        print(res_clean_text)
        return res_clean_text

    def get_info(self) -> Any:
        pass

    def get_support_languages(self) -> list[str]:
        available_languages = ["auto", "zh", "en", "yue", "ja", "ko"]
        return available_languages
