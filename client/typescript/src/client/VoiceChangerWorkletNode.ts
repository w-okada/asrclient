import { VoiceChangerWorkletProcessorRequest } from "../@types/voice-changer-worklet-processor";
import { ConvertResultResponse, DefaultClientSettng, PerformanceData, VOICE_CHANGER_CLIENT_EXCEPTION, WorkletNodeSetting, WorkletSetting } from "../const";
import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { RingBuffer } from "../utils/RingBuffer";
const WorkletNodeRole = {
    IN: "IN",
    OUT: "OUT",
} as const;
type WorkletNodeRole = (typeof WorkletNodeRole)[keyof typeof WorkletNodeRole];

export type VoiceChangerWorkletListener = {
    notifyPerformanceData: (perf: PerformanceData) => void;
    notifyException: (code: VOICE_CHANGER_CLIENT_EXCEPTION, message: string) => void;
    notifyNewTranscription: (transcription: ConvertResultResponse) => void;
};

export type InternalCallback = {
    processAudio: (data: Uint8Array) => Promise<Uint8Array>;
};

export class VoiceChangerWorkletNode extends AudioWorkletNode {
    private listener: VoiceChangerWorkletListener;
    private role: WorkletNodeRole;

    private setting: WorkletNodeSetting = DefaultClientSettng.workletNodeSetting;
    // private requestChunks: ArrayBuffer[] = [];
    private requestChunkSamples: RingBuffer = new RingBuffer(48000 * 60); // 一分
    private socket: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;

    private isInputRecording = false;
    private recordingInputChunk: Float32Array[] = [];
    private isOutputRecording = false;
    private recordingOutputChunk: Float32Array[] = [];
    private outputNode: VoiceChangerWorkletNode | null = null;

    // Promises
    private startPromiseResolve: ((value: void | PromiseLike<void>) => void) | null = null;
    private stopPromiseResolve: ((value: void | PromiseLike<void>) => void) | null = null;

    // InternalCallback
    private internalCallback: InternalCallback | null = null;

    constructor(context: AudioContext, role: WorkletNodeRole, listener: VoiceChangerWorkletListener) {
        super(context, "voice-changer-worklet-processor");
        this.role = role;
        this.port.onmessage = this.handleMessage.bind(this);
        this.listener = listener;
        this.createSocketIO();
        console.log(`[worklet_node][voice-changer-worklet-processor][${this.role}] created.`);
    }

    setOutputNode = (outputNode: VoiceChangerWorkletNode | null) => {
        this.outputNode = outputNode;
    };

    // 設定
    updateSetting = (setting: WorkletNodeSetting) => {
        // console.log(`[WorkletNode][${this.role}] Updating WorkletNode Setting,`, this.setting, setting);
        let recreateSocketIoRequired = false;
        if (this.setting.serverUrl != setting.serverUrl || this.setting.protocol != setting.protocol || this.setting.workOnColab != setting.workOnColab) {
            recreateSocketIoRequired = true;
        }
        this.setting = setting;
        console.log(`updateSetting this.setting`, this.setting)
        if (recreateSocketIoRequired) {
            this.createSocketIO();
        }
    };

    setInternalAudioProcessCallback = (internalCallback: InternalCallback) => {
        this.internalCallback = internalCallback;
    };

    getSettings = (): WorkletNodeSetting => {
        return this.setting;
    };

    getSocketId = () => {
        return this.socket?.id;
    };

    // 処理
    private createSocketIO = () => {
        if (this.socket) {
            console.log("close socket");
            this.socket.close();
            this.socket = null;
        }
        if (this.setting.workOnColab == false) {
            // プロトコル設定にかかわらずSIOを作成しに行く。ただし、workOnColabがtrueの場合は作成しない
            this.socket = io(this.setting.serverUrl + "/test");
            this.socket.on("connect_error", (err) => {
                console.log(`[SIO][${this.role}] connect failed`);
                this.socket!.close();
                this.socket = null;
                this.listener.notifyException(VOICE_CHANGER_CLIENT_EXCEPTION.ERR_SIO_CONNECT_FAILED, `[SIO][${this.role}] rconnection failed ${err}`);
            });
            this.socket.on("connect", () => {
                console.log(`[SIO][${this.role}] connected on ${this.socket?.id}`);
            });
            this.socket.on("close", (socket) => {
                console.log(`[SIO][${this.role}] close ${socket.id}`);
            });

            this.socket.on("message", (response: any[]) => {
                console.log(`[SIO][${this.role}]message:`, response);
            });

            this.socket.on("response", (response: any[]) => {
                // const timestamp = response[0] as number;
                const result = response[1] as ArrayBuffer;
                const performance_data = response[2] as string;

                const perf = JSON.parse(performance_data) as PerformanceData;
                this.listener.notifyPerformanceData(perf);

                // Quick hack for server device mode
                if (response[0] == 0) {
                    // this.listener.notifyResponseTime(Math.round(perf[0] * 1000), perf.slice(1, 4));
                    return;
                }

                const arrayBuffer = result;
                const float32Array = new Float32Array(arrayBuffer);
                // console.log(`[worklet_node][${this.role}]Response Timestamp:`, responseTimestamp, float32Array);
                if (this.outputNode != null) {
                    if (float32Array.length > 1) {
                        this.outputNode.postReceivedVoice(float32Array);
                    } else {
                        console.debug(`[worklet_node][${this.role}] skip short data length:${float32Array.length}`);
                    }
                } else {
                    console.error(`[worklet_node][${this.role}] outputNode is null`);
                }
            });
            this.socket.on("perf", (perfString: string) => {
                const perf = JSON.parse(perfString) as PerformanceData;
                this.listener.notifyPerformanceData(perf);
            });
            this.socket.on("command", (val) => {
                const cmd = val[0];
                const data = val[1];
                console.log("command received ", cmd, data);
            });
        }
    };

    postReceivedVoice = (data: Float32Array) => {
        const req: VoiceChangerWorkletProcessorRequest = {
            requestType: "voice",
            // voice: upSampledBuffer,
            voice: data,
            numTrancateTreshold: 0,
            outputBufferFactor: 0,
        };
        this.port.postMessage(req);

        if (this.isOutputRecording) {
            this.recordingOutputChunk.push(data);
        }
    };

    handleMessage(event: any) {
        // console.log(`[Node:handleMessage_][${this.role}] `, event.data.volume);
        if (event.data.responseType === "start_ok") {
            if (this.startPromiseResolve) {
                this.startPromiseResolve();
                this.startPromiseResolve = null;
            }
        } else if (event.data.responseType === "stop_ok") {
            if (this.stopPromiseResolve) {
                this.stopPromiseResolve();
                this.stopPromiseResolve = null;
            }
        } else if (event.data.responseType === "volume") {
            // this.listener.notifyVolume(event.data.volume as number);
        } else if (event.data.responseType === "inputData") {
            const inputData = event.data.inputData as Float32Array;

            if (this.isInputRecording) {
                this.recordingInputChunk.push(inputData);
            }
            this.requestChunkSamples.addSamples(inputData);
            const readSampleNum = this.setting.sendingChunkSec * 48000;
            if (this.requestChunkSamples.getCurrentSize() < readSampleNum) {
                return;
            }
            const samples = this.requestChunkSamples.readSamples(readSampleNum);
            // samplesをUint8Arrayとして扱う
            const newBuffer = new Uint8Array(samples.buffer);
            this.sendBuffer(newBuffer);
        } else {
            console.warn(`[worklet_node][voice-changer-worklet-processor][${this.role}] unknown response ${event.data.responseType}`, event.data);
        }
    }

    generatePath = (path: string): string => {
        // console.log(`generatePath ${this.setting.serverUrl}`)
        // console.log(` generatePath this.setting`, this.setting)

        if (this.setting.enableFlatPath) {
            return this.setting.serverUrl + path[0] + path.slice(1).replace(/\//g, "_");
        }
        return this.setting.serverUrl + path;
    };

    private sendBuffer = async (newBuffer: Uint8Array) => {
        const timestamp = Date.now();
        if (this.setting.protocol === "sio" && this.setting.workOnColab == false) {
            if (!this.socket) {
                console.warn(`[worklet_node][${this.role}] sio is not initialized`);
                throw new Error("sio is not initialized.");
            }
            // console.log(`[worklet_node][${this.role}]emit!`)
            let bulk = this.setting.sendingChunkAsBulk == true;
            this.socket.emit("request_message", [timestamp, bulk, newBuffer.buffer]);
        } else if (this.setting.protocol === "rest" || this.setting.workOnColab == true) {
            const formData = new FormData();
            formData.append("waveform", new Blob([newBuffer]), "waveform.bin");

            let path = "";
            if (this.setting.sendingChunkAsBulk == true) {
                path = this.generatePath("/api/voice-changer/convert_chunk_bulk");
            } else {
                path = this.generatePath("/api/voice-changer/convert_chunk");
            }
            const options = {
                method: "POST",
                body: formData,
                headers: {},
            };
            if (!this.setting.enableFlatPath) {
                options.headers = {
                    "x-timestamp": timestamp.toString(),
                };
            }
            const response = await fetch(path, options);
            if (response.ok) {
                // 成功時の処理
                const performance_data = response.headers.get("x-performance");
                if (performance_data) {
                    const perf = JSON.parse(performance_data) as PerformanceData;
                    this.listener.notifyPerformanceData(perf);
                }
                const data = await (response.json()) as ConvertResultResponse
                this.listener.notifyNewTranscription(data);
            } else {
                // エラー時の処理
                console.error(`[worklet_node]Error:`, response.status);
            }

        } else if (this.setting.protocol == "internal") {
            if (!this.internalCallback) {
                this.listener.notifyException(
                    VOICE_CHANGER_CLIENT_EXCEPTION.ERR_INTERNAL_AUDIO_PROCESS_CALLBACK_IS_NOT_INITIALIZED,
                    `[AudioWorkletNode][${this.role}] internal audio process callback is not initialized`,
                );
                return;
            }
            // const res = await this.internalCallback.processAudio(newBuffer);
            // if (res.length < 128 * 2) {
            //     return;
            // }
            // if (this.outputNode != null) {
            //     this.outputNode.postReceivedVoice(res.buffer);
            // } else {
            //     this.postReceivedVoice(res.buffer);
            // }
            // this.internalCallback.processAudio(newBuffer).then((res) => {
            //     if (res.length < 128 * 2) {
            //         return;
            //     }
            //     if (this.outputNode != null) {
            //         this.outputNode.postReceivedVoice(res.buffer);
            //     } else {
            //         this.postReceivedVoice(res.buffer);
            //     }
            // });
        } else {
            throw "unknown protocol";
        }
    };

    // Worklet操作
    configureWorklet = (setting: WorkletSetting) => {
        const req: VoiceChangerWorkletProcessorRequest = {
            requestType: "config",
            voice: new Float32Array(1),
            numTrancateTreshold: setting.numTrancateTreshold,
            outputBufferFactor: setting.outputBufferFactor,
        };
        this.port.postMessage(req);
    };

    start = async () => {
        const p = new Promise<void>((resolve) => {
            this.startPromiseResolve = resolve;
        });
        const req: VoiceChangerWorkletProcessorRequest = {
            requestType: "start",
            voice: new Float32Array(1),
            numTrancateTreshold: 0,
            outputBufferFactor: 0,
        };
        this.port.postMessage(req);
        await p;
    };
    stop = async () => {
        const p = new Promise<void>((resolve) => {
            this.stopPromiseResolve = resolve;
        });
        const req: VoiceChangerWorkletProcessorRequest = {
            requestType: "stop",
            voice: new Float32Array(1),
            numTrancateTreshold: 0,
            outputBufferFactor: 0,
        };
        this.port.postMessage(req);
        await p;
    };
    trancateBuffer = () => {
        const req: VoiceChangerWorkletProcessorRequest = {
            requestType: "trancateBuffer",
            voice: new Float32Array(1),
            numTrancateTreshold: 0,
            outputBufferFactor: 0,
        };
        this.port.postMessage(req);
    };

    startInputRecording = () => {
        this.recordingInputChunk = [];
        this.isInputRecording = true;
    };
    stopInputRecording = () => {
        this.isInputRecording = false;
        const dataSize = this.recordingInputChunk.reduce((prev, cur) => {
            return prev + cur.length;
        }, 0);
        const samples = new Float32Array(dataSize);
        let sampleIndex = 0;
        for (let i = 0; i < this.recordingInputChunk.length; i++) {
            for (let j = 0; j < this.recordingInputChunk[i].length; j++) {
                samples[sampleIndex] = this.recordingInputChunk[i][j];
                sampleIndex++;
            }
        }
        return samples;
    };

    startOutputRecording = () => {
        this.recordingOutputChunk = [];
        this.isOutputRecording = true;
    };
    stopOutputRecording = () => {
        this.isOutputRecording = false;

        const dataSize = this.recordingOutputChunk.reduce((prev, cur) => {
            return prev + cur.length;
        }, 0);
        const samples = new Float32Array(dataSize);
        let sampleIndex = 0;
        for (let i = 0; i < this.recordingOutputChunk.length; i++) {
            for (let j = 0; j < this.recordingOutputChunk[i].length; j++) {
                samples[sampleIndex] = this.recordingOutputChunk[i][j];
                sampleIndex++;
            }
        }
        return samples;
    };
}
