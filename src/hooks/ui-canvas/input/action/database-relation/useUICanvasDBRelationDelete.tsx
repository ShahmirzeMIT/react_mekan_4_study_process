import {deleteField, doc, getDoc, updateDoc, serverTimestamp, arrayUnion} from "firebase/firestore";
import {message} from "antd";
import {db} from "@/config/firebase.ts";

export default function useUICanvasDBRelationDelete({selectedUICanvasId}) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    const deleteDBRelation = async (descriptionId, inputId) => {
        if (!selectedUICanvasId || !descriptionId) {
            console.warn("selectedUICanvasId or descriptionId is not set");
            return;
        }

        const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);

        try {
            const docSnap = await getDoc(uiCanvasDocRef);
            if (!docSnap.exists()) {
                message.error("UI Canvas document not found");
                return;
            }

            // Get existing DB relation data before deleting
            let deletedDBRelationData = null;
            let inputName = '';
            
            if (docSnap.exists()) {
                deletedDBRelationData = docSnap.data()?.input?.[selectedUICanvasId]?.[inputId]?.databaseRelation?.[descriptionId] || null;
                const inputBlock = docSnap.data()?.input?.[selectedUICanvasId]?.[inputId];
                inputName = inputBlock?.inputName || '';
            }

            // Dot notation ile sadece ilgili databaseRelation entry’sini sil
            await updateDoc(uiCanvasDocRef, {
                [`input.${selectedUICanvasId}.${inputId}.databaseRelation.${descriptionId}`]: deleteField(),
            });

            // Add to ui_canvas_history
            await addDBRelationDeleteHistoryRecord({
                uiCanvasId: selectedUICanvasId,
                inputId: inputId,
                inputName: inputName,
                dbRelationId: descriptionId,
                deletedDBRelationData: deletedDBRelationData,
            });

            message.success("Database Relation deleted successfully");
        } catch (error) {
            console.error("Error deleting Database Relation:", error);
            message.error("Failed to delete Database Relation");
        }
    };

    // Add to ui_canvas_history
    const addDBRelationDeleteHistoryRecord = async (historyData: {
        uiCanvasId: string;
        inputId: string;
        inputName: string;
        dbRelationId: string;
        deletedDBRelationData: any;
    }) => {
        try {
            const uiCanvasHistoryDocRef = doc(db, 'ui_canvas_history', historyData.uiCanvasId);
            
            const historyRecord = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: userData?.uid || 'unknown',
                userName: userData?.name || userData?.email || 'Unknown User',
                userEmail: userData?.email || 'Unknown Email',
                actionType: 'DB_RELATION_DELETE',
                fieldName: 'db_relations',
                inputId: historyData.inputId,
                inputName: historyData.inputName,
                dbRelationId: historyData.dbRelationId,
                deletedDBRelationData: historyData.deletedDBRelationData,
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

            console.log('DB relation delete history record added successfully');
        } catch (error) {
            console.error('Error adding DB relation delete history record:', error);
        }
    };

    return {deleteDBRelation}
}