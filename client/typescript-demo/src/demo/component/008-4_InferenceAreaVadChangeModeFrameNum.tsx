import { useMemo } from "react";
import React from "react";
import { configSubAreaRow, configSubAreaRowField12 } from "../../styles/configArea.css";
import { useAppRoot } from "../../001_AppRootProvider";
import { useTranslation } from "react-i18next";
import { BasicLabel } from "../../styles/style-components/labels/01_basic-label.css";


export const InferenceAreaVadChangeModeFrameNum = () => {
    const { serverConfigState } = useAppRoot();
    const { t } = useTranslation();

    const options = useMemo(() => {
        const options = [3, 4, 5, 6, 7, 8, 9, 10].map((num) => {

            return (
                <option key={num} value={num}>
                    {num}
                </option>
            );
        });
        return options;
    }, []);

    const select = useMemo(() => {

        if (!serverConfigState.serverConfiguration) {
            return <></>;
        }
        const onVadChangeModeFrameNumChanged = (val: number) => {
            if (!serverConfigState.serverConfiguration) {
                return;
            }
            serverConfigState.serverConfiguration.vad_change_mode_frame_num = val
            serverConfigState.updateServerConfiguration(serverConfigState.serverConfiguration)
        };


        return (
            <select
                value={serverConfigState.serverConfiguration.vad_change_mode_frame_num}
                onChange={(e) => {
                    onVadChangeModeFrameNumChanged(Number(e.target.value));
                }}
            >
                {options}
            </select>
        );
    }, [options, serverConfigState.serverConfiguration]);

    const component = useMemo(() => {

        return (
            <div className={configSubAreaRow}>
                <div className={BasicLabel({ width: "large" })}>{t("config_area_vad_change_mode_frame_num")}:</div>
                <div className={configSubAreaRowField12}>{select}</div>
            </div>
        );
    }, [select]);

    return component;
};
