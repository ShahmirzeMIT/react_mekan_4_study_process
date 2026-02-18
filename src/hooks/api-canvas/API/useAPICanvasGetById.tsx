import {collection, documentId, getDocs, query, where} from "firebase/firestore";
import {db} from "@/config/firebase.ts";

export default function useAPICanvasGetById() {
    // const currentProject = useSelector((state: RootState) => state.project.currentProject)

    const getAPICanvasByIds = async (ids: string[]) => {
        if (!ids?.length) return {};
        const result: Record<string, any> = {};

        // Firestore in sorgusu 10 elemanla sınırlıdır
        const chunks = [];
        for (let i = 0; i < ids.length; i += 10) {
            chunks.push(ids.slice(i, i + 10));
        }

        for (const chunk of chunks) {
            const q = query(
                collection(db, "api_canvas"),
                where(documentId(), "in", chunk)
            );
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(docSnap => {
                result[docSnap.id] = docSnap.data();
            });
        }

        return result;
    }
    return {getAPICanvasByIds}
}