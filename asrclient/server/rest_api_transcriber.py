from fastapi import APIRouter, Response
from fastapi import File, UploadFile, Header
import numpy as np
from pydantic import BaseModel

import wave
import time

from asrclient.server.validation_error_logging_route import ValidationErrorLoggingRoute
from asrclient.transcriber.transcrber import Transcriber


class ConvertFileParam(BaseModel):
    src_path: str
    dst_path: str


class ConvertResultResponse(BaseModel):
    texts: list[str]
    mid_text: str | None
    elapsed_time: float


def write_wave(path, audio, sample_rate):
    """Writes a .wav file.

    Takes path, PCM audio data, and sample rate.
    """
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio)


class RestAPITranscriber:
    def __init__(self):
        self.router = APIRouter()
        self.router.route_class = ValidationErrorLoggingRoute
        self.router.add_api_route("/api/voice-changer/convert_chunk", self.post_convert_chunk, methods=["POST"])
        self.router.add_api_route("/api/voice-changer/convert_file", self.post_convert_file, methods=["POST"])
        self.router.add_api_route("/api/voice-changer/support_languages", self.get_support_languages, methods=["GET"])

        self.router.add_api_route("/api_voice-changer_convert_chunk", self.post_convert_chunk, methods=["POST"])
        self.router.add_api_route("/api_voice-changer_convert_file", self.post_convert_file, methods=["POST"])
        self.router.add_api_route("/api_voice-changer_support_languages", self.get_support_languages, methods=["GET"])

        print("REST API Initialized")
        self.latest_timestamp = 0

    def find_voice_start_end(self, tags: list[bool], n: int, flag: bool = True) -> int:
        start = -1
        consecutive_count = 0

        for i in range(len(tags)):
            if tags[i] is flag:
                consecutive_count += 1
            else:
                consecutive_count = 0

            if consecutive_count == n:
                start = i - n + 1  # 10個連続の最初の位置を計算
                break

        return start

    async def post_convert_chunk(
        self,
        waveform: UploadFile = File(...),
        x_timestamp: int | None = Header(default=0),
    ):
        """
        音声変換を行うAPI

        Args:
            waveform (UploadFile): 音声データ np.float32のバイナリデータを想定している。
            x_timestamp (int): タイムスタンプ
        """
        start = time.time()
        chunk = await waveform.read()
        chunk_np: np.ndarray = np.frombuffer(chunk, dtype=np.float32)
        transcriber = Transcriber.get_instance()
        texts, mid_text = transcriber.transcribe(chunk_np)

        elapsed_time = time.time() - start
        if self.latest_timestamp > x_timestamp:
            print("x_timestamp is old. x_timestamp is updated.")
        self.latest_timestamp = x_timestamp

        return Response(
            content=ConvertResultResponse(texts=texts, mid_text=mid_text, elapsed_time=elapsed_time).model_dump_json(),
            media_type="application/json",
            headers={
                "x-timestamp": str(x_timestamp),
            },
        )

    def post_convert_file(self, convert_file_param: ConvertFileParam):
        pass
        # vc = VoiceChanger.get_instance()
        # vc.convert_file(convert_file_param.src_path, convert_file_param.dst_path)

    def get_support_languages(self):
        transcriber = Transcriber.get_instance()
        return transcriber.get_support_languages()
