import {db} from '@/config/firebase.ts';
import {message} from 'antd';
import {doc, getDoc, updateDoc, serverTimestamp, arrayUnion} from 'firebase/firestore';
import {RootState, useAppSelector} from "@/store";
import services from "@/ui-canvas/ui_backlog_canvas/services/backlogService";

export default function useUICanvasManualDescriptionUpdate({selectedUICanvasId, selectedInput}) {
    const {currentProject} = useAppSelector((state: RootState) => state.project);
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    const updateManualDescription = async (value, inputId) => {
        if (!selectedUICanvasId || !inputId || !selectedInput?.id) {
            console.warn("selectedUICanvasId, inputId or selectedInput.id is not set");
            return;
        }

        const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);

        try {
            const docSnap = await getDoc(uiCanvasDocRef);
            if (!docSnap.exists()) {
                message.error("UI Canvas document not found");
                return;
            }

            // selectedInput.id aslında description'ın ID'si (descId)
            const manualDescriptionId = selectedInput.id;

            // Mevcut entry'yi al ve merge et
            const existingManualDescription =
                docSnap.data()?.input?.[selectedUICanvasId]?.[inputId]?.manualDescription?.[manualDescriptionId] || {};

            const mergedManualDescription = {
                ...existingManualDescription,
                ...value,
            };

            // Dot-notation ile sadece ilgili manualDescription alanını güncelle
            // Path: input.{selectedUICanvasId}.{inputId}.manualDescription.{manualDescriptionId}
            const updatePayload = {
                [`input.${selectedUICanvasId}.${inputId}.manualDescription.${manualDescriptionId}`]: mergedManualDescription,
            };

            await updateDoc(uiCanvasDocRef, updatePayload);

            // Add to ui_canvas_history
            await addManualDescriptionUpdateHistoryRecord({
                uiCanvasId: selectedUICanvasId,
                inputId: inputId,
                manualDescriptionId: manualDescriptionId,
                oldValue: existingManualDescription,
                newValue: mergedManualDescription,
            });

            // Build description text for backlog sync
            const event = mergedManualDescription.event ? `[${mergedManualDescription.event}] ` : '';
            const descriptionText = event + (mergedManualDescription.description || mergedManualDescription.label || '');
            
            // Build description data for backlog sync
            const descriptionData = {
                key: 'manualDescription',
                event: mergedManualDescription.event,
                description: mergedManualDescription.description || mergedManualDescription.label || '',
            };

            // Get inputName for backlog sync
            const inputBlock = docSnap.data()?.input?.[selectedUICanvasId]?.[inputId];
            const inputName = inputBlock?.inputName || '';
            if (inputName) {
                descriptionData.inputName = inputName;
            }

            // Sync backlog issues
            if (currentProject?.id) {
                await services.syncBacklogIssuesOnDescriptionUpdate(
                    currentProject.id,
                    selectedUICanvasId,
                    inputId,
                    manualDescriptionId,
                    'manualDescription',
                    descriptionData,
                    descriptionText
                );
            }

            message.success("Manual Description updated successfully");
        } catch (error) {
            console.error("Error updating Manual Description:", error);
            message.error("Failed to update Manual Description");
        }
    }

    // Add to ui_canvas_history
    const addManualDescriptionUpdateHistoryRecord = async (historyData: {
        uiCanvasId: string;
        inputId: string;
        manualDescriptionId: string;
        oldValue: any;
        newValue: any;
    }) => {
        try {
            const uiCanvasHistoryDocRef = doc(db, 'ui_canvas_history', historyData.uiCanvasId);
            
            const historyRecord = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: userData?.uid || 'unknown',
                userName: userData?.name || userData?.email || 'Unknown User',
                userEmail: userData?.email || 'Unknown Email',
                actionType: 'MANUAL_DESCRIPTION_UPDATE',
                fieldName: 'manual_descriptions',
                inputId: historyData.inputId,
                manualDescriptionId: historyData.manualDescriptionId,
                oldValue: historyData.oldValue,
                newValue: historyData.newValue,
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

            console.log('Manual description update history record added successfully');
        } catch (error) {
            console.error('Error adding manual description update history record:', error);
        }
    }

    return {updateManualDescription}
}