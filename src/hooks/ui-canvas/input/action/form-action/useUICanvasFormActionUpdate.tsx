import {doc, getDoc, updateDoc} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {message} from "antd";
import {RootState, useAppSelector} from "@/store";
import services from "@/ui-canvas/ui_backlog_canvas/services/backlogService";

export default function useUICanvasFormActionUpdate({selectedUICanvasId, selectedInput}) {
    const {currentProject} = useAppSelector((state: RootState) => state.project);
    
    const updateFormAction = async (values) => {
        const inputId = selectedInput.inputId;
        if (!selectedUICanvasId || !inputId) {
            console.warn("selectedUICanvasId or inputId is not set");
            return;
        }

        const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);

        try {
            const docSnap = await getDoc(uiCanvasDocRef);
            if (!docSnap.exists()) {
                message.error("UI Canvas document not found");
                return;
            }

            const fkUserStoryId = selectedUICanvasId;

            // Mevcut formAction entry'sini al ve merge et
            const existingFormAction =
                docSnap.data()?.input?.[selectedUICanvasId]?.[inputId]?.formAction || {};

            const mergedFormAction = {
                ...existingFormAction,
                ...values,
            };

            // Dot-notation ile sadece ilgili formAction alanını güncelle
            const updatePayload = {
                [`input.${selectedUICanvasId}.${inputId}.formAction`]: mergedFormAction,
            };

            await updateDoc(uiCanvasDocRef, updatePayload);

            // Build description text and data for backlog sync
            const descriptionText = mergedFormAction.description || mergedFormAction.action || '';
            const descriptionData = {
                key: 'formAction',
                action: mergedFormAction.action,
                description: mergedFormAction.description,
                condition: mergedFormAction.condition,
                ui_canvas_id: mergedFormAction.ui_canvas_id,
            };

            // Get inputName for backlog sync
            const inputBlock = docSnap.data()?.input?.[selectedUICanvasId]?.[inputId];
            if (inputBlock?.inputName) {
                descriptionData.inputName = inputBlock.inputName;
            }

            // Sync backlog issues - formAction uses action as descId when created
            // We need to sync issues that match by inputId and key, and descId might be the old or new action
            if (currentProject?.id) {
                // Use the action value as descId (as it's stored in backlog when created)
                const descIdForSync = mergedFormAction.action || inputId;
                await services.syncBacklogIssuesOnDescriptionUpdate(
                    currentProject.id,
                    selectedUICanvasId,
                    inputId,
                    descIdForSync,
                    'formAction',
                    descriptionData,
                    descriptionText
                );
            }

            message.success("Form Action updated successfully");
        } catch (e) {
            console.error("Error updating Form Action:", e);
            message.error("Failed to update Form Action");
        }
    }
    return {updateFormAction}
}