import {doc, updateDoc, getDoc, setDoc, serverTimestamp} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {RootState} from "@/store";
import {useSelector} from "react-redux";

export default function useUpdateMonetization({selectedMonetization, list, selectedMonetizationId}) {
    const currentProject = useSelector((state: RootState) => state.project.currentProject);
    const currentUserData = JSON.parse(localStorage.getItem("userData") || "{}");
    const currentUserId = currentUserData?.uid;

    // Helper function to create history record for Monetization Canvas
    const createMonetizationHistoryRecord = async (
        actionType: string,
        fieldName: string,
        oldValue: any,
        newValue: any,
        monetizationId: string,
        monetizationName?: string
    ) => {
        try {
            if (!currentUserId || !monetizationId) {
                console.warn("No user or Monetization ID for history record");
                return;
            }

            const historyRecord = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: currentUserId,
                userName: currentUserData?.name || currentUserData?.email || 'Unknown User',
                userEmail: currentUserData?.email || 'Unknown Email',
                actionType,
                fieldName,
                oldValue,
                newValue,
                monetizationId,
                monetizationName,
                timestamp: new Date().toISOString(),
            };

            const historyDocRef = doc(db, 'monetization_canvas_history', monetizationId);
            const existingDoc = await getDoc(historyDocRef);
            
            if (existingDoc.exists()) {
                const existingData = existingDoc.data();
                const existingChanges = existingData.allChanges || [];
                
                // Create updated changes array
                const updatedChanges = [historyRecord, ...existingChanges].slice(0, 100);
                
                // Create update data object
                const updateData: any = {
                    monetizationId,
                    monetizationName: monetizationName || 'Unknown Monetization',
                    updatedAt: serverTimestamp(),
                    allChanges: updatedChanges,
                };

                // Add to specific action type records if needed
                const actionKey = `${actionType.toLowerCase()}_records`;
                const existingActionRecords = existingDoc.data()[actionKey] || [];
                updateData[actionKey] = [historyRecord, ...existingActionRecords].slice(0, 20);

                await updateDoc(historyDocRef, updateData);
            } else {
                await setDoc(historyDocRef, {
                    monetizationId,
                    monetizationName: monetizationName || 'Unknown Monetization',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    allChanges: [historyRecord],
                    [`${actionType.toLowerCase()}_records`]: [historyRecord],
                });
            }
            
            console.log(`Monetization history record created: ${actionType}`);
        } catch (error) {
            console.error('Error creating Monetization history record:', error);
        }
    };

    const updateMonetization = async (key: string, value: any) => {
        if (!selectedMonetizationId) {
            console.warn("No monetization selected for update");
            return;
        }

        // Get old value before update
        const oldValue = selectedMonetization[selectedMonetizationId]?.[key];
        
        const payload = {
            list,
            body: {
                ...selectedMonetization,
                [selectedMonetizationId]: {
                    ...selectedMonetization[selectedMonetizationId],
                    ...(key === "_" ? value : {[key]: value})
                }
            }
        };

        // Get monetization name for history record
        const monetizationItem = list.find(item => item.id === selectedMonetizationId);
        const monetizationName = monetizationItem?.title || 
                               selectedMonetization[selectedMonetizationId]?.name || 
                               selectedMonetization[selectedMonetizationId]?.label || 
                               `Monetization ${selectedMonetizationId}`;

        // Create history record for the monetization update
        await createMonetizationHistoryRecord(
            'MONETIZATION_UPDATE',
            key,
            oldValue,
            value,
            selectedMonetizationId, // Use monetization ID, not project ID
            monetizationName
        );

        // Update the monetization canvas document
        const monetizationCanvasDocRef = doc(db, "monetization_canvas", currentProject.id);
        await updateDoc(monetizationCanvasDocRef, payload);
    }

    return {updateMonetization}
}