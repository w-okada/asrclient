import { useEffect, useRef, useState } from "react";
import {
    GPUInfo,
    VCRestClient,
    HttpException,
    VOICE_CHANGER_CLIENT_EXCEPTION,
    ASRConfiguration,
} from "asr-client-typescript-client-lib";

export type ServerConfigState = {
    serverConfiguration?: ASRConfiguration;
    serverGpuInfo?: GPUInfo[];
    supportLanguages: string[]
};

export type ServerConfigStateAndMethod = ServerConfigState & {
    reloadServerConfiguration: () => Promise<void>;
    updateServerConfiguration: (conf: ASRConfiguration) => Promise<void>;

    initializeServer: () => Promise<void>;
    // startRecording: () => Promise<void>;
    // stopRecording: () => Promise<void>;
};

export type UseServerConfigProps = {
    exceptionCallback: (message: string) => void;
    flatPath: boolean;
    serverBaseUrl: string;
};
// サーバ情報取得と更新。音声変換以外のRESTでの操作が集まっている。
export const useServerConfig = (props: UseServerConfigProps): ServerConfigStateAndMethod => {
    const restClient = useRef<VCRestClient>();
    const [serverConfiguration, setServerConfiguration] = useState<ASRConfiguration>();
    const [serverGpuInfo, setServerGpuInfo] = useState<GPUInfo[]>();
    const [supportLanguages, setSupportLanguages] = useState<string[]>([]);

    useEffect(() => {
        restClient.current = VCRestClient.getInstance();
        restClient.current.setEnableFlatPath(props.flatPath);
        restClient.current.setBaseUrl(props.serverBaseUrl);

        // setEnableFlatPath, setBaseUrlの後に情報取得をし直す必要がある。
        restClient.current.getServerConfiguration();
        reloadServerConfiguration();
        reloadServerGpuInfo();
        reloadSupportLanguages();
    }, [props.flatPath, props.serverBaseUrl]);

    // サーバ情報取得系
    const reloadServerConfiguration = async () => {
        if (!restClient.current) {
            console.log("restClient.current is null");
            return;
        }
        const conf = await restClient.current.getServerConfiguration();
        setServerConfiguration(conf);
    };
    const reloadServerGpuInfo = async () => {
        if (!restClient.current) {
            return;
        }
        const gpuInfo = await restClient.current.getServerGPUInfo();
        setServerGpuInfo(gpuInfo);
    };
    const reloadSupportLanguages = async () => {
        if (!restClient.current) {
            return;
        }
        const languages = await restClient.current.getSupportLanguages();
        setSupportLanguages(languages);
    }


    // 設定系
    // 共通のエラーハンドリング関数
    const withErrorHandling = async (fn: () => Promise<void>) => {
        try {
            await fn();
        } catch (error) {
            console.info("[RestClient] Error occurred:", error);
            if (error.type == VOICE_CHANGER_CLIENT_EXCEPTION.ERR_HTTP_EXCEPTION) {
                const message = `${error.status}[${error.statusText}]: ${error.reason} ${error.action}`;
                props.exceptionCallback(message);
            } else {
                throw error;
            }
        }
    };

    const updateServerConfiguration = async (conf: ASRConfiguration) => {
        await withErrorHandling(async () => {
            await _updateServerConfiguration(conf);

        });
    };

    const _updateServerConfiguration = async (conf: ASRConfiguration) => {
        if (!restClient.current) {
            return;
        }
        await restClient.current.updateServerConfiguration(conf);
        await reloadServerConfiguration();
        await reloadSupportLanguages()
    };

    // オペレーション系
    const initializeServer = async () => {
        if (!restClient.current) {
            return;
        }
        await restClient.current.initializeServer();
    };

    // const startRecording = async () => {
    //     if (!restClient.current) {
    //         return;
    //     }
    //     await restClient.current.startRecording();
    // };
    // const stopRecording = async () => {
    //     if (!restClient.current) {
    //         return;
    //     }
    //     await restClient.current.stopRecording();
    // };


    const res = {
        serverConfiguration,
        serverGpuInfo,
        supportLanguages,
        reloadServerConfiguration,
        updateServerConfiguration,
        initializeServer,
    };
    return res;
};
