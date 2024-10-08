ASRClient
---
  [[日本語]](./README.md) [[English]](./README_en.md) [[한국어]](./README_ko.md) [[中文简体]](./README_cn.md)

リアルタイム音声認識/Speech To Text/Automatic Speech Recognition(STT/ASR)のクライアントソフトウェアです。

認識したテキストをWebHook経由やWebsocoket経由でリアルタイムに取得することができます。

各種AIに対応していく計画です。

- 対応 AI
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


## 関連ソフトウェア
- [リアルタイムボイスチェンジャ VCClient](https://github.com/w-okada/voice-changer)
- [読み上げソフトウェア TTSClient](https://github.com/w-okada/ttsclient)
- [リアルタイム音声認識ソフトウェア ASRClient](https://github.com/w-okada/asrclient)

## ダウンロード
[Hugging Faceのリポジトリ](https://huggingface.co/wok000/asrclient000/tree/main)


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


## リポジトリをクローンして使用する方法 (Advanced)
### 前提

- poetry: [how to install](https://python-poetry.org/docs/#installing-with-the-official-installer)

### 準備
下記のコマンドを実行してください。

```
git clone https://github.com/w-okada/asrclient.git

cd asrclient
cd third_party
git clone https://github.com/reazon-research/ReazonSpeech
cd ..

poetry install

```

### 実行
下記のコマンドを実行してください。
```
poetry run main cui
```

下の画像のURLにアクセスしてください。
![image](https://github.com/user-attachments/assets/c700c75e-28b9-4779-a659-2df6eada32aa)



`fatal error: Python.h: そのようなファイルやディ レクトリはありません`のようなエラーが出る場合は、pythonのソースコードをインストールしてください。
```
sudo apt install python3-dev
```

`No such file or directory: 'cmake'`のようなエラーが出る場合は、cmakeをインストールしてください。
```
sudo apt-get install cmake
```

### NVIDIAのGPU(cuda)を使用する場合

```
poetry remove onnxruntime-directml torch-directml
poetry add torch==2.3.1 --source torch_cuda12
poetry add onnxruntime-gpu==1.17.1 --source ort_cuda12
```

### webhook client sample

#### python
下記のコマンドを実行してください。
表示されるwebhookのurlをGUIに設定してください。

```
python .\client\webhook_server\generic_main.py
```

#### node
下記のコマンドを実行してください。
表示されるwebhookのurlをGUIに設定してください。
```
node .\client\webhook_server\generic_main.js
```

### socketio client sample
下記のコマンドを実行してください。
`http://localhost:20000`の部分はASRClientの起動URLを指定してください。
```
poetry run python_socket_io http://localhost:20000
```
