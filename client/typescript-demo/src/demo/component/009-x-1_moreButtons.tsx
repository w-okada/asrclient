import { useEffect, useMemo } from "react";
import React from "react";
import {
    configSubAreaButtonContainer,
    configSubAreaButtonContainerButton,
    configSubAreaButtonContainerCheckbox,
    configSubAreaRow,
    configSubAreaRowField15,
    configSubAreaRowTitle4,
    configSubAreaRowTitle10,
    configSubAreaRowTitle5,
    configSubAreaRowTitle7,
    configSubAreaRowField12,
    configSubAreaRowField30,
} from "../../styles/configArea.css";
import { useAppRoot } from "../../001_AppRootProvider";
import { useTranslation } from "react-i18next";
import { left1Padding } from "../../styles/base.css";
import { AudioDeviceType } from "../../const";
import { isDesktopApp } from "../../util/isDesctopApp";
import { useGuiState } from "../GuiStateProvider";
import { Logger } from "../../util/logger";

export const MoreActionsButtons = () => {
    const { serverConfigState, audioConfigState } = useAppRoot();
    const { t } = useTranslation();

    const component = useMemo(() => {

        const onOpenLogViewerClicked = async () => {
            if (isDesktopApp()) {
                const url = new URL(window.location.href);
                const baseUrl = `${url.protocol}//${url.hostname}${url.port ? ":" + url.port : ""}`;
                // @ts-ignore
                window.electronAPI.openBrowser(`${baseUrl}/?app_mode=LogViewer`);
            } else {
                // ブラウザを開く
                window.open("/?app_mode=LogViewer", "_blank", "noopener,noreferrer");

                // // @ts-ignore
                // window.electronAPI.openBrowser("https://github.com/w-okada/voice-changer");
            }
        };

        const onDownloadLogClicked = async () => {
            const clientLogs = Logger.getLogger().getLogs();
            const clientogTexts = clientLogs
                .map((log) => {
                    return `${log.timestamp}\t${log.level}\t${log.message.join("\t")}`;
                })
                .reduce((prev, current) => {
                    return `${prev}\n${current}`;
                }, "");

            const serverLogRes = await fetch("/asr-client.log");
            const serverLogTexts = await serverLogRes.text();

            const outputLogs = "===== Server Logs =======\n" + serverLogTexts + "====== Client Logs ======\n" + clientogTexts;

            // Blobオブジェクトを作成
            const blob = new Blob([outputLogs], { type: "application/json" });

            // ダウンロード用のリンクを動的に作成
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "logs.txt";
            document.body.appendChild(a);
            a.click();

            // 一度使用したリンクは削除
            document.body.removeChild(a);
        };

        return (
            <div className={configSubAreaRow}>
                <div className={`${configSubAreaRowTitle7} ${left1Padding}`}>{t("config_area_more_actions_area_title")}:</div>
                <div className={configSubAreaRowField30}>
                    <div className={configSubAreaButtonContainer}>
                        <div onClick={onOpenLogViewerClicked} className={configSubAreaButtonContainerButton}>
                            {t("config_area_more_actions_area_open_log_viewer")}
                        </div>
                        <div onClick={onDownloadLogClicked} className={configSubAreaButtonContainerButton}>
                            {t("config_area_more_actions_area_download_log")}
                        </div>

                    </div>
                </div>
            </div>
        );
    }, [serverConfigState]);

    return component;
};
