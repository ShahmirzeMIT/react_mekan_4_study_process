import {doc, getDoc, updateDoc} from "firebase/firestore";
import {db} from "@/config/firebase.ts";

export default function useUICanvasActionDeleteById({currentProject}) {
    const deleteActionById = async (id: string, objectKey: string, tableItem: any) => {
        const uiCanvasDocRef = doc(db, "ui_canvas", currentProject.id);

        try {
            const currentDoc = await getDoc(uiCanvasDocRef).then(res => res.data());
            if (!currentDoc) throw new Error("Document not found");

            const fkUserStoryId = tableItem.fkUserStoryId;
            const inputId = tableItem.id;

            const prevInput = currentDoc.input || {};
            const prevStory = prevInput[fkUserStoryId] || {};
            const prevItem = prevStory[inputId] || {};
            const prevRelation = prevItem[objectKey] || {};

            const {[id]: _, ...remainingRelations} = prevRelation;

            const newStoryItem = {
                ...prevStory,
                [inputId]: {
                    ...prevItem,
                    [objectKey]: remainingRelations,
                }
            };

            const newInput = {
                ...prevInput,
                [fkUserStoryId]: newStoryItem,
            };

            await updateDoc(uiCanvasDocRef, {
                ...currentDoc,
                input: newInput,
            });
        } catch (e) {
            console.error("❌ Silme hatası:", e);
        }
    }

    return {deleteActionById}
}