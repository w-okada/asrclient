export const RequestType = {
    voice: "voice",
    config: "config",
    start: "start",
    stop: "stop",
    trancateBuffer: "trancateBuffer",
} as const;
export type RequestType = (typeof RequestType)[keyof typeof RequestType];

export const ResponseType = {
    volume: "volume",
    inputData: "inputData",
    start_ok: "start_ok",
    stop_ok: "stop_ok",
} as const;
export type ResponseType = (typeof ResponseType)[keyof typeof ResponseType];

export type VoiceChangerWorkletProcessorRequest = {
    requestType: RequestType;
    voice: Float32Array;
    numTrancateTreshold: number;
    outputBufferFactor: number;
};

export type VoiceChangerWorkletProcessorResponse = {
    responseType: ResponseType;
    volume?: number;
    recordData?: Float32Array[];
    inputData?: Float32Array;
};

class VoiceChangerWorkletProcessor extends AudioWorkletProcessor {
    private BLOCK_SIZE = 128;
    private initialized = false;
    private volume = 0;
    // private numTrancateTreshold = 100;
    // ↓何process分(BLOCK_SIZE=128)のデータまで残すかを決める数値。
    //  変換後データのブロック数(request.voice/BLOCK_SIZE)の何倍をバッファ上限とするかで設定。
    //  上限を超えるとtrancateする。
    private outputBufferFactor = 5;

    private isRecording = false;

    playBuffer: Float32Array[] = [];
    unpushedF32Data: Float32Array = new Float32Array(0);
    /**
     * @constructor
     */
    constructor() {
        super();
        console.log("[AudioWorkletProcessor] created.");
        this.initialized = true;
        this.port.onmessage = this.handleMessage.bind(this);
    }

    calcVol = (data: Float32Array, prevVol: number) => {
        const sum = data.reduce((prev, cur) => {
            return prev + cur * cur;
        }, 0);
        const rms = Math.sqrt(sum / data.length);
        return Math.max(rms, prevVol * 0.95);
    };

    trancateBuffer = () => {
        console.log("[worklet] Buffer truncated");
        while (this.playBuffer.length > 1) {
            // console.log("[worklet] Buffer truncated", this.playBuffer.length);
            this.playBuffer.shift();
        }
    };
    handleMessage(event: any) {
        const request = event.data as VoiceChangerWorkletProcessorRequest;
        if (request.requestType === "config") {
            // this.numTrancateTreshold = request.numTrancateTreshold;
            // console.log("[worklet] worklet configured", request);
            this.outputBufferFactor = request.outputBufferFactor;
            return;
        } else if (request.requestType === "start") {
            if (this.isRecording) {
                console.warn(`[worklet] recording is already started. ${this.isRecording}`);
                return;
            }
            this.isRecording = true;
            const startResponse: VoiceChangerWorkletProcessorResponse = {
                responseType: "start_ok",
            };
            this.port.postMessage(startResponse);
            return;
        } else if (request.requestType === "stop") {
            if (!this.isRecording) {
                console.warn(`[worklet] recording is not started. ${this.isRecording}`);
                return;
            }
            this.isRecording = false;
            const stopResponse: VoiceChangerWorkletProcessorResponse = {
                responseType: "stop_ok",
            };
            this.port.postMessage(stopResponse);
            return;
        } else if (request.requestType === "trancateBuffer") {
            this.trancateBuffer();
            return;
        }

        const f32Data = request.voice;
        // Truncate, とりあえず入力のn倍の長さが残っていたら切り捨てる
        if (this.playBuffer.length > (f32Data.length / this.BLOCK_SIZE) * this.outputBufferFactor) {
            console.log(`[worklet] Truncate ${this.playBuffer.length} > ${(f32Data.length / this.BLOCK_SIZE) * this.outputBufferFactor}`);
            this.trancateBuffer();
            this.outputBufferFactor += 1;
        }

        // ひとつ前の残データ(unpushedF32Data)と今回のデータを結合
        const concatedF32Data = new Float32Array(this.unpushedF32Data.length + f32Data.length);
        concatedF32Data.set(this.unpushedF32Data);
        concatedF32Data.set(f32Data, this.unpushedF32Data.length);

        // outputに渡せるブロックサイズに分割し、バッファに入力。端数は次に回す(unpushedF32Data)。
        const chunkNum = Math.floor(concatedF32Data.length / this.BLOCK_SIZE);
        for (let i = 0; i < chunkNum; i++) {
            const block = concatedF32Data.slice(i * this.BLOCK_SIZE, (i + 1) * this.BLOCK_SIZE);
            this.playBuffer.push(block);
        }
        this.unpushedF32Data = concatedF32Data.slice(chunkNum * this.BLOCK_SIZE);
    }

    pushData = (inputData: Float32Array) => {
        const inputDataResponse: VoiceChangerWorkletProcessorResponse = {
            responseType: ResponseType.inputData,
            inputData: inputData,
        };
        this.port.postMessage(inputDataResponse);
    };

    process(_inputs: Float32Array[][], outputs: Float32Array[][], _parameters: Record<string, Float32Array>) {
        if (!this.initialized) {
            console.warn("[worklet] worklet_process not ready");
            return true;
        }

        if (this.isRecording) {
            if (_inputs.length > 0 && _inputs[0].length > 0) {
                this.pushData(_inputs[0][0]);
            } else {
                console.warn("[worklet] no input data");
            }
        } else {
        }

        if (this.playBuffer.length === 0) {
            // console.log("[worklet] no play buffer");
            return true;
        } else {
            // console.warn("[worklet] play buffer", this.playBuffer.length);
        }

        let voice = this.playBuffer.shift();
        if (voice) {
            this.volume = this.calcVol(voice, this.volume);
            const volumeResponse: VoiceChangerWorkletProcessorResponse = {
                responseType: ResponseType.volume,
                volume: this.volume,
            };
            this.port.postMessage(volumeResponse);
            outputs[0][0].set(voice);
            if (outputs[0].length == 2) {
                outputs[0][1].set(voice);
            }
        } else {
            console.log("[worklet] no voice data");
        }

        return true;
    }
}
registerProcessor("voice-changer-worklet-processor", VoiceChangerWorkletProcessor);
