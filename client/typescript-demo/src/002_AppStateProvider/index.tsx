import React, { useContext, useEffect, useState } from "react";
import { ReactNode } from "react";
import { useAppRoot } from "../001_AppRootProvider";
import { ASRClientStateAndMethod, useASRClient } from "./hooks/001_useASRClient";
type Props = {
    children: ReactNode;
};

type AppStateValue = {
    displayColorMode: DisplayColorMode
    voiceChangerClientState: ASRClientStateAndMethod;
    serverAudioDeviceReloaded: boolean;
    setDisplayColorMode: (mode: DisplayColorMode) => void
    setServerAudioDeviceReloaded: (val: boolean) => void;
};

const AppStateContext = React.createContext<AppStateValue | null>(null);
export const useAppState = (): AppStateValue => {
    const state = useContext(AppStateContext);
    if (!state) {
        throw new Error("useAppState must be used within AppStateProvider");
    }
    return state;
};

export const DisplayColorMode = ["light", "dark"] as const;
export type DisplayColorMode = typeof DisplayColorMode[number];


export const AppStateProvider = ({ children }: Props) => {
    const [displayColorMode, setDisplayColorMode] = useState<DisplayColorMode>("light");
    const { audioConfigState, guiSetting, serverBaseUrl } = useAppRoot();
    const voiceChangerClientState = useASRClient({
        enableFlatPath: guiSetting.edition == "colab" ? true : false,
        workOnColab: guiSetting.edition == "colab" ? true : false,
        serverBaseUrl: serverBaseUrl,
    });
    const [serverAudioDeviceReloaded, setServerAudioDeviceReloaded] = useState(false);

    useEffect(() => {
        if (!audioConfigState.audioContext) {
            return;
        }
        voiceChangerClientState.setAudioContext(audioConfigState.audioContext);
        voiceChangerClientState.setAudioOutput("default")
    }, [audioConfigState.audioContext]);

    const providerValue: AppStateValue = {
        displayColorMode,
        voiceChangerClientState,
        serverAudioDeviceReloaded,
        setDisplayColorMode,
        setServerAudioDeviceReloaded,
    };
    return <AppStateContext.Provider value={providerValue}>{children}</AppStateContext.Provider>;
};
