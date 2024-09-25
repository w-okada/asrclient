import { useEffect, useRef, useState } from "react";
import {
    VOICE_CHANGER_CLIENT_EXCEPTION,
    VoiceChangerClient,
    downloadAsWav,
    initDB,
    setItem,
    getItem,
    clearStore,
    PerformanceData,
    ClientSetting,
    Protocol,
    ConvertResultResponse,
} from "asr-client-typescript-client-lib";

export type ASRClientState = {
    voiceChangerClientInitialized: boolean;
    isClientSettingLoaded: boolean;
    exceptionCode: VOICE_CHANGER_CLIENT_EXCEPTION | null;
    isStarted: boolean;
    recordingStarted: boolean;

    audioInput: string | MediaStream;
    audioOutput: string;
    audioMonitor: string;
    audioInputGain: number;
    audioOutputGain: number;
    audioMonitorGain: number;
    enableEchoCancellation: boolean;
    enableNoiseSuppression: boolean;
    enableNoiseSuppression2: boolean;
    protocol: Protocol;
    sendingChunkSec: number;

    performanceData: PerformanceData | null;

    texts: string[];
    midText: string;
};

export type ASRClientStateAndMethod = ASRClientState & {
    setAudioContext: (ctx: AudioContext) => void;
    start: () => void;
    stop: () => void;

    // 保存が必要な設定
    setAudioInput: (audioInput: string | MediaStream) => void;
    setAudioOutput: (audioOutput: string) => void;
    setAudioMonitor: (audioMonitor: string) => void;
    setAudioInputGain: (audioInputGain: number) => void;
    setAudioOutputGain: (audioOutputGain: number) => void;
    setAudioMonitorGain: (audioMonitorGain: number) => void;
    setEnableEchoCancellation: (enableEchoCancellation: boolean) => void;
    setEnableNoiseSuppression: (enableNoiseSuppression: boolean) => void;
    setEnableNoiseSuppression2: (enableNoiseSuppression2: boolean) => void;
    setProtocol: (protocol: Protocol) => void;

    // 一時的な情報
    setRecordingStarted: (recordingStarted: boolean) => void;

    clearDb: () => Promise<void>;

    setSendingChunkSec: (num: number) => void;
    setTexts: (texts: string[]) => void;
    setMidText: (midText: string) => void;

};

type useASRClientProps = {
    enableFlatPath: boolean;
    workOnColab: boolean;
    serverBaseUrl: string
};
export const useASRClient = (props: useASRClientProps): ASRClientStateAndMethod => {
    const voiceChangerClient = useRef<VoiceChangerClient | null>(null);
    const [voiceChangerClientInitialized, setVoiceChangerClientInitialized] = useState<boolean>(false);
    const [exceptionCode, setExceptionCode] = useState<VOICE_CHANGER_CLIENT_EXCEPTION | null>(null);

    const [isStarted, setIsStarted] = useState<boolean>(false);
    const [recordingStarted, setRecordingStarted] = useState<boolean>(false);

    // 保存が必要な設定
    const [clientSetting, setClientSetting] = useState<ClientSetting | null>(null);
    const [isClientSettingLoaded, setIsClientSettingLoaded] = useState<boolean>(false);
    const [audioOutput, setAudioOutput] = useState<string>();
    const [audioMonitor, setAudioMonitor] = useState<string>();

    // performance data
    const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
    const [texts, setTexts] = useState<string[]>([]);
    const [midText, setMidText] = useState<string>("");

    // データのリストア
    useEffect(() => {
        if (!voiceChangerClientInitialized) {
            return;
        }

        const initData = async () => {
            if (!voiceChangerClient.current) {
                throw new Error("voiceChangerClient is not initialized.");
            }
            await initDB();

            // ClinetSettingのリストア
            const clientSetting = voiceChangerClient.current.getClientSetting();

            const savedAudioInput = (await getItem("audioInput")) || "none";
            const savedAudioInputGain = (await getItem("audioInputGain")) || 1;
            const savedAudioOutputGain = (await getItem("audioOutputGain")) || 1;
            const savedAudioMonitorGain = (await getItem("audioMonitorGain")) || 1;
            const savedEnableEchoCancellation = (await getItem("enableEchoCancellation")) || true;
            const savedEnableNoiseSuppression = (await getItem("enableNoiseSuppression")) || true;
            const savedEnableNoiseSuppression2 = (await getItem("enableNoiseSuppression2")) || true;
            const savedProtocol = (await getItem("Protocol")) || "rest";
            const savedOutputBufferFactor = (await getItem("outputBufferFactor")) || 1;
            const savedSendingChunkSec = (await getItem("sendingChunkSec")) || 3;
            // const sendingChunkNum = savedSendingChunkNum || props.sendingChunkNum;

            const loadedClientSetting: ClientSetting = {
                voiceChangerClientSetting: {
                    ...clientSetting.voiceChangerClientSetting,
                    audioInput: savedAudioInput,
                    echoCancel: savedEnableEchoCancellation,
                    noiseSuppression: savedEnableNoiseSuppression,
                    noiseSuppression2: savedEnableNoiseSuppression2,
                    inputGain: savedAudioInputGain,
                    outputGain: savedAudioOutputGain,
                    monitorGain: savedAudioMonitorGain,
                },
                workletNodeSetting: {
                    ...clientSetting.workletNodeSetting,
                    enableFlatPath: props.enableFlatPath,
                    workOnColab: props.workOnColab,
                    protocol: savedProtocol,
                    sendingChunkSec: savedSendingChunkSec,
                    serverUrl: props.serverBaseUrl,
                    // sendingChunkNum: sendingChunkNum,
                },
                workletSetting: {
                    ...clientSetting.workletSetting,
                },
            };
            setClientSetting(loadedClientSetting);
            setIsClientSettingLoaded(true);

            // その他の設定のリストア
            const savedAudioOutput = (await getItem("audioOutput")) || "none";
            setAudioOutput(savedAudioOutput);
            const savedAudioMonitor = (await getItem("audioMonitor")) || "none";
            setAudioMonitor(savedAudioMonitor);
        };

        initData();
    }, [voiceChangerClientInitialized]);

    // // Colab向け
    // useEffect(() => {
    //     if (!clientSetting) return;
    //     if (props.enableFlatPath) {
    //         clientSetting.workletNodeSetting.enableFlatPath = props.enableFlatPath;
    //         setClientSetting({ ...clientSetting });
    //     }
    // }, [voiceChangerClient.current, voiceChangerClientInitialized, props.enableFlatPath]);

    // データの保存
    useEffect(() => {
        if (!clientSetting) return;
        if (!clientSetting.voiceChangerClientSetting) return;
        if (!clientSetting.workletSetting) return;

        if (typeof clientSetting.voiceChangerClientSetting.audioInput === "string") {
            setItem("audioInput", clientSetting.voiceChangerClientSetting.audioInput);
        }
        setItem("audioInputGain", clientSetting.voiceChangerClientSetting.inputGain);
        setItem("audioOutputGain", clientSetting.voiceChangerClientSetting.outputGain);
        setItem("audioMonitorGain", clientSetting.voiceChangerClientSetting.monitorGain);
        setItem("enableEchoCancellation", clientSetting.voiceChangerClientSetting.echoCancel);
        setItem("enableNoiseSuppression", clientSetting.voiceChangerClientSetting.noiseSuppression);
        setItem("enableNoiseSuppression2", clientSetting.voiceChangerClientSetting.noiseSuppression2);
        setItem("Protocol", clientSetting.workletNodeSetting.protocol);
        setItem("outputBufferFactor", clientSetting.workletSetting.outputBufferFactor);
        setItem("sendingChunkSec", clientSetting.workletNodeSetting.sendingChunkSec);
    }, [clientSetting]);

    useEffect(() => {
        if (!audioOutput) return;
        setItem("audioOutput", audioOutput);
    }, [audioOutput]);
    useEffect(() => {
        if (!audioMonitor) return;
        setItem("audioMonitor", audioMonitor);
    }, [audioMonitor]);

    // データのクリア
    const clearDb = async () => {
        clearStore();
    };

    // 設定
    const setAudioInput = (audioInput: string | MediaStream) => {
        // if (typeof audioInput !== "string") return;
        if (!voiceChangerClient.current || !voiceChangerClientInitialized) {
            return;
        }
        if (!clientSetting) return;
        // const clientSetting = voiceChangerClient.current.getClientSetting();
        clientSetting.voiceChangerClientSetting.audioInput = audioInput;
        // setClientSetting(clientSetting);
        setClientSetting((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                voiceChangerClientSetting: {
                    ...prev.voiceChangerClientSetting,
                    audioInput: audioInput,
                },
            };
        });
    };
    const setAudioInputGain = (audioInputGain: number) => {
        if (!voiceChangerClient.current || !voiceChangerClientInitialized) {
            return;
        }
        if (!clientSetting) return;
        // const clientSetting = voiceChangerClient.current.getClientSetting();
        clientSetting.voiceChangerClientSetting.inputGain = audioInputGain;
        // setClientSetting(clientSetting);
        setClientSetting((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                voiceChangerClientSetting: {
                    ...prev.voiceChangerClientSetting,
                    inputGain: audioInputGain,
                },
            };
        });
    };
    const setAudioOutputGain = (audioOutputGain: number) => {
        if (!voiceChangerClient.current || !voiceChangerClientInitialized) {
            return;
        }
        if (!clientSetting) return;
        // const clientSetting = voiceChangerClient.current.getClientSetting();
        clientSetting.voiceChangerClientSetting.outputGain = audioOutputGain;
        // setClientSetting(clientSetting);
        setClientSetting((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                voiceChangerClientSetting: {
                    ...prev.voiceChangerClientSetting,
                    outputGain: audioOutputGain,
                },
            };
        });
    };
    const setAudioMonitorGain = (audioMonitorGain: number) => {
        if (!voiceChangerClient.current || !voiceChangerClientInitialized) {
            return;
        }
        if (!clientSetting) return;
        // const clientSetting = voiceChangerClient.current.getClientSetting();
        clientSetting.voiceChangerClientSetting.monitorGain = audioMonitorGain;
        // setClientSetting(clientSetting);
        setClientSetting((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                voiceChangerClientSetting: {
                    ...prev.voiceChangerClientSetting,
                    monitorGain: audioMonitorGain,
                },
            };
        });
    };
    const setEnableEchoCancellation = (enableEchoCancellation: boolean) => {
        if (!voiceChangerClient.current || !voiceChangerClientInitialized) {
            return;
        }
        if (!clientSetting) return;
        // const clientSetting = voiceChangerClient.current.getClientSetting();
        clientSetting.voiceChangerClientSetting.echoCancel = enableEchoCancellation;
        // setClientSetting(clientSetting);
        setClientSetting((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                voiceChangerClientSetting: {
                    ...prev.voiceChangerClientSetting,
                    echoCancel: enableEchoCancellation,
                },
            };
        });
    };
    const setEnableNoiseSuppression = (enableNoiseSuppression: boolean) => {
        if (!voiceChangerClient.current || !voiceChangerClientInitialized) {
            return;
        }
        if (!clientSetting) return;
        // const clientSetting = voiceChangerClient.current.getClientSetting();
        clientSetting.voiceChangerClientSetting.noiseSuppression = enableNoiseSuppression;
        // setClientSetting(clientSetting);
        setClientSetting((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                voiceChangerClientSetting: {
                    ...prev.voiceChangerClientSetting,
                    noiseSuppression: enableNoiseSuppression,
                },
            };
        });
    };
    const setEnableNoiseSuppression2 = (enableNoiseSuppression2: boolean) => {
        if (!voiceChangerClient.current || !voiceChangerClientInitialized) {
            return;
        }
        if (!clientSetting) return;
        // const clientSetting = voiceChangerClient.current.getClientSetting();
        clientSetting.voiceChangerClientSetting.noiseSuppression2 = enableNoiseSuppression2;
        // setClientSetting(clientSetting);
        setClientSetting((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                voiceChangerClientSetting: {
                    ...prev.voiceChangerClientSetting,
                    noiseSuppression2: enableNoiseSuppression2,
                },
            };
        });
    };
    const setProtocol = (protocol: Protocol) => {
        if (!voiceChangerClient.current || !voiceChangerClientInitialized) {
            return;
        }
        if (!clientSetting) return;
        clientSetting.workletNodeSetting.protocol = protocol;
        setClientSetting((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                workletNodeSetting: {
                    ...prev.workletNodeSetting,
                    protocol: protocol,
                },
            };
        });
    };

    const setSendingChunkSec = (num: number) => {
        if (!voiceChangerClient.current || !voiceChangerClientInitialized) {
            console.log("voiceChangerClient is not initialized.");
            return;
        }
        if (!clientSetting) {
            console.log("clientSetting is not initialized.");
            return;
        }
        // const clientSetting = voiceChangerClient.current.getClientSetting();
        clientSetting.workletNodeSetting.sendingChunkSec = num;
        // setClientSetting(clientSetting);
        setClientSetting((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                workletNodeSetting: {
                    ...prev.workletNodeSetting,
                    sendingChunkSec: num,
                },
            };
        });
    };


    const setAudioContext = (ctx: AudioContext) => {
        voiceChangerClient.current = new VoiceChangerClient(ctx, true, {
            notifyPerformanceData: (perf: PerformanceData) => {
                setPerformanceData(perf);
            },
            notifyException: (code: VOICE_CHANGER_CLIENT_EXCEPTION, message: string) => {
                setExceptionCode(code);
            },
            notifyNewTranscription: (transcription: ConvertResultResponse) => {
                if (transcription.texts.length == 0 && transcription.mid_text == null) return;
                setTexts((prev) => [...prev, ...transcription.texts]);
                setMidText(transcription.mid_text || "")
            }
        });
        const checkInitiazized = async () => {
            if (!voiceChangerClient.current) {
                return;
            }
            const initialized = await voiceChangerClient.current.isInitialized();
            setVoiceChangerClientInitialized(initialized);
            voiceChangerClient.current.setServerUrl(props.serverBaseUrl)

        };
        checkInitiazized();
    };

    const start = async () => {
        if (!voiceChangerClient.current) {
            return;
        }
        setIsStarted(true);
    };
    const stop = async () => {
        if (!voiceChangerClient.current) {
            return;
        }
        setIsStarted(false);
    };
    useEffect(() => {
        if (!voiceChangerClient.current) {
            return;
        }
        if (isStarted) {
            voiceChangerClient.current.start();
        } else {
            voiceChangerClient.current.stop();
        }
    }, [isStarted]);

    // audioInputの変更時にaudioInputを設定し直す。
    useEffect(() => {
        if (!voiceChangerClient.current || !voiceChangerClientInitialized) {
            return;
        }
        if (!clientSetting || !clientSetting.voiceChangerClientSetting.audioInput) {
            return;
        }
        voiceChangerClient.current.updateClientSetting(clientSetting);
    }, [voiceChangerClient.current, clientSetting?.voiceChangerClientSetting.audioInput, voiceChangerClientInitialized]);


    useEffect(() => {
        if (!voiceChangerClient.current || !voiceChangerClientInitialized) {
            return;
        }
        if (!clientSetting) {
            return;
        }
        voiceChangerClient.current.updateClientSetting(clientSetting);
    }, [voiceChangerClient.current, clientSetting, voiceChangerClientInitialized]);

    useEffect(() => {
        if (!voiceChangerClient.current || !voiceChangerClientInitialized) {
            return;
        }
        if (recordingStarted == true) {
            voiceChangerClient.current.startOutputRecording();
        } else {
            const record = voiceChangerClient.current.stopOutputRecording();
            if (record.length > 0) downloadAsWav(record);
        }
    }, [recordingStarted, voiceChangerClientInitialized]);

    const res = {
        voiceChangerClientInitialized,
        isClientSettingLoaded,
        exceptionCode,
        isStarted,
        recordingStarted,
        audioInput: clientSetting?.voiceChangerClientSetting.audioInput || "none",
        audioOutput: audioOutput || "none",
        audioMonitor: audioMonitor || "none",
        audioInputGain: clientSetting?.voiceChangerClientSetting.inputGain || 1,
        audioOutputGain: clientSetting?.voiceChangerClientSetting.outputGain || 1,
        audioMonitorGain: clientSetting?.voiceChangerClientSetting.monitorGain || 1,
        enableEchoCancellation: clientSetting?.voiceChangerClientSetting.echoCancel || false,
        enableNoiseSuppression: clientSetting?.voiceChangerClientSetting.noiseSuppression || false,
        enableNoiseSuppression2: clientSetting?.voiceChangerClientSetting.noiseSuppression2 || false,
        protocol: clientSetting?.workletNodeSetting.protocol || "rest",
        sendingChunkSec: clientSetting?.workletNodeSetting.sendingChunkSec || 3,
        performanceData,
        texts,
        midText,
        setAudioContext,
        start,
        stop,
        setAudioInput,
        setAudioOutput,
        setAudioMonitor,
        setAudioInputGain,
        setAudioOutputGain,
        setAudioMonitorGain,
        setEnableEchoCancellation,
        setEnableNoiseSuppression,
        setEnableNoiseSuppression2,
        setProtocol,
        setRecordingStarted,
        clearDb,
        setSendingChunkSec,
        setTexts,
        setMidText,
    };
    return res;
};
