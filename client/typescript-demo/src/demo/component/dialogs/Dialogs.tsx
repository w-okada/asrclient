import React, { useEffect, useMemo, useState } from "react";
import { useGuiState } from "../../GuiStateProvider";
import { dialogContainer, dialogContainerShow } from "../../../styles/dialog.css";
import { AdvancedSettingDialog } from "./Dialogs_AdvancedSettingDialog";
import { StartingNoticeDialog } from "./Dialogs_StartingNoticeDialog";

export const Dialogs = () => {
    const guiState = useGuiState();
    const [targetSlotIndex, setTargetSlotIndex] = useState<number>(0);
    const openFileUploadDialog = (targetSlotIndex: number) => {
        setTargetSlotIndex(targetSlotIndex);
        guiState.setDialogName("modelSlotManagerFileUploaderDialog");
    };
    const openSampleDialog = (targetSlotIndex: number) => {
        setTargetSlotIndex(targetSlotIndex);
        guiState.setDialogName("modelSlotManagerSamplesDialog");
    };

    const currentDialog = useMemo(() => {
        if (guiState.dialogName === "none") {
            return <></>;
        } else if (guiState.dialogName === "startingNoticeDialog") {
            return <StartingNoticeDialog></StartingNoticeDialog>;
        } else if (guiState.dialogName === "advancedSettingDialog") {
            return <AdvancedSettingDialog></AdvancedSettingDialog>;
        } else {
            return <></>;
        }
    }, [guiState.dialogName]);

    const dialog = (
        <div id="dialog-container" className={dialogContainer}>
            {currentDialog}
        </div>
    );

    useEffect(() => {
        const container = document.getElementById("dialog-container");
        if (!container) {
            return;
        }
        if (guiState.dialogName === "none") {
            container.classList.remove(`${dialogContainerShow}`);
        } else {
            container.classList.add(`${dialogContainerShow}`);
        }
    }, [guiState.dialogName]);

    return dialog;
};
