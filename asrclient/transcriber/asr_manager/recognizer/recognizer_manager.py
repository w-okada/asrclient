from asrclient.const import ComputeType, ReazonSpeechPrecisionType, RecognizerType, WhisperModelType
from asrclient.transcriber.asr_manager.recognizer.faster_whisper_recognizer import FasterWhisperRecognizer
from asrclient.transcriber.asr_manager.recognizer.kotoba_whisper_v2_faster import KotobaWhisperV2Faster
from asrclient.transcriber.asr_manager.recognizer.kotoba_whisper_v2 import KotobaWhisperV2
from asrclient.transcriber.asr_manager.recognizer.reazonspeech_k2_v2 import ReazonSpeechK2V2
from asrclient.transcriber.asr_manager.recognizer.reazonspeech_nemo_v2 import ReazonSpeechNemoV2
from asrclient.transcriber.asr_manager.recognizer.recognizer import Recognizer
from asrclient.transcriber.asr_manager.recognizer.sense_voice_recognizer import SenseVoiceRecognizer
from asrclient.transcriber.asr_manager.recognizer.whisper_recognizer import WhisperRecognizer


class RecognizerManager:
    current_recognizer: Recognizer | None = None

    @classmethod
    def get_recognizer(
        cls,
        recognizer_type: RecognizerType,
        device_id: int,
        model_type: WhisperModelType | None = None,
        compute_type: ComputeType = "default",
        reazon_speech_precision_type: ReazonSpeechPrecisionType = "fp32",
    ) -> Recognizer:
        try:
            cls.current_recognizer = cls.load_recognizer(recognizer_type, device_id, compute_type, model_type=model_type, reazon_speech_precision_type=reazon_speech_precision_type)
        except Exception as e:
            raise RuntimeError(e)
        return cls.current_recognizer

    @classmethod
    def load_recognizer(
        cls,
        recognizer_type: RecognizerType,
        device_id: int,
        compute_type: ComputeType = "default",
        model_type: WhisperModelType | None = None,
        reazon_speech_precision_type: ReazonSpeechPrecisionType = "fp32",
    ) -> Recognizer:
        recognizer: Recognizer
        if recognizer_type == "whisper":
            recognizer = WhisperRecognizer()
            recognizer.load_model(device_id, model_type=model_type)
        elif recognizer_type == "faster-whisper":
            recognizer = FasterWhisperRecognizer()
            recognizer.load_model(device_id, model_type=model_type, compute_type=compute_type)
        elif recognizer_type == "SenseVoiceSmall":
            recognizer = SenseVoiceRecognizer()
            recognizer.load_model(device_id)
        elif recognizer_type == "reazonspeech-nemo-v2":
            recognizer = ReazonSpeechNemoV2()
            recognizer.load_model(device_id)
        elif recognizer_type == "reazonspeech-k2-v2":
            recognizer = ReazonSpeechK2V2()
            recognizer.load_model(device_id, reazon_speech_precision_type=reazon_speech_precision_type)
        elif recognizer_type == "kotoba-whisper-v2.0":
            recognizer = KotobaWhisperV2()
            recognizer.load_model(device_id)
        elif recognizer_type == "kotoba-whisper-v2.0-faster":
            recognizer = KotobaWhisperV2Faster()
            recognizer.load_model(device_id, compute_type=compute_type)
        else:
            raise RuntimeError(f"Unknown recognizer {recognizer_type}")
        return recognizer
