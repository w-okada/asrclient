import { useMemo } from "react";
import React from "react";
import { useAppRoot } from "../../001_AppRootProvider";
import { BrowserAudioDeviceAreaDeviceSelect } from "./007-x-2-1_BrowserAudioDeviceAreaDeviceSelect";

export const AudioDeviceAreaDeviceSelect = () => {
    const { serverConfigState } = useAppRoot();
    const component = useMemo(() => {
        return (
            <>
                <BrowserAudioDeviceAreaDeviceSelect type={"Input"}></BrowserAudioDeviceAreaDeviceSelect>
                {/* <BrowserAudioDeviceAreaDeviceSelect type={"Output"}></BrowserAudioDeviceAreaDeviceSelect> */}
                {/* <BrowserAudioDeviceAreaDeviceSelect type={"Monitor"}></BrowserAudioDeviceAreaDeviceSelect> */}
            </>
        );
    }, [serverConfigState.serverConfiguration]);

    return component;
};
