import {doc, getDoc} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {RootState, setCurrentCanvas, useAppDispatch} from "@/store";
import {useSelector} from "react-redux";
import {Dispatch, SetStateAction} from "react";


const keyLabels = [
    {id: "is_mandatory", label: "Is Mandatory"},
    {id: "is_unique", label: "Is Unique"},
    {id: "is_editable", label: "Is Editable"},
    {id: "is_not_editable", label: "Is Not Editable"},
    {id: "is_integer", label: "Is Integer"},
    {id: "is_float", label: "Is Float"},
    {id: "is_string", label: "Is String"},
    {id: "is_dropdown", label: "Is Dropdown"},
    {id: "is_readonly", label: "Is Readonly"},
    {id: "is_current_user", label: "Is Current User"},
    {id: "is_current_date", label: "Is Current Date"},
    {id: "is_current_time", label: "Is Current Time"},
    {id: "is_minimum_value", label: "Is Minimum Value"},
    {id: "is_maximum_value", label: "Is Maximum Value"},
    {id: "is_row_count", label: "Is Row Count"},
    {id: "is_average_value", label: "Is Average Value"},
    {id: "is_summary", label: "Is Summary"},
    {id: "close_after_click", label: "Close After Click"},
    {id: "disappear_after_click", label: "Disappear After Click"},
    {id: "maximum_length_is", label: "Maximum length is"},
    {id: "minimum_length_is", label: "Minimum length is"},
    {id: "after_redirect_to", label: "After redirect to"},
    {id: "successful_message_is", label: "Successful message is"},
    {id: "warning_message_is", label: "Warning message is"},
    {id: "error_message_is", label: "Error message is"},
    {id: "date_format_is", label: "Date format is"},
    {id: "time_format_is", label: "Time format is"},
    {id: "minimum_value_is", label: "Minimum value is"},
    {id: "maximum_value_is", label: "Maximum value is"},
    {id: "default_value_is", label: "Default value is"},
    {id: "placeholder_is", label: "Placeholder is"},
    {id: "minimum_selected_item_count_is", label: "Minimum selected item count is"},
    {id: "maximum_selected_item_count_is", label: "Maximum selected item count is"},
    {id: "mask_is", label: "Mask is"}
];

// sürətli lookup üçün map:

export default function useGetAllUI({setSelectedUI, setUIList, setSelectedUICanvasId, setAllUIInputs}) {
    const dispatch = useAppDispatch();
    const currentProject = useSelector((state: RootState) => state.project.currentProject);

    const getUI = async (setLoading: Dispatch<SetStateAction<boolean>>) => {
        try {
            setLoading(true);

            const projectsCanvasDocRef = doc(db, "projects", currentProject.id);
            const projectsCanvasSnapshot = await getDoc(projectsCanvasDocRef);

            const digitalServiceJson = projectsCanvasSnapshot.get("digital_service_json")
            const uiListObject = JSON.parse(digitalServiceJson ? digitalServiceJson : "{}");
            const uiList = Array.isArray(uiListObject) ? uiListObject : Object.keys(uiListObject)?.map(item => ({
                id: item,
                label: uiListObject[item]
            })) || [];
            const currentId = localStorage.getItem("currentUI")
                ? localStorage.getItem("currentUI")
                : uiList?.[0]?.id;

            const currentUI = uiList.find(item => item.id == currentId);
            const uiCanvasDocRef = doc(db, "ui_canvas", currentId);
            const snapshot = await getDoc(uiCanvasDocRef);

            const data = snapshot.data();

            const selectedUiData = structuredClone(data);

            if (currentUI) {
                setSelectedUICanvasId(currentId);
                setSelectedUI({
                    ...selectedUiData,
                    id: currentId,
                    input: selectedUiData?.input[currentId],
                });
            } else {
                setSelectedUICanvasId(uiList[0]?.id);
                setSelectedUI({
                    ...selectedUiData,
                    input: selectedUiData?.input[uiList[0]?.id] ?? {},
                });
            }

            dispatch(
                setCurrentCanvas({
                    ...selectedUiData,
                    id: currentId,
                    input: selectedUiData?.input,
                })
            );

            setAllUIInputs(selectedUiData?.input ?? {});
            setUIList(uiList);
            console.log("✅ Firestore updated with transformed templateDescriptions");
        } catch (e) {
            console.error("❌ Error while updating Firestore:", e);
        } finally {
            setLoading(false);
        }
    };
    return {getUI}
}