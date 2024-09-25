import { useMemo } from "react";
import React from "react";
import { configSubAreaRow, configSubAreaRowTitle5, configSubAreaRowField14, configSubArea, configSubAreaRowField12, configSubAreaRowTitle7, configSubAreaRowField30 } from "../../styles/configArea.css";
import { useAppRoot } from "../../001_AppRootProvider";
import { useTranslation } from "react-i18next";
import { ComputeType, ReazonSpeechPrecisionType, WhisperModelType } from "asr-client-typescript-client-lib";
import { BasicLabel } from "../../styles/style-components/labels/01_basic-label.css";
import { useGuiState } from "../GuiStateProvider";
import { resultArea_buttonArea, webHookArea, webHookArea_buttonArea } from "../../styles/characterArea.css";
import { BasicButton } from "../../styles/style-components/buttons/01_basic-button.css";
import { headerButtonThema, normalButtonThema } from "../../styles/style-components/buttons/thema/button-thema.css";


export const WebHookArea = () => {
    const { serverConfigState } = useAppRoot();
    const { t } = useTranslation();
    const { setDialog2Props, setDialog2Name } = useGuiState()

    const component = useMemo(() => {
        const setWebhookUrl = async () => {
            if (!serverConfigState.serverConfiguration) {
                return
            }
            const inputArea = document.getElementById("webhook_area_text_input") as HTMLInputElement;
            const url = inputArea.value;
            serverConfigState.serverConfiguration.webhook_url = url;
            await serverConfigState.updateServerConfiguration(serverConfigState.serverConfiguration);
        }
        const clearWebhookUrl = async () => {
            if (!serverConfigState.serverConfiguration) {
                return
            }
            const inputArea = document.getElementById("webhook_area_text_input") as HTMLInputElement;
            inputArea.value = "";
            const url = inputArea.value;
            serverConfigState.serverConfiguration.webhook_url = url;
            await serverConfigState.updateServerConfiguration(serverConfigState.serverConfiguration);
        }

        const webHookUrlTextInputRow = (
            <div className={configSubAreaRow}>
                <div className={BasicLabel()}>{t("webhook_area_title")}:</div>
                <div className={configSubAreaRowField30}><input type="text" id="webhook_area_text_input" defaultValue={serverConfigState.serverConfiguration?.webhook_url || ""}></input></div>
                <div className={webHookArea_buttonArea}>
                    <button className={`${BasicButton()} ${normalButtonThema}`} onClick={() => { clearWebhookUrl() }}>{t("webhook_area_button_clear")}</button>
                    <button className={`${BasicButton()} ${normalButtonThema}`} onClick={() => { setWebhookUrl() }}>{t("webhook_area_button_set")}</button>
                </div>
            </div>
        )

        return (
            <>
                <div className={webHookArea}>
                    {webHookUrlTextInputRow}
                </div>
            </>
        );
    }, [
        serverConfigState.serverConfiguration,
    ]);

    return component;
};
