import { useMemo } from "react";
import {
    characterAreaControl,
    characterAreaControlButtonActive,
    characterAreaControlButtonStanby,
    characterAreaControlButtons,
} from "../../styles/characterArea.css";
import React from "react";
import { useAppRoot } from "../../001_AppRootProvider";
import { useTranslation } from "react-i18next";
import { useAppState } from "../../002_AppStateProvider";

export const AudioControlArea = () => {
    const { serverConfigState } = useAppRoot();
    const { voiceChangerClientState } = useAppState();
    const { t } = useTranslation();

    const startControl = useMemo(() => {

        const onStartClicked = async () => {
            if (voiceChangerClientState.isStarted) {
                return;
            }
            voiceChangerClientState.start();
        };
        const onStopClicked = async () => {
            if (!voiceChangerClientState.isStarted) {
                return;
            }
            voiceChangerClientState.stop();
        };

        const startClassName = voiceChangerClientState.isStarted ? characterAreaControlButtonActive : characterAreaControlButtonStanby;
        const stopClassName = voiceChangerClientState.isStarted ? characterAreaControlButtonStanby : characterAreaControlButtonActive;

        return (
            <div className={characterAreaControl}>
                <div className={characterAreaControlButtons}>
                    <div onClick={onStartClicked} className={startClassName}>
                        {t("character_area_control_start")}
                    </div>
                    <div onClick={onStopClicked} className={stopClassName}>
                        {t("character_area_control_stop")}
                    </div>

                </div>
            </div>
        );
    }, [voiceChangerClientState.isStarted, serverConfigState.serverConfiguration]);

    return startControl;
};
