import os

from asrclient.const import ConfigFile
from asrclient.transcriber.data_types.data_types import ASRConfiguration


class ConfigurationManager:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:

            cls._instance = cls()
            return cls._instance

        return cls._instance

    def __init__(self):
        self.reload()

    def reload(self):
        if os.path.exists(ConfigFile):
            self.asr_configuration = ASRConfiguration.model_validate_json(open(ConfigFile, encoding="utf-8").read())
        else:
            self.asr_configuration = ASRConfiguration()
            self.save_voice_changer_configuration()

    def get_configuration(self) -> ASRConfiguration:
        return self.asr_configuration

    def set_configuration(self, conf: ASRConfiguration):
        self.asr_configuration = conf
        self.save_voice_changer_configuration()

    def save_voice_changer_configuration(self):
        open(ConfigFile, "w", encoding="utf-8").write(self.asr_configuration.model_dump_json(indent=4))
