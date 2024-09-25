import { useMemo } from "react";
import React from "react";
import {
    configSubAreaButtonContainer,
    configSubAreaButtonContainerCheckbox,
    configSubAreaRow,
    configSubAreaRowField12,
    configSubAreaRowField15,
    configSubAreaRowTitle4,
    configSubAreaRowTitle7,
} from "../../styles/configArea.css";
import { useAppRoot } from "../../001_AppRootProvider";
import { useTranslation } from "react-i18next";
import { useAppState } from "../../002_AppStateProvider";
import { BasicLabel } from "../../styles/style-components/labels/01_basic-label.css";

export const NoiseSupression = () => {
    const { serverConfigState } = useAppRoot();
    const { voiceChangerClientState } = useAppState();

    const { t } = useTranslation();

    const component = useMemo(() => {

        return (
            <div className={configSubAreaRow}>
                <div className={BasicLabel({ width: "large" })}>{t("config_area_noise_supression")}:</div>
                <div className={configSubAreaRowField12}>
                    <div className={configSubAreaButtonContainer}>
                        <div className={configSubAreaButtonContainerCheckbox}>
                            <input
                                type="checkbox"
                                checked={voiceChangerClientState.enableEchoCancellation}
                                onChange={(e) => {
                                    voiceChangerClientState.setEnableEchoCancellation(e.target.checked);
                                }}
                            />
                            <span>{t("config_area_noise_supression_echo_cancel")}</span>
                        </div>
                        <div className={configSubAreaButtonContainerCheckbox}>
                            <input
                                type="checkbox"
                                checked={voiceChangerClientState.enableNoiseSuppression}
                                onChange={(e) => {
                                    voiceChangerClientState.setEnableNoiseSuppression(e.target.checked);
                                }}
                            />
                            <span>{t("config_area_noise_supression_supression1")}</span>
                        </div>
                        <div className={configSubAreaButtonContainerCheckbox}>
                            <input
                                type="checkbox"
                                checked={voiceChangerClientState.enableNoiseSuppression2}
                                onChange={(e) => {
                                    voiceChangerClientState.setEnableNoiseSuppression2(e.target.checked);
                                }}
                            />
                            <span>{t("config_area_noise_supression_supression2")}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [
        serverConfigState.serverConfiguration,
        voiceChangerClientState.enableEchoCancellation,
        voiceChangerClientState.enableNoiseSuppression,
        voiceChangerClientState.enableNoiseSuppression2,
        voiceChangerClientState.setEnableEchoCancellation,
        voiceChangerClientState.setEnableNoiseSuppression,
        voiceChangerClientState.setEnableNoiseSuppression2,
    ]);

    return component;
};
