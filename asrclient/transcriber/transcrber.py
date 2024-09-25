import logging
import time
import numpy as np
from queue import Empty, Queue
import threading
import requests
import json

from ..const import LOGGER_NAME
from ..exception import ERROR_CODE_WHISPER_IS_NOT_SUPPORTED, VCClientError
from ..server.event_emitter_manager import EventEmitterManager
from .asr_manager.pipeline.pipeline import Pipeline
from .asr_manager.pipeline.pipline_manager import PipelineManager
from .configuration_manager.configuration_manager import ConfigurationManager


class Transcriber:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:

            cls._instance = cls()
            return cls._instance

        return cls._instance

    def __init__(self):
        self.pipeline: Pipeline | None = None
        self.start_transcribe = True
        self.transcribe_queue_in = Queue()
        self.transcribe_queue_out = Queue()

    def start(self):
        self.transcribe_thread = threading.Thread(target=self.transcribe_thread_func)
        self.transcribe_thread.start()

    def stop(self):
        self.start_transcribe = False
        self.transcribe_thread.join()
        print("[transcriber] loop thread finalized.")

    def check_pipeline_updated_and_update(self):
        try:
            conf = ConfigurationManager.get_instance().get_configuration()
            if self.pipeline is None:
                self.pipeline = PipelineManager.get_pipeline(conf.recognizer_type, conf.recognizer_model_type, conf.gpu_device_id_int, conf.compute_type, reazon_speech_precision_type=conf.reazon_speech_precision_type)
            else:
                assert self.pipeline is not None
                pipeline_info = self.pipeline.get_info()
                if pipeline_info.recognizer_type != conf.recognizer_type or pipeline_info.recognizer_model_type != conf.recognizer_model_type or pipeline_info.device_id != conf.gpu_device_id_int or pipeline_info.compute_type != conf.compute_type or pipeline_info.reazon_speech_precision_type != conf.reazon_speech_precision_type:
                    self.pipeline = PipelineManager.get_pipeline(conf.recognizer_type, conf.recognizer_model_type, conf.gpu_device_id_int, conf.compute_type, reazon_speech_precision_type=conf.reazon_speech_precision_type)

        except VCClientError as e:
            if e.info.code == ERROR_CODE_WHISPER_IS_NOT_SUPPORTED:
                logging.getLogger(LOGGER_NAME).warning(f"Failed to generate pipeline:{e}")
                logging.getLogger(LOGGER_NAME).warning("change to SenseVoiceSmall")
                print(f"Failed to generate pipeline:{e}")
                print("change to SenseVoiceSmall")
                conf.recognizer_type = "SenseVoiceSmall"
                ConfigurationManager.get_instance().set_configuration(conf)
                self.pipeline = PipelineManager.get_pipeline(conf.recognizer_type, conf.recognizer_model_type, conf.gpu_device_id_int, conf.compute_type)
            else:
                import traceback

                logging.getLogger(LOGGER_NAME).warning(f"Failed to generate pipeline:{e}")
                logging.getLogger(LOGGER_NAME).warning(f"Failed to generate pipeline:{traceback.format_exc()}")
                print(f"Failed to generate pipeline:{e}")
                time.sleep(1)

    def notify_to_socket_io_client(self, texts: list[str], mid_text: str):
        data = {"data": {"texts": texts, "mid_text": mid_text}}

        EventEmitterManager.get_instance().get_event_emitter().emit_coroutine("transcribe", json.dumps(data))

    def notify_to_webhook(self, texts: list[str], mid_text: str):
        conf = ConfigurationManager.get_instance().get_configuration()
        if conf.webhook_url == "":
            return

        headers = {
            "Content-Type": "application/json",
        }
        data = {"data": {"texts": texts, "mid_text": mid_text}}
        try:

            response = requests.post(conf.webhook_url, headers=headers, data=json.dumps(data))
            # response = requests.post("http://127.0.0.1:8080/webhook", headers=headers, data=json.dumps(data))

            if response.status_code != 200:
                logging.getLogger(LOGGER_NAME).error(f"Failed to notify to webhook: response:{response.status_code}")

        except Exception as e:
            logging.getLogger(LOGGER_NAME).error(f"Failed to notify to webhook: error:{e}")

    def transcribe_thread_func(self):
        while self.start_transcribe:
            conf = ConfigurationManager.get_instance().get_configuration()

            # 書き起こし処理
            try:
                if self.transcribe_queue_in.empty():
                    time.sleep(0.5)
                    continue
                audio = np.array([])
                while self.transcribe_queue_in.empty() is False:
                    new_audio = self.transcribe_queue_in.get()
                    assert isinstance(new_audio, np.ndarray)
                    audio = np.concatenate([audio, new_audio])
                texts, mid_text = self.pipeline.run(
                    audio,
                    conf.language,
                    max_frame_length=conf.max_frame_length,
                    vad_frame_duration_ms=conf.vad_frame_duration_ms,
                    vad_change_mode_frame_num=conf.vad_change_mode_frame_num,
                )
                self.transcribe_queue_out.put((texts, mid_text))
                threading.Thread(target=self.notify_to_webhook, args=(texts, mid_text)).start()
                self.notify_to_socket_io_client(texts, mid_text)
            except Empty:
                print("pass")
                pass
            except Exception as e:
                import traceback

                logging.getLogger(LOGGER_NAME).warn(f"Failed to convert_chunk_bulk_internal:{e}")
                logging.getLogger(LOGGER_NAME).warn(f"Failed to convert_chunk_bulk_internal:{traceback.format_exc()}")
        print("[loop] end")

    def transcribe(self, audio: np.ndarray, skip_transcribe: bool = False) -> tuple[list, str | None]:
        # 処理エントリ
        self.transcribe_queue_in.put(audio)

        # 処理完了エントリ回収
        return_text = []
        return_mid_text = None
        while True:
            if self.transcribe_queue_out.empty():
                break
            try:
                texts, mid_text = self.transcribe_queue_out.get()
                return_text.extend(texts)
                return_mid_text = mid_text
            except Empty:
                pass

        return return_text, return_mid_text

    def get_support_languages(self) -> list[str]:

        if self.pipeline is None:
            return ["-"]
        return self.pipeline.get_support_languages()
