import {RootState, useAppSelector} from "@/store";
import {doc, getDoc, setDoc} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {message} from "antd";

export default function useUICanvasExternalLinkUpdate() {
    const {currentCanvas} = useAppSelector((state: RootState) => state.auth);
    const currentProject = useAppSelector((state) => state.project.currentProject);
    const updateExternalLink = async (id, values) => {
        if (!currentProject?.id || !currentCanvas?.id) {
            console.error("Project ID və UI Canvas ID tələb olunur");
            return;
        }

        const docRef = doc(db, "external_links", currentProject.id);

        try {
            const docSnap = await getDoc(docRef);
            const data = docSnap.data();
            const canvasLinks = data?.links?.[currentCanvas.id] || {};

            // Sadəcə seçilmiş linkin sahələrini yenilə (defaultView toxunulmur)
            const updatedCanvasLinks = {
                ...canvasLinks,
                [id]: {
                    ...canvasLinks[id], // mövcud sahələri saxla
                    ...values,
                },
            };

            const newData = {
                links: {
                    ...data?.links,
                    [currentCanvas.id]: updatedCanvasLinks,
                },
            };
            await setDoc(docRef, newData);

            message.success("External Link updated successfully");
            console.log("✅ External link uğurla yeniləndi:", newData);
        } catch (error) {
            message.error("Something went wrong");
            console.error("❌ External link yenilənərkən xəta:", error);
        }
    }
    return {updateExternalLink}
}