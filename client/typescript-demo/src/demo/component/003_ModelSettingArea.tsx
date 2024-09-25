import { useMemo } from "react";
import React from "react";
import { configSubAreaRow, configSubAreaRowTitle5, configSubAreaRowField14, configSubArea, configSubAreaRowField12, configSubAreaRowTitle7 } from "../../styles/configArea.css";
import { useAppRoot } from "../../001_AppRootProvider";
import { useTranslation } from "react-i18next";
import { ComputeType, ReazonSpeechPrecisionType, WhisperModelType } from "asr-client-typescript-client-lib";
import { BasicLabel } from "../../styles/style-components/labels/01_basic-label.css";
import { useGuiState } from "../GuiStateProvider";


export const ModelSettingArea = () => {
    const { serverConfigState } = useAppRoot();
    const { t } = useTranslation();
    const { setDialog2Props, setDialog2Name } = useGuiState()

    const whisperModelTypeOptions = useMemo(() => {
        const options = WhisperModelType.map((x) => {
            return (
                <option key={x} value={x}>
                    {x}
                </option>
            );
        });
        return options;
    }, []);

    const whisperModelTypeSelect = useMemo(() => {
        if (!serverConfigState.serverConfiguration) {
            return <></>;
        }

        return (
            <select
                value={serverConfigState.serverConfiguration.recognizer_model_type}
                onChange={async (e) => {
                    if (!serverConfigState.serverConfiguration) {
                        return <></>;
                    }

                    setDialog2Props({
                        title: t("waiting_dialog_title_changing_model"),
                        instruction: `${t("waiting_dialog_instruction_changing_model")}`,
                        defaultValue: "",
                        resolve: () => { },
                        options: null,
                    });
                    setDialog2Name("waitDialog");
                    serverConfigState.serverConfiguration.recognizer_model_type = e.target.value as WhisperModelType
                    await serverConfigState.updateServerConfiguration(serverConfigState.serverConfiguration)
                    setDialog2Name("none");




                }}
            >
                {whisperModelTypeOptions}
            </select>
        );
    }, [serverConfigState.serverConfiguration]);


    const whisperModelComputeTypeOptions = useMemo(() => {
        const options = ComputeType.map((x) => {
            return (
                <option key={x} value={x}>
                    {x}
                </option>
            );
        });
        return options;
    }, []);

    const whisperModelComputeTypeSelect = useMemo(() => {
        if (!serverConfigState.serverConfiguration) {
            return <></>;
        }

        return (
            <select
                value={serverConfigState.serverConfiguration.compute_type}
                onChange={(e) => {
                    if (!serverConfigState.serverConfiguration) {
                        return <></>;
                    }
                    serverConfigState.serverConfiguration.compute_type = e.target.value as ComputeType
                    serverConfigState.updateServerConfiguration(serverConfigState.serverConfiguration)
                }}
            >
                {whisperModelComputeTypeOptions}
            </select>
        );
    }, [
        serverConfigState.serverConfiguration,
    ]);


    const reazonSpeechPrecisionTypeOptions = useMemo(() => {
        const options = ReazonSpeechPrecisionType.map((x) => {
            return (
                <option key={x} value={x}>
                    {x}
                </option>
            );
        });
        return options;
    }, []);

    const reazonSpeechPrecisionTypeSelect = useMemo(() => {
        if (!serverConfigState.serverConfiguration) {
            return <></>;
        }

        return (
            <select
                value={serverConfigState.serverConfiguration.reazon_speech_precision_type}
                onChange={(e) => {
                    if (!serverConfigState.serverConfiguration) {
                        return <></>;
                    }
                    serverConfigState.serverConfiguration.reazon_speech_precision_type = e.target.value as ReazonSpeechPrecisionType
                    serverConfigState.updateServerConfiguration(serverConfigState.serverConfiguration)
                }}
            >
                {reazonSpeechPrecisionTypeOptions}
            </select>
        );
    }, [
        serverConfigState.serverConfiguration,
    ]);



    const languageOptions = useMemo(() => {
        if (!serverConfigState.serverConfiguration) {
            return <></>;
        }
        const options = serverConfigState.supportLanguages.sort((x, y) => { return x < y ? -1 : 1 }).map((x) => {
            return (
                <option key={x} value={x}>
                    {x}
                </option>
            );
        });
        return options;
    }, [serverConfigState.supportLanguages]);

    const languageSelect = useMemo(() => {
        if (!serverConfigState.serverConfiguration) {
            return <></>;
        }

        return (
            <select
                value={serverConfigState.serverConfiguration.language}
                onChange={(e) => {
                    if (!serverConfigState.serverConfiguration) {
                        return <></>;
                    }
                    serverConfigState.serverConfiguration.language = e.target.value
                    serverConfigState.updateServerConfiguration(serverConfigState.serverConfiguration)
                }}
            >
                {languageOptions}
            </select>
        );
    }, [
        languageOptions,
        serverConfigState.serverConfiguration,
    ]);


    const component = useMemo(() => {
        const enableWhisperModelTypeSelect = serverConfigState.serverConfiguration?.recognizer_type == "faster-whisper" || serverConfigState.serverConfiguration?.recognizer_type == "whisper"
        const whisperModelTypeSelectRow = enableWhisperModelTypeSelect ? (
            <div className={configSubAreaRow}>
                <div className={BasicLabel({ width: "large" })}>{t("model_size")}:</div>
                <div className={configSubAreaRowField12}>{whisperModelTypeSelect}</div>
            </div>
        ) : <></>

        const enableComputeType = serverConfigState.serverConfiguration?.recognizer_type == "faster-whisper"
        const whisperModelComputeTypeSelectRow = enableComputeType ? (
            <div className={configSubAreaRow}>
                <div className={BasicLabel({ width: "large" })}>{t("compute_type")}:</div>
                <div className={configSubAreaRowField12}>{whisperModelComputeTypeSelect}</div>
            </div>
        ) : <></>

        const enableReazonSpeechPrecisionType = serverConfigState.serverConfiguration?.recognizer_type == "reazonspeech-k2-v2"
        const reazonSpeechPrecisionTypeSelectRow = enableReazonSpeechPrecisionType ? (
            <div className={configSubAreaRow}>
                <div className={BasicLabel({ width: "large" })}>{t("reazon_speech_precision_type")}:</div>
                <div className={configSubAreaRowField12}>{reazonSpeechPrecisionTypeSelect}</div>
            </div>
        ) : <></>

        const languageSelectRow = (
            <div className={configSubAreaRow}>
                <div className={BasicLabel({ width: "large" })}>{t("transcribe_language")}:</div>
                <div className={configSubAreaRowField12}>{languageSelect}</div>
            </div>

        )
        return (
            <>
                <div className={configSubArea}>
                    {whisperModelTypeSelectRow}
                    {whisperModelComputeTypeSelectRow}
                    {reazonSpeechPrecisionTypeSelectRow}
                    {languageSelectRow}

                </div>
            </>
        );
    }, [
        whisperModelTypeSelect,
        whisperModelComputeTypeSelect,
        reazonSpeechPrecisionTypeSelect,
        languageSelect,
        serverConfigState.serverConfiguration,
    ]);

    return component;
};
