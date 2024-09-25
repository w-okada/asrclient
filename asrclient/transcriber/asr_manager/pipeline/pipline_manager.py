import logging
import platform
from asrclient.const import LOGGER_NAME, ComputeType, ReazonSpeechPrecisionType, RecognizerType, WhisperModelType
from asrclient.exception import ERROR_CODE_WHISPER_IS_NOT_SUPPORTED, VCClientError
from asrclient.transcriber.asr_manager.pipeline.single_transcriber_pipeline import SingleTranscriberPipeline
from asrclient.transcriber.asr_manager.pipeline.general_whisper_pipeline import GeneralWhisperPipeline
from asrclient.transcriber.asr_manager.pipeline.pipeline import Pipeline


class PipelineManager:

    @classmethod
    def get_pipeline(
        cls,
        transcriber_type: RecognizerType,
        model_type: WhisperModelType,
        device_id: int,
        compute_type: ComputeType = "default",
        reazon_speech_precision_type: ReazonSpeechPrecisionType = "fp32",
    ) -> Pipeline:
        logging.getLogger(LOGGER_NAME).info(f"Generating wew pipleline: {transcriber_type}, {model_type}, {device_id}")
        if transcriber_type in [
            "whisper",
        ]:
            if platform.system().lower() == "darwin":
                raise VCClientError(ERROR_CODE_WHISPER_IS_NOT_SUPPORTED)
            pipeline: Pipeline = GeneralWhisperPipeline(transcriber_type, model_type, device_id, compute_type)
            return pipeline
        elif transcriber_type in [
            "faster-whisper",
        ]:
            pipeline = GeneralWhisperPipeline(transcriber_type, model_type, device_id, compute_type)
            return pipeline
        elif transcriber_type in [
            "SenseVoiceSmall",
        ]:
            pipeline = SingleTranscriberPipeline(transcriber_type, model_type, device_id, compute_type)
            return pipeline
        elif transcriber_type in [
            "reazonspeech-nemo-v2",
            "reazonspeech-k2-v2",
        ]:
            pipeline = SingleTranscriberPipeline(transcriber_type, model_type, device_id, compute_type, reazon_speech_precision_type=reazon_speech_precision_type)
            return pipeline
        elif transcriber_type in [
            "kotoba-whisper-v2.0",
        ]:
            pipeline = SingleTranscriberPipeline(transcriber_type, model_type, device_id, compute_type)
            return pipeline
        elif transcriber_type in [
            "kotoba-whisper-v2.0-faster",
        ]:
            pipeline = SingleTranscriberPipeline(transcriber_type, model_type, device_id, compute_type)
            return pipeline
        else:
            raise ValueError(f"Unknown transcriber type:{transcriber_type}")
