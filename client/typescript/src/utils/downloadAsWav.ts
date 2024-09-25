export const downloadAsWav = (data: Float32Array) => {
    const writeString = (view: DataView, offset: number, string: string) => {
        for (var i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
        for (var i = 0; i < input.length; i++, offset += 2) {
            var s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
    };

    const buffer = new ArrayBuffer(44 + data.length * 2);
    const view = new DataView(buffer);

    // https://www.youfit.co.jp/archives/1418
    writeString(view, 0, "RIFF"); // RIFFヘッダ
    view.setUint32(4, 32 + data.length * 2, true); // これ以降のファイルサイズ
    writeString(view, 8, "WAVE"); // WAVEヘッダ
    writeString(view, 12, "fmt "); // fmtチャンク
    view.setUint32(16, 16, true); // fmtチャンクのバイト数
    view.setUint16(20, 1, true); // フォーマットID
    view.setUint16(22, 1, true); // チャンネル数
    view.setUint32(24, 48000, true); // サンプリングレート
    view.setUint32(28, 48000 * 2, true); // データ速度
    view.setUint16(32, 2, true); // ブロックサイズ
    view.setUint16(34, 16, true); // サンプルあたりのビット数
    writeString(view, 36, "data"); // dataチャンク
    view.setUint32(40, data.length * 2, true); // 波形データのバイト数
    floatTo16BitPCM(view, 44, data); // 波形データ
    const audioBlob = new Blob([view], { type: "audio/wav" });

    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `output.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
