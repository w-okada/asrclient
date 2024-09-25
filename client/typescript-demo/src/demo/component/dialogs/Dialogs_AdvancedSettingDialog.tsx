import React, { useMemo } from "react";
import {
    closeButton,
    closeButtonRow,
    dialogFixedSizeContent,
    dialogFrame,
    dialogItemName20,
    dialogItemRow,
    dialogItemValue,
    dialogTitle,
    instructions,
} from "../../../styles/dialog.css";
import { useGuiState } from "../../GuiStateProvider";
import { useTranslation } from "react-i18next";
import { useAppRoot } from "../../../001_AppRootProvider";
import { useAppState } from "../../../002_AppStateProvider";
import { Protocol, Protocols } from "asr-client-typescript-client-lib";

type CloseButtonRowProps = {
    closeClicked: () => void;
};

const CloseButtonRow = (props: CloseButtonRowProps) => {
    const { t } = useTranslation();
    return (
        <div className={closeButtonRow}>
            <div
                className={closeButton}
                onClick={() => {
                    props.closeClicked();
                }}
            >
                {t("dialog_advanced_setting_button_close")}
            </div>
        </div>
    );
};
const ProtocolSelect = () => {
    const { t } = useTranslation();
    const { voiceChangerClientState } = useAppState();
    const component = useMemo(() => {
        return (
            <div className={dialogItemRow}>
                <div className={dialogItemName20}>{t("dialog_advanced_setting_protocol")}</div>
                <div className={dialogItemValue}>
                    <select
                        value={voiceChangerClientState.protocol}
                        onChange={(e) => {
                            voiceChangerClientState.setProtocol(e.target.value as Protocol);
                        }}
                    >
                        {Protocols.map((v) => {
                            return (
                                <option key={v} value={v}>
                                    {v}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>
        );
    }, [voiceChangerClientState.protocol]);
    return component;
};



type AdvancedSettingDialogProps = {};

export const AdvancedSettingDialog = (props: AdvancedSettingDialogProps) => {
    const { t } = useTranslation();
    const { serverConfigState, triggerToast } = useAppRoot();
    const { setDialogName } = useGuiState();

    const backClicked = () => {
        setDialogName("none");
    };
    const component = useMemo(() => {
        return (
            <div className={dialogFrame}>
                <div className={dialogTitle}>{t("dialog_advanced_setting_title")}</div>
                <div className={instructions}>{t("dialog_advanced_setting_instruction")}</div>
                <div className={dialogFixedSizeContent}>
                    <ProtocolSelect></ProtocolSelect>
                </div>
                <CloseButtonRow closeClicked={backClicked}></CloseButtonRow>
            </div>
        );
    }, []);
    return component;
};
