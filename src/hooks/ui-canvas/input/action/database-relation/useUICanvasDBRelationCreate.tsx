import {v4 as uuidv4} from "uuid";
import {doc, getDoc, updateDoc, serverTimestamp, arrayUnion} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {message} from "antd";

export default function useUICanvasDBRelationCreate({selectedInput, selectedUICanvasId}) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    const createDBRelation = async ({action, description, table, tableName, field, fieldName, input}: {
        action: string,
        description: string,
        table: string,
        tableName: string,
        field: string,
        fieldName: string,
        input: string
    }) => {
        if (!selectedUICanvasId) {
            console.error("selectedUICanvasId is not defined");
            return;
        }
        if (!selectedInput?.fkUserStoryId) {
            console.error("selectedInput.fkUserStoryId is not defined");
            return;
        }

        const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);

        try {
            const docSnap = await getDoc(uiCanvasDocRef);
            const currentDoc = docSnap.data() || {};

            const fkUserStoryId = selectedInput.fkUserStoryId;
            const inputId = input;
            const prevInput = currentDoc.input || {};
            const prevStory = prevInput[fkUserStoryId] || {};
            const prevItem = prevStory[inputId] || {};
            const prevDatabaseRelation = prevItem.databaseRelation || {};

            // Yeni ilişki ID'si ve sırası
            const dbRelId = uuidv4();
            const databaseRelationCount = Object.keys(prevDatabaseRelation).length;

            // Yeni databaseRelation kaydı
            const newRelation = {
                action,
                description,
                table,
                tableName,
                field,
                fieldName,
                input,
                inputName: prevItem.inputName,
                uiId: selectedUICanvasId,
                uiName: selectedInput.uiName,
                dbRelId,
                order: databaseRelationCount,
            };

            // Dot-notation ile sadece hedef nested alanı ekle
            const updatePayload = {
                [`input.${selectedUICanvasId}.${inputId}.databaseRelation.${dbRelId}`]: newRelation,
            };

            await updateDoc(uiCanvasDocRef, updatePayload);

            // Add to ui_canvas_history
            await addDBRelationHistoryRecord({
                uiCanvasId: selectedUICanvasId,
                inputId: inputId,
                inputName: prevItem.inputName || '',
                dbRelationId: dbRelId,
                action: action,
                description: description,
                table: table,
                tableName: tableName,
                field: field,
                fieldName: fieldName,
                existingCount: databaseRelationCount,
            });

            message.success("Database Relation created successfully");
        } catch (e) {
            console.error("Error creating Database Relation:", e);
            message.error("Failed to create Database Relation");
        }
    }

    // Add to ui_canvas_history
    const addDBRelationHistoryRecord = async (historyData: {
        uiCanvasId: string;
        inputId: string;
        inputName: string;
        dbRelationId: string;
        action: string;
        description: string;
        table: string;
        tableName: string;
        field: string;
        fieldName: string;
        existingCount: number;
    }) => {
        try {
            const uiCanvasHistoryDocRef = doc(db, 'ui_canvas_history', historyData.uiCanvasId);
            
            const historyRecord = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: userData?.uid || 'unknown',
                userName: userData?.name || userData?.email || 'Unknown User',
                userEmail: userData?.email || 'Unknown Email',
                actionType: 'DB_RELATION_CREATE',
                fieldName: 'db_relations',
                inputId: historyData.inputId,
                inputName: historyData.inputName,
                dbRelationId: historyData.dbRelationId,
                action: historyData.action,
                description: historyData.description,
                table: historyData.table,
                tableName: historyData.tableName,
                field: historyData.field,
                // fieldName: historyData.fieldName,
                order: historyData.existingCount,
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

            console.log('DB relation history record added successfully');
        } catch (error) {
            console.error('Error adding DB relation history record:', error);
        }
    }

    return {createDBRelation}
}