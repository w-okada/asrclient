import logging
from fastapi import APIRouter

from ..const import LOGGER_NAME
from .validation_error_logging_route import ValidationErrorLoggingRoute
from ..transcriber.configuration_manager.configuration_manager import ConfigurationManager
from ..transcriber.data_types.data_types import ASRConfiguration
from ..transcriber.transcrber import Transcriber


class RestAPIConfigurationManager:
    def __init__(self):
        self.router = APIRouter()
        self.router.route_class = ValidationErrorLoggingRoute
        self.router.add_api_route("/api/configuration-manager/configuration", self.get_configuration, methods=["GET"])
        self.router.add_api_route("/api/configuration-manager/configuration", self.put_configuration, methods=["PUT"])

        self.router.add_api_route("/api_configuration-manager_configuration", self.get_configuration, methods=["GET"])
        self.router.add_api_route("/api_configuration-manager_configuration", self.put_configuration, methods=["PUT"])
        # self.router.add_api_route("/api/configuration-manager/configuration", self.post_configuration, methods=["POST"])

    def get_configuration(self, reload: bool = False):
        configuration_manager = ConfigurationManager.get_instance()
        if reload:
            configuration_manager.reload()
        return configuration_manager.get_configuration()

    def put_configuration(self, configuration: ASRConfiguration):
        """
        注意: VoiceChangerConfigurationには初期値が設定されているので、フィールドが欠けていても初期値で補われてエラーが出ない。
        　　　フィールドの型が異なる場合はエラーが出る。
        """
        configuration_manager = ConfigurationManager.get_instance()
        logging.getLogger(LOGGER_NAME).info(f"Configuration updated: {configuration}")
        configuration_manager.set_configuration(configuration)
        Transcriber.get_instance().check_pipeline_updated_and_update()
        supported_languages = Transcriber.get_instance().get_support_languages()
        if configuration.language not in supported_languages:
            logging.getLogger(LOGGER_NAME).warning(f"Unsupported language: {configuration.language}")
            configuration.language = supported_languages[0]
            configuration_manager.set_configuration(configuration)
