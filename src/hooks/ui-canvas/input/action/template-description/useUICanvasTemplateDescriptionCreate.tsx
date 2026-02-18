import {doc, getDoc, updateDoc, serverTimestamp, arrayUnion, setDoc} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {message} from "antd";
import {v4 as uuidv4} from "uuid";

export default function useUICanvasTemplateDescriptionCreate({selectedUICanvasId, selectedInput}) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    const templateDescriptionCreate = async (descriptionList) => {
        const inputId = selectedInput.id;
        if (!selectedUICanvasId || !inputId) {
            console.warn("selectedUICanvasId, inputId, or selectedInput.id is not set");
            return;
        }

        const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);

        try {
            const docSnap = await getDoc(uiCanvasDocRef);
            if (!docSnap.exists()) {
                message.error("UI Canvas document not found");
                return;
            }
            const prevItem = docSnap.data()?.input?.[selectedUICanvasId]?.[inputId]
            const existingTemplateDescription = prevItem?.templateDescription || {};

            const prevCount = Object.keys(existingTemplateDescription).length;

            const newDescriptions: Record<string, any> = {};

            descriptionList.forEach((item, index) => {
                const newId = uuidv4();
                newDescriptions[newId] = {
                    ...item,
                    id: newId,
                    templateDescId: item.id,
                    order: prevCount + index + 1,
                    inputId,
                    inputName: prevItem.inputName,
                    uiId: selectedUICanvasId,
                    uiName: selectedInput.uiName,
                };
            });

            const mergedTemplateDescription = {
                ...existingTemplateDescription,
                ...newDescriptions,
            };

            const updatePayload = {
                [`input.${selectedUICanvasId}.${inputId}.templateDescription`]: mergedTemplateDescription,
            };

            await updateDoc(uiCanvasDocRef, updatePayload);

            // Add to ui_canvas_history - artıq var
            await addTemplateDescriptionHistoryRecord({
                uiCanvasId: selectedUICanvasId,
                inputId: inputId,
                inputName: prevItem.inputName || '',
                templateDescriptions: descriptionList,
                existingCount: prevCount,
                newCount: descriptionList.length,
            });

            message.success("Template Description added successfully");
        } catch (error) {
            console.error("Error creating Template Description:", error);
            message.error("Failed to create Template Description ❌");
        }
    };

    // Add to ui_canvas_history - artıq var
    const addTemplateDescriptionHistoryRecord = async (historyData: {
        uiCanvasId: string;
        inputId: string;
        inputName: string;
        templateDescriptions: any[];
        existingCount: number;
        newCount: number;
    }) => {
        try {
            const uiCanvasHistoryDocRef = doc(db, 'ui_canvas_history', historyData.uiCanvasId);
            
            const historyRecord = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: userData?.uid || 'unknown',
                userName: userData?.name || userData?.email || 'Unknown User',
                userEmail: userData?.email || 'Unknown Email',
                actionType: 'TEMPLATE_DESCRIPTION_CREATE',
                fieldName: 'template_descriptions',
                inputId: historyData.inputId,
                inputName: historyData.inputName,
                templateDescriptions: historyData.templateDescriptions,
                existingCount: historyData.existingCount,
                newCount: historyData.newCount,
                totalCount: historyData.existingCount + historyData.newCount,
                timestamp: new Date().toISOString(),
            };

            // Check if history document exists
            const historyDocSnap = await getDoc(uiCanvasHistoryDocRef);
            
            if (!historyDocSnap.exists()) {
                // Create new document with setDoc instead of updateDoc for non-existent document
                await setDoc(uiCanvasHistoryDocRef, {
                    uiCanvasId: historyData.uiCanvasId,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    template_descriptions: [historyRecord],
                    allChanges: [historyRecord],
                });
            } else {
                // Update existing document
                await updateDoc(uiCanvasHistoryDocRef, {
                    updatedAt: serverTimestamp(),
                    template_descriptions: arrayUnion(historyRecord),
                    allChanges: arrayUnion(historyRecord),
                });
            }

            console.log('Template description history record added successfully');
        } catch (error) {
            console.error('Error adding template description history record:', error);
        }
    };

    return {templateDescriptionCreate}
}