# 1. エラコード定数の定義
from pydantic import BaseModel


ERROR_CODE_WHISPER_IS_NOT_SUPPORTED = 100

# 2. コードに関する説明を持つ辞書の定義
ERROR_MESSAGES = {
    ERROR_CODE_WHISPER_IS_NOT_SUPPORTED: {
        "reason": "whisper is not supported on MacOS.",
        "action": "Please select faster-whisper.",
    },
}
UNKNOWN_ERROR_MESSAGES = {
    "reason": "unknown error",
    "action": "Please report to developer.",
}


class VCClientErrorInfo(BaseModel):
    code: int
    reason: str
    action: str
    detail: str | None = None


class VCClientError(Exception):
    def __init__(self, code: int, detail: str | None = None):
        self.info = VCClientErrorInfo(
            code=code,
            reason=ERROR_MESSAGES.get(code, UNKNOWN_ERROR_MESSAGES)["reason"],
            action=ERROR_MESSAGES.get(code, UNKNOWN_ERROR_MESSAGES)["action"],
            detail=detail,
        )
        super().__init__(self.info.model_dump_json())
