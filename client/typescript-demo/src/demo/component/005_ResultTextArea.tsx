import { useEffect, useMemo, useRef } from "react";
import { resultArea, resultArea_button, resultArea_buttonArea, resultArea_textArea, resultArea_textSpan, resultArea_textSpan_nofixed } from "../../styles/characterArea.css";
import React from "react";
import { useAppRoot } from "../../001_AppRootProvider";
import { useTranslation } from "react-i18next";
import { useAppState } from "../../002_AppStateProvider";
import { useGuiState } from "../GuiStateProvider";

export const ResultTextArea = () => {
    const { serverConfigState } = useAppRoot();
    const { voiceChangerClientState } = useAppState();
    const { t } = useTranslation();
    const { setDialog2Name, setDialog2Props } = useGuiState();
    const textAreaRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
        }
    }, [voiceChangerClientState.texts, voiceChangerClientState.midText]);

    const startControl = useMemo(() => {
        const onClearClicked = async () => {
            let ok = false;
            const p = new Promise<boolean>((resolve) => {
                setDialog2Props({
                    title: t("result_text_area_clear_confirm_title"),
                    instruction: `${t("result_text_area_clear_confirm_instruction")}`,
                    defaultValue: "",
                    resolve: resolve,
                    options: null,
                });
                setDialog2Name("confirmDialog");
            });
            const res = await p;
            if (res == true) {
                ok = true;
            } else {
                ok = false;
            }

            if (ok) {
                voiceChangerClientState.setTexts([])
                voiceChangerClientState.setMidText("")
            }
        }
        const onDownloadClicked = async () => {
            const combinedText = `${voiceChangerClientState.texts.join("\n")}\n${voiceChangerClientState.midText}`;
            const blob = new Blob([combinedText], { type: "text/plain" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "texts.txt"; // Set the download filename
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }
        return (
            <div className={resultArea}>
                <div ref={textAreaRef} className={resultArea_textArea}>
                    {voiceChangerClientState.texts.map((t) => { return <div key={t} className={resultArea_textSpan}>{t}</div> })}
                    <div className={resultArea_textSpan_nofixed}>{voiceChangerClientState.midText}</div>
                </div>
                <div className={resultArea_buttonArea}>
                    <button className={resultArea_button} onClick={() => { onClearClicked() }}>{t("result_text_area_clear_button_label")}</button>
                    <button className={resultArea_button} onClick={() => { onDownloadClicked() }}>{t("result_text_area_download_button_label")}</button>
                </div>
            </div >
        );
    }, [voiceChangerClientState.isStarted, serverConfigState.serverConfiguration, voiceChangerClientState.texts, voiceChangerClientState.midText]);

    return startControl;
};
