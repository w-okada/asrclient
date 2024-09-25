import React, { useEffect } from "react";
import { GuiStateProvider } from "./GuiStateProvider";
import { Dialogs } from "./component/dialogs/Dialogs";
import { Dialogs2 } from "./component/dialogs/Dialogs2";
import { HeaderArea } from "./component/001_HeaderArea";
import { ModelSlotArea } from "./component/002_ModelSlotArea";
import { useAppState } from "../002_AppStateProvider";
import { darkTheme, lightTheme } from "../styles/001_global.css";
import { ModelSettingArea } from "./component/003_ModelSettingArea";
import { configArea, configAreaRow, configSubArea } from "../styles/configArea.css";
import { AudioControlArea } from "./component/004_AudioControlArea";
import { InferenceAreaChunk } from "./component/008-1_InferenceAreaChunk";
import { InferenceAreaGPU } from "./component/008-2_InferenceAreaGPU";
import { NoiseSupression } from "./component/006_NoiseSupression";
import { AudioDeviceMode } from "./component/007-x-1_AudioDeviceAreaMode";
import { AudioDeviceAreaDeviceSelect } from "./component/007-x-2_AudioDeviceAreaDeviceSelect";
import { ResultTextArea } from "./component/005_ResultTextArea";
import { MoreActionsArea } from "./component/009_MoreActionsArea";
import { InferenceAreaVadFrameDurationMs } from "./component/008-3_InferenceAreaVadFrameMS";
import { InferenceAreaVadChangeModeFrameNum } from "./component/008-4_InferenceAreaVadChangeModeFrameNum";
import { WebHookArea } from "./component/005_2_WebHookArea";


export const Demo = () => {
    const { voiceChangerClientState, displayColorMode } = useAppState();
    useEffect(() => {
        const bodyClass = displayColorMode == "light" ? lightTheme : darkTheme;
        document.body.className = bodyClass
    }, [displayColorMode])
    return (
        <GuiStateProvider>
            <Dialogs2 />
            <Dialogs />
            <HeaderArea></HeaderArea>
            <ModelSlotArea></ModelSlotArea>

            <div className={configArea}>
                <div className={configAreaRow}>
                    <ModelSettingArea></ModelSettingArea>
                </div>
            </div>
            <div className={configArea}>
                <div className={configAreaRow}>
                    <div className={configSubArea}>

                        <AudioControlArea></AudioControlArea>
                    </div>
                </div>
            </div>

            <div className={configArea}>
                <div className={configAreaRow}>
                    <ResultTextArea></ResultTextArea>
                </div>
            </div>


            <div className={configArea}>
                <div className={configAreaRow}>
                    <WebHookArea></WebHookArea>
                </div>
            </div>


            <div className={configArea}>
                <div className={configAreaRow}>
                    <div className={configSubArea}>
                        <AudioDeviceMode></AudioDeviceMode>
                        <AudioDeviceAreaDeviceSelect></AudioDeviceAreaDeviceSelect>
                        <NoiseSupression></NoiseSupression>
                    </div>
                    <div className={configSubArea}>
                        <InferenceAreaChunk></InferenceAreaChunk>
                        <InferenceAreaGPU></InferenceAreaGPU>
                        {/* <InferenceAreaVadFrameDurationMs></InferenceAreaVadFrameDurationMs> */}
                        <InferenceAreaVadChangeModeFrameNum></InferenceAreaVadChangeModeFrameNum>
                    </div>

                </div>
            </div>
            <div className={configArea}>
                <div className={configAreaRow}>
                    <MoreActionsArea></MoreActionsArea>
                </div>
            </div>

        </GuiStateProvider>
    );
};
