import {doc, getDoc} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {RootState} from "@/store";
import {useSelector} from "react-redux";

export default function useGetMonetizationDetails({
                                                      setSelectedMonetization,
                                                      setSelectedMonetizationId,
                                                      setMonetizations
                                                  }) {
    const currentProject = useSelector((state: RootState) => state.project.currentProject);

    async function getMonetizationDetails() {
        const monetizationCanvasDocRef = doc(db, "monetization_canvas", currentProject.id);
        const monetizationDetails = await getDoc(monetizationCanvasDocRef);
        if (monetizationDetails.exists()) {
            const list = monetizationDetails.get("list") || [];
            if (list.length) {
                setSelectedMonetizationId(list[0]?.id)
                setSelectedMonetization(monetizationDetails.get("body"));
                setMonetizations(list);
            }
        }
    }

    return {getMonetizationDetails}
}