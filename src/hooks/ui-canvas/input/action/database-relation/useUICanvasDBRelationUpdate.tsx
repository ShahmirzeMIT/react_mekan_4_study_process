import {doc, getDoc, updateDoc, serverTimestamp, arrayUnion} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {message} from "antd";
import {RootState, useAppSelector} from "@/store";
import services from "@/ui-canvas/ui_backlog_canvas/services/backlogService";

export default function useUICanvasDBRelationUpdate({selectedInput, selectedUICanvasId}) {
    const {currentProject} = useAppSelector((state: RootState) => state.project);
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    const updateDBRelation = async (value, inputId) => {
        if (!selectedUICanvasId) {
            console.warn("selectedUICanvasId is not set");
            return;
        }
        if (!selectedInput?.dbRelId) {
            console.error("selectedInput.dbRelId is not defined — nothing to update");
            return;
        }

        const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);

        try {
            const docSnap = await getDoc(uiCanvasDocRef);
            if (!docSnap.exists()) {
                message.error("UI Canvas document not found");
                return;
            }

            const relId = selectedInput.dbRelId;
            const oldValue = docSnap.data()?.input?.[selectedUICanvasId]?.[inputId]?.databaseRelation?.[relId] || {};
            const mergedValue = {
                ...oldValue,
                ...value,
            };

            // Dot notation ile sadece ilgili databaseRelation entry'sini merge et
            const updatePayload = {
                [`input.${selectedUICanvasId}.${inputId}.databaseRelation.${relId}`]: mergedValue,
            };
            
            await updateDoc(uiCanvasDocRef, updatePayload);

            // Add to ui_canvas_history
            await addDBRelationUpdateHistoryRecord({
                uiCanvasId: selectedUICanvasId,
                inputId: inputId,
                dbRelationId: relId,
                oldValue: oldValue,
                newValue: mergedValue,
                inputName: oldValue.inputName || '',
            });

            // Build description text and data for backlog sync
            const descriptionText = mergedValue.description || mergedValue.label || '';
            const descriptionData = {
                key: 'databaseRelation',
                table: mergedValue.table,
                field: mergedValue.field,
                action: mergedValue.action,
                description: mergedValue.description || mergedValue.label || '',
                dbRelId: relId,
            };

            // Get inputName for backlog sync
            const inputBlock = docSnap.data()?.input?.[selectedUICanvasId]?.[inputId];
            if (inputBlock?.inputName) {
                descriptionData.inputName = inputBlock.inputName;
            }

            // Sync backlog issues
            if (currentProject?.id) {
                await services.syncBacklogIssuesOnDescriptionUpdate(
                    currentProject.id,
                    selectedUICanvasId,
                    inputId,
                    relId,
                    'databaseRelation',
                    descriptionData,
                    descriptionText
                );
            }

            message.success("DB Relation updated successfully");
        } catch (error) {
            console.error("Error updating DB Relation:", error);
            message.error("Failed to update DB Relation");
        }
    }

    // Add to ui_canvas_history
    const addDBRelationUpdateHistoryRecord = async (historyData: {
        uiCanvasId: string;
        inputId: string;
        inputName: string;
        dbRelationId: string;
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
                actionType: 'DB_RELATION_UPDATE',
                fieldName: 'db_relations',
                inputId: historyData.inputId,
                inputName: historyData.inputName,
                dbRelationId: historyData.dbRelationId,
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
                    db_relations: [historyRecord],
                    allChanges: [historyRecord],
                });
            } else {
                // Update existing document
                await updateDoc(uiCanvasHistoryDocRef, {
                    updatedAt: serverTimestamp(),
                    db_relations: arrayUnion(historyRecord),
                    allChanges: arrayUnion(historyRecord),
                });
            }

            console.log('DB relation update history record added successfully');
        } catch (error) {
            console.error('Error adding DB relation update history record:', error);
        }
    }

    return {updateDBRelation}
}