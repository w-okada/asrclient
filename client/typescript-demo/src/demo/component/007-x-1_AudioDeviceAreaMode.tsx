import { useMemo } from "react";
import React from "react";
import {
    configSubAreaButtonContainer,
    configSubAreaButtonContainerButton,
    configSubAreaButtonContainerCheckbox,
    configSubAreaRow,
    configSubAreaRowField15,
    configSubAreaRowTitle4,
} from "../../styles/configArea.css";
import { useAppRoot } from "../../001_AppRootProvider";
import { useTranslation } from "react-i18next";
import { useAppState } from "../../002_AppStateProvider";
import { BasicLabel } from "../../styles/style-components/labels/01_basic-label.css";

export const AudioDeviceMode = () => {
    const { serverConfigState, triggerToast, audioConfigState } = useAppRoot();
    const { voiceChangerClientState, setServerAudioDeviceReloaded, serverAudioDeviceReloaded } = useAppState();

    const { t } = useTranslation();
    const component = useMemo(() => {
        const reloadDeviceInfo = async () => {
            await audioConfigState.reloadDeviceInfo();
        };

        return (
            <div className={configSubAreaRow}>
                <div className={BasicLabel({ width: "large" })}>{t("config_area_audio_device_mode")}:</div>
                <div className={configSubAreaRowField15}>
                    <div className={configSubAreaButtonContainer}>
                        <div onClick={reloadDeviceInfo} className={configSubAreaButtonContainerButton}>
                            {t("config_area_audio_device_reload")}
                        </div>
                    </div>
                </div>
            </div >
        );
    }, [
        serverConfigState.serverConfiguration,
        voiceChangerClientState.isStarted,
        serverAudioDeviceReloaded
    ]);

    return component;
};
