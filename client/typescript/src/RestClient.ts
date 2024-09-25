import { FileUploaderClient } from "./FileUploaderClient";
import {
    GPUInfo,
    ASRConfiguration,
    HttpException,
    VCClientErrorInfo,
} from "./const";

abstract class RestResult<T> {
    abstract isOk(): boolean;
    abstract get(): T;
}

class Ok<T> extends RestResult<T> {
    constructor(private value: T) {
        super();
    }

    isOk(): boolean {
        return true;
    }

    get(): T {
        return this.value;
    }
}

class Err<T> extends RestResult<T> {
    constructor(private error: HttpException) {
        super();
    }

    isOk(): boolean {
        return false;
    }

    get(): T {
        throw this.error;
    }
}

export class RestClient {
    #baseUrl: string;
    constructor() {
        this.#baseUrl = "";
    }

    setBaseUrl = (baseUrl: string): void => {
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.slice(0, -1);
        }
        this.#baseUrl = baseUrl;
    };

    execFetch = async <T>(request: Request): Promise<RestResult<T>> => {
        return new Promise<RestResult<T>>((resolve) => {
            fetch(request)
                .then(async (response) => {
                    if (response.ok) {
                        const json = (await response.json()) as T;
                        resolve(new Ok(json));
                    } else {
                        const info = await response.json();
                        if (info.detail != null) {
                            const detail = JSON.parse(info.detail) as VCClientErrorInfo;
                            const ex: HttpException = {
                                type: "ERR_HTTP_EXCEPTION",
                                status: response.status,
                                statusText: response.statusText,
                                code: detail.code,
                                reason: detail.reason,
                                action: detail.action,
                                detail: detail.detail,
                            };
                            resolve(new Err(ex));
                        } else {
                            const ex: HttpException = {
                                type: "ERR_HTTP_EXCEPTION",
                                status: response.status,
                                statusText: response.statusText,
                                code: info.code,
                                reason: "no detail",
                                action: "no action",
                                detail: info.detail,
                            };
                            resolve(new Err(ex));
                        }
                    }
                })
                .catch((error) => {
                    console.error(error);
                    const ex: HttpException = {
                        type: "ERR_HTTP_EXCEPTION",
                        status: 0,
                        statusText: "",
                        code: -1,
                        reason: `${error}`,
                        action: "",
                        detail: null,
                    };
                    resolve(new Err(ex));
                });
        });
    };

    getRequest = async <T>(path: string): Promise<T> => {
        let url: string = path.startsWith("/") ? `${this.#baseUrl}${path}` : `${this.#baseUrl}/${path}`;
        const request = new Request(url, {
            method: "GET",
        });
        const info = await this.execFetch<T>(request);

        if (!info.isOk()) {
            throw info.get();
        }
        return info.get();
    };

    postRequest = async <T>(path: string, body: any): Promise<T> => {
        let url: string = path.startsWith("/") ? `${this.#baseUrl}${path}` : `${this.#baseUrl}/${path}`;

        const request = new Request(url, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
            },
        });
        const info = await this.execFetch<T>(request);


        if (!info.isOk()) {
            throw info.get();
        }
        return info.get();
    };

    putRequest = async <T>(path: string, body: any): Promise<T> => {
        let url: string = path.startsWith("/") ? `${this.#baseUrl}${path}` : `${this.#baseUrl}/${path}`;

        const request = new Request(url, {
            method: "PUT",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
            },
        });
        const info = await this.execFetch<T>(request);

        if (!info.isOk()) {
            throw info.get();
        }
        return info.get();
    };

    deleteRequest = async <T>(path: string): Promise<T> => {
        let url: string = path.startsWith("/") ? `${this.#baseUrl}${path}` : `${this.#baseUrl}/${path}`;

        const request = new Request(url, {
            method: "DELETE",
        });
        const info = await this.execFetch<T>(request);


        if (!info.isOk()) {
            throw info.get();
        }
        return info.get();
    };
}

export class VCRestClient {
    private static _instance: VCRestClient | null = null;
    restClient: RestClient;
    fileUploaderClient: FileUploaderClient;
    enableFlatPath: boolean = false;

    private constructor() {
        this.restClient = new RestClient();
        this.fileUploaderClient = new FileUploaderClient();
    }

    static getInstance = (): VCRestClient => {
        if (VCRestClient._instance === null) {
            VCRestClient._instance = new VCRestClient();
        }
        return VCRestClient._instance;
    };

    setBaseUrl = (baseUrl: string): void => {
        this.restClient.setBaseUrl(baseUrl);
        this.fileUploaderClient.setBaseUrl(baseUrl);
    };

    setEnableFlatPath = (enable: boolean): void => {
        console.log(`setEnableFlatPath, ${enable}`);
        this.enableFlatPath = enable;
        this.fileUploaderClient.setEnableFlatPath(enable);

    };

    generatePath = (path: string): string => {
        if (this.enableFlatPath) {
            return path[0] + path.slice(1).replace(/\//g, "_");
        }
        return path;
    };

    initializeServer = async () => {
        const path = this.generatePath(`/api/operation/initialize`);
        await this.restClient.postRequest<null>(path, null);
    };


    getServerConfiguration = async (): Promise<ASRConfiguration> => {
        const path = this.generatePath(`/api/configuration-manager/configuration`);
        const conf = await this.restClient.getRequest<ASRConfiguration>(path);
        return conf;
    };

    updateServerConfiguration = async (conf: ASRConfiguration) => {
        const path = this.generatePath(`/api/configuration-manager/configuration`);
        await this.restClient.putRequest<null>(path, conf);
    };

    getServerGPUInfo = async (): Promise<GPUInfo[]> => {
        const path = this.generatePath(`/api/gpu-device-manager/devices`);
        const info = await this.restClient.getRequest<GPUInfo[]>(path);
        return info;
    };

    getSupportLanguages = async (): Promise<string[]> => {
        const path = this.generatePath(`/api/voice-changer/support_languages`);
        const info = await this.restClient.getRequest<string[]>(path);
        return info;
    };



    uploadFile = async (dir: string, file: File, onprogress: (progress: number, end: boolean) => void) => {
        const chunk_num = await this.fileUploaderClient.uploadFile(dir, file, onprogress);
        await this.fileUploaderClient.concatUploadedFile(file.name, chunk_num);
    };

    // uploadRVCModelFile = async (slot_index: number | null, modelFile: File, indexFile: File | null, onprogress: (progress: number, end: boolean) => void) => {
    //     const uploadFileNum = indexFile != null ? 2 : 1;
    //     await this.uploadFile("", modelFile, (progress: number, _end: boolean) => {
    //         onprogress(progress / uploadFileNum, false);
    //     });
    //     if (indexFile != null) {
    //         await this.uploadFile("", indexFile, (progress: number, _end: boolean) => {
    //             onprogress(progress / uploadFileNum + 100 / uploadFileNum, false);
    //         });
    //     }

    //     const path = this.generatePath(`/api/slot-manager/slots`);
    //     const rvcImportParam: RVCModelImportParam = {
    //         slot_index: slot_index ?? null,
    //         voice_changer_type: "RVC",
    //         name: modelFile.name.split(".")[0],
    //         model_file: modelFile.name,
    //         index_file: indexFile?.name ?? null,
    //     };
    //     await this.restClient.postRequest<null>(path, rvcImportParam);
    //     return;
    // };



    // startRecording = async () => {
    //     const path = this.generatePath(`/api/voice-changer/operation/start_recording`);
    //     await this.restClient.postRequest<null>(path, null);
    // };

    // stopRecording = async () => {
    //     const path = this.generatePath(`/api/voice-changer/operation/stop_recording`);
    //     await this.restClient.postRequest<null>(path, null);
    // };

}
