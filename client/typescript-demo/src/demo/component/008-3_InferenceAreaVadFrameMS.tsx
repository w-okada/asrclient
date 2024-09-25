import { useMemo } from "react";
import React from "react";
import { configSubAreaRow, configSubAreaRowField12 } from "../../styles/configArea.css";
import { useAppRoot } from "../../001_AppRootProvider";
import { useTranslation } from "react-i18next";
import { BasicLabel } from "../../styles/style-components/labels/01_basic-label.css";
import { VadFrameDurationMs } from "asr-client-typescript-client-lib";


export const InferenceAreaVadFrameDurationMs = () => {
    const { serverConfigState } = useAppRoot();
    const { t } = useTranslation();

    const options = useMemo(() => {
        const options = VadFrameDurationMs.map((ms) => {
            return (
                <option key={ms} value={ms}>
                    {ms}ms
                </option>
            );
        });
        return options;
    }, []);

    const select = useMemo(() => {
        if (!serverConfigState.serverConfiguration) {
            return <></>;
        }
        const onVadFrameDurationMsChanged = (val: number) => {
            if (!serverConfigState.serverConfiguration) {
                return;
            }
            serverConfigState.serverConfiguration.vad_frame_duration_ms = val as VadFrameDurationMs;
            serverConfigState.updateServerConfiguration(serverConfigState.serverConfiguration)
        };

        return (
            <select
                value={serverConfigState.serverConfiguration.vad_frame_duration_ms}
                onChange={(e) => {
                    onVadFrameDurationMsChanged(Number(e.target.value));
                }}
            >
                {options}
            </select>
        );
    }, [options, serverConfigState.serverConfiguration]);

    const component = useMemo(() => {
        return (
            <div className={configSubAreaRow}>
                <div className={BasicLabel({ width: "large" })}>{t("config_area_vad_frame_duration_ms")}:</div>
                <div className={configSubAreaRowField12}>{select}</div>
            </div>
        );
    }, [select]);

    return component;
};
