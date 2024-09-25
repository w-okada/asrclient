import React, { useContext, useEffect, useMemo, useState } from "react";
import { ReactNode } from "react";
import { AudioConfigStateAndMethods, useAudioConfig } from "./hooks/001_useAudioConfig";
import { AppMode } from "../const";
import { AppGuiSettingStateAndMethod, useAppGuiSetting } from "./hooks/002_useAppGuiSetting";
import { toast, TypeOptions } from "react-toastify";
import { ServerConfigStateAndMethod, useServerConfig } from "./hooks/003_useServerConfig";
import { Logger } from "../util/logger";
import { isMobile } from "react-device-detect";
import { getGenerateGetPathFunc } from "../util/generateColabProxyPath";
import { setupI18n } from "../i18n";

console.log("[Window]", window);
const colabServer = window.colab_server;
const colabServerPort = window.colab_server_port;
const runOnColab = colabServer == 1;
console.log("runOnColab", runOnColab)

type Props = {
    children: ReactNode;
};

type AppRootValue = {
    audioConfigState: AudioConfigStateAndMethods;
    guiSetting: AppGuiSettingStateAndMethod;
    serverConfigState: ServerConfigStateAndMethod;
    appMode: AppMode;
    serverBaseUrl: string;
    setAppMode: (mode: AppMode) => void;
    triggerToast: (level: TypeOptions, message: string) => void;
    setUnhandledRejectionToastEnabled: (value: boolean) => void;
    generateGetPathFunc: (path: string) => string
};

const AppRootContext = React.createContext<AppRootValue | null>(null);
export const useAppRoot = (): AppRootValue => {
    const state = useContext(AppRootContext);
    if (!state) {
        throw new Error("useAppState must be used within AppStateProvider");
    }
    return state;
};

export const AppRootProvider = ({ children }: Props) => {
    const serverBaseUrl = useMemo(() => {
        return colabServerPort ? `https://localhost:${colabServerPort}` : "";
    }, [])
    const generateGetPathFunc = useMemo(() => {
        return getGenerateGetPathFunc(serverBaseUrl, runOnColab)
    }, [])
    useMemo(() => {
        const i18nPath = generateGetPathFunc("/assets/i18n/{{lng}}/{{ns}}.json")
        setupI18n(i18nPath)
    }, [])


    const triggerToast = (level: TypeOptions, message: string) => {
        toast(message, {
            type: level,
            position: "bottom-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });
    };
    const [unhandledRejectionToastEnabled, setUnhandledRejectionToastEnabled] = useState(true);
    const audioConfigState = useAudioConfig({
        createAudioContextDelay: isMobile ? 2000 : 0,
    });
    const guiSetting = useAppGuiSetting({
        generateGetPathFunc: generateGetPathFunc
    });

    const serverConfigState = useServerConfig({
        exceptionCallback: (message: string) => {
            triggerToast("error", message);
        },
        flatPath: colabServer == 1 ? true : guiSetting.edition == "colab" ? true : false,
        serverBaseUrl: serverBaseUrl
    });
    const [appMode, setAppMode] = useState<AppMode>("App");

    // Colabの時の処理
    const [colabSettingDone, setColabSettingDone] = useState(false);
    useEffect(() => {
        if (!serverConfigState.serverConfiguration) {
            return;
        }
        if (colabSettingDone) {
            return
        }
        if (runOnColab) {
            serverConfigState.serverConfiguration.gpu_device_id_int = 0;
            serverConfigState.updateServerConfiguration(serverConfigState.serverConfiguration);
        }
        setColabSettingDone(true);
    }, [serverConfigState.serverConfiguration])

    useEffect(() => {
        const dummyReload = async () => {
            guiSetting.reloadEditionDummy()
            setTimeout(() => {
                dummyReload()
            }, 1000 * 10)
        }
        if (runOnColab) {
            dummyReload()
        }
    }, []);

    useEffect(() => {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        const appMode = params.get("app_mode") || null;
        if (appMode == "Test") {
            setAppMode("Test");
        } else if (appMode == "LogViewer") {
            setAppMode("LogViewer");
        } else {
            setAppMode("App");
        }
    }, []);

    const handledRejection = (event: PromiseRejectionEvent) => {
        const error = event.reason as Error;
        // if (unhandledRejectionToastEnabled) {
        //     triggerToast("error", `${error.name}, ${error.message}`);
        // }
        Logger.getLogger().error("Unhandled Rejection", error);
        Logger.getLogger().error(
            "Unhandled Rejection",
            "[Possible Cause 1]: Errors occur when other clients are running. This is because resources such as the database are treated exclusively.",
        );
        event.preventDefault();
    };

    useEffect(() => {
        window.addEventListener("unhandledrejection", handledRejection);
        return () => {
            window.removeEventListener("unhandledrejection", handledRejection);
        };
    }, [unhandledRejectionToastEnabled]);

    const providerValue: AppRootValue = {
        audioConfigState,
        guiSetting,
        serverConfigState,
        appMode,
        serverBaseUrl,
        setAppMode,
        triggerToast,
        setUnhandledRejectionToastEnabled,
        generateGetPathFunc,
    };

    return <AppRootContext.Provider value={providerValue}>{children}</AppRootContext.Provider>;
};
