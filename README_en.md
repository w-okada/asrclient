TTSClient
---
  [[日本語]](./README.md) [[English]](./README_en.md) [[한국어]](./README_ko.md) [[中文简体]](./README_cn.md)


This is client software for Speech To Text/Automatic Speech Recognition (STT/ASR).
We plan to support various AI technologies.

- Supported AIs
  - [Whisper](https://github.com/openai/whisper)
  - [Faster Whisper](https://github.com/SYSTRAN/faster-whisper)


## Related Software
- [Real-time Voice Changer VCClient](https://github.com/w-okada/voice-changer)
- [Text-to-Speech Software TTSClient](https://github.com/w-okada/ttsclient)
- [Speech Recognition Software ASRClient](https://github.com/w-okada/asrclient)

## Download
Please download from the [Hugging Face repository](https://huggingface.co/wok000/asrclient000/tree/main).

- win_std Edition: This is the edition for Windows that runs on a CPU. It is slower compared to the CUDA version, but should work on recent CPUs with decent specs.
- win_cuda Edition: This is the edition for Windows that runs on an NVIDIA GPU. It operates faster due to GPU hardware acceleration.
- mac Edition: This is the edition for Mac(Apple silicon(M1, M2, M3, etc)).

## Online Demo

You can run this on Colab.
Please access [this notebook](https://github.com/w-okada/asrclient/blob/master/w_okada's_ASR_Client.ipynb) and click the `Open in Colab` button in the top left to open it.

## Usage
- After extracting the zip file, execute `start_http.bat`. Then, access the displayed URL in a browser.
- Use `start_https.bat` to access the software remotely.
- (For advanced users) Use `start_http_with_ngrok.bat` to access the software via ngrok tunneling.

Note: For the mac edition, replace .bat with .command.
