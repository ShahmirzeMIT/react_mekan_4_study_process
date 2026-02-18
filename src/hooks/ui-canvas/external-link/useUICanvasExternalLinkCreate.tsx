import {RootState, useAppSelector} from "@/store";
import {doc, getDoc, setDoc, serverTimestamp, arrayUnion} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {v4 as uuidv4} from "uuid";
import {message} from "antd";

export default function useUICanvasExternalLinkCreate({type}) {
    const {currentCanvas} = useAppSelector((state: RootState) => state.auth);
    const currentProject = useAppSelector((state) => state.project.currentProject);
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    const createExternalLink = async ({title, url, file_name}: { title: string; url: string; file_name?: string }) => {
        // Get canvas ID from currentCanvas state or localStorage
        const canvasId = currentCanvas?.id || localStorage.getItem("currentUI");
        
        if (!currentProject?.id || !canvasId) {
            console.error("Project ID və UI Canvas ID tələb olunur");
            const error = new Error("Please select a UI Canvas first");
            message.error("Please select a UI Canvas first");
            throw error;
        }

        const dynamicId = uuidv4();
        const docRef = doc(db, "external_links", currentProject.id);

        try {
            const docSnap = await getDoc(docRef);
            let isFirstItem = false;
            let nextOrder = 1;

            if (docSnap.exists()) {
                const data = docSnap.data();
                const canvasLinks = data?.links?.[canvasId];

                if (!canvasLinks) {
                    // bu canvas üçün ilk link
                    isFirstItem = true;
                } else {
                    // artıq linklər varsa, sayına görə növbəti order tap
                    const linkCount = Object.keys(canvasLinks).length;
                    nextOrder = linkCount + 1;
                }
            } else {
                // sənəd yoxdur → bu həm birinci itemdir, həm də order = 1
                isFirstItem = true;
            }

            const existingData = docSnap.exists() ? docSnap.data() : {};
            const existingLinks = existingData?.links || {};
            const existingCanvasLinks = existingLinks[canvasId] || {};

            const newLinkData = {
                [dynamicId]: {
                    id: dynamicId,
                    type,
                    title,
                    ...(file_name ? {file_name} : {}),
                    ...(type === "image" ? {image: url} : {url}),
                    defaultView: isFirstItem,
                    order: nextOrder,
                },
            };

            const newData = {
                links: {
                    ...existingLinks,
                    [canvasId]: {
                        ...existingCanvasLinks,
                        ...newLinkData,
                    },
                },
            };

            await setDoc(docRef, newData, {merge: true});

            // Add to ui_canvas_history
            await addExternalLinkHistoryRecord({
                uiCanvasId: canvasId,
                externalLinkId: dynamicId,
                title: title,
                url: url,
                type: type,
                file_name: file_name,
            });

            message.success("External Link created successfully");
            console.log("✅ External link uğurla əlavə/yeniləndi:", newData);
            return dynamicId;
        } catch (error) {
            console.error("❌ External link əlavə edilərkən xəta:", error);
            message.error("Something went wrong");
            throw error;
        }
    };

    // Add to ui_canvas_history
    const addExternalLinkHistoryRecord = async (historyData: {
        uiCanvasId: string;
        externalLinkId: string;
        title: string;
        url: string;
        type: string;
        file_name?: string;
    }) => {
        try {
            const uiCanvasHistoryDocRef = doc(db, 'ui_canvas_history', historyData.uiCanvasId);
            
            const historyRecord = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: userData?.uid || 'unknown',
                userName: userData?.name || userData?.email || 'Unknown User',
                userEmail: userData?.email || 'Unknown Email',
                actionType: 'EXTERNAL_LINK_CREATE',
                fieldName: 'external_links',
                externalLinkId: historyData.externalLinkId,
                title: historyData.title,
                url: historyData.url,
                type: historyData.type,
                file_name: historyData.file_name || null,
                timestamp: new Date().toISOString(),
            };

            // Check if history document exists
            const historyDocSnap = await getDoc(uiCanvasHistoryDocRef);
            
            if (!historyDocSnap.exists()) {
                // Create new document
                await setDoc(uiCanvasHistoryDocRef, {
                    uiCanvasId: historyData.uiCanvasId,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    external_links: [historyRecord],
                    allChanges: [historyRecord],
                    createdBy: userData?.uid || '',
                    createdByName: userData?.name || userData?.email || 'Unknown User',
                    createdByEmail: userData?.email || 'Unknown Email',
                });
            } else {
                // Update existing document
                await setDoc(uiCanvasHistoryDocRef, {
                    updatedAt: serverTimestamp(),
                    external_links: arrayUnion(historyRecord),
                    allChanges: arrayUnion(historyRecord),
                }, { merge: true });
            }

            console.log('External link history record added successfully');
        } catch (error) {
            console.error('Error adding external link history record:', error);
        }
    };

    return {createExternalLink};
}