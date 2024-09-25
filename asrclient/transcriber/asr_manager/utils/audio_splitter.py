from typing import Literal
import numpy as np
import webrtcvad


class Frame(object):
    """Represents a "frame" of audio data."""

    def __init__(self, bytes, timestamp, duration):
        self.bytes = bytes
        self.timestamp = timestamp
        self.duration = duration


def _frame_generator(frame_duration_ms, audio, sample_rate):
    """Generates audio frames from PCM audio data.

    Takes the desired frame duration in milliseconds, the PCM data, and
    the sample rate.

    Yields Frames of the requested duration.
    """
    n = int(sample_rate * (frame_duration_ms / 1000.0) * 2)
    offset = 0
    timestamp = 0.0
    duration = (float(n) / sample_rate) / 2.0
    while offset + n < len(audio):
        yield Frame(audio[offset : offset + n], timestamp, duration)
        timestamp += duration
        offset += n
    yield Frame(audio[offset : offset + n], timestamp, duration)


def tagging(
    audio: np.ndarray,
    frame_duration_ms: Literal[10, 20, 30] = 30,
    sample_rate: Literal[8000, 16000, 32000, 48000] = 16000,
    aggressiveness: Literal[0, 1, 2, 3] = 0,
):
    vad = webrtcvad.Vad(aggressiveness)
    frames = _frame_generator(frame_duration_ms, audio, sample_rate)
    frames = list(frames)
    tags: list[bool] = []
    for frame in frames:
        is_speech = vad.is_speech(frame.bytes, sample_rate)
        tags.append(is_speech)
    return frames, tags
