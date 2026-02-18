import {v4 as uuidv4} from "uuid";
import {doc, setDoc, updateDoc, serverTimestamp, getDoc} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {RootState} from "@/store";
import {useSelector} from "react-redux";

export default function useAddMonetizationFunctions({selectedMonetization, monetizations, selectedMonetizationId}) {
    const currentProject = useSelector((state: RootState) => state.project.currentProject);
    const currentUserData = JSON.parse(localStorage.getItem("userData") || "{}");
    const currentUserId = currentUserData?.uid;

    // Function to create monetization history record
    const createMonetizationHistoryRecord = async (
        actionType: string,
        monetizationId: string,
        monetizationTitle: string,
        oldValue: any,
        newValue: any
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
                fieldName: 'monetization',
                oldValue,
                newValue,
                monetizationId,
                monetizationTitle,
                timestamp: new Date().toISOString(), // Use regular Date object for array elements
            };

            const historyDocRef = doc(db, 'monetization_canvas_history', monetizationId);
            const existingDoc = await getDoc(historyDocRef);
            
            if (existingDoc.exists()) {
                const existingData = existingDoc.data();
                const existingChanges = existingData.allChanges || [];
                const updatedChanges = [historyRecord, ...existingChanges].slice(0, 100);
                
                await updateDoc(historyDocRef, {
                    updatedAt: serverTimestamp(),
                    allChanges: updatedChanges,
                    [`${actionType.toLowerCase()}_records`]: [
                        historyRecord, 
                        ...(existingData[`${actionType.toLowerCase()}_records`] || [])
                    ].slice(0, 20)
                });
            } else {
                // Document doesn't exist, create it with setDoc
                await setDoc(historyDocRef, {
                    monetizationId,
                    monetizationTitle,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    allChanges: [historyRecord],
                    [`${actionType.toLowerCase()}_records`]: [historyRecord]
                });
            }
            
            console.log(`Monetization history record created: ${actionType}`);
        } catch (error) {
            console.error('Error creating monetization history record:', error);
        }
    };

    const addMonetization = async (title: string, isEdit: boolean) => {
        try {
            const id = uuidv4();
            const monetizationCanvasDocRef = doc(db, "monetization_canvas", currentProject.id);

            // First, check if the document exists
            const monetizationCanvasDoc = await getDoc(monetizationCanvasDocRef);
            const documentExists = monetizationCanvasDoc.exists();

            if (isEdit) {
                // Find the monetization being edited
                const monetizationToEdit = monetizations.find(item => item.id === selectedMonetizationId);
                
                if (monetizationToEdit) {
                    // Create history record for edit
                    await createMonetizationHistoryRecord(
                        'MONETIZATION_UPDATE',
                        selectedMonetizationId,
                        title,
                        {
                            title: monetizationToEdit.title,
                            data: selectedMonetization
                        },
                        {
                            title,
                            data: selectedMonetization
                        }
                    );
                }

                const payload = {
                    body: {...selectedMonetization},
                    list: monetizations.map(item => item.id === selectedMonetizationId ? {...item, title} : item),
                    updatedAt: new Date().toISOString() // Use ISO string for updatedAt
                };
                
                if (documentExists) {
                    await updateDoc(monetizationCanvasDocRef, payload);
                } else {
                    // If document doesn't exist, create it
                    await setDoc(monetizationCanvasDocRef, {
                        ...payload,
                        createdAt: new Date().toISOString(), // Use ISO string for createdAt
                        projectId: currentProject.id
                    });
                }
            } else {
                // Create history record for creation
                await createMonetizationHistoryRecord(
                    'MONETIZATION_CREATE',
                    id,
                    title,
                    null,
                    {
                        title,
                        id,
                        description: "",
                        table_list: []
                    }
                );

                const payload = {
                    body: {
                        ...selectedMonetization, 
                        [id]: {
                            description: "",
                            table_list: []
                        }
                    },
                    list: [...monetizations, {title, id}],
                    updatedAt: new Date().toISOString() // Use ISO string for updatedAt
                };
                
                if (documentExists) {
                    await updateDoc(monetizationCanvasDocRef, payload);
                } else {
                    await setDoc(monetizationCanvasDocRef, {
                        ...payload,
                        createdAt: new Date().toISOString(), // Use ISO string for createdAt
                        projectId: currentProject.id
                    });
                }
            }
            
            return { success: true, message: isEdit ? 'Monetization updated successfully' : 'Monetization created successfully' };
            
        } catch (error) {
            console.error("Error adding/updating monetization:", error);
            throw error;
        }
    };

    return { addMonetization };
}