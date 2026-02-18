import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import getAllUI from "@/hooks/ui-canvas/getAllUI.ts";
import {ISelectedUI, UIList} from "@/hooks/ui-canvas/types.ts";
import {doc, getDoc, onSnapshot, updateDoc, addDoc, collection, setDoc, serverTimestamp, arrayUnion} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import useUpdateCanvas from "@/hooks/ui-canvas/useUpdateCanvas.tsx";
import {useSelector} from "react-redux";
import {RootState, setCurrentCanvas, useAppDispatch} from "@/store";
import useUICanvasCreate from "@/hooks/ui-canvas/useUICanvasCreate.tsx";
import useUICanvasUpdate from "@/hooks/ui-canvas/useUICanvasUpdate.tsx";
import useUICanvasDelete from "@/hooks/ui-canvas/canvas-functions/useUICanvasDelete.tsx";
import useUICanvasDuplicate from "@/hooks/ui-canvas/canvas-functions/useUICanvasDuplicate.tsx";
import useUICanvasInputCreate from "@/hooks/ui-canvas/input/useUICanvasInputCreate.tsx";
import useUICanvasInputColumns from "@/hooks/ui-canvas/input/useUICanvasInputColumns.tsx";
import useUICanvasDescriptionUpdate from "./description/useUICanvasDescriptionUpdate.tsx";
import useUICanvasManualDescriptionCreate
    from "@/hooks/ui-canvas/input/action/manual-description/useUICanvasManualDescriptionCreate.tsx";
import useUICanvasAPICallRelationCreate
    from "@/hooks/ui-canvas/input/action/api-call/useUICanvasAPICallRelationCreate.tsx";
import useUICanvasDBRelationCreate
    from "@/hooks/ui-canvas/input/action/database-relation/useUICanvasDBRelationCreate.tsx";
import {
    useUICanvasComponentInfoCreate
} from "@/hooks/ui-canvas/input/action/component-info/useUICanvasComponentInfoCreate.tsx";
import useUICanvasTemplateDescriptionCreate
    from "@/hooks/ui-canvas/input/action/template-description/useUICanvasTemplateDescriptionCreate.tsx";
import useUICanvasInputUpdate from "@/hooks/ui-canvas/input/useUICanvasInputUpdate.tsx";
import useUICanvasManualDescriptionUpdate
    from "@/hooks/ui-canvas/input/action/manual-description/useUICanvasManualDescriptionUpdate.tsx";
import useUICanvasManualDescriptionDelete
    from "@/hooks/ui-canvas/input/action/manual-description/useUICanvasManualDescriptionDelete.tsx";
import useUICanvasAPICallRelationUpdate
    from "@/hooks/ui-canvas/input/action/api-call/useUICanvasAPICallRelationUpdate.tsx";
import useUICanvasAPIRelationDelete from "@/hooks/ui-canvas/input/action/api-call/useUICanvasAPIRelationDelete.tsx";
import useUICanvasDBRelationUpdate
    from "@/hooks/ui-canvas/input/action/database-relation/useUICanvasDBRelationUpdate.tsx";
import useUICanvasDBRelationDelete
    from "@/hooks/ui-canvas/input/action/database-relation/useUICanvasDBRelationDelete.tsx";
import useUICanvasFormActionCreate from "@/hooks/ui-canvas/input/action/form-action/useUICanvasFormActionCreate.tsx";
import useUICanvasFormActionUpdate from "@/hooks/ui-canvas/input/action/form-action/useUICanvasFormActionUpdate.tsx";
import useUICanvasFormActionDelete from "@/hooks/ui-canvas/input/action/form-action/useUICanvasFormActionDelete.tsx";
import useUICanvasDescriptionsBulkDelete from "@/hooks/ui-canvas/useUICanvasDescriptionsBulkDelete.tsx";
import useUICanvasCreateBulkIssue from "@/hooks/ui-canvas/useUICanvasCreateBulkIssue.tsx";
import useUICanvasExternalLinksLoad from "@/hooks/ui-canvas/external-link/useUICanvasExternalLinksLoad.tsx";
import useUICanvasTemplateDescriptionUpdate
    from "@/hooks/ui-canvas/input/action/template-description/useUICanvasTemplateDescriptionUpdate.tsx";
import {message, Modal} from "antd";
import useUICanvasInputDelete from "@/hooks/ui-canvas/input/useUICanvasInputDelete.tsx";
import {ComponentJson} from "@/components/ui-canvas/common/types.ts";
import {callApi} from "@/utils/callApi.ts";
import type {CollectionCanvasAssignment} from "@/ui-canvas/collection/types";


export function useUICanvasStates() {
    const [inputColumns, setInputColumns] = useState([])
    const [allUIInputs, setAllUIInputs] = useState({});
    const [selectedUI, setSelectedUI] = useState<ISelectedUI>();
    const [selectedUICanvasId, setSelectedUICanvasId] = useState<string>('');
    const [uiList, setUIList] = useState<UIList[]>([]);
    const [isOpenUICreateModal, setIsOpenUICreateModal] = useState(false);
    const [isOpenUIUpdateModal, setIsOpenUIUpdateModal] = useState(false);
    const [description, setDescription] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true)
    const currentProject = useSelector((state: RootState) => state.project.currentProject);
    const {getUI} = getAllUI({setSelectedUI, setUIList, setSelectedUICanvasId, setAllUIInputs});
    const [editingUICanvas, setEditingUICanvas] = useState({name: ''});
    const [isOpenUICanvasDuplicateModal, setIsOpenUICanvasDuplicateModal] = useState(false);
    const [isOpenUICanvasCreateInputModal, setIsOpenUICanvasCreateInputModal] = useState(false);
    const [isOpenUICanvasUpdateInputModal, setIsOpenUICanvasUpdateInputModal] = useState(false);
    const [apiCanvasDrawerData, setApiCanvasDrawerData] = useState({open: false, data: null});
    const [dbCanvasDrawerData, setDBCanvasDrawerData] = useState({open: false, data: null});
    const [uiCanvasPreviewDrawerData, setUICanvasPreviewDrawerData] = useState({open: false, data: null});
    const [isOpenUICanvasCreateDescriptionModal, setIsOpenUICanvasCreateDescriptionModal] = useState(false);
    const [isOpenUICanvasActionsManualDescriptionDrawer, setIsOpenUICanvasActionsManualDescriptionDrawer] = useState(false);
    const [isOpenUICanvasManualDescriptionUpdateDrawer, setIsOpenUICanvasManualDescriptionUpdateDrawer] = useState(false);
    const [isOpenUICanvasActionsAPIRelationDrawer, setIsOpenUICanvasAPIRelationDrawer] = useState(false);
    const [isOpenUICanvasUpdateAPIRelationDrawer, setIsOpenUICanvasUpdateAPIRelationDrawer] = useState(false);
    const [isOpenUICanvasActionsDBRelationDrawer, setIsOpenUICanvasDBRelationDrawer] = useState(false);
    const [isOpenUICanvasUpdateDBRelationDrawer, setIsOpenUICanvasUpdateDBRelationDrawer] = useState(false);
    const [isOpenUICanvasActionsComponentInfoDrawer, setIsOpenUICanvasActionsComponentInfoDrawer] = useState(false);
    const [isOpenUICanvasActionsTemplateDescriptionDrawer, setIsOpenUICanvasActionsTemplateDescriptionDrawer] = useState(false);
    const [isOpenUICanvasActionsTemplateDescriptionUpdateDrawer, setIsOpenUICanvasActionsTemplateDescriptionUpdateDrawer] = useState(false);
    const [isOpenUICanvasCreateFormActionDrawer, setIsOpenUICanvasCreateFormActionDrawer] = useState(false);
    const [isOpenUICanvasUpdateFormActionDrawer, setIsOpenUICanvasUpdateFormActionDrawer] = useState(false);
    const [isOpenUICanvasCreateIssueDrawer, setIsOpenUICanvasCreateIssueDrawer] = useState(false);
    const [isOpenUICanvasExternalViewLinksDrawer, setIsOpenUICanvasExternalViewLinksDrawer] = useState(false);
    const [selectedDescriptions, setSelectedDescriptions] = useState([]);
    const [selectedUICanvasInputRows, setSelectedUICanvasInputRows] = useState<any[]>([]);
    const [isOpenUICanvasCollectionCanvasDrawer, setIsOpenUICanvasCollectionCanvasDrawer] = useState(false);
    const [collectionCanvasPreviewDrawerData, setCollectionCanvasPreviewDrawerData] = useState<{open: boolean; assignment: CollectionCanvasAssignment | null}>({open: false, assignment: null});
    const uiCanvasRef = useRef();
    const [externalViewLinkTableData, setExternalViewLinkTableData] = useState<any[]>([]);
    const [externalLinkData, setExternalLinkData] = useState(null);
    const [selectedLink, setSelectedLink] = useState({id: "ui_prototype"});
    const [isShowIssueStats, setIsShowIssueStats] = useState(false);
    const [issueDrawerData, setIssueDrawerData] = useState({open: false, data: null});
    const [isShowUIViewCSSColumn, setIsShowUIViewCSSColumn] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState<ComponentJson | null>(null);
    // AI / Gemini drawer state
    const [isOpenAIDrawer, setIsOpenAIDrawer] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiResult, setAiResult] = useState<any>(null);
    const inputDescriptionMainActions = useMemo(() => {
        const mainActions = [
            {label: "Remove Inputs", value: "remove_selected_inputs"},
            {label: "Remove Descriptions", value: "remove_selected_descriptions"},
            {label: "Input & Description UI View", value: "add_selected_descriptions_to_issue"},
        ];
        const filteredMainActions = mainActions.filter(item => {
            if (selectedUICanvasInputRows.length > 0 && item.value == "remove_selected_inputs") {
                return true

            }
            if (selectedDescriptions.length > 0 && item.value == "remove_selected_descriptions") {
                return true
            }
            if (item.value == "add_selected_descriptions_to_issue") {
                return true
            }
            return false
        })
        return filteredMainActions
    }, [selectedUICanvasInputRows, selectedDescriptions]);

    useUICanvasExternalLinksLoad(setExternalViewLinkTableData, setExternalLinkData,selectedUICanvasId)

    const dispatch = useAppDispatch();

    function openUICreateModal() {
        setIsOpenUICreateModal(true)
    }

    function openUICanvasUpdateInputModal() {
        setIsOpenUICanvasUpdateInputModal(true)
    }

    function closeUICanvasUpdateInputModal() {
        setIsOpenUICanvasUpdateInputModal(false)
    }

    function openUIUpdateModal(editingUI: any) {
        setEditingUICanvas(editingUI)
        setIsOpenUIUpdateModal(true)
    }

    function closeUICreateModal() {
        setIsOpenUICreateModal(false)
    }

    function closeUIUpdateModal() {
        setIsOpenUIUpdateModal(false)
    }

    function closeUICanvasCreateIssueDrawer() {
        setIsOpenUICanvasCreateIssueDrawer(false)
    }

    function openUICanvasCreateIssueDrawer() {
        setIsOpenUICanvasCreateIssueDrawer(true)
    }

    function openUICanvasActionsAPIRelationDrawer() {
        setIsOpenUICanvasAPIRelationDrawer(true)
    }

    function closeUICanvasActionsAPIRelationDrawer() {
        setIsOpenUICanvasAPIRelationDrawer(false)
    }

    function openUICanvasCreateFormActionDrawer() {
        setIsOpenUICanvasCreateFormActionDrawer(true)
    }

    function openUICanvasExternalViewLinksDrawer() {
        setIsOpenUICanvasExternalViewLinksDrawer(true)
    }

    function closeUICanvasExternalViewLinksDrawer() {
        setIsOpenUICanvasExternalViewLinksDrawer(false)
    }

    function closeUICanvasFormActionDrawer() {
        setIsOpenUICanvasCreateFormActionDrawer(false)
    }

    function openUICanvasUpdateFormActionDrawer() {
        setIsOpenUICanvasUpdateFormActionDrawer(true)
    }

    function closeUICanvasUpdateFormActionDrawer() {
        setIsOpenUICanvasUpdateFormActionDrawer(false)
    }

    function openUICanvasUpdateAPIRelationDrawer() {
        setIsOpenUICanvasUpdateAPIRelationDrawer(true)
    }

    function closeUICanvasUpdateAPIRelationDrawer() {
        setIsOpenUICanvasUpdateAPIRelationDrawer(false)
    }

    function openUICanvasUpdateDBRelationDrawer() {
        setIsOpenUICanvasUpdateDBRelationDrawer(true)
    }

    function closeUICanvasUpdateDBRelationDrawer() {
        setIsOpenUICanvasUpdateDBRelationDrawer(false)
    }

    function openUICanvasActionsDBRelationDrawer() {
        setIsOpenUICanvasDBRelationDrawer(true)
    }

    function openUICanvasActionsComponentInfoDrawer() {
        setIsOpenUICanvasActionsComponentInfoDrawer(true)
    }

    function openUICanvasActionsCollectionCanvasDrawer() {
        setIsOpenUICanvasCollectionCanvasDrawer(true)
    }

    function openCollectionCanvasPreviewDrawer(assignment: CollectionCanvasAssignment | null) {
        setCollectionCanvasPreviewDrawerData({open: Boolean(assignment), assignment});
    }

    function closeCollectionCanvasPreviewDrawer() {
        setCollectionCanvasPreviewDrawerData({open: false, assignment: null});
    }

    function closeUICanvasActionsDBRelationDrawer() {
        setIsOpenUICanvasDBRelationDrawer(false)
    }

    function closeUICanvasPreviewDrawer() {
        setUICanvasPreviewDrawerData({data: null, open: false})
    }

    function openUICanvasActionsTemplateDescriptionDrawer() {
        setIsOpenUICanvasActionsTemplateDescriptionDrawer(true)
    }

    function closeUICanvasActionsTemplateDescriptionDrawer() {
        setIsOpenUICanvasActionsTemplateDescriptionDrawer(false)
    }

    function openUICanvasActionsTemplateDescriptionUpdateDrawer() {
        setIsOpenUICanvasActionsTemplateDescriptionUpdateDrawer(true)
    }

    function closeUICanvasActionsTemplateDescriptionUpdateDrawer() {
        setIsOpenUICanvasActionsTemplateDescriptionUpdateDrawer(false)
    }

    function closeUICanvasActionsComponentInfoDrawer() {
        setIsOpenUICanvasActionsComponentInfoDrawer(false)
    }

    function closeUICanvasActionsCollectionCanvasDrawer() {
        setIsOpenUICanvasCollectionCanvasDrawer(false)
    }

    function openUICanvasManualDescriptionUpdateDrawer() {
        setIsOpenUICanvasManualDescriptionUpdateDrawer(true)
    }

    function closeBacklogIssueDrawer() {
        setIssueDrawerData({data: null, open: false})
    }

    useEffect(() => {
        if (!currentProject?.id) return
        getUI(setLoading)
    }, [currentProject]);

    useEffect(() => {
        if (selectedUI?.description) {
            setDescription(selectedUI?.description)
        }
    }, [selectedUI]);

    const closeAPICanvasDrawer = () => {
        setApiCanvasDrawerData({open: false, data: null})
    }
    const closeDBCanvasDrawer = () => {
        setDBCanvasDrawerData({open: false, data: null})
    }

    const onChangeUI = (id) => {
        localStorage.setItem("currentUI", String(id));
        setSelectedUICanvasId(id)
        setSelectedDescriptions([])
    }

    useEffect(() => {
        setSelectedLink(externalLinkData?.[0] ?? {id: "ui_prototype"});
    }, [externalLinkData]);

    const uiCanvasListener = () => {
        return onSnapshot(doc(db, "ui_canvas", selectedUICanvasId), (snapshot) => {

            const canvasData = snapshot.data();
            const {...rest} = canvasData ?? {};
            setAllUIInputs(rest.input);
            dispatch(setCurrentCanvas({
                ...selectedUI,
                ...rest,
                id: selectedUICanvasId,
                input: rest?.input?.[selectedUICanvasId] ?? {}
            }));
            return setSelectedUI({
                ...selectedUI,
                ...rest,
                id: selectedUICanvasId,
                input: rest?.input[selectedUICanvasId] ?? {}
            });
        })
    };

    const projectUIListListener = () => {
        console.log("project id", currentProject.id)
        return onSnapshot(doc(db, "projects", currentProject?.id), async (snapshot) => {
            const listJson = snapshot.get("digital_service_json");
            const listObject = JSON.parse(listJson ? listJson : "{}");
            const list = Array.isArray(listObject)
                ? listObject
                : Object.keys(listObject)?.map(item => ({
                    id: item,
                    label: listObject[item],
            })) || [];
            setUIList(list.sort((a, b) => a.label.localeCompare(b.label)));

            const currentUI = localStorage.getItem("currentUI");

            if (!list?.find(item => item.id == currentUI) && list.length > 0) {
                const uiCanvasDocRef = doc(db, "ui_canvas", list[0]?.id);
                const snapShot = await getDoc(uiCanvasDocRef).then(res => res.data());
                setSelectedUICanvasId(list?.[0]?.id ?? '');
                dispatch(
                    setCurrentCanvas({
                        ...selectedUI,
                        ...list[0],
                        id: list[0]?.id,
                        input: snapShot.input?.[list[0]?.id],
                    })
                );
                return setSelectedUI({
                    ...selectedUI,
                    ...list[0],
                    description: snapShot.description,
                    input: snapShot.input?.[list?.[0]?.id] || {},
                });
            } else {
                if (list.length) {
                    const uiCanvasDocRef = doc(db, "ui_canvas", currentUI);
                    const snapShot = await getDoc(uiCanvasDocRef).then(res => res.data());
                    setSelectedUICanvasId(currentUI);
                    dispatch(
                        setCurrentCanvas({
                            ...selectedUI,
                            ...list.find(item => item.id === currentUI),
                            id: currentUI,
                            input: snapShot.input?.[currentUI] || {},
                        })
                    );
                    setSelectedUI({
                        ...selectedUI,
                        ...list.find(item => item.id === currentUI),
                        description: snapShot.description,
                        input: snapShot.input?.[currentUI] || {},
                    });
                } else {
                    setSelectedUICanvasId("");
                    dispatch(
                        setCurrentCanvas({
                            label: "",
                            description: "",
                            id: "",
                            input: {},
                        })
                    );
                    setSelectedUI({
                        input: {},
                        description: "",
                        id: "", label: ""
                    })
                }

            }

        })
    };

    useEffect(() => {
        if (!selectedUICanvasId || !currentProject?.id) return
        const uiCanvasUnsubcribe = uiCanvasListener();
        return () => {
            uiCanvasUnsubcribe()
        }
    }, [selectedUICanvasId, currentProject]);

    useEffect(() => {
        if (!currentProject?.id) return
        const uiCanvasListUnsubcribe = projectUIListListener();
        return () => {
            uiCanvasListUnsubcribe()
        }
    }, [currentProject?.id]);


    const {updateCanvas} = useUpdateCanvas({selectedUI});
    const {createUICanvas} = useUICanvasCreate()
    const {updateUICanvas,updateUICanvasName} = useUICanvasUpdate({selectedUI, selectedUICanvasId, uiList})
    const {deleteUICanvas} = useUICanvasDelete({selectedUI, uiList, editingUICanvas});
    const {duplicateUICanvas} = useUICanvasDuplicate({selectedUI, uiList, selectedUICanvasId});
    const {createInput} = useUICanvasInputCreate({selectedUI, selectedUICanvasId, uiList, setSelectedComponent});
    const {createDescription} = useUICanvasDescriptionUpdate({selectedUICanvasId});


    const {inputTableData, selectedInput, moveRow} = useUICanvasInputColumns({
        readOnly: false,
        uiList,
        selectedUI,
        selectedUICanvasId,
        setApiCanvasDrawerData,
        setDBCanvasDrawerData,
        setIsOpenUICanvasActionsManualDescriptionDrawer,
        openUICanvasActionsAPIRelationDrawer,
        openUICanvasActionsDBRelationDrawer,
        openUICanvasActionsComponentInfoDrawer,
        openUICanvasActionsTemplateDescriptionDrawer,
        openUICanvasActionsCollectionCanvasDrawer,
        openUICanvasUpdateInputModal,
        openUICanvasManualDescriptionUpdateDrawer,
        openUICanvasUpdateAPIRelationDrawer,
        openUICanvasUpdateDBRelationDrawer,
        openUICanvasCreateFormActionDrawer,
        setUICanvasPreviewDrawerData,
        inputColumns,
        setInputColumns,
        openUICanvasUpdateFormActionDrawer,
        setSelectedDescriptions,
        isShowIssueStats,
        setIssueDrawerData,
        openUICanvasActionsTemplateDescriptionUpdateDrawer,
        selectedDescriptions,
        selectedUICanvasInputRows,
        setSelectedUICanvasInputRows,
        openCollectionCanvasPreviewDrawer,
    });
    const {updateInput} = useUICanvasInputUpdate({selectedUI, selectedUICanvasId, selectedInput});
    const {updateFormAction} = useUICanvasFormActionUpdate({selectedUICanvasId, selectedInput})
    const {deleteFormAction} = useUICanvasFormActionDelete({selectedUICanvasId, selectedInput})
    const {createComponentInfo} = useUICanvasComponentInfoCreate({selectedInput, selectedUI, selectedUICanvasId})
    const {createManualDescription} = useUICanvasManualDescriptionCreate({
        selectedUICanvasId,
        selectedInput
    });
    const {updateManualDescription} = useUICanvasManualDescriptionUpdate({
        selectedUICanvasId,
        selectedInput
    });
    const {deleteManualDescription} = useUICanvasManualDescriptionDelete({selectedUICanvasId});
    const {deleteAPIRelation} = useUICanvasAPIRelationDelete({selectedUICanvasId});
    const {createAPICallRelation} = useUICanvasAPICallRelationCreate({selectedInput, selectedUICanvasId});
    const {createFormAction} = useUICanvasFormActionCreate({selectedInput, selectedUICanvasId});
    const {updateAPICallRelation} = useUICanvasAPICallRelationUpdate({selectedInput, selectedUICanvasId});
    const {createDBRelation} = useUICanvasDBRelationCreate({selectedInput, selectedUICanvasId});
    const {deleteDBRelation} = useUICanvasDBRelationDelete({selectedUICanvasId});
    const {updateDBRelation} = useUICanvasDBRelationUpdate({selectedInput, selectedUICanvasId});
    const {templateDescriptionCreate} = useUICanvasTemplateDescriptionCreate({selectedUICanvasId, selectedInput});
    const {templateDescriptionUpdate} = useUICanvasTemplateDescriptionUpdate({selectedUICanvasId, selectedInput});
    const {deleteInput} = useUICanvasInputDelete({selectedUICanvasId});
    const {descriptionsBulkDelete} = useUICanvasDescriptionsBulkDelete({
        selectedUICanvasId,
        selectedUI,
        selectedDescriptions,
        setSelectedDescriptions
    });
    const {createBulkIssue} = useUICanvasCreateBulkIssue({selectedDescriptions, uiList, setSelectedDescriptions, selectedUI});
    const createIssueData = {
        uiCanvas: selectedUICanvasId
    };

const assignCollectionCanvasToInput = useCallback(async (assignment: CollectionCanvasAssignment | null) => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!selectedUICanvasId || !selectedInput?.id) {
        message.error("Select an input to continue");
        return;
    }

    try {
        const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);
        
        // Get current data before updating
        const docSnap = await getDoc(uiCanvasDocRef);
        const currentInput = docSnap.data()?.input?.[selectedUICanvasId]?.[selectedInput.id];
        const oldAssignment = currentInput?.collectioncanvas || null;
        
        const payload = assignment
            ? {
                id: assignment.id,
                label: assignment.label,
                fieldPath: assignment.fieldPath,
                fieldPathLabel: assignment.fieldPathLabel,
                fieldLabel: assignment.fieldLabel,
                fieldType: assignment.fieldType,
                description: assignment.description ?? "",
                actionType: assignment.actionType ?? 'GET',
            }
            : null;
            
        await updateDoc(uiCanvasDocRef, {
            [`input.${selectedUICanvasId}.${selectedInput.id}.collectioncanvas`]: payload,
        });
        
        // Add to ui_canvas_history
        const addCollectionCanvasHistoryRecord = async (historyData: {
            uiCanvasId: string;
            inputId: string;
            inputName: string;
            oldAssignment: any;
            newAssignment: any;
        }) => {
            try {
                const uiCanvasHistoryDocRef = doc(db, 'ui_canvas_history', historyData.uiCanvasId);
                
                const historyRecord = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    userId: userData?.uid || 'unknown',
                    userName: userData?.name || userData?.email || 'Unknown User',
                    userEmail: userData?.email || 'Unknown Email',
                    actionType: assignment ? 'COLLECTION_CANVAS_ASSIGN' : 'COLLECTION_CANVAS_REMOVE',
                    fieldName: 'collection_canvas',
                    inputId: historyData.inputId,
                    inputName: historyData.inputName,
                    oldAssignment: historyData.oldAssignment,
                    newAssignment: historyData.newAssignment,
                    timestamp: new Date().toISOString(),
                };

                // Check if history document exists
                const historyDocSnap = await getDoc(uiCanvasHistoryDocRef);
                
                if (!historyDocSnap.exists()) {
                    // Create new document
                    await updateDoc(uiCanvasHistoryDocRef, {
                        uiCanvasId: historyData.uiCanvasId,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        collection_canvas: [historyRecord],
                        allChanges: [historyRecord],
                    });
                } else {
                    // Update existing document
                    await updateDoc(uiCanvasHistoryDocRef, {
                        updatedAt: serverTimestamp(),
                        collection_canvas: arrayUnion(historyRecord),
                        allChanges: arrayUnion(historyRecord),
                    });
                }

                console.log('Collection canvas history record added successfully');
            } catch (error) {
                console.error('Error adding collection canvas history record:', error);
            }
        };
        
        await addCollectionCanvasHistoryRecord({
            uiCanvasId: selectedUICanvasId,
            inputId: selectedInput.id,
            inputName: currentInput?.inputName || '',
            oldAssignment: oldAssignment,
            newAssignment: payload,
        });

        message.success(assignment ? "Collection Canvas field linked." : "Collection Canvas removed.");
    } catch (error) {
        console.error("Failed to update Collection Canvas assignment", error);
        message.error("Unable to update Collection Canvas assignment");
    }
}, [selectedInput?.id, selectedUICanvasId]);

    async function addUIEditorAddComponent(component: ComponentJson) {
        const componentInfo = await createInput(" ", component);
        setSelectedComponent(componentInfo)
    }

    async function uiEditorUpdateComponent(component: ComponentJson) {
        await updateInput('', {...component,hasLabel: !["btn","hlink"].includes(component.componentType) })
    }

    async function uiEditorDeleteComponent(componentsIds: string[]) {
        Modal.confirm({
            content: "Are you sure you want to delete this component?",
            onOk: async () => {
                await deleteInput(componentsIds)
                setSelectedComponent(null)
            },
            cancelText: "Cancel",
            okText: "OK",
            onCancel: () => {
            },
        })
    }

    async function uiEditorDuplicateComponent(component: ComponentJson) {
        const componentInfo = await createInput(" ", component);
        setSelectedComponent(componentInfo)
    }

    function handleActionInputDescription(action: string) {
        switch (action) {
            case "remove_selected_inputs": {
                Modal.confirm({
                    content: "Are you sure to delete selected inputs?",
                    okText: "Ok",
                    cancelText: "Cancel",
                    onOk: async () => {
                        const ids = selectedUICanvasInputRows.map(i => i.id);
                        deleteInput(ids);
                        setSelectedUICanvasInputRows([])
                    },
                })
            }
                break;
            case "remove_selected_descriptions": {
                Modal.confirm({
                    content: "Are you sure you want to delete these descriptions?",
                    onOk: () => {
                        descriptionsBulkDelete()
                    },
                    cancelText: "Cancel",
                    okText: "OK",
                    onCancel: () => {
                    },
                })
            }
                break
            case "add_selected_descriptions_to_issue":
                openUICanvasCreateIssueDrawer()
                break
            default:
                break
        }
    }

    const handleGenerate = async () => {
        if (!selectedUI?.description) return message.error("Please add a description to generate canvas");
        const response = await callApi("/ui-canvas/generate-canvas", {
            prompt: selectedUI?.description,
            canvasId: selectedUICanvasId,
            canvasName: selectedUI?.label
        });
        updateUICanvas(response.input[selectedUICanvasId])
        return
    }

    // AI / Gemini handlers
    const handleAIDrawerCancel = useCallback(() => {
        setIsOpenAIDrawer(false);
        setAiError(null);
        setAiResult(null);
        setAiLoading(false);
    }, []);

    const handleAICanvasGenerate = useCallback(async (businessDescription: string) => {
        if (!businessDescription) return message.error("Please enter a description");
        try {
            setAiLoading(true);
            setAiError(null);
            // Reuse server-side generator if available
            const response = await callApi("/ui-canvas/generate-canvas", {
                prompt: businessDescription,
                canvasId: selectedUICanvasId,
                canvasName: selectedUI?.label
            });

            // The server is expected to return an object matching the UI-canvas template
            const generated = response || null;
            setAiResult(generated);
        } catch (err) {
            console.error("AI Generate Error", err);
            setAiError(String(err?.message ?? err));
        } finally {
            setAiLoading(false);
        }
    }, [selectedUICanvasId, selectedUI?.label]);

    const handleAIDrawerSave = useCallback(async () => {
        if (!aiResult) return message.error("Nothing to save");
        try {
            setAiLoading(true);
            // 1) Update ui_canvas: merge generated form inputs into the current canvas doc
            if (selectedUICanvasId) {
                const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);
                // If aiResult.FormCard.Input has the canvas id, merge it
                const formInputs = aiResult?.FormCard?.Input ?? {};
                if (Object.keys(formInputs).length) {
                    // update input.<canvasId> with generated inputs
                    await updateDoc(uiCanvasDocRef, {
                        [`input.${selectedUICanvasId}`]: formInputs[selectedUICanvasId] ?? formInputs,
                        description: aiResult?.FormCard?.Config?.[selectedUICanvasId]?.description ?? selectedUI?.description ?? "",
                    });
                }
            }

            // 2) Save API definitions (aiResult.Api) into an `api` collection
            if (aiResult?.Api) {
                const apiCol = collection(db, "api");
                await addDoc(apiCol, aiResult.Api);
            }

            // 3) Save collection canvas definitions into `collection_canvas` collection (if any)
            if (aiResult?.CollectionCanvas) {
                const colCol = collection(db, "collection_canvas");
                await addDoc(colCol, aiResult.CollectionCanvas);
            }

            // 4) Save Database object into `database` collection
            if (aiResult?.Database) {
                const dbCol = collection(db, "database");
                await addDoc(dbCol, aiResult.Database);
            }

            message.success("AI-generated canvas saved to Firestore");
            // reset and close
            setIsOpenAIDrawer(false);
            setAiResult(null);
        } catch (err) {
            console.error("AI Save Error", err);
            message.error("Failed to save AI generated canvas");
        } finally {
            setAiLoading(false);
        }
    }, [aiResult, selectedUICanvasId, selectedUI?.description]);
    return {
        selectedUI,
        uiList,
        selectedUICanvasId,
        setSelectedUICanvasId,
        isOpenUICreateModal,
        isOpenUIUpdateModal,
        openUICreateModal,
        openUIUpdateModal,
        closeUIUpdateModal,
        closeUICreateModal,
        createUICanvas,
        onChangeUI,
        updateCanvas,
        updateUICanvasName,
        description,
        setDescription,
        loading,
        editingUICanvas,
        setEditingUICanvas,
        deleteUICanvas,
        isOpenUICanvasDuplicateModal,
        setIsOpenUICanvasDuplicateModal,
        isOpenUICanvasCreateInputModal,
        setIsOpenUICanvasCreateInputModal,
        isOpenUICanvasCreateDescriptionModal,
        setIsOpenUICanvasCreateDescriptionModal,
        isOpenUICanvasActionsManualDescriptionDrawer,
        setIsOpenUICanvasActionsManualDescriptionDrawer,
        uiCanvasRef,
        duplicateUICanvas,
        createInput,
        inputColumns,
        createDescription,
        inputTableData,
        createManualDescription,
        selectedInput,
        apiCanvasDrawerData,
        dbCanvasDrawerData,
        closeAPICanvasDrawer,
        closeDBCanvasDrawer,
        isOpenUICanvasActionsAPIRelationDrawer,
        openUICanvasActionsAPIRelationDrawer,
        closeUICanvasActionsAPIRelationDrawer,
        createAPICallRelation,
        isOpenUICanvasActionsDBRelationDrawer,
        setIsOpenUICanvasDBRelationDrawer,
        closeUICanvasActionsDBRelationDrawer,
        createDBRelation,
        moveRow,
        closeUICanvasActionsComponentInfoDrawer,
        isOpenUICanvasActionsComponentInfoDrawer,
        createComponentInfo,
        isOpenUICanvasActionsTemplateDescriptionDrawer,
        closeUICanvasActionsTemplateDescriptionDrawer,
        openUICanvasActionsTemplateDescriptionDrawer,
        isOpenUICanvasCollectionCanvasDrawer,
        openUICanvasActionsCollectionCanvasDrawer,
        closeUICanvasActionsCollectionCanvasDrawer,
        collectionCanvasPreviewDrawerData,
        openCollectionCanvasPreviewDrawer,
        closeCollectionCanvasPreviewDrawer,
        assignCollectionCanvasToInput,
        templateDescriptionCreate,
        isOpenUICanvasUpdateInputModal,
        closeUICanvasUpdateInputModal,
        updateInput,
        isOpenUICanvasManualDescriptionUpdateDrawer,
        setIsOpenUICanvasManualDescriptionUpdateDrawer,
        updateManualDescription,
        deleteManualDescription,
        isOpenUICanvasUpdateAPIRelationDrawer,
        closeUICanvasUpdateAPIRelationDrawer,
        updateAPICallRelation,
        deleteAPIRelation,
        isOpenUICanvasUpdateDBRelationDrawer,
        closeUICanvasUpdateDBRelationDrawer,
        updateDBRelation,
        deleteDBRelation,
        isOpenUICanvasCreateFormActionDrawer,
        closeUICanvasFormActionDrawer,
        createFormAction,
        closeUICanvasPreviewDrawer,
        uiCanvasPreviewDrawerData,
        allUIInputs,
        isOpenUICanvasUpdateFormActionDrawer,
        closeUICanvasUpdateFormActionDrawer,
        updateFormAction,
        deleteFormAction,
        selectedDescriptions,
        setSelectedDescriptions,
        descriptionsBulkDelete,
        isOpenUICanvasCreateIssueDrawer,
        openUICanvasCreateIssueDrawer,
        closeUICanvasCreateIssueDrawer,
        createBulkIssue,
        openUICanvasExternalViewLinksDrawer,
        isOpenUICanvasExternalViewLinksDrawer,
        closeUICanvasExternalViewLinksDrawer,
        externalLinkData,
        externalViewLinkTableData,
        isShowIssueStats,
        setIsShowIssueStats,
        selectedLink,
        setSelectedLink,
        closeBacklogIssueDrawer,
        issueDrawerData,
        closeUICanvasActionsTemplateDescriptionUpdateDrawer,
        isOpenUICanvasActionsTemplateDescriptionUpdateDrawer,
        templateDescriptionUpdate,
        createIssueData,
        isShowUIViewCSSColumn,
        setIsShowUIViewCSSColumn,
        handleActionInputDescription,
        inputDescriptionMainActions,
        selectedComponent,
        setSelectedComponent,
        addUIEditorAddComponent,
        uiEditorUpdateComponent,
        uiEditorDeleteComponent,
        uiEditorDuplicateComponent,
        handleGenerate
        ,
        isOpenAIDrawer,
        setIsOpenAIDrawer,
        aiLoading,
        aiError,
        aiResult,
        handleAIDrawerCancel,
        handleAIDrawerSave,
        handleAICanvasGenerate
    }
}