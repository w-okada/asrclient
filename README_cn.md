TTSClient
---
  [[日本語]](./README.md) [[English]](./README_en.md) [[한국어]](./README_ko.md) [[中文简体]](./README_cn.md)

这是一个用于语音识别/语音转文字/自动语音识别（STT/ASR）的客户端软件。
我们计划支持各种AI技术。

- 支持的AI
  - [Whisper](https://github.com/openai/whisper)
  - [Faster Whisper](https://github.com/SYSTRAN/faster-whisper)



## 相关软件
- [实时语音变声器 VCClient](https://github.com/w-okada/voice-changer)
- [语音合成软件 TTSClient](https://github.com/w-okada/ttsclient)
- [语音识别软件 ASRClient](https://github.com/w-okada/asrclient)

## 下载
请从[Hugging Face的仓库](https://huggingface.co/wok000/asrclient000/tree/main)下载。

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
