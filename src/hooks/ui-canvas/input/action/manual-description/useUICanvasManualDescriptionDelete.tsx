import {deleteField, doc, getDoc, updateDoc, serverTimestamp, arrayUnion} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {message} from "antd";

export default function useUICanvasManualDescriptionDelete({selectedUICanvasId}) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    const deleteManualDescription = async (descriptionId, inputId) => {
        if (!selectedUICanvasId || !descriptionId || !inputId) {
            console.warn("selectedUICanvasId, inputId or descriptionId is not set");
            return;
        }

        const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);

        try {
            // Get existing manual description data before deleting
            const docSnap = await getDoc(uiCanvasDocRef);
            let deletedDescriptionData = null;
            let inputName = '';
            
            if (docSnap.exists()) {
                deletedDescriptionData = docSnap.data()?.input?.[selectedUICanvasId]?.[inputId]?.manualDescription?.[descriptionId] || null;
                const inputBlock = docSnap.data()?.input?.[selectedUICanvasId]?.[inputId];
                inputName = inputBlock?.inputName || '';
            }

            // Dot-notation ile sadece ilgili manualDescription entry’sini sil
            await updateDoc(uiCanvasDocRef, {
                [`input.${selectedUICanvasId}.${inputId}.manualDescription.${descriptionId}`]: deleteField(),
            });

            // Add to ui_canvas_history
            await addManualDescriptionDeleteHistoryRecord({
                uiCanvasId: selectedUICanvasId,
                inputId: inputId,
                inputName: inputName,
                manualDescriptionId: descriptionId,
                deletedDescriptionData: deletedDescriptionData,
            });

            message.success("Manual Description deleted successfully");
        } catch (error) {
            console.error("Error deleting Manual Description:", error);
            message.error("Failed to delete Manual Description");
        }
    };

    // Add to ui_canvas_history
    const addManualDescriptionDeleteHistoryRecord = async (historyData: {
        uiCanvasId: string;
        inputId: string;
        inputName: string;
        manualDescriptionId: string;
        deletedDescriptionData: any;
    }) => {
        try {
            const uiCanvasHistoryDocRef = doc(db, 'ui_canvas_history', historyData.uiCanvasId);
            
            const historyRecord = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: userData?.uid || 'unknown',
                userName: userData?.name || userData?.email || 'Unknown User',
                userEmail: userData?.email || 'Unknown Email',
                actionType: 'MANUAL_DESCRIPTION_DELETE',
                fieldName: 'manual_descriptions',
                inputId: historyData.inputId,
                inputName: historyData.inputName,
                manualDescriptionId: historyData.manualDescriptionId,
                deletedDescriptionData: historyData.deletedDescriptionData,
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
                    manual_descriptions: [historyRecord],
                    allChanges: [historyRecord],
                });
            } else {
                // Update existing document
                await updateDoc(uiCanvasHistoryDocRef, {
                    updatedAt: serverTimestamp(),
                    manual_descriptions: arrayUnion(historyRecord),
                    allChanges: arrayUnion(historyRecord),
                });
            }

            console.log('Manual description delete history record added successfully');
        } catch (error) {
            console.error('Error adding manual description delete history record:', error);
        }
    };

    return {deleteManualDescription}
}