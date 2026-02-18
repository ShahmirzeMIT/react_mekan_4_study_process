import {doc, getDoc, updateDoc, serverTimestamp, arrayUnion} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {message} from "antd";

export function useUICanvasComponentInfoCreate({selectedInput, selectedUICanvasId, selectedUI}) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    const createComponentInfo = async (componentInfo) => {
        if (!selectedUI || !selectedUICanvasId || !selectedInput) return;

        const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);
        const path = `input.${selectedUICanvasId}.${selectedInput.id}`;

        try {
            const docSnap = await getDoc(uiCanvasDocRef);
            if (!docSnap.exists()) throw new Error("Document does not exist");

            // mevcut component info
            const existing = docSnap.get(path) || {};

            // eskiyle yeniyi birleştir
            // Normal merge: eğer componentInfo'da bir alan varsa onu kullan, yoksa mevcut değeri koru
            const updated = {
                ...existing,
                ...componentInfo,
                // hasLabel'ı özel olarak yönet - eğer componentInfo'da varsa kullan, yoksa mevcut değeri koru
                // Eğer ikisi de undefined ise, componentType'a göre default değer ver
                hasLabel: componentInfo.hasLabel !== undefined 
                    ? componentInfo.hasLabel 
                    : (existing.hasLabel !== undefined 
                        ? existing.hasLabel 
                        : !["btn", "hlink"].includes(componentInfo.componentType || existing.componentType || ""))
            };

            // sadece merge sonucu güncelle
            await updateDoc(uiCanvasDocRef, {
                [path]: updated
            });

            // Add to ui_canvas_history
            await addComponentInfoHistoryRecord({
                uiCanvasId: selectedUICanvasId,
                inputId: selectedInput.id,
                inputName: selectedInput.inputName || '',
                oldComponentInfo: existing,
                newComponentInfo: updated,
            });

            message.success("Component Info updated successfully");
        } catch (e) {
            console.error("Error updating component info:", e);
            message.error("Failed to update component info");
        }
    }

    // Add to ui_canvas_history
    const addComponentInfoHistoryRecord = async (historyData: {
        uiCanvasId: string;
        inputId: string;
        inputName: string;
        oldComponentInfo: any;
        newComponentInfo: any;
    }) => {
        try {
            const uiCanvasHistoryDocRef = doc(db, 'ui_canvas_history', historyData.uiCanvasId);
            
            const historyRecord = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: userData?.uid || 'unknown',
                userName: userData?.name || userData?.email || 'Unknown User',
                userEmail: userData?.email || 'Unknown Email',
                actionType: 'COMPONENT_INFO_UPDATE',
                fieldName: 'component_info',
                inputId: historyData.inputId,
                inputName: historyData.inputName,
                oldComponentInfo: historyData.oldComponentInfo,
                newComponentInfo: historyData.newComponentInfo,
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
                    component_info: [historyRecord],
                    allChanges: [historyRecord],
                });
            } else {
                // Update existing document
                await updateDoc(uiCanvasHistoryDocRef, {
                    updatedAt: serverTimestamp(),
                    component_info: arrayUnion(historyRecord),
                    allChanges: arrayUnion(historyRecord),
                });
            }

            console.log('Component info history record added successfully');
        } catch (error) {
            console.error('Error adding component info history record:', error);
        }
    }

    return {createComponentInfo}
}