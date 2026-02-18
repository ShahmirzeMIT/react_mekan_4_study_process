import {useEffect, useState} from "react";
import useGetMonetizationDetails from "@/hooks/monetization-canvas/getMonetizationDetails.ts";
import {IMonetizationCanvasBody, IMonetizationCanvasList} from "@/hooks/monetization-canvas/types.ts";
import useUpdateMonetization from "@/hooks/monetization-canvas/useUpdateMonetization.tsx";
import {doc, onSnapshot, setDoc, getDoc, serverTimestamp} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import useAddMonetizationFunctions from "@/hooks/monetization-canvas/useMonitezationAdd.tsx";
import useAIAgentFunctions from "@/hooks/monetization-canvas/useAIAgentFunctions.tsx";
import {RootState} from "@/store";
import {useSelector} from "react-redux";
import { message } from "antd";

export interface MonetizationExportData {
    projectId: string;
    projectName: string;
    documentId: string;
    monetizations: IMonetizationCanvasList[];
    monetizationBody: IMonetizationCanvasBody | null;
    exportDate: string;
    exportVersion: string;
}

export default function useMonetizationStatesPreview() {
    const [monetizations, setMonetizations] = useState<IMonetizationCanvasList[]>([])
    const [selectedMonetization, setSelectedMonetization] = useState<IMonetizationCanvasBody | undefined>();
    const [selectedMonetizationId, setSelectedMonetizationId] = useState<string | undefined>();
    const [isOpenmonetizationAddModal, setIsOpenmonetizationAddModal] = useState({isOpen: false, isEdit: false});
    const [isOpenAiAgentModal, setIsOpenAiAgentModal] = useState<boolean>(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const currentProject = useSelector((state: RootState) => state.project.currentProject);
    const {getMonetizationDetails} = useGetMonetizationDetails({
        setSelectedMonetization,
        setSelectedMonetizationId,
        setMonetizations
    })
    const {updateMonetization} = useUpdateMonetization({
        selectedMonetizationId,
        selectedMonetization,
        list: monetizations
    });
    const {addMonetization} = useAddMonetizationFunctions({
        selectedMonetization,
        monetizations,
        selectedMonetizationId
    });
    const {generateMonetizationCanvas} = useAIAgentFunctions({selectedMonetizationId, updateMonetization})

    useEffect(() => {
        if (!currentProject?.id) return;
        getMonetizationDetails()
    }, [currentProject]);

    useEffect(() => {
        if (!currentProject?.id) return
        const monetizationUnsubcribe = onSnapshot(doc(db, "monetization_canvas", currentProject.id), (snapshot) => {
            const list = snapshot.get("list") || [];
            setSelectedMonetization(snapshot.get("body"));
            setMonetizations(list);
        });
        return () => {
            monetizationUnsubcribe();
        }
    }, [currentProject]);

    const handleExportMonetization = async () => {
        if (!currentProject?.id) {
            message.warning('Please select a project first');
            return;
        }

        setExportLoading(true);
        try {
            // Get the complete monetization document from Firestore
            const monetizationDocRef = doc(db, "monetization_canvas", currentProject.id);
            const monetizationSnap = await getDoc(monetizationDocRef);
            
            if (!monetizationSnap.exists()) {
                message.warning('No monetization data found for this project');
                return;
            }
            
            const monetizationData = monetizationSnap.data();
            
            console.log(monetizationData,'monetizationData');
            
            // Get the list and body from the document
            const exportList: IMonetizationCanvasList[] = monetizationData.list || [];
            const exportBody: IMonetizationCanvasBody | null = monetizationData.body || null;
            
            // Check if there's actual data to export
            if (exportList.length === 0 && !exportBody) {
                message.warning('No monetization data to export');
                return;
            }
            
            // Prepare export data
            const exportData = {
                projectId: currentProject.id,
                projectName: currentProject.name || `Project ${currentProject.id}`,
                documentId: monetizationSnap.id,
                ...monetizationData,
                exportDate: new Date().toISOString(),
                exportVersion: '1.0',
            };

            // Convert to JSON string with pretty formatting
            const jsonString = JSON.stringify(exportData, null, 2);
            
            // Create download
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().getTime();
            link.href = url;
            link.download = `monetization-export-${currentProject.name || currentProject.id}-${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            message.success(`Monetization export completed! (${exportList.length} items)`);
            
        } catch (error) {
            console.error('Error exporting monetization data:', error);
            message.error('Failed to export monetization data');
        } finally {
            setExportLoading(false);
        }
    };

const handleImportMonetization = (file: File) => {
    setImportLoading(true);
    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const importData: any = JSON.parse(content);
                
                console.log('Import data:', importData);
                
                // Validate import data - check for both body and list
                if (!importData.body || typeof importData.body !== 'object') {
                    message.error('Invalid monetization import file - missing or invalid "body" object');
                    return;
                }
                
                if (!importData.list || !Array.isArray(importData.list)) {
                    message.error('Invalid monetization import file - missing or invalid "list" array');
                    return;
                }

                // Check if current project matches import project
                if (currentProject?.id !== importData.projectId) {
                    const shouldContinue = confirm(
                        `Import data is from project: "${importData.projectName}"\n` +
                        `You are currently in: "${currentProject?.name}"\n\n` +
                        `Do you want to continue importing?`
                    );
                    if (!shouldContinue) {
                        setImportLoading(false);
                        return;
                    }
                }

                // Get current document to merge
                const monetizationDocRef = doc(db, "monetization_canvas", currentProject!.id);
                const currentDocSnap = await getDoc(monetizationDocRef);
                
                let currentBody: Record<string, any> = {};
                let currentList: IMonetizationCanvasList[] = [];
                
                if (currentDocSnap.exists()) {
                    currentBody = currentDocSnap.get("body") || {};
                    currentList = currentDocSnap.get("list") || [];
                }
                
                // Create new IDs for all imported monetizations to avoid conflicts
                const idMap: Record<string, string> = {};
                
                // Process the imported body - generate new IDs for each key
                const importedBodyKeys = Object.keys(importData.body);
                const newBody: Record<string, any> = { ...currentBody };
                
                for (const key of importedBodyKeys) {
                    const newId = Math.random().toString(36).substring(2, 15);
                    idMap[key] = newId;
                    
                    // Copy the body data with new ID
                    newBody[newId] = {
                        ...importData.body[key],
                        // Preserve the original ID in the data if needed
                        originalId: key
                    };
                }
                
                // Process the imported list - update IDs using the mapping
                const importedList = importData.list.map((item: IMonetizationCanvasList) => {
                    const newId = idMap[item.id] || Math.random().toString(36).substring(2, 15);
                    return {
                        ...item,
                        id: newId
                    };
                });
                
                // Merge existing list with imported list
                const mergedList = [...currentList, ...importedList];
                
                // Prepare update data
                const updateData: any = {
                    body: newBody,
                    list: mergedList,
                    updatedAt: serverTimestamp()
                };
                
                // Always use setDoc with merge: true to create or update the document
                await setDoc(monetizationDocRef, updateData, { merge: true });
                
                // Force refresh the data
                if (getMonetizationDetails) {
                    getMonetizationDetails();
                }
                
                // Also manually update local state for immediate feedback
                setMonetizations(mergedList);
                setSelectedMonetization(newBody);

                message.success(
                    `Successfully imported ${importedList.length} monetization item(s)\n` +
                    `Total items now: ${mergedList.length}`
                );
                
            } catch (parseError: any) {
                console.error('Error parsing import file:', parseError);
                message.error(`Failed to parse import file: ${parseError.message || 'Invalid JSON format'}`);
            } finally {
                setImportLoading(false);
            }
        };
        
        reader.onerror = () => {
            message.error('Error reading file');
            setImportLoading(false);
        };
        
        reader.readAsText(file);
        
    } catch (error) {
        console.error('Error importing monetization data:', error);
        message.error('Failed to import monetization data');
        setImportLoading(false);
    }
};

    return {
        selectedMonetization,
        monetizations,
        selectedMonetizationId,
        updateMonetization,
        setSelectedMonetizationId,
        setSelectedMonetization,
        isOpenmonetizationAddModal,
        setIsOpenmonetizationAddModal,
        addMonetization,
        isOpenAiAgentModal,
        setIsOpenAiAgentModal,
        generateMonetizationCanvas,
        handleExportMonetization,
        handleImportMonetization,
        exportLoading,
        importLoading,
        currentProject
    }
}