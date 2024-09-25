import logging
from typing import Any
import numpy as np

from asrclient.const import LOGGER_NAME
from asrclient.transcriber.asr_manager.device_manager.device_manager import DeviceManager
from asrclient.transcriber.asr_manager.recognizer.recognizer import Recognizer

from reazonspeech.nemo.asr import load_model, audio_from_numpy
from reazonspeech.nemo.asr.interface import TranscribeConfig
from reazonspeech.nemo.asr.audio import norm_audio, pad_audio
from reazonspeech.nemo.asr.decode import PAD_SECONDS, decode_hypothesis


class ReazonSpeechNemoV2(Recognizer):
    def load_model(
        self,
        device_id,
    ):

        self.dev = DeviceManager.get_instance().get_pytorch_device(device_id)
        self.isHalf = DeviceManager.get_instance().half_precision_available(device_id)

        try:
            device = "cpu" if device_id < 0 else "cuda"
            self.reason_model = load_model(device=device)
            logging.getLogger(LOGGER_NAME).info(f"[reazonspeech_nemo_v2] initialize with device {device}")
        except Exception as e:
            logging.getLogger(LOGGER_NAME).error(f"[reazonspeech_nemo_v2] load reason model failed {e}")

            import traceback

            traceback.print_exc()

        return self

    def _inner_transcribe(self, model, audio, config=None):
        if config is None:
            config = TranscribeConfig()

        audio = pad_audio(norm_audio(audio), PAD_SECONDS)
        hyp, _ = model.transcribe([audio.waveform], batch_size=1, return_hypotheses=True)
        hyp = hyp[0]
        ret = decode_hypothesis(model, hyp)

        if config.raw_hypothesis:
            ret.hypothesis = hyp

        return ret

    def transcribe(self, audio: np.ndarray, language: str, timestamps: bool = False) -> str:
        # 16kで入ってくることを想定

        # int16の場合はfloat32に変換
        if audio.dtype != np.float32:
            audio = audio.astype(np.float32) / 32767

        try:
            audio_data = audio_from_numpy(audio, 16000)
            res2 = self._inner_transcribe(self.reason_model, audio_data)
        except Exception as e:
            print(e)
            raise e

        return res2.text

    def get_info(self) -> Any:
        pass

    def get_support_languages(self) -> list[str]:
        available_languages = ["ja"]
        return available_languages
