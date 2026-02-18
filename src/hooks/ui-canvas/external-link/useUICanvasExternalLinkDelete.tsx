import {RootState, useAppSelector} from "@/store";
import {doc, getDoc, setDoc} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {message} from "antd";

export default function useUICanvasExternalLinkDelete() {
    const {currentCanvas} = useAppSelector((state: RootState) => state.auth);
    const currentProject = useAppSelector((state) => state.project.currentProject);
    const deleteExternalLink = async (id: string) => {
        if (!currentProject?.id || !currentCanvas?.id) {
            console.error("Project ID və UI Canvas ID tələb olunur");
            return;
        }

        const docRef = doc(db, "external_links", currentProject.id);

        try {
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                message.error("Document not found");
                return;
            }

            const data = docSnap.data();
            const canvasLinks = data?.links?.[currentCanvas.id] || {};

            if (!canvasLinks[id]) {
                message.error("Link tapılmadı");
                return;
            }

            // 🔹 Seçilmiş linki sil
            const {[id]: deleted, ...remainingLinks} = canvasLinks;

            const newData = {
                links: {
                    ...data?.links,
                    [currentCanvas.id]: remainingLinks,
                },
            };

            await setDoc(docRef, newData);

            message.success("External Link deleted successfully");
            console.log("✅ External link uğurla silindi:", id);
        } catch (error) {
            message.error("Something went wrong");
            console.error("❌ External link silinərkən xəta:", error);
        }
    }

    return {deleteExternalLink}
}