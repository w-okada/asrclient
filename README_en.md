TTSClient
---
  [[日本語]](./README.md) [[English]](./README_en.md) [[한국어]](./README_ko.md) [[中文简体]](./README_cn.md)


This is client software for real-time speech recognition/Speech To Text/Automatic Speech Recognition (STT/ASR).

Recognized text can be obtained in real-time via WebHook or WebSocket.

We plan to support various AI services.

- Supported AIs
  - [Whisper](https://github.com/openai/whisper)
  - [Faster Whisper](https://github.com/SYSTRAN/faster-whisper)
  - [SenceVoiceSmall](https://github.com/FunAudioLLM/SenseVoice)
    - [license](https://github.com/FunAudioLLM/SenseVoice/blob/main/LICENSE)
  - [Reazon Speech](https://research.reazon.jp/projects/ReazonSpeech/index.html)
  - [kotoba-whisper-v2.0](https://huggingface.co/kotoba-tech/kotoba-whisper-v2.0)
  - [kotoba-whisper-v2.0-faster](https://huggingface.co/kotoba-tech/kotoba-whisper-v2.0-faster)

## What's New
- v.1.0.4 released
  - source code is opened.


## Related Software
- [Real-time Voice Changer VCClient](https://github.com/w-okada/voice-changer)
- [Text-to-Speech Software TTSClient](https://github.com/w-okada/ttsclient)
- [Real-Time Speech Recognition Software ASRClient](https://github.com/w-okada/asrclient)

## Download
[Hugging Face repository](https://huggingface.co/wok000/asrclient000/tree/main).

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

## How to Clone and Use the Repository (Advanced)
### Prerequisites

- poetry: [how to install](https://python-poetry.org/docs/#installing-with-the-official-installer)

### Preparation
Please execute the following commands:

```
git clone https://github.com/w-okada/asrclient.git

cd asrclient
cd third_party
git clone https://github.com/reazon-research/ReazonSpeech
cd ..

poetry install
```

### Execution
Please execute the following command:
```
poetry run main cui
```

Please access the URL in the image below.
![image](https://github.com/user-attachments/assets/c700c75e-28b9-4779-a659-2df6eada32aa)


If you encounter an error like `fatal error: Python.h: No such file or directory`, please install the Python source code.

```
sudo apt install python3-dev
```

If you encounter an error like `No such file or directory: 'cmake'`, install cmake with:
```
sudo apt-get install cmake
```

### If using NVIDIA GPU (CUDA)

```
poetry remove onnxruntime-directml torch-directml
poetry add torch==2.3.1 --source torch_cuda12
poetry add onnxruntime-gpu==1.17.1 --source ort_cuda12
```

### Webhook Client Sample

#### Python
Please execute the following command and set the displayed webhook URL in the GUI.
```
python .\client\webhook_server\generic_main.py
```

#### Node
Please execute the following command and set the displayed webhook URL in the GUI.
```
node .\client\webhook_server\generic_main.js
```

### Socket.io Client Sample
Please execute the following command.
Replace `http://localhost:20000` with the URL where ASRClient is running.
```
poetry run python_socket_io http://localhost:20000
```