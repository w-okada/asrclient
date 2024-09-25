import logging
from typing import Any
import numpy as np
from faster_whisper import WhisperModel
from whisper.tokenizer import LANGUAGES

from asrclient.const import LOGGER_NAME, ComputeType, WhisperModelType
from asrclient.transcriber.asr_manager.device_manager.device_manager import DeviceManager
from asrclient.transcriber.asr_manager.recognizer.recognizer import Recognizer


class FasterWhisperRecognizer(Recognizer):
    def load_model(
        self,
        device_id,
        model_type: WhisperModelType,
        compute_type: ComputeType = "default",
    ):
        self.dev = DeviceManager.get_instance().get_pytorch_device(device_id)
        self.isHalf = DeviceManager.get_instance().half_precision_available(device_id)

        try:
            # device: Device to use for computation ("cpu", "cuda", "auto").
            self.device = "cuda" if self.dev.type == "cuda" else "cpu"
            if self.device == "cpu" and compute_type == "float16":
                compute_type = "float32"
                print("[faster_whisper_recognizer] cpu can not use float16. use float32 instead.")
                logging.getLogger(LOGGER_NAME).info("[faster_whisper_recognizer] cpu can not use float16. use float32 instead.")
            self.model = WhisperModel(model_type, device=self.device, compute_type=compute_type)
        except Exception as e:
            raise RuntimeError(e)

        return self

    def transcribe(self, audio: np.ndarray, language: str, timestamps: bool = False) -> str:
        # 16kで入ってくることを想定

        # int16の場合はfloat32に変換
        if audio.dtype != np.float32:
            audio = audio.astype(np.float32) / 32767

        results, info = self.model.transcribe(audio, language=language, word_timestamps=False)
        # resultsはIterableなのでcomsumeすると中身がなくなる
        # for segment in results:
        #     print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))

        text = " ".join([x.text for x in list(results)])
        return text

    def get_info(self) -> Any:
        pass

    def get_support_languages(self) -> list[str]:
        available_languages = list(LANGUAGES.keys())
        return available_languages
