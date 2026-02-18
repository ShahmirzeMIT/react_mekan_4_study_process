import {useSelector} from "react-redux";
import {RootState} from "@/store";
import {doc, getDoc} from "firebase/firestore";
import {db} from "@/config/firebase.ts";

export default function useUICanvasDBUpload() {
    const currentProject = useSelector((state: RootState) => state.project.currentProject);
    const databaseLoad = async () => {
        try {
            const docProjectsRef = doc(db, "projects", currentProject.id);
            const docProjectsSnap = await getDoc(docProjectsRef);
            if (docProjectsSnap.exists()) {
                const data = docProjectsSnap.data();
                const raw = data?.database_json;
                let list: Record<string, string> = {};
                    list = raw ? JSON.parse(raw) : {};

                return {list}
            }
        } catch (err) {
            console.error("Firestore error:", err);
        }
    }
    const databaseFieldListLoad = async (tableId: string) => {
        const fieldList = {};
        try {
            const docFieldRef = doc(db, "database_canvas", tableId);
            const dbData = await getDoc(docFieldRef);

            if (dbData.data()?.field?.Field) fieldList[tableId] = dbData.data()?.field?.Field[tableId];
            return fieldList
            // fieldList[listId] = dbData.data()?.field?.Field ? dbData.data()?.field?.Field[listId] : []
        } catch (e) {
            console.warn("database_json parse failed", e);
            return {}
        }

    }
    return {databaseLoad, databaseFieldListLoad}
}