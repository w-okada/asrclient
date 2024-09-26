TTSClient
---
  [[日本語]](./README.md) [[English]](./README_en.md) [[한국어]](./README_ko.md) [[中文简体]](./README_cn.md)

这是用于实时语音识别/语音转文字/自动语音识别（STT/ASR）的客户端软件。

识别的文本可以通过WebHook或WebSocket实时获取。

我们计划支持各种人工智能服务。

- 支持的AI
  - [Whisper](https://github.com/openai/whisper)
  - [Faster Whisper](https://github.com/SYSTRAN/faster-whisper)
  - [SenceVoiceSmall](https://github.com/FunAudioLLM/SenseVoice)
    - [license](https://github.com/FunAudioLLM/SenseVoice/blob/main/LICENSE)
  - [Reazon Speech](https://research.reazon.jp/projects/ReazonSpeech/index.html)
  - [kotoba-whisper-v2.0](https://huggingface.co/kotoba-tech/kotoba-whisper-v2.0)
  - [kotoba-whisper-v2.0-faster](https://huggingface.co/kotoba-tech/kotoba-whisper-v2.0-faster)



## 相关软件
- [实时语音变声器 VCClient](https://github.com/w-okada/voice-changer)
- [语音合成软件 TTSClient](https://github.com/w-okada/ttsclient)
- [实时语音识别软件 ASRClient](https://github.com/w-okada/asrclient)

## 下载
[Hugging Face的仓库](https://huggingface.co/wok000/asrclient000/tree/main)

- win_std版：适用于Windows的版本，运行在CPU上。虽然比cuda版慢，但在现代规格较高的CPU上也可以运行。
- win_cuda版：适用于Windows的版本，运行在NVIDIA的GPU上。利用GPU硬件加速，可以快速运行。
- mac版：适用于Mac(Apple silicon(M1, M2, M3, etc))的版本。

## 在线演示

你可以在Colab上运行此程序。
请访问[这个笔记本](https://github.com/w-okada/asrclient/blob/master/w_okada's_ASR_Client.ipynb)，然后点击左上角的 `Open in Colab` 按钮打开它。


## 使用方法
- 解压缩文件后，运行`start_http.bat`。在浏览器中访问显示的URL。
- 使用`start_https.bat`可以从远程访问。
- （高级用户）使用`start_http_with_ngrok.bat`可以通过ngrok隧道进行访问。

注意：mac版请将.bat替换为.command。

## 克隆并使用存储库的方法 (Advanced)
### 前提条件

- poetry: [如何安装](https://python-poetry.org/docs/#installing-with-the-official-installer)

### 准备
请执行以下命令：

```
git clone https://github.com/w-okada/asrclient.git

cd asrclient
cd third_party
git clone https://github.com/reazon-research/ReazonSpeech
cd ..

poetry install
```

### 执行
请执行以下命令：
```
poetry run main cui
```

如果遇到 `fatal error: Python.h: No such file or directory` 类似的错误，请安装 Python 源代码。
```
sudo apt install python3-dev
```

如果遇到 `No such file or directory: 'cmake'` 类似的错误，请安装 cmake:
```
sudo apt-get install cmake
```

### 如果使用 NVIDIA GPU (CUDA)

```
poetry remove onnxruntime-directml torch-directml
poetry add torch==2.3.1 --source torch_cuda12
poetry add onnxruntime-gpu==1.17.1 --source ort_cuda12
```

### Webhook客户端样例

#### Python
请执行以下命令，并在GUI中设置显示的webhook URL。
```
python .\client\webhook_server\generic_main.py
```

#### Node
请执行以下命令，并在GUI中设置显示的webhook URL。
```
node .\client\webhook_server\generic_main.js
```

### Socket.io客户端样例
请执行以下命令。
将 `http://localhost:20000` 替换为ASRClient的启动URL。
```
poetry run python_socket_io http://localhost:20000
```
