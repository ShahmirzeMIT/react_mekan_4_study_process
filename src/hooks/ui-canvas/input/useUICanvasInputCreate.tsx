import {doc, getDoc, updateDoc, serverTimestamp, arrayUnion} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {v4 as uuidv4} from "uuid";
import {message} from "antd";

export default function useUICanvasInputCreate({selectedUI, uiList, selectedUICanvasId}) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    const createInput = async (inputName: string, componentInfo = null) => {
        if (!selectedUI) return;
        const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);
        const id = uuidv4();
        const docSnapInput = await getDoc(uiCanvasDocRef).then(res => res.get("input"));
        const existingCount = Object.keys(docSnapInput[selectedUICanvasId] ?? {}).length;
        const payload = {
            ...selectedUI,
            input: {
                ...docSnapInput,
                [selectedUICanvasId]: {
                    ...docSnapInput[selectedUICanvasId],
                    [id]: {
                        inputName,
                        fkUserStoryId: selectedUICanvasId,
                        ...(componentInfo ? componentInfo : {
                            fkTableId: "",
                            inputType: "IN",
                            componentType: "txt",
                            hasLabel: true,
                            cellNo: "6",
                            content: ""
                        }),
                        id,
                        order: existingCount
                    }
                },

            }
        }
        try {
            await updateDoc(uiCanvasDocRef, payload);
            
            // Add to ui_canvas_history
            await addInputHistoryRecord({
                uiCanvasId: selectedUICanvasId,
                inputId: id,
                inputName: inputName,
                componentInfo: componentInfo,
                existingCount: existingCount,
            });
            
            message.success("Input added successfully");
            return {...componentInfo, id}
        } catch (e) {
            console.log(e)
        }

    }

    // Add to ui_canvas_history
    const addInputHistoryRecord = async (historyData: {
        uiCanvasId: string;
        inputId: string;
        inputName: string;
        componentInfo: any;
        existingCount: number;
    }) => {
        try {
            const uiCanvasHistoryDocRef = doc(db, 'ui_canvas_history', historyData.uiCanvasId);
            
            const historyRecord = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: userData?.uid || 'unknown',
                userName: userData?.name || userData?.email || 'Unknown User',
                userEmail: userData?.email || 'Unknown Email',
                actionType: 'INPUT_CREATE',
                fieldName: 'inputs',
                inputId: historyData.inputId,
                inputName: historyData.inputName,
                componentInfo: historyData.componentInfo || {
                    fkTableId: "",
                    inputType: "IN",
                    componentType: "txt",
                    hasLabel: true,
                    cellNo: "6",
                    content: ""
                },
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
                    inputs: [historyRecord],
                    allChanges: [historyRecord],
                });
            } else {
                // Update existing document
                await updateDoc(uiCanvasHistoryDocRef, {
                    updatedAt: serverTimestamp(),
                    inputs: arrayUnion(historyRecord),
                    allChanges: arrayUnion(historyRecord),
                });
            }

            console.log('Input history record added successfully');
        } catch (error) {
            console.error('Error adding input history record:', error);
        }
    }

    return {createInput}
}