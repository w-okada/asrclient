from abc import ABC, abstractmethod
from typing import Any

import numpy as np


class Recognizer(ABC):

    @abstractmethod
    def transcribe(self, audio: np.ndarray, language: str, timestamps: bool = False) -> str:
        pass

    @abstractmethod
    def get_info(self) -> Any:
        pass

    @abstractmethod
    def get_support_languages(self) -> list[str]:
        pass
