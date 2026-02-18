import {useEffect, useState} from "react";
import {doc, onSnapshot} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {useAppSelector} from "@/store";

/**
 * Real-time external link listener for a specific project + uiCanvasId
 * @param {object} currentProject - current project object
 * @param {string} uiCanvasId - uiCanvasId to listen for
 * @param {function} setData - table data setter function
 */

export default function useUICanvasExternalLinksLoad(setTableData, setExternalLinkData, uiCanvasId) {
    const [allExternalLinks, setAllExternalLinks] = useState<any>({});
    // const {currentCanvas} = useAppSelector((state: RootState) => state.auth);
    const currentProject = useAppSelector((state) => state.project.currentProject);

    useEffect(() => {
        if (!currentProject?.id) return;
        const docRef = doc(db, "external_links", currentProject.id);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (!docSnap.exists()) {
                setAllExternalLinks({});
                setExternalLinkData(null)
                setTableData([])
                return;
            }

            const data = docSnap.data();
            // 🔹 Firestore datasını global dəyişəndə saxla, məsələn useState ilə
            setAllExternalLinks(data?.links || {});
        });

        return () => unsubscribe();
    }, [currentProject?.id]); // 👈 yalnız project dəyişəndə onSnapshot yenidən qurulur


// 🔸 currentCanvas dəyişəndə və ya Firestore datası yenilənəndə render logic

    useEffect(() => {
        if (!uiCanvasId || !allExternalLinks) return;

        const links = allExternalLinks?.[uiCanvasId];
        if (!links) {
            setTableData([]);
            setExternalLinkData(null);
            return;
        }

        const formattedData = Object.entries(links)
            .map(([dynamicId, item]) => ({
                key: item.id,
                title: item.title,
                url: item.url || item.image || "",
                type: item.type,
                file_name: item.file_name || "",
                defaultView: item.defaultView || false,
                order: item.order,
                id: item.id,
            }))
            .sort((a, b) => {
                if (a.defaultView && !b.defaultView) return -1;
                if (!a.defaultView && b.defaultView) return 1;
                return (a.order || 0) - (b.order || 0);
            });

        setExternalLinkData(formattedData);
        setTableData(formattedData);

    }, [uiCanvasId, allExternalLinks]); // 👈 canvas və Firestore datası dəyişəndə hesablama
}
