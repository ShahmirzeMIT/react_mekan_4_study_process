import {doc, getDoc, updateDoc, serverTimestamp, arrayUnion} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {message} from "antd";

export default function useUICanvasFormActionCreate({selectedInput, selectedUICanvasId}) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    const createFormAction = async (values) => {
        if (!selectedUICanvasId) {
            console.warn("selectedUICanvasId is not set");
            return;
        }
        if (!selectedInput?.fkUserStoryId || !selectedInput?.id) {
            console.error("selectedInput is missing fkUserStoryId or id");
            return;
        }

        const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);

        try {
            const docSnap = await getDoc(uiCanvasDocRef);
            if (!docSnap.exists()) {
                message.error("UI Canvas document not found");
                return;
            }
            const prevItem = docSnap.data()?.input?.[selectedUICanvasId]?.[selectedInput.id] || {};
            const inputId = selectedInput.id;

            // Mevcut formAction entry’sini al ve merge et
            const existingFormAction = prevItem?.formAction || {};

            const mergedFormAction = {
                ...existingFormAction,
                ...values,
                inputId,
                uiName: selectedInput.uiName,
                inputName: prevItem.inputName,
            };

            // Dot-notation ile sadece ilgili formAction alanını güncelle
            const updatePayload = {
                [`input.${selectedUICanvasId}.${inputId}.formAction`]: mergedFormAction,
            };

            await updateDoc(uiCanvasDocRef, updatePayload);

            // Add to ui_canvas_history
            await addFormActionHistoryRecord({
                uiCanvasId: selectedUICanvasId,
                inputId: inputId,
                inputName: prevItem.inputName || '',
                oldFormAction: existingFormAction,
                newFormAction: mergedFormAction,
            });

            message.success("Form Action created successfully");
        } catch (e) {
            console.error("Error creating/updating Form Action:", e);
            message.error("Failed to create/update Form Action");
        }
    }

    // Add to ui_canvas_history
    const addFormActionHistoryRecord = async (historyData: {
        uiCanvasId: string;
        inputId: string;
        inputName: string;
        oldFormAction: any;
        newFormAction: any;
    }) => {
        try {
            const uiCanvasHistoryDocRef = doc(db, 'ui_canvas_history', historyData.uiCanvasId);
            
            const historyRecord = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: userData?.uid || 'unknown',
                userName: userData?.name || userData?.email || 'Unknown User',
                userEmail: userData?.email || 'Unknown Email',
                actionType: Object.keys(historyData.oldFormAction).length === 0 ? 'FORM_ACTION_CREATE' : 'FORM_ACTION_UPDATE',
                fieldName: 'form_actions',
                inputId: historyData.inputId,
                inputName: historyData.inputName,
                oldFormAction: historyData.oldFormAction,
                newFormAction: historyData.newFormAction,
                timestamp: new Date().toISOString(),
            };

            // Check if history document exists
            const historyDocSnap = await getDoc(uiCanvasHistoryDocRef);
            
            if (!historyDocSnap.exists()) {
                // Create new document
                await updateDoc(uiCanvasHistoryDocRef, {
                    uiCanvasId: historyData.uiCanvasId,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    form_actions: [historyRecord],
                    allChanges: [historyRecord],
                });
            } else {
                // Update existing document
                await updateDoc(uiCanvasHistoryDocRef, {
                    updatedAt: serverTimestamp(),
                    form_actions: arrayUnion(historyRecord),
                    allChanges: arrayUnion(historyRecord),
                });
            }

            console.log('Form action history record added successfully');
        } catch (error) {
            console.error('Error adding form action history record:', error);
        }
    }

    return {createFormAction}
}