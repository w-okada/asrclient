import { useMemo } from "react";
import React from "react";
import { configSubAreaRow, configSubAreaRowField12, configSubAreaRowField14, configSubAreaRowField15, configSubAreaRowTitle4, configSubAreaRowTitle5, configSubAreaRowTitle7 } from "../../styles/configArea.css";
import { useAppRoot } from "../../001_AppRootProvider";
import { useTranslation } from "react-i18next";
import { BasicLabel } from "../../styles/style-components/labels/01_basic-label.css";

export const InferenceAreaGPU = () => {
    const { serverConfigState } = useAppRoot();
    const { t } = useTranslation();

    const options = useMemo(() => {
        if (!serverConfigState.serverGpuInfo) {
            return <></>;
        }
        const options = serverConfigState.serverGpuInfo.map((c) => {
            return (
                <option key={c.device_id_int} value={c.device_id_int}>
                    {c.name}[{c.device_id_int}]
                </option>
            );
        });
        return options;
    }, [serverConfigState.serverGpuInfo]);

    const GPUSecSelect = useMemo(() => {
        if (!serverConfigState.serverConfiguration) {
            return <></>;
        }
        const onGpuChanged = (val: number) => {
            if (!serverConfigState.serverConfiguration) {
                return <></>;
            }
            serverConfigState.serverConfiguration.gpu_device_id_int = val;
            serverConfigState.updateServerConfiguration(serverConfigState.serverConfiguration);
        };
        return (
            <select
                defaultValue={serverConfigState.serverConfiguration.gpu_device_id_int}
                onChange={(e) => {
                    onGpuChanged(Number(e.target.value));
                }}
            >
                {options}
            </select>
        );
    }, [options, serverConfigState.serverConfiguration]);

    const component = useMemo(() => {
        return (
            <div className={configSubAreaRow}>
                <div className={BasicLabel({ width: "large" })}>{t("config_area_gpu")}:</div>
                <div className={configSubAreaRowField12}>{GPUSecSelect}</div>
            </div>
        );
    }, [GPUSecSelect]);

    return component;
};
