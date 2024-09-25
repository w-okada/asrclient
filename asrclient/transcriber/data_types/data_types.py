from pydantic import BaseModel

from ...const import ComputeType, ReazonSpeechPrecisionType, RecognizerType, WhisperModelType


class GPUInfo(BaseModel):
    name: str = ""
    device_id: str = ""
    adapter_ram: int = 0
    device_id_int: int = 0
    cuda_compute_version_major: int = -1
    cuda_compute_version_minor: int = -1


class ASRConfiguration(BaseModel):
    recognizer_type: RecognizerType = "SenseVoiceSmall"
    recognizer_model_type: WhisperModelType = "tiny"
    compute_type: ComputeType = "default"
    reazon_speech_precision_type: ReazonSpeechPrecisionType = "fp32"

    gpu_device_id_int: int = -1
    input_sample_rate: int = 48000
    max_frame_length: int = 500
    language: str = "ja"

    # vad_frame_duration_ms: 10 | 20 | 30 = 30
    vad_frame_duration_ms: int = 30
    vad_change_mode_frame_num: int = 10

    webhook_url: str = ""
