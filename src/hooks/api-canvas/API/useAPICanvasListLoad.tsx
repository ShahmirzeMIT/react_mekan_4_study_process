import {db} from '@/config/firebase.ts'
import {collection, doc, getDoc, getDocs} from 'firebase/firestore'
import {useSelector} from "react-redux";
import {RootState} from "@/store";

export default function useAPICanvasListLoad({
                                                setEndpoints,
                                                setSelectedEndpoint
                                            }) {
    const currentProject = useSelector((state: RootState) => state.project.currentProject);
    const canvasListLoad = async (setLoading: any) => {
        setLoading(true);
        const projectDoc = doc(db, "projects", currentProject.id);
        const project = await getDoc(projectDoc);
        const apiJsonString = project.get("api_json");
        const apiJson = apiJsonString ? JSON.parse(apiJsonString) : {};
        const apiJsonKeys = Object.keys(apiJson)
        const apiCanvasDoc = await getDocs(collection(db, "api_canvas"));
        const endpointsArray = [];
        const selectedEndpoint = JSON.parse(localStorage.getItem("selectedEndpoint"));
        if (!apiCanvasDoc.empty) {
            apiCanvasDoc.forEach(item => {
                if (apiJsonKeys.includes(item.id)) {
                    const data = item.data();
                    const newStructure = {
                        ...data,
                        name: data?.name ?? apiJson[item.id],
                    }
                    endpointsArray.push({...data, ...newStructure})
                }
            });
            if (!selectedEndpoint) localStorage.setItem("selectedEndpoint", JSON.stringify(endpointsArray[0]))
            setSelectedEndpoint(selectedEndpoint ? endpointsArray.find(item => item.id == selectedEndpoint.id) : endpointsArray[0])
            setEndpoints(endpointsArray);
        }
        setLoading(false);
    };

    return {
        canvasListLoad,

    }
}
