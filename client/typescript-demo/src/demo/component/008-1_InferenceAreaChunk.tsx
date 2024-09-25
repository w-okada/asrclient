import { useMemo } from "react";
import React from "react";
import { configSubAreaRow, configSubAreaRowField12, configSubAreaRowField14, configSubAreaRowField15, configSubAreaRowTitle4, configSubAreaRowTitle5, configSubAreaRowTitle7 } from "../../styles/configArea.css";
import { useAppRoot } from "../../001_AppRootProvider";
import { useTranslation } from "react-i18next";
import { useAppState } from "../../002_AppStateProvider";
import { BasicLabel } from "../../styles/style-components/labels/01_basic-label.css";


export const InferenceAreaChunk = () => {
    const { guiSetting } = useAppRoot();
    const { t } = useTranslation();
    const { voiceChangerClientState } = useAppState();

    const options = useMemo(() => {
        if (!guiSetting.setting?.inputChunkSec) {
            return <></>;
        }
        const options = guiSetting.setting?.inputChunkSec.map((c) => {
            const sec = c;
            const sample = Math.floor(sec * 48000);
            return (
                <option key={c} value={c}>
                    {sample} [{c} {t("config_area_chunk_sec")}]
                </option>
            );
        });
        return options;
    }, [guiSetting.setting?.inputChunkSec]);

    const chunkSecSelect = useMemo(() => {

        const onChunkSecChanged = (val: number) => {
            voiceChangerClientState.setSendingChunkSec(val);
        };

        return (
            <select
                value={voiceChangerClientState.sendingChunkSec}
                onChange={(e) => {
                    onChunkSecChanged(Number(e.target.value));
                }}
            >
                {options}
            </select>
        );
    }, [options, voiceChangerClientState.sendingChunkSec, voiceChangerClientState.setSendingChunkSec]);

    const component = useMemo(() => {
        return (
            <div className={configSubAreaRow}>
                <div className={BasicLabel({ width: "large" })}>{t("config_area_chunk")}:</div>
                <div className={configSubAreaRowField12}>{chunkSecSelect}</div>
            </div>
        );
    }, [chunkSecSelect]);

    return component;
};
