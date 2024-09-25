import logging
from typing import List, Literal
import wave
import samplerate as sr
import numpy as np
from asrclient.const import LOGGER_NAME, ComputeType, ReazonSpeechPrecisionType, RecognizerType, WhisperModelType
from asrclient.transcriber.asr_manager.pipeline.pipeline import Pipeline, PipelineInfo
from asrclient.transcriber.asr_manager.recognizer.recognizer_manager import RecognizerManager
from asrclient.transcriber.asr_manager.utils.audio_splitter import tagging, Frame

global_index = 0


def write_wave(path, audio, sample_rate):
    """Writes a .wav file.

    Takes path, PCM audio data, and sample rate.
    """
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio)


class SingleTranscriberPipeline(Pipeline):
    def __init__(
        self,
        recognizer_type: RecognizerType,
        model_type: WhisperModelType,
        device_id: int,
        compute_type: ComputeType = "default",
        reazon_speech_precision_type: ReazonSpeechPrecisionType = "fp32",
    ):
        if recognizer_type == "SenseVoiceSmall":
            self.transcriber = RecognizerManager.get_recognizer("SenseVoiceSmall", device_id)
        elif recognizer_type == "reazonspeech-nemo-v2":
            self.transcriber = RecognizerManager.get_recognizer("reazonspeech-nemo-v2", device_id)
        elif recognizer_type == "reazonspeech-k2-v2":
            self.transcriber = RecognizerManager.get_recognizer("reazonspeech-k2-v2", device_id, reazon_speech_precision_type=reazon_speech_precision_type)
        elif recognizer_type == "kotoba-whisper-v2.0":
            self.transcriber = RecognizerManager.get_recognizer("kotoba-whisper-v2.0", device_id)
        elif recognizer_type == "kotoba-whisper-v2.0-faster":
            self.transcriber = RecognizerManager.get_recognizer("kotoba-whisper-v2.0-faster", device_id, compute_type=compute_type)
        else:
            raise ValueError(f"Unknown recognizer_type:{recognizer_type}")

        self.rest_frames: List[Frame] = []
        self.rest_tags: List[bool] = []
        self.resample_ratio_in = 16000 / 48000
        self.resampler_in = sr.Resampler("sinc_best", channels=1)

        self.recognizer_type = recognizer_type
        self.model_type = model_type
        self.device_id = device_id
        self.compute_type = compute_type
        self.reazon_speech_precision_type = reazon_speech_precision_type

    def get_info(self) -> PipelineInfo:
        return PipelineInfo(
            recognizer_type=self.recognizer_type,
            recognizer_model_type=self.model_type,
            compute_type=self.compute_type,
            reazon_speech_precision_type=self.reazon_speech_precision_type,
            device_id=self.device_id,
        )

    def get_support_languages(self) -> list[str]:
        available_languages = self.transcriber.get_support_languages()
        return available_languages

    def _exec_resample_in(self, waveform: np.ndarray) -> np.ndarray:
        return self.resampler_in.process(waveform, self.resample_ratio_in, end_of_input=False)

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

    def run(
        self,
        audio: np.ndarray,
        language: str,
        max_frame_length: int = 500,
        skip_transcribe: bool = False,
        vad_frame_duration_ms: Literal[10, 20, 30] = 30,
        vad_change_mode_frame_num: int = 10,
    ) -> tuple[list, str | None]:
        global global_index
        global_index += 1
        # 48K/float32で入ってい来る想定
        wave_16k = self._exec_resample_in(audio)
        wave_16k_short = (wave_16k * 32767).astype(np.int16)

        # frames, tags = tagging(wave_16k_short, frame_duration_ms=vad_frame_duration_ms, sample_rate=16000, aggressiveness=3)
        frames, tags = tagging(wave_16k_short, frame_duration_ms=vad_frame_duration_ms, sample_rate=16000, aggressiveness=0)
        self.rest_frames.extend(frames)
        self.rest_tags.extend(tags)
        if skip_transcribe is True:
            return [], None

        # all_voices = [x.bytes for x in self.rest_frames]
        # all_voice = np.concatenate(all_voices)
        # write_wave(f"zzz_{global_index:03}.wav", all_voice.astype(np.int16), 16000)

        # search start
        # self.rest_tagsを先頭から走査していき、n個連続でTrueが続いたら、その最初の位置をstartとする
        n = vad_change_mode_frame_num
        voice_frames = []
        voice_mid = None
        # print("[Voice Detection] Start")
        while True:
            # print("[Voice Detection] Loop")
            voice_start = self.find_voice_start_end(self.rest_tags, n, True)
            if voice_start == -1:

                # 音声が見つからないので、後ろのn-1frameを残して次のchunkを待つ
                # frame_len = len(self.rest_frames)
                self.rest_frames = self.rest_frames[-(n - 1) :]
                self.rest_tags = self.rest_tags[-(n - 1) :]
                # print(f"[Voice Detection] No Voice Detected. Rest Frames Trim:{frame_len} -> {len(self.rest_frames)}")
                break
            # voice_start以降のself.rest_tagsを走査して、n個連続でFalseが続いたら、その最後の位置をvoice_endとする
            voice_end = self.find_voice_start_end(self.rest_tags[voice_start + 1 :], n, False)
            if voice_end == -1:
                # 音声の終了が見つからないので、現在の音声は発話中。
                # frame_len = len(self.rest_frames)

                voice_mid = self.rest_frames[voice_start:].copy()
                self.rest_frames = self.rest_frames[voice_start:]
                self.rest_tags = self.rest_tags[voice_start:]
                # print(f"[Voice Detection] Voice Detected. Not End. Rest Frames Trim:{frame_len} -> {len(self.rest_frames)}")
                break

            # 音声が見つかったので、その部分を抽出
            # frame_len = len(self.rest_frames)
            # nframe後も取っておく。
            # print("add voice frame1", voice_start, voice_start + voice_end + n, len(self.rest_frames))
            voice_frame = self.rest_frames[voice_start : voice_start + voice_end + n].copy()
            voice_frames.append(voice_frame)

            self.rest_frames = self.rest_frames[voice_start + voice_end :]
            self.rest_tags = self.rest_tags[voice_start + voice_end :]
            # print(f"[Voice Detection] Voice Detected. End Detected. Rest Frames Trim:{frame_len} -> {len(self.rest_frames)}")

        # print("[Voice Detection] End")

        texts = []
        mid_text: str | None = None
        import time

        for i, frame in enumerate(voice_frames):
            start_time = time.time()

            datas = [x.bytes for x in frame]
            data = np.concatenate(datas)
            data_f = data.astype(np.float32) / 32767

            result = self.transcriber.transcribe(data_f, language=language)
            texts.append(result)

            # data_fをwavとして保存
            # write_wave(f"x_output_{global_index:03}_{i:03}.wav", data.astype(np.int16), 16000)

            end_time = time.time()
            logging.getLogger(LOGGER_NAME).info(f"[pipeline] transcribe voice end [{i}]. Elapsed time:{end_time - start_time}ms")

        if voice_mid is not None:
            start_time = time.time()
            datas = [x.bytes for x in voice_mid]
            data = np.concatenate(datas)
            data_f = data.astype(np.float32) / 32767

            result = self.transcriber.transcribe(data_f, language=language)
            mid_text = result
            end_time = time.time()
            logging.getLogger(LOGGER_NAME).info(f"[pipeline] transcribe mid-voice end. Elapsed time:{end_time - start_time}ms")

        return texts, mid_text
