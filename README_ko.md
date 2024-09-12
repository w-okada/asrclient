TTSClient
---
  [[日本語]](./README.md) [[English]](./README_en.md) [[한국어]](./README_ko.md) [[中文简体]](./README_cn.md)

이 소프트웨어는 음성 인식/STT/ASR (Speech To Text/Automatic Speech Recognition) 클라이언트 소프트웨어입니다.
다양한 AI 기술을 지원할 계획입니다.

- 지원 AI
  - [Whisper](https://github.com/openai/whisper)
  - [Faster Whisper](https://github.com/SYSTRAN/faster-whisper)


## 관련 소프트웨어
- [실시간 음성 변조기 VCClient](https://github.com/w-okada/voice-changer)
- [텍스트 읽기 소프트웨어 TTSClient](https://github.com/w-okada/ttsclient)
- [음성 인식 소프트웨어 ASRClient](https://github.com/w-okada/asrclient)

## 다운로드
[Hugging Face 리포지토리](https://huggingface.co/wok000/asrclient000/tree/main)에서 다운로드해주세요.

- win_std 에디션: Windows용 CPU에서 동작하는 에디션입니다. cuda 버전과 비교하여 속도가 느리지만, 최근 사양의 CPU라면 동작합니다.
- win_cuda 에디션: Windows용 NVIDIA GPU에서 동작하는 에디션입니다. GPU 하드웨어 가속을 통해 빠르게 작동합니다.
- mac 에디션: Mac(Apple silicon(M1, M2, M3, etc))용 에디션입니다.

## 사용 방법
- zip 파일을 해제한 후, `start_http.bat`을 실행하십시오. 표시된 URL에 브라우저로 접근하십시오.
- `start_https.bat`을 사용하면 원격에서도 접근할 수 있습니다.
- (상급자용)`start_http_with_ngrok.bat`을 사용하면 ngrok을 이용한 터널링으로 접근할 수 있습니다.

note: mac 에디션은 .bat 파일을 .command 파일로 읽어주세요.
