import {deleteField, doc, updateDoc} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {message} from "antd";

export default function useUICanvasFormActionDelete({selectedUICanvasId, selectedInput}) {
    const deleteFormAction = async () => {
        const inputId = selectedInput.inputId;
        if (!selectedUICanvasId || !selectedInput.inputId) {
            console.warn("selectedUICanvasId or inputId is not set");
            return;
        }

        const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);

        try {
            // Dot-notation ile sadece formAction alanını sil
            await updateDoc(uiCanvasDocRef, {
                [`input.${selectedUICanvasId}.${inputId}.formAction`]: deleteField(),
            });

            message.success("Form Action deleted successfully");
        } catch (error) {
            console.error("Error deleting Form Action:", error);
            message.error("Failed to delete Form Action");
        }
    }
    return {deleteFormAction}
}