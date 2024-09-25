export const MAX_SLOT_INDEX = 199;

////////////////////////////////////////////
// REST Params
////////////////////////////////////////////

export const AudioDeviceType = {
    audioinput: "audioinput",
    audiooutpu: "audiooutput",
} as const;
export type AudioDeviceType = (typeof AudioDeviceType)[keyof typeof AudioDeviceType];

export const RecognizerType = [
    "whisper",
    "faster-whisper",
    "SenseVoiceSmall",
    "reazonspeech-nemo-v2",
    "reazonspeech-k2-v2",
    "kotoba-whisper-v2.0",
    "kotoba-whisper-v2.0-faster",
] as const
export type RecognizerType = (typeof RecognizerType)[number];

export const WhisperModelType = ["tiny", "base", "small", "medium", "large-v3",] as const
export type WhisperModelType = (typeof WhisperModelType)[number];


export const ComputeType = ["int8", "float16", "float32", "default",] as const;
export type ComputeType = (typeof ComputeType)[number];
export const ReazonSpeechPrecisionType = ["fp32", "int8", "int8-fp32",] as const;
export type ReazonSpeechPrecisionType = (typeof ReazonSpeechPrecisionType)[number];

export const VadFrameDurationMs = [10, 20, 30] as const
export type VadFrameDurationMs = (typeof VadFrameDurationMs)[number];
export type ASRConfiguration = {
    recognizer_type: RecognizerType
    recognizer_model_type: WhisperModelType
    compute_type: ComputeType
    reazon_speech_precision_type: ReazonSpeechPrecisionType

    gpu_device_id_int: number
    input_sample_rate: number

    max_frame_length: number
    language: string

    vad_frame_duration_ms: VadFrameDurationMs,
    vad_change_mode_frame_num: number,

    webhook_url: string,
};

export type GPUInfo = {
    name: string;
    device_id: string;
    adapter_ram: number;
    device_id_int: number;
};

export type ConvertResultResponse = {
    texts: string[],
    mid_text: string | null,
    skip: boolean,
    elapsed_time: number,
}

////////////////////////////////////////////
// VoiceChangerClient Settings
////////////////////////////////////////////
export type ClientSetting = {
    voiceChangerClientSetting: VoiceChangerClientSetting;
    workletNodeSetting: WorkletNodeSetting;
    workletSetting: WorkletSetting;
};
// (1) VoiceChangerClientSetting
export const SampleRate = {
    "48000": 48000,
} as const;
export type SampleRate = (typeof SampleRate)[keyof typeof SampleRate];

export type VoiceChangerClientSetting = {
    audioInput: string | MediaStream;
    sampleRate: SampleRate; // 48000Hz
    echoCancel: boolean;
    noiseSuppression: boolean;
    noiseSuppression2: boolean;

    inputGain: number;
    outputGain: number;
    monitorGain: number;
};
// (2) WorkletNodeSetting
export const Protocols = ["sio", "rest", "internal"] as const;
export type Protocol = (typeof Protocols)[number];

export const SendingSampleRate = {
    "48000": 48000,
    "44100": 44100,
    "24000": 24000,
} as const;
export type SendingSampleRate = (typeof SendingSampleRate)[keyof typeof SendingSampleRate];

export type WorkletNodeSetting = {
    serverUrl: string;
    protocol: Protocol;
    sendingSampleRate: SendingSampleRate;
    // sendingChunkNum: number;
    sendingChunkSec: number;
    sendingChunkAsBulk: boolean;
    enableFlatPath: boolean;
    workOnColab: boolean;
};
// (3) WorkletSetting
export type WorkletSetting = {
    numTrancateTreshold: number;
    outputBufferFactor: number;
};

// (misc) default ClientSetting
export const DefaultClientSettng: ClientSetting = {
    voiceChangerClientSetting: {
        audioInput: "none",
        sampleRate: 48000,
        echoCancel: true,
        noiseSuppression: true,
        noiseSuppression2: true,
        inputGain: 1.0,
        outputGain: 1.0,
        monitorGain: 1.0,
    },
    workletNodeSetting: {
        serverUrl: "",
        protocol: "rest",
        sendingSampleRate: 48000,
        // sendingChunkNum: 3,
        sendingChunkSec: 3,
        sendingChunkAsBulk: false,
        enableFlatPath: false,
        workOnColab: false,
    },
    workletSetting: {
        numTrancateTreshold: 100,
        outputBufferFactor: 5,
    },
};
////////////////////////////////////
// VoiceChangerClient Exceptions
////////////////////////////////////
export const VOICE_CHANGER_CLIENT_EXCEPTION = {
    ERR_SIO_CONNECT_FAILED: "ERR_SIO_CONNECT_FAILED",
    ERR_SIO_INVALID_RESPONSE: "ERR_SIO_INVALID_RESPONSE",
    ERR_REST_INVALID_RESPONSE: "ERR_REST_INVALID_RESPONSE",
    ERR_MIC_STREAM_NOT_INITIALIZED: "ERR_MIC_STREAM_NOT_INITIALIZED",
    ERR_INTERNAL_AUDIO_PROCESS_CALLBACK_IS_NOT_INITIALIZED: "ERR_INTERNAL_AUDIO_PROCESS_CALLBACK_IS_NOT_INITIALIZED",
    ERR_HTTP_EXCEPTION: "ERR_HTTP_EXCEPTION",
} as const;
export type VOICE_CHANGER_CLIENT_EXCEPTION = (typeof VOICE_CHANGER_CLIENT_EXCEPTION)[keyof typeof VOICE_CHANGER_CLIENT_EXCEPTION];

export type HttpException = {
    type: VOICE_CHANGER_CLIENT_EXCEPTION;
    status: number;
    statusText: string;
    code: number;
    reason: string;
    action: string;
    detail: string | null;
};

////////////////////////////////////
// Performance
////////////////////////////////////
export type PerformanceData = {
    input_size: number;
    output_size: number;
    elapsed_time: number;
    input_volume_db: number;
    output_volume_db: number;
    data_num: number;
};

////////////////////////////////////
// Exception
////////////////////////////////////
export type VCClientErrorInfo = {
    code: number;
    reason: string;
    action: string;
    detail: string | null;
};
