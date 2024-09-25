from abc import ABC, abstractmethod
from typing import Literal

import numpy as np
from pydantic import BaseModel

from asrclient.const import ComputeType, ReazonSpeechPrecisionType, RecognizerType, WhisperModelType


class PipelineInfo(BaseModel):
    recognizer_type: RecognizerType
    recognizer_model_type: WhisperModelType
    compute_type: ComputeType
    reazon_speech_precision_type: ReazonSpeechPrecisionType
    device_id: int


class Pipeline(ABC):

    @abstractmethod
    def run(
        self,
        audio: np.ndarray,
        language: str,
        max_frame_length: int = 500,
        skip_transcribe: bool = False,
        vad_frame_duration_ms: Literal[10, 20, 30] = 30,
        vad_change_mode_frame_num: int = 10,
    ) -> tuple[list, str | None]:
        pass

    @abstractmethod
    def get_info(self) -> PipelineInfo:
        pass

    @abstractmethod
    def get_support_languages(self) -> list[str]:
        pass
