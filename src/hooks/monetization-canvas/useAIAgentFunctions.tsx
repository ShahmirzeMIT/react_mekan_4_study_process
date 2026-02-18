import {callApi} from "@/utils/callApi.ts";
import {doc, setDoc, getDoc, serverTimestamp} from "firebase/firestore";
import {db} from "@/config/firebase.ts";

export default function useAIAgentFunctions({selectedMonetizationId, updateMonetization}) {
    const generateMonetizationCanvas = async (prompt: string) => {
        try {
            // Get current user data
            const currentUserData = JSON.parse(localStorage.getItem("userData") || "{}");
            const currentUserId = currentUserData?.uid;
            
            if (!currentUserId) {
                console.warn("No user logged in for history tracking");
            }

            // Call the API to generate monetization canvas
            const response = await callApi("/monetization-canvas/create-monetization-ai", {
                prompt: prompt,
                id: selectedMonetizationId
            });

            // Update the monetization with AI-generated data
            updateMonetization("_", response.data[selectedMonetizationId]);

            // Create simple history record - ONLY who updated and that it was AI_GENERATION
            if (selectedMonetizationId && currentUserId) {
                try {
                    const historyDocRef = doc(db, 'monetization_canvas_history', selectedMonetizationId);
                    
                    const historyRecord = {
                        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        userId: currentUserId,
                        userName: currentUserData?.name || currentUserData?.email || 'Unknown User',
                        userEmail: currentUserData?.email || 'Unknown Email',
                        actionType: 'AI_GENERATION',
                        monetizationId: selectedMonetizationId,
                        timestamp: new Date().toISOString(),
                        // NO RESPONSE DATA, ONLY WHO AND WHAT
                    };

                    // Check if document exists
                    const existingDoc = await getDoc(historyDocRef);
                    
                    if (existingDoc.exists()) {
                        const existingData = existingDoc.data();
                        const existingChanges = existingData.allChanges || [];
                        const updatedChanges = [historyRecord, ...existingChanges].slice(0, 100);
                        
                        const existingAIRecords = existingData.ai_generation_records || [];
                        const updatedAIRecords = [historyRecord, ...existingAIRecords].slice(0, 20);
                        
                        await setDoc(historyDocRef, {
                            updatedAt: serverTimestamp(),
                            allChanges: updatedChanges,
                            ai_generation_records: updatedAIRecords,
                            // Preserve existing createdAt
                            ...(existingData.createdAt && { createdAt: existingData.createdAt })
                        }, { merge: true });
                    } else {
                        await setDoc(historyDocRef, {
                            monetizationId: selectedMonetizationId,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                            allChanges: [historyRecord],
                            ai_generation_records: [historyRecord]
                        });
                    }
                    
                    console.log("AI generation history recorded");
                } catch (historyError) {
                    console.error("Failed to create history record:", historyError);
                    // Don't throw - history failure shouldn't break the main operation
                }
            }

        } catch (error) {
            console.error("Error generating monetization canvas:", error);
            throw error;
        }
    }
    
    return {generateMonetizationCanvas}
}