import {message} from "antd";
import {v4 as uuidv4} from "uuid";
import {doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {useSelector} from "react-redux";
import {RootState} from "@/store";

export default function useUICanvasDuplicate({selectedUI, uiList, selectedUICanvasId}) {
    const currentProject = useSelector((state: RootState) => state.project.currentProject);
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    const duplicateUICanvas = async (name: string) => {
        const newId = uuidv4();

        const sourceDocRef = doc(db, "ui_canvas", selectedUICanvasId);
        const newDocRef = doc(db, "ui_canvas", newId);
        const projectDocRef = doc(db, "projects", currentProject?.id);

        try {
            // kaynak canvas dokümanını getir
            const sourceSnap = await getDoc(sourceDocRef);
            if (!sourceSnap.exists()) {
                message.error("Source UI Canvas not found");
                return;
            }

            const sourceData = sourceSnap.data();
            
            // Get input data from source - fərqli strukturları idarə et
            let sourceInput = {};
            if (sourceData.input) {
                // Əgər input obyektdirsə
                if (typeof sourceData.input === 'object' && sourceData.input !== null) {
                    // Əgər sourceData.input[selectedUICanvasId] varsa onu istifadə et, yoxsa bütün input-u götür
                    if (sourceData.input[selectedUICanvasId] !== undefined) {
                        sourceInput = sourceData.input[selectedUICanvasId];
                    } else {
                        sourceInput = sourceData.input;
                    }
                }
            }

            // Yeni dokument üçün data hazırla - undefined dəyərləri təmizlə
            const newCanvasData: any = {
                ...sourceData,
                id: newId,
                name: name,
                label: name,
                description: sourceData.description || "",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: userData?.uid || '',
                createdByName: userData?.name || userData?.email || 'Unknown User',
                createdByEmail: userData?.email || 'Unknown Email',
                duplicatedFrom: selectedUICanvasId,
                duplicatedFromName: sourceData.name || sourceData.label || '',
            };

            // input field-ini təhlükəsiz şəkildə əlavə et
            if (Object.keys(sourceInput).length > 0) {
                newCanvasData.input = {[newId]: sourceInput};
            } else {
                newCanvasData.input = {};
            }

            // undefined dəyərləri təmizlə
            Object.keys(newCanvasData).forEach(key => {
                if (newCanvasData[key] === undefined) {
                    delete newCanvasData[key];
                }
            });

            await setDoc(newDocRef, newCanvasData);

            // Create ui_canvas_history for duplicated canvas
            await createUICanvasHistoryForDuplicate(newId, name, selectedUICanvasId, sourceData, userData);

            // project dökümanını getir
            const projectSnap = await getDoc(projectDocRef);
            if (projectSnap.exists()) {
                const projectData = projectSnap.data();
                let dsJson = [];

                try {
                    const uiListObject = JSON.parse(projectData.digital_service_json || "{}");

                    dsJson = Array.isArray(uiListObject) ? uiListObject : Object.keys(uiListObject).map(item => ({id: item, label: uiListObject[item]}))
                } catch (err) {
                    console.warn("digital_service_json parse error:", err);
                    dsJson = [];
                }

                // yeni öğeyi ekle
                dsJson.push({
                    label: name,
                    id: newId,
                });

                // güncelle
                await updateDoc(projectDocRef, {
                    digital_service_json: JSON.stringify(dsJson),
                });
            }

            message.success("UI Canvas duplicated successfully");
            return newId; // Yeni ID-ni return et
        } catch (e) {
            console.error(e);
            localStorage.removeItem("currentUI");
            message.error("Something went wrong while duplicating");
            return null;
        }
    }

    // Create ui_canvas_history for duplicated canvas
    const createUICanvasHistoryForDuplicate = async (
        newCanvasId: string, 
        name: string, 
        sourceCanvasId: string,
        sourceData: any,
        userData: any
    ) => {
        try {
            const uiCanvasHistoryDocRef = doc(db, 'ui_canvas_history', newCanvasId);
            
            const duplicateRecord = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: userData?.uid || 'unknown',
                userName: userData?.name || userData?.email || 'Unknown User',
                userEmail: userData?.email || 'Unknown Email',
                actionType: 'CANVAS_DUPLICATE',
                fieldName: 'canvas',
                oldValue: null,
                newValue: name,
                sourceCanvasId: sourceCanvasId,
                sourceCanvasName: sourceData.name || sourceData.label || '',
                timestamp: new Date().toISOString(),
            };

            // Create new history document for duplicated canvas
            await setDoc(uiCanvasHistoryDocRef, {
                uiCanvasId: newCanvasId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                canvas_duplicate: [duplicateRecord],
                name: [{
                    ...duplicateRecord,
                    actionType: 'FIELD_CREATE',
                    fieldName: 'name',
                }],
                allChanges: [duplicateRecord],
                createdBy: userData?.uid || '',
                createdByName: userData?.name || userData?.email || 'Unknown User',
                createdByEmail: userData?.email || 'Unknown Email',
            });

            // Also add to source canvas history if it exists
            await addDuplicateHistoryToSource(sourceCanvasId, newCanvasId, name, userData);

            console.log('UI Canvas duplicate history created successfully');
        } catch (error) {
            console.error('Error creating UI Canvas duplicate history:', error);
        }
    }

    // Add duplicate record to source canvas history
    const addDuplicateHistoryToSource = async (
        sourceCanvasId: string,
        newCanvasId: string,
        newCanvasName: string,
        userData: any
    ) => {
        try {
            const sourceHistoryDocRef = doc(db, 'ui_canvas_history', sourceCanvasId);
            
            const sourceDuplicateRecord = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: userData?.uid || 'unknown',
                userName: userData?.name || userData?.email || 'Unknown User',
                userEmail: userData?.email || 'Unknown Email',
                actionType: 'CANVAS_DUPLICATED_FROM',
                fieldName: 'canvas',
                oldValue: null,
                newValue: newCanvasName,
                duplicatedCanvasId: newCanvasId,
                duplicatedCanvasName: newCanvasName,
                timestamp: new Date().toISOString(),
            };

            // Check if source history document exists
            const historyDocSnap = await getDoc(sourceHistoryDocRef);
            
            if (historyDocSnap.exists()) {
                // Update existing document with arrayUnion
                await updateDoc(sourceHistoryDocRef, {
                    updatedAt: serverTimestamp(),
                    canvas_duplicated_from: arrayUnion(sourceDuplicateRecord),
                    allChanges: arrayUnion(sourceDuplicateRecord),
                });
            }

            console.log('Source canvas duplicate history added successfully');
        } catch (error) {
            console.error('Error adding source canvas duplicate history:', error);
        }
    }

    return {duplicateUICanvas}
}