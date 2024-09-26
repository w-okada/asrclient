TTSClient
---
  [[日本語]](./README.md) [[English]](./README_en.md) [[한국어]](./README_ko.md) [[中文简体]](./README_cn.md)

실시간 음성 인식/Speech To Text/Automatic Speech Recognition(STT/ASR) 클라이언트 소프트웨어입니다.

인식된 텍스트는 WebHook 또는 WebSocket을 통해 실시간으로 얻을 수 있습니다.

다양한 AI 서비스에 대응할 계획입니다.

- 지원 AI
  - [Whisper](https://github.com/openai/whisper)
  - [Faster Whisper](https://github.com/SYSTRAN/faster-whisper)
  - [SenceVoiceSmall](https://github.com/FunAudioLLM/SenseVoice)
    - [license](https://github.com/FunAudioLLM/SenseVoice/blob/main/LICENSE)
  - [Reazon Speech](https://research.reazon.jp/projects/ReazonSpeech/index.html)
  - [kotoba-whisper-v2.0](https://huggingface.co/kotoba-tech/kotoba-whisper-v2.0)
  - [kotoba-whisper-v2.0-faster](https://huggingface.co/kotoba-tech/kotoba-whisper-v2.0-faster)


## 관련 소프트웨어
- [실시간 음성 변조기 VCClient](https://github.com/w-okada/voice-changer)
- [텍스트 읽기 소프트웨어 TTSClient](https://github.com/w-okada/ttsclient)
- [실시간 음성 인식 소프트웨어 ASRClient](https://github.com/w-okada/asrclient)
- 
## 다운로드
[Hugging Face 리포지토리](https://huggingface.co/wok000/asrclient000/tree/main)

- win_std 에디션: Windows용 CPU에서 동작하는 에디션입니다. cuda 버전과 비교하여 속도가 느리지만, 최근 사양의 CPU라면 동작합니다.
- win_cuda 에디션: Windows용 NVIDIA GPU에서 동작하는 에디션입니다. GPU 하드웨어 가속을 통해 빠르게 작동합니다.
- mac 에디션: Mac(Apple silicon(M1, M2, M3, etc))용 에디션입니다.

## 온라인 데모

Colab에서 실행할 수 있습니다.
[이 노트북](https://github.com/w-okada/asrclient/blob/master/w_okada's_ASR_Client.ipynb)에 접속하여 왼쪽 상단의 `Open in Colab` 버튼을 클릭해 열어주세요.

## 사용 방법
- zip 파일을 해제한 후, `start_http.bat`을 실행하십시오. 표시된 URL에 브라우저로 접근하십시오.
- `start_https.bat`을 사용하면 원격에서도 접근할 수 있습니다.
- (상급자용)`start_http_with_ngrok.bat`을 사용하면 ngrok을 이용한 터널링으로 접근할 수 있습니다.

note: mac 에디션은 .bat 파일을 .command 파일로 읽어주세요.

## 리포지토리를 클론해서 사용하는 방법 (Advanced)
### 전제 조건

- poetry: [설치 방법](https://python-poetry.org/docs/#installing-with-the-official-installer)

### 준비
다음 명령어를 실행하세요:

```
git clone https://github.com/w-okada/asrclient.git

cd asrclient
cd third_party
git clone https://github.com/reazon-research/ReazonSpeech
cd ..

poetry install
```

### 실행
다음 명령어를 실행하세요:
```
poetry run main cui
```

`fatal error: Python.h: 그런 파일이나 디렉터리가 없습니다`와 같은 오류가 발생하면, Python 소스 코드를 설치하십시오.
```
sudo apt install python3-dev
```


`No such file or directory: 'cmake'`와 같은 오류가 발생하면, cmake를 설치하십시오:
```
sudo apt-get install cmake
```

### NVIDIA GPU(cuda)를 사용하는 경우

```
poetry remove onnxruntime-directml torch-directml
poetry add torch==2.3.1 --source torch_cuda12
poetry add onnxruntime-gpu==1.17.1 --source ort_cuda12
```


### webhook 클라이언트 샘플

#### Python
다음 명령어를 실행하고 표시된 webhook URL을 GUI에 설정하세요.
```
python .\client\webhook_server\generic_main.py
```

#### Node
다음 명령어를 실행하고 표시된 webhook URL을 GUI에 설정하세요.
```
node .\client\webhook_server\generic_main.js
```

### Socket.io 클라이언트 샘플
다음 명령어를 실행하세요.
`http://localhost:20000` 부분을 ASRClient가 실행되는 URL로 교체하세요.
```
poetry run python_socket_io http://localhost:20000
```
