import { VoiceChangerWorkletNode, VoiceChangerWorkletListener, InternalCallback } from "./client/VoiceChangerWorkletNode";
// @ts-ignore
import workerjs from "raw-loader!../worklet/dist/index.js";
import { VoiceFocusDeviceTransformer, VoiceFocusTransformDevice } from "amazon-chime-sdk-js";
import { ClientSetting, DefaultClientSettng, WorkletNodeSetting, WorkletSetting } from "./const";

// オーディオデータの流れ
// input node(mic or MediaStream) -> [vf node] -> [vc node] ->
//    sio/rest server ->  [vc node] -> output node

import { BlockingQueue } from "./utils/BlockingQueue";
import { createDummyMediaStream } from "./utils/createDummyMediaStream";
import { validateUrl } from "./utils/validateUrl";

export class VoiceChangerClient {
    private ctx: AudioContext;
    private vfEnable = false;
    private vf: VoiceFocusDeviceTransformer | null = null;
    private currentDevice: VoiceFocusTransformDevice | null = null;

    private currentMediaStream: MediaStream | null = null;
    private currentMediaStreamAudioSourceNode: MediaStreamAudioSourceNode | null = null;
    private inputGainNode: GainNode | null = null;
    private outputGainNode: GainNode | null = null;
    private monitorGainNode: GainNode | null = null;
    private vcInNode!: VoiceChangerWorkletNode;
    private vcOutNode!: VoiceChangerWorkletNode;
    private currentMediaStreamAudioDestinationNode: MediaStreamAudioDestinationNode | null = null;
    private currentMediaStreamAudioDestinationMonitorNode: MediaStreamAudioDestinationNode | null = null;

    private promiseForInitialize: Promise<void>;
    private _isVoiceChanging = false;

    // private setting: VoiceChangerClientSetting = DefaultClientSettng.voiceChangerClientSetting;
    private clientSetting: ClientSetting = DefaultClientSettng;

    // private sslCertified: string[] = [];

    private sem = new BlockingQueue<number>();

    constructor(ctx: AudioContext, vfEnable: boolean, voiceChangerWorkletListener: VoiceChangerWorkletListener) {
        this.sem.enqueue(0);
        this.ctx = ctx;
        this.vfEnable = vfEnable;
        this.promiseForInitialize = new Promise<void>(async (resolve) => {
            const scriptUrl = URL.createObjectURL(new Blob([workerjs], { type: "text/javascript" }));

            // await this.ctx.audioWorklet.addModule(scriptUrl)
            // this.vcInNode = new VoiceChangerWorkletNode(this.ctx, voiceChangerWorkletListener); // vc node

            try {
                this.vcInNode = new VoiceChangerWorkletNode(this.ctx, "IN", voiceChangerWorkletListener); // vc node
            } catch (err) {
                await this.ctx.audioWorklet.addModule(scriptUrl);
                this.vcInNode = new VoiceChangerWorkletNode(this.ctx, "IN", voiceChangerWorkletListener); // vc node
            }

            // const ctx44k = new AudioContext({ sampleRate: 44100 }) // これでもプチプチが残る
            const ctx44k = new AudioContext({ sampleRate: 48000 }); // 結局これが一番まし。
            // const ctx44k = new AudioContext({ sampleRate: 16000 }); // LLVCテスト⇒16K出力でプチプチなしで行ける。
            try {
                this.vcOutNode = new VoiceChangerWorkletNode(ctx44k, "OUT", voiceChangerWorkletListener); // vc node
            } catch (err) {
                await ctx44k.audioWorklet.addModule(scriptUrl);
                this.vcOutNode = new VoiceChangerWorkletNode(ctx44k, "OUT", voiceChangerWorkletListener); // vc node
            }
            this.currentMediaStreamAudioDestinationNode = ctx44k.createMediaStreamDestination(); // output node
            this.outputGainNode = ctx44k.createGain();
            this.outputGainNode.gain.value = this.clientSetting.voiceChangerClientSetting.outputGain;
            this.vcOutNode.connect(this.outputGainNode); // vc node -> output node
            this.outputGainNode.connect(this.currentMediaStreamAudioDestinationNode);

            this.currentMediaStreamAudioDestinationMonitorNode = ctx44k.createMediaStreamDestination(); // output node
            this.monitorGainNode = ctx44k.createGain();
            this.monitorGainNode.gain.value = this.clientSetting.voiceChangerClientSetting.monitorGain;
            this.vcOutNode.connect(this.monitorGainNode); // vc node -> monitor node
            this.monitorGainNode.connect(this.currentMediaStreamAudioDestinationMonitorNode);

            if (this.vfEnable) {
                this.vf = await VoiceFocusDeviceTransformer.create({ variant: "c20" });
                const dummyMediaStream = createDummyMediaStream(this.ctx);
                this.currentDevice = (await this.vf.createTransformDevice(dummyMediaStream)) || null;
            }
            resolve();
        });
    }

    private lock = async () => {
        const num = await this.sem.dequeue();
        return num;
    };
    private unlock = (num: number) => {
        this.sem.enqueue(num + 1);
    };

    isInitialized = async () => {
        if (this.promiseForInitialize) {
            await this.promiseForInitialize;
        }
        return true;
    };

    /////////////////////////////////////////////////////
    // オペレーション
    /////////////////////////////////////////////////////
    /// Operations ///
    setup = async () => {
        console.log(`Input Setup=> audio: ${this.clientSetting.voiceChangerClientSetting.audioInput}`);
        console.log(
            `Input Setup=> echo: ${this.clientSetting.voiceChangerClientSetting.echoCancel}, noise1: ${this.clientSetting.voiceChangerClientSetting.noiseSuppression}, noise2: ${this.clientSetting.voiceChangerClientSetting.noiseSuppression2}`,
        );
        // condition check
        if (!this.vcInNode) {
            console.warn("vc node is not initialized.");
            throw "vc node is not initialized.";
        }

        // Main Process
        //// shutdown & re-generate mediastream
        if (this.currentMediaStream) {
            this.currentMediaStream.getTracks().forEach((x) => {
                x.stop();
            });
            this.currentMediaStream = null;
        }

        // //// Input デバイスがnullの時はmicStreamを止めてリターン
        // if (!this.clientSetting.voiceChangerClientSetting.audioInput) {
        //     console.log(`Input Setup=> client mic is disabled. ${this.clientSetting.voiceChangerClientSetting.audioInput}`);
        //     this.vcInNode.stop();
        //     await this.unlock(lockNum);
        //     return;
        // }

        if (typeof this.clientSetting.voiceChangerClientSetting.audioInput == "string") {
            try {
                if (this.clientSetting.voiceChangerClientSetting.audioInput == "none") {
                    console.log("Input Setup=> dummy stream.");
                    this.currentMediaStream = createDummyMediaStream(this.ctx);
                } else {
                    this.currentMediaStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            deviceId: this.clientSetting.voiceChangerClientSetting.audioInput,
                            channelCount: 1,
                            sampleRate: this.clientSetting.voiceChangerClientSetting.sampleRate,
                            sampleSize: 16,
                            autoGainControl: false,
                            echoCancellation: this.clientSetting.voiceChangerClientSetting.echoCancel,
                            noiseSuppression: this.clientSetting.voiceChangerClientSetting.noiseSuppression,
                        },
                    });
                }
            } catch (e) {
                console.warn(e);
                this.vcInNode.stop();
                throw e;
            }
            // this.currentMediaStream.getAudioTracks().forEach((x) => {
            //     console.log("MIC Setting(cap)", x.getCapabilities())
            //     console.log("MIC Setting(const)", x.getConstraints())
            //     console.log("MIC Setting(setting)", x.getSettings())
            // })
        } else {
            this.currentMediaStream = this.clientSetting.voiceChangerClientSetting.audioInput;
        }

        // connect nodes.
        this.currentMediaStreamAudioSourceNode = this.ctx.createMediaStreamSource(this.currentMediaStream);
        this.inputGainNode = this.ctx.createGain();
        this.inputGainNode.gain.value = this.clientSetting.voiceChangerClientSetting.inputGain;
        this.currentMediaStreamAudioSourceNode.connect(this.inputGainNode);
        if (this.currentDevice && this.clientSetting.voiceChangerClientSetting.noiseSuppression2) {
            this.currentDevice.chooseNewInnerDevice(this.currentMediaStream);
            const voiceFocusNode = await this.currentDevice.createAudioNode(this.ctx); // vf node
            this.inputGainNode.connect(voiceFocusNode.start); // input node -> vf node
            voiceFocusNode.end.connect(this.vcInNode);
        } else {
            // console.log("input___ media stream", this.currentMediaStream)
            // this.currentMediaStream.getTracks().forEach(x => {
            //     console.log("input___ media stream set", x.getSettings())
            //     console.log("input___ media stream con", x.getConstraints())
            //     console.log("input___ media stream cap", x.getCapabilities())
            // })
            // console.log("input___ media node", this.currentMediaStreamAudioSourceNode)
            // console.log("input___ gain node", this.inputGainNode.channelCount, this.inputGainNode)
            this.inputGainNode.connect(this.vcInNode);
        }
        this.vcInNode.setOutputNode(this.vcOutNode);
        console.log("Input Setup=> success");
    };
    get stream(): MediaStream | null {
        return this.currentMediaStreamAudioDestinationNode?.stream || null;
    }
    get monitorStream(): MediaStream | null {
        return this.currentMediaStreamAudioDestinationMonitorNode?.stream || null;
    }

    start = async () => {
        await this.vcInNode.start();
        this._isVoiceChanging = true;
    };
    stop = async () => {
        await this.vcInNode.stop();
        this._isVoiceChanging = false;
    };

    get isVoiceChanging(): boolean {
        return this._isVoiceChanging;
    }

    ////////////////////////
    /// 設定
    //////////////////////////////
    setServerUrl = (serverUrl: string, openTab: boolean = false) => {
        console.log(`serverUrl:${serverUrl}, openTab: ${openTab}`);
        const url = validateUrl(serverUrl);
        // const pageUrl = `${location.protocol}//${location.host}`;

        // if (url != pageUrl && url.length != 0 && location.protocol == "https:" && this.sslCertified.includes(url) == false) {
        //     if (openTab) {
        //         const value = window.confirm(
        //             "MMVC Server is different from this page's origin. Open tab to open ssl connection. OK? (You can close the opened tab after ssl connection succeed.)",
        //         );
        //         if (value) {
        //             window.open(url, "_blank");
        //             this.sslCertified.push(url);
        //         } else {
        //             alert("Your voice conversion may fail...");
        //         }
        //     }
        // }
        this.vcInNode.updateSetting({ ...this.vcInNode.getSettings(), serverUrl: url });
    };

    getClientSetting = (): ClientSetting => {
        return {
            voiceChangerClientSetting: { ...this.clientSetting.voiceChangerClientSetting },
            workletNodeSetting: { ...this.clientSetting.workletNodeSetting },
            workletSetting: { ...this.clientSetting.workletSetting },
        };
    };

    updateClientSetting = async (setting: ClientSetting) => {
        const lockNum = await this.lock();
        let reconstructInputRequired = false;
        if (
            this.clientSetting.voiceChangerClientSetting.audioInput != setting.voiceChangerClientSetting.audioInput ||
            this.clientSetting.voiceChangerClientSetting.echoCancel != setting.voiceChangerClientSetting.echoCancel ||
            this.clientSetting.voiceChangerClientSetting.noiseSuppression != setting.voiceChangerClientSetting.noiseSuppression ||
            this.clientSetting.voiceChangerClientSetting.noiseSuppression2 != setting.voiceChangerClientSetting.noiseSuppression2 ||
            this.clientSetting.voiceChangerClientSetting.sampleRate != setting.voiceChangerClientSetting.sampleRate
        ) {
            reconstructInputRequired = true;
        }

        if (this.clientSetting.voiceChangerClientSetting.inputGain != setting.voiceChangerClientSetting.inputGain) {
            this._setInputGain(setting.voiceChangerClientSetting.inputGain);
        }
        if (this.clientSetting.voiceChangerClientSetting.outputGain != setting.voiceChangerClientSetting.outputGain) {
            this._setOutputGain(setting.voiceChangerClientSetting.outputGain);
        }
        if (this.clientSetting.voiceChangerClientSetting.monitorGain != setting.voiceChangerClientSetting.monitorGain) {
            this._setMonitorGain(setting.voiceChangerClientSetting.monitorGain);
        }

        this.clientSetting = {
            voiceChangerClientSetting: { ...setting.voiceChangerClientSetting },
            workletNodeSetting: { ...setting.workletNodeSetting },
            workletSetting: { ...setting.workletSetting },
        };

        if (reconstructInputRequired) {
            await this.setup();
        }
        this._configureWorklet(setting.workletSetting);
        this._updateWorkletNodeSetting(setting.workletNodeSetting);
        await this.unlock(lockNum);
    };

    private _setInputGain = (val: number) => {
        if (!this.inputGainNode) {
            return;
        }
        if (!val) {
            return;
        }
        this.inputGainNode.gain.value = val;
    };

    private _setOutputGain = (val: number) => {
        if (!this.outputGainNode) {
            return;
        }
        if (!val) {
            return;
        }
        this.outputGainNode.gain.value = val;
    };

    private _setMonitorGain = (val: number) => {
        if (!this.monitorGainNode) {
            return;
        }
        if (!val) {
            return;
        }
        this.monitorGainNode.gain.value = val;
    };

    /////////////////////////////////////////////////////
    // コンポーネント設定、操作
    /////////////////////////////////////////////////////
    //##  Worklet ##//
    private _configureWorklet = (setting: WorkletSetting) => {
        if (this.vcInNode == null || this.vcOutNode == null) return;
        this.vcInNode.configureWorklet(setting);
        this.vcOutNode.configureWorklet(setting);
    };

    trancateBuffer = () => {
        this.vcOutNode.trancateBuffer();
    };

    //##  Worklet Node ##//
    private _updateWorkletNodeSetting = (setting: WorkletNodeSetting) => {
        if (this.vcInNode == null || this.vcOutNode == null) return;
        this.clientSetting.workletNodeSetting = setting;
        this.vcInNode.updateSetting(setting);
        this.vcOutNode.updateSetting(setting);
    };
    setInternalAudioProcessCallback = (internalCallback: InternalCallback) => {
        this.vcInNode.setInternalAudioProcessCallback(internalCallback);
    };
    startInputRecording = () => {
        this.vcInNode.startInputRecording();
    };
    stopInputRecording = () => {
        return this.vcInNode.stopInputRecording();
    };

    startOutputRecording = () => {
        this.vcOutNode.startOutputRecording();
    };
    stopOutputRecording = () => {
        return this.vcOutNode.stopOutputRecording();
    };

    /////////////////////////////////////////////////////
    // 情報取得
    /////////////////////////////////////////////////////

    getSocketId = () => {
        return this.vcInNode.getSocketId();
    };
}
