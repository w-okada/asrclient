ASRClient
---
  [[日本語]](./README.md) [[English]](./README_en.md) [[한국어]](./README_ko.md) [[中文简体]](./README_cn.md)

音声認識/Speech To Text/Automatic Speech Recognition(STT/ASR)のクライアントソフトウェアです。
各種AIに対応していく計画です。

- 対応 AI
  - [Whisper](https://github.com/openai/whisper)
  - [Faster Whisper](https://github.com/SYSTRAN/faster-whisper)
  - [SenceVoiceSmall](https://github.com/FunAudioLLM/SenseVoice)
    - [license](https://github.com/FunAudioLLM/SenseVoice/blob/main/LICENSE)



## 関連ソフトウェア
- [リアルタイムボイスチェンジャ VCClient](https://github.com/w-okada/voice-changer)
- [読み上げソフトウェア TTSClient](https://github.com/w-okada/ttsclient)
- [音声認識ソフトウェア ASRClient](https://github.com/w-okada/asrclient)

## ダウンロード
[Hugging Faceのリポジトリ](https://huggingface.co/wok000/asrclient000/tree/main)よりダウンロードしてください。

- win_stdエディション：Windows向けのCPUで動作するエディションです。cuda版と比較して低速ですが、最近のそれなりのスペックのCPUであれば動きます。
- win_cudaエディション：Windows向けのNVIDIAのGPUで動作するエディションです。GPUのハードウェアアクセラレーションにより高速に動きます。
- macエディション：Mac(Apple silicon(M1, M2, M3, etc))向けのエディションです。

## オンラインデモ

Colabでの実行が可能です。
[こちらのノート](https://github.com/w-okada/asrclient/blob/master/w_okada's_ASR_Client.ipynb)にアクセスし、左上の`Open in Colab`ボタンをクリックして開いてください。


## 使用方法
- zipファイルを展開後、`start_http.bat`を実行してください。表示された、URLにブラウザでアクセスしてください。
- `start_https.bat`を使用すると、リモートからでもアクセスすることができます。
- (上級者向け)`start_http_with_ngrok.bat`を使用するとngrokを用いたトンネリングを使用してアクセスすることができます。

note: macエディションは.batを.commandで読み替えてください。
