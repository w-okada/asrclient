import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaSortAlphaDown, FaSortNumericDown } from "react-icons/fa";
import {
    buttonGroup,
    buttons,
    modelSlotArea,
    modelSlotPane,
    modelSlotTileContainer,
    modelSlotTileContainerSelected,
    modelSlotTileDscription,
    modelSlotTileIcon,
    modelSlotTileIconDiv,
    modelSlotTilesContainer,
} from "../../styles/modelSlot.css";
import { useAppRoot } from "../../001_AppRootProvider";
import { DialogName, useGuiState } from "../GuiStateProvider";
import { BasicButton } from "../../styles/style-components/buttons/01_basic-button.css";
import { modelSlotButtonThema } from "../../styles/style-components/buttons/thema/button-thema.css";
import { RecognizerType } from "asr-client-typescript-client-lib";
export type ModelSlotAreaProps = {};

const SortTypes = {
    slot: "slot",
    name: "name",
} as const;
export type SortTypes = (typeof SortTypes)[keyof typeof SortTypes];

export const ModelSlotArea = (_props: ModelSlotAreaProps) => {
    const { serverConfigState, generateGetPathFunc } = useAppRoot();
    const guiState = useGuiState();
    const { t } = useTranslation();
    const [sortType, setSortType] = useState<SortTypes>("slot");
    const { setDialog2Props, setDialog2Name } = useGuiState()

    const modelTiles = useMemo(() => {
        const modelSlots =
            sortType == "slot"
                ? RecognizerType.slice()
                : RecognizerType.slice().sort((a, b) => {
                    return a.localeCompare(b);
                });

        return modelSlots
            .map((x, index) => {
                const tileContainerClass =
                    x == serverConfigState.serverConfiguration?.recognizer_type
                        ? `${modelSlotTileContainer} ${modelSlotTileContainerSelected}`
                        : modelSlotTileContainer;
                const name = x.length > 8 ? x.substring(0, 7) + "..." : x;

                // const icon = x.icon_file != null ? "model_dir" + "/" + x.slot_index + "/" + x.icon_file.split(/[\/\\]/).pop() : "./assets/icons/human.png";

                const iconUrl = generateGetPathFunc(`/assets/asr_icons/${x}.png`);
                const iconElem =
                    <>
                        <img className={modelSlotTileIcon} src={iconUrl} alt={x} />
                        {/* <div className={modelSlotTileVctype}>{x}</div> */}
                    </>

                const clickAction = async () => {
                    // @ts-ignore
                    if (serverConfigState.serverConfiguration == null) {
                        console.log("serverConfigState.serverConfiguration is null");
                        return;
                    }

                    setDialog2Props({
                        title: t("waiting_dialog_title_changing_model"),
                        instruction: `${t("waiting_dialog_instruction_changing_model")}`,
                        defaultValue: "",
                        resolve: () => { },
                        options: null,
                    });
                    setDialog2Name("waitDialog");
                    serverConfigState.serverConfiguration.recognizer_type = x;
                    await serverConfigState.updateServerConfiguration(serverConfigState.serverConfiguration);
                    setDialog2Name("none");

                };

                return (
                    <div key={index} className={tileContainerClass} onClick={clickAction}>
                        <div className={modelSlotTileIconDiv}>{iconElem}</div>
                        <div className={modelSlotTileDscription}>{name}</div>
                    </div>
                );
            })
            .filter((x) => x != null);
    }, [serverConfigState.serverConfiguration, sortType]);

    const modelSlot = useMemo(() => {
        const onModelSlotEditClicked = () => {
            guiState.setDialogName(DialogName.modelSlotManagerMainDialog);
        };
        return (
            <div className={modelSlotArea}>
                <div className={modelSlotPane}>
                    <div className={modelSlotTilesContainer}>{modelTiles}</div>
                    <div className={buttons}>
                        <div className={buttonGroup}>
                            <div
                                className={`${BasicButton({ width: "small", active: sortType == "slot" ? true : false })} ${modelSlotButtonThema}`}
                                onClick={() => {
                                    setSortType("slot");
                                }}
                            >
                                <FaSortNumericDown />
                            </div>
                            <div
                                className={`${BasicButton({ width: "small", active: sortType == "name" ? true : false })} ${modelSlotButtonThema}`}
                                onClick={() => {
                                    setSortType("name");
                                }}

                            >
                                <FaSortAlphaDown />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [modelTiles, sortType]);

    return modelSlot;
};
