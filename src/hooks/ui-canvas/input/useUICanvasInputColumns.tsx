/* eslint-disable */
// @ts-nocheck
import { Button, Checkbox, Dropdown, Menu, message, Modal, Space, Tag } from "antd"
import { actions, ActionsType } from "@/components/ui-canvas/common/types.ts"
import React, { useEffect, useMemo, useState } from "react"
import { BugOutlined, DownOutlined, EditOutlined, FolderOpenOutlined } from "@ant-design/icons"
import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore"
import { db } from "@/config/firebase.ts"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import useUICanvasLoadIssueInfo from "@/hooks/ui-canvas/input/useUICanvasLoadIssueInfo.tsx"
import { componentTypeLabel, FormActionEventLabel } from "@/hooks/ui-canvas/types.ts"
import { buildDisplayOrderData } from "@/utils/ui-canvas/buildDisplayOrderData.ts";
import useUICanvasInputDelete from "@/hooks/ui-canvas/input/useUICanvasInputDelete.tsx";
import type { CollectionCanvasAssignment } from "@/ui-canvas/collection/types";

type NormalizedInputMap = Record<string, any>;

const normalizeAndSortInputs = (inputObj: NormalizedInputMap = {}): NormalizedInputMap => {
    const values = Object.values(inputObj) as any[]

    const sorted = values.sort((a, b) => (a?.order ?? 9999) - (b?.order ?? 9999))

    let lastOrder = -1
    const normalized: NormalizedInputMap = {}

    for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i]
        let currentOrder = item?.order

        if (currentOrder === undefined || currentOrder === null) {
            currentOrder = lastOrder + 1
        }

        normalized[item?.id ?? item?.relId ?? item?.dbRelId] = {
            ...item,
            order: currentOrder,
        }

        lastOrder = currentOrder
    }
    return normalized
}

const formatCollectionActionLabel = (type?: string | null) => (type === 'POST' ? 'Send' : type);

export default function useUICanvasInputColumns({
    setInputColumns,
    readOnly = false,
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
    openUICanvasUpdateFormActionDrawer,
    setSelectedDescriptions,
    isShowIssueStats,
    setIssueDrawerData,
    openUICanvasActionsTemplateDescriptionUpdateDrawer,
    selectedDescriptions,
    selectedUICanvasInputRows,
    setSelectedUICanvasInputRows,
    openCollectionCanvasPreviewDrawer,
}: {
    setInputColumns?: (columns: any[]) => void
    readOnly: boolean
    isShowIssueStats?: any
    uiList?: any[]
    selectedUI?: any
    selectedUICanvasId?: string
    setApiCanvasDrawerData?: (data: any) => void
    setDBCanvasDrawerData?: (data: any) => void
    setIsOpenUICanvasActionsManualDescriptionDrawer?: (val: boolean) => void
    openUICanvasActionsAPIRelationDrawer?: (data?: any) => void
    openUICanvasActionsDBRelationDrawer?: (data?: any) => void
    openUICanvasActionsComponentInfoDrawer?: (data?: any) => void
    openUICanvasActionsTemplateDescriptionDrawer?: (data?: any) => void
    openUICanvasActionsCollectionCanvasDrawer?: () => void
    openUICanvasUpdateInputModal?: (data?: any) => void
    openUICanvasManualDescriptionUpdateDrawer?: (data?: any) => void
    openUICanvasUpdateAPIRelationDrawer?: (data?: any) => void
    openUICanvasUpdateDBRelationDrawer?: (data?: any) => void
    openUICanvasCreateFormActionDrawer?: (data?: any) => void
    setUICanvasPreviewDrawerData?: (data: any) => void
    openUICanvasUpdateFormActionDrawer?: (data: any) => void,
    selectedDescriptions?: any[],
    setSelectedDescriptions?: (data: any) => void,
    setIssueDrawerData?: (data: any) => void,
    openUICanvasActionsTemplateDescriptionUpdateDrawer?: () => void,
    selectedUICanvasInputRows?: any[],
    setSelectedUICanvasInputRows?: React.Dispatch<React.SetStateAction<any[]>>,
    openCollectionCanvasPreviewDrawer?: (assignment: CollectionCanvasAssignment) => void,

}) {
    const [issueData, setIssueData] = useState<any>({ data: [], total: 0, bugCount: 0, sh: 0, eh: 0, totalIds: [], typeCounts: {} })
    const { loadIssueInfo } = useUICanvasLoadIssueInfo()
    const currentProject = useSelector((state: RootState) => state.project.currentProject)
    const [selectedInput, setSelectedInput] = React.useState(null);
    const { deleteInput } = useUICanvasInputDelete({ selectedUICanvasId });
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    // Load all backlog issues for the canvas and calculate totals
    const loadAllBacklogIssuesForCanvas = async (canvasId: string) => {
        if (!currentProject?.id || !canvasId) return { 
            total: 0, 
            bugCount: 0, 
            sh: 0, 
            eh: 0, 
            totalIds: [],
            typeCounts: {} as Record<string, number>
        };
        
        try {
            const backlogRef = collection(db, `backlog_${currentProject.id}`);
            const snapshot = await getDocs(backlogRef);
            const allIssues: any[] = [];
            
            snapshot.forEach((doc) => {
                const issueData = { id: doc.id, ...doc.data() };
                if (issueData.uiCanvasId === canvasId) {
                    allIssues.push(issueData);
                }
            });

            const total = allIssues.length;
            const bugCount = allIssues.filter(i => i.type === "Bug" || i.type === "bug").length;
            const sh = allIssues.reduce((sum, i) => sum + (i.sh || 0), 0);
            const eh = allIssues.reduce((sum, i) => sum + (i.eh || 0), 0);
            const totalIds = allIssues.map(i => i.id);

            // Calculate counts by issue type
            const typeCounts: Record<string, number> = {};
            allIssues.forEach(issue => {
                const issueType = issue.type || 'Unknown';
                typeCounts[issueType] = (typeCounts[issueType] || 0) + 1;
            });

            return { total, bugCount, sh, eh, totalIds, typeCounts };
        } catch (error) {
            console.error("Error loading backlog issues:", error);
            return { 
                total: 0, 
                bugCount: 0, 
                sh: 0, 
                eh: 0, 
                totalIds: [],
                typeCounts: {} as Record<string, number>
            };
        }
    };

    const backlogIssueListener = () => {
        let previousDocs: Record<string, any> = {}; // əvvəlki snapshot-ları saxlamaq üçün

        return onSnapshot(collection(db, `backlog_${currentProject?.id}`), async (snapshot) => {
            let shouldUpdate = false;
            const currentCanvasId = selectedUICanvasId || localStorage.getItem("currentUI");

            snapshot.docChanges().forEach((change) => {
                const docId = change.doc.id;
                const currentDoc = change.doc.data();
                const previousDoc = previousDocs[docId];

                // pending olanları atla

                // ADD və ya REMOVE olarsa
                if (change.type === "added" || change.type === "removed") {
                    if (currentDoc?.uiCanvasId === currentCanvasId) {
                        shouldUpdate = true;
                    }
                }

                // MODIFIED olarsa və yalnız STATUS və ya TYPE dəyişibsə
                else if (change.type === "modified") {
                    const statusChanged = previousDoc && previousDoc.status !== currentDoc.status;
                    const typeChanged = previousDoc && previousDoc.type !== currentDoc.type;

                    if ((statusChanged || typeChanged) && currentDoc?.uiCanvasId === currentCanvasId) {
                        shouldUpdate = true;
                    }
                }

                // hər doc-u yadda saxla ki, növbəti dəyişikdə müqayisə edə bilək
                previousDocs[docId] = currentDoc;
            });

            if (shouldUpdate && currentCanvasId) {
                // Load per-description stats from API
                const uiDocRef = doc(db, "ui_canvas", currentCanvasId);
                getDoc(uiDocRef).then(async (res) => {
                    if (res.exists() && Object.keys(res.data().input?.[currentCanvasId] || {}).length) {
                        const descriptionStats = await loadIssueInfo({
                            input: res.data().input[currentCanvasId],
                        });
                        
                        // Load all backlog issues for totals
                        const allIssuesStats = await loadAllBacklogIssuesForCanvas(currentCanvasId);
                        
                        // Merge: use all issues stats for totals, keep description stats for per-item details
                        setIssueData({
                            ...descriptionStats,
                            total: allIssuesStats.total,
                            bugCount: allIssuesStats.bugCount,
                            sh: allIssuesStats.sh,
                            eh: allIssuesStats.eh,
                            totalIds: allIssuesStats.totalIds,
                            typeCounts: allIssuesStats.typeCounts,
                        });
                    } else {
                        // If no input, just load all issues stats
                        const allIssuesStats = await loadAllBacklogIssuesForCanvas(currentCanvasId);
                        setIssueData({
                            data: [],
                            ...allIssuesStats,
                        });
                    }
                });
            }
        });

    }

    useEffect(() => {
        const loadData = async () => {
            if (Object.keys(selectedUI?.input ?? {}).length > 0 && !readOnly && selectedUICanvasId) {
                // Load per-description stats from API
                const descriptionStats = await loadIssueInfo(selectedUI);
                
                // Load all backlog issues for totals
                const allIssuesStats = await loadAllBacklogIssuesForCanvas(selectedUICanvasId);
                
                // Merge: use all issues stats for totals, keep description stats for per-item details
                setIssueData({
                    ...descriptionStats,
                    total: allIssuesStats.total,
                    bugCount: allIssuesStats.bugCount,
                    sh: allIssuesStats.sh,
                    eh: allIssuesStats.eh,
                    totalIds: allIssuesStats.totalIds,
                    typeCounts: allIssuesStats.typeCounts,
                });
            } else if (selectedUICanvasId) {
                // If no input, just load all issues stats
                const allIssuesStats = await loadAllBacklogIssuesForCanvas(selectedUICanvasId);
                setIssueData({
                    data: [],
                    ...allIssuesStats,
                });
            }
        };
        
        loadData();
    }, [selectedUI, selectedUICanvasId]);

    useEffect(() => {
        if (!currentProject?.id || !selectedUICanvasId) return
        const backLogIssueUnsubscribe = backlogIssueListener();
        return () => backLogIssueUnsubscribe()
    }, [currentProject, selectedUICanvasId]);

    const handleOpenIssueDrawer = ({ ids, ...rest }) => {
        setIssueDrawerData({
            open: true,
            data: {
                ids,
                ...rest
            }
        })
    }

    const handleAction = async (action: string, record) => {
        setSelectedInput({ ...record, uiName: selectedUI?.label })
        switch (action) {
            case ActionsType.DELETE: {
                Modal.confirm({
                    content: "Are you sure to delete current detail card?",
                    okText: "Ok",
                    cancelText: "Cancel",
                    onOk: async () => {
                        deleteInput([record.id])
                    },
                })
                break
            }
            case ActionsType.MANUAL_DESCRIPTION: {
                setIsOpenUICanvasActionsManualDescriptionDrawer(true)
                break
            }
            case ActionsType.API_RELATION: {
                openUICanvasActionsAPIRelationDrawer()
                break
            }
            case ActionsType.DATABASE_RELATION: {
                openUICanvasActionsDBRelationDrawer()
                break
            }
            case ActionsType.COMPONENT_INFORMATION: {
                openUICanvasActionsComponentInfoDrawer()
                break
            }
            case ActionsType.TEMPLATE_DESCRIPTION: {
                openUICanvasActionsTemplateDescriptionDrawer()
                break
            }
            case ActionsType.FORM_ACTION: {
                openUICanvasCreateFormActionDrawer()
                break
            }
            case ActionsType.COLLECTION_CANVAS: {
                openUICanvasActionsCollectionCanvasDrawer()
                break
            }
            case ActionsType.RENAME: {
                openUICanvasUpdateInputModal()
                break
            }
            case ActionsType.ADD_TO_TABLE: {
                multiMove(record)
                break
            }
            case ActionsType.ADD_TO_GROUP: {
                multiMove(record)
                break
            }
            case ActionsType.REMOVE_FROM_TABLE: {
                multiRemove(record)
                break
            }
            case ActionsType.REMOVE_FROM_GROUP: {
                multiRemove(record)
                break
            }
            default:
                break
        }
    }

    async function multiMove(targetParent) {
        try {
            let newData = [...inputTableData];

            // seçilən itemləri gətir
            const selectedIds = selectedUICanvasInputRows.map(i => i.id);
            const movedItemsData = [];

            // hər seçilən item üçün parent assign
            newData.forEach(item => {
                if (!selectedIds.includes(item.id)) return;

                const oldParent = {
                    fkTableId: item.fkTableId,
                    fkGroupId: item.fkGroupId,
                    hasLabel: item.hasLabel
                };

                if (["tbl", "table"].includes(targetParent.componentType)) {
                    item.hasLabel = false
                    item.fkTableId = targetParent.id;
                    item.fkGroupId = null;
                } else if (["group", "grp"].includes(targetParent.componentType)) {
                    item.fkGroupId = targetParent.id;
                    item.fkTableId = null;
                }

                movedItemsData.push({
                    inputId: item.id,
                    inputName: item.inputName,
                    oldParent: oldParent,
                    newParent: {
                        fkTableId: item.fkTableId,
                        fkGroupId: item.fkGroupId,
                        hasLabel: item.hasLabel
                    },
                    targetParentId: targetParent.id,
                    targetParentName: targetParent.inputName,
                    targetParentType: targetParent.componentType,
                });
            });

            // === Order yenilə (sənin logic)
            let orderCounter = 0;
            newData.forEach(item => {
                if (!item.fkTableId && !item.fkGroupId) {
                    item.order = orderCounter++;
                    const children = newData.filter(c =>
                        c.fkTableId === item.id || c.fkGroupId === item.id
                    );
                    children.forEach(child => {
                        child.order = orderCounter++;
                    });
                }
            });

            // === Firebase Update ===
            const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);
            const docSnap = await getDoc(uiCanvasDocRef);
            const docData = docSnap.data();
            const canvasInputs = docData?.input?.[selectedUICanvasId] || {};

            const updatedInputs = { ...canvasInputs };

            newData.forEach(item => {
                if (!updatedInputs[item.id]) return;
                updatedInputs[item.id] = {
                    ...updatedInputs[item.id],
                    order: item.order ?? 0,
                    fkTableId: item.fkTableId ?? null,
                    fkGroupId: item.fkGroupId ?? null,
                };
            });

            const updatedAllInput = {
                ...docData.input,
                [selectedUICanvasId]: updatedInputs
            };

            await updateDoc(uiCanvasDocRef, { input: updatedAllInput });

            // Add to ui_canvas_history
            if (selectedUICanvasId) {
                await addMultiMoveHistoryRecord({
                    uiCanvasId: selectedUICanvasId,
                    movedItemsData: movedItemsData,
                    actionType: targetParent.componentType === 'table' || targetParent.componentType === 'tbl' 
                        ? 'ADD_TO_TABLE' 
                        : 'ADD_TO_GROUP',
                });
            }

            message.success("Selected items moved successfully!");

            // clear selection
            setSelectedUICanvasInputRows([]);

        } catch (e) {
            console.error(e);
            message.error("Error moving items");
        }
    }

    async function multiRemove(targetParent) {
        try {
            let newData = [...inputTableData];
            const removedItemsData = [];

            // seçilən itemləri gətir
            const selectedIds = selectedUICanvasInputRows.map(i => i.id);

            // hər seçilən item üçün parent assign
            newData.forEach(item => {
                if (!selectedIds.includes(item.id)) return;

                const oldParent = {
                    fkTableId: item.fkTableId,
                    fkGroupId: item.fkGroupId,
                    hasLabel: item.hasLabel
                };

                if (["tbl", "table"].includes(targetParent.componentType)) {
                    item.hasLabel = !["btn", "hlink"].includes(item.componentType)
                    item.fkTableId = null;
                    item.fkGroupId = null;
                } else if (["grp", "group"].includes(targetParent.componentType)) {
                    item.fkGroupId = null;
                    item.fkTableId = null;
                }

                removedItemsData.push({
                    inputId: item.id,
                    inputName: item.inputName,
                    oldParent: oldParent,
                    newParent: {
                        fkTableId: item.fkTableId,
                        fkGroupId: item.fkGroupId,
                        hasLabel: item.hasLabel
                    },
                    targetParentId: targetParent.id,
                    targetParentName: targetParent.inputName,
                    targetParentType: targetParent.componentType,
                });
            });

            // === Order yenilə (sənin logic)
            let orderCounter = 0;
            newData.forEach(item => {
                if (!item.fkTableId && !item.fkGroupId) {
                    item.order = orderCounter++;
                    const children = newData.filter(c =>
                        c.fkTableId === item.id || c.fkGroupId === item.id
                    );
                    children.forEach(child => {
                        child.order = orderCounter++;
                    });
                }
            });

            // === Firebase Update ===
            const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);
            const docSnap = await getDoc(uiCanvasDocRef);
            const docData = docSnap.data();
            const canvasInputs = docData?.input?.[selectedUICanvasId] || {};

            const updatedInputs = { ...canvasInputs };

            newData.forEach(item => {
                if (!updatedInputs[item.id]) return;
                updatedInputs[item.id] = {
                    ...updatedInputs[item.id],
                    order: item.order ?? 0,
                    fkTableId: item.fkTableId ?? null,
                    fkGroupId: item.fkGroupId ?? null,
                };
            });

            const updatedAllInput = {
                ...docData.input,
                [selectedUICanvasId]: updatedInputs
            };

            await updateDoc(uiCanvasDocRef, { input: updatedAllInput });

            // Add to ui_canvas_history
            if (selectedUICanvasId) {
                await addMultiMoveHistoryRecord({
                    uiCanvasId: selectedUICanvasId,
                    movedItemsData: removedItemsData,
                    actionType: targetParent.componentType === 'table' || targetParent.componentType === 'tbl' 
                        ? 'REMOVE_FROM_TABLE' 
                        : 'REMOVE_FROM_GROUP',
                });
            }

            message.success("Selected items moved successfully!");

            // clear selection
            setSelectedUICanvasInputRows([]);

        } catch (e) {
            console.error(e);
            message.error("Error moving items");
        }
    }

    // Add to ui_canvas_history for multi move/remove actions
    const addMultiMoveHistoryRecord = async (historyData: {
        uiCanvasId: string;
        movedItemsData: any[];
        actionType: string;
    }) => {
        try {
            const uiCanvasHistoryDocRef = doc(db, 'ui_canvas_history', historyData.uiCanvasId);
            
            const historyRecord = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: userData?.uid || 'unknown',
                userName: userData?.name || userData?.email || 'Unknown User',
                userEmail: userData?.email || 'Unknown Email',
                actionType: historyData.actionType,
                fieldName: 'input_parent_changes',
                movedItemsData: historyData.movedItemsData,
                movedCount: historyData.movedItemsData.length,
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
                    input_parent_changes: [historyRecord],
                    allChanges: [historyRecord],
                });
            } else {
                // Update existing document
                await updateDoc(uiCanvasHistoryDocRef, {
                    updatedAt: serverTimestamp(),
                    input_parent_changes: arrayUnion(historyRecord),
                    allChanges: arrayUnion(historyRecord),
                });
            }

            console.log('Multi move history record added successfully');
        } catch (error) {
            console.error('Error adding multi move history record:', error);
        }
    }

    const toggleRow = (checked, item) => {
        if (checked) {
            setSelectedUICanvasInputRows((prevState) => [...prevState, item])

        } else {
            setSelectedUICanvasInputRows((prevState) => prevState.filter(prev => prev.id !== item.id))
        }
    }
    const showRemoveButton = (row) => {
        if (selectedUICanvasInputRows.length === 0) return false;

        return selectedUICanvasInputRows.some(item => {
            return (
                (["tbl", "table"].includes(row.componentType) && item.fkTableId === row.id) ||
                (["grp", "group"].includes(row.componentType) && item.fkGroupId === row.id)
            );
        });
    };
    const baseActions = actions.map(a => ({
        key: a.key,
        label: a.label,
    }));

    // Helper to generate add/remove actions for group or table
    const getAddRemoveActions = (record: any) => {
        const actions: any[] = [{ type: "divider" }];

        if (["grp", "group"].includes(record.componentType)) {
            actions.push({ key: "add_to_group", label: "Add to Group" });
            if (showRemoveButton(record)) {
                actions.push({ key: "remove_from_group", label: "Remove from Group" });
            }
        } else if (["tbl", "table"].includes(record.componentType)) {
            actions.push({ key: "add_to_table", label: "Add to Table" });
            if (showRemoveButton(record)) {
                actions.push({ key: "remove_from_table", label: "Remove from Table" });
            }
        }

        return actions;
    };

    // Determine if we should show extra actions
    const shouldShowExtraActions = selectedUICanvasInputRows?.length > 0 &&
        selectedUICanvasInputRows?.every(item => !["grp", "tbl", "group", "table"].includes(item.componentType));
    // Final menu items


    const buildColumns = () => {

        const columns = [
            !readOnly
                ? [{
                    title: "",
                    key: "drag",
                    width: 20,
                    className: `${readOnly ? "hidden" : ""}`,
                },
                {
                    title: "",
                    key: "checkbox",
                    width: 20,
                    render: (_, record) => {
                        return <Checkbox
                            checked={selectedUICanvasInputRows.find(item => item.id === record.id)}
                            onChange={(e) => toggleRow(e.target.checked, record)}
                        />
                    }
                }]
                : null,

            {
                title: "#",
                dataIndex: "index",
                key: "index",
                width: "30px",
                columnIndex: 2,
                render: (_, record) => record.displayIndex
            },
            {
                title: "Input",
                dataIndex: "inputName",
                key: "inputName",
            },
            {
                title: (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <span style={{ fontWeight: 500 }}>Description</span>
                        {isShowIssueStats && (
                            <div style={{ marginTop: 4 }}>
                                <Space size={4} wrap>
                                    <Tag color="default" className="cursor-pointer"
                                        onClick={() => handleOpenIssueDrawer({ ids: issueData?.totalIds })}>Total-{issueData?.total}</Tag>
                                    <Tag color="error" className="cursor-pointer" icon={<BugOutlined />}
                                        onClick={() => handleOpenIssueDrawer({ ids: issueData?.totalIds, type: "bug" })}>
                                        Bug-{issueData?.bugCount}
                                    </Tag>
                                    {/* Display issue type counts */}
                                    {issueData?.typeCounts && Object.entries(issueData.typeCounts).map(([type, count]: [string, any]) => {
                                        if (type.toLowerCase() === 'bug' || type === 'Bug') return null; // Bug already shown above
                                        const typeColors: Record<string, string> = {
                                            'Task': '#1890ff',
                                            'task': '#1890ff',
                                            'Story': '#52c41a',
                                            'story': '#52c41a',
                                            'Epic': '#722ed1',
                                            'epic': '#722ed1',
                                            'Feature': '#fa8c16',
                                            'feature': '#fa8c16',
                                        };
                                        return (
                                            <Tag 
                                                key={type}
                                                color={typeColors[type] || 'default'} 
                                                className="cursor-pointer"
                                                onClick={() => handleOpenIssueDrawer({ ids: issueData?.totalIds, type: type.toLowerCase() })}
                                            >
                                                {type}-{count}
                                            </Tag>
                                        );
                                    })}
                                    {issueData?.sh > 0 && <Tag color="#22c55e" className="cursor-pointer"
                                        onClick={() => handleOpenIssueDrawer({ ids: issueData?.totalIds })}>SH-{issueData?.sh}</Tag>}
                                    {issueData?.eh > 0 && <Tag color="#ef4444" className="cursor-pointer"
                                        onClick={() => handleOpenIssueDrawer({ ids: issueData?.totalIds })}>EH-{issueData?.eh}</Tag>}
                                </Space>
                            </div>
                        )}
                    </div>
                ),
                key: "content",
                render: (item) => {
                    const formAction = item?.formAction;
                    const formActionRelationCount = issueData?.data?.find(item => item.id === formAction?.action);
                    const rawCollectionAssignment = item?.collectioncanvas || item?.collectionCanvas;
                    const resolvedFieldPath = rawCollectionAssignment
                        ? Array.isArray(rawCollectionAssignment.fieldPath)
                            ? rawCollectionAssignment.fieldPath
                            : typeof rawCollectionAssignment.fieldPathLabel === 'string'
                                ? rawCollectionAssignment.fieldPathLabel.split('/').filter(Boolean)
                                : []
                        : [];
                    const normalizedCollectionAssignment: CollectionCanvasAssignment | null = rawCollectionAssignment
                        ? {
                            ...rawCollectionAssignment,
                            id: rawCollectionAssignment.id ?? rawCollectionAssignment.collectionCanvasId ?? '',
                            label: rawCollectionAssignment.label ?? rawCollectionAssignment.id ?? 'Untitled',
                            fieldPath: resolvedFieldPath,
                            fieldPathLabel:
                                rawCollectionAssignment.fieldPathLabel ?? (resolvedFieldPath.length ? resolvedFieldPath.join('/') : ''),
                            fieldLabel: rawCollectionAssignment.fieldLabel ?? resolvedFieldPath[resolvedFieldPath.length - 1] ?? rawCollectionAssignment.label ?? 'field',
                            fieldType: rawCollectionAssignment.fieldType ?? 'string',
                            actionType: rawCollectionAssignment.actionType ?? 'GET',
                            description: rawCollectionAssignment.description ?? '',
                        }
                        : null;
                    const collectionFieldPathLabel = normalizedCollectionAssignment?.fieldPathLabel || (normalizedCollectionAssignment?.fieldPath?.length ? normalizedCollectionAssignment.fieldPath.join('/') : null);
                    const collectionNotes = normalizedCollectionAssignment?.description;
                    const collectionActionType = normalizedCollectionAssignment?.actionType;
                    const collectionFieldType = normalizedCollectionAssignment?.fieldType;
                    const handleCollectionCanvasPreview = () => {
                        if (normalizedCollectionAssignment && openCollectionCanvasPreviewDrawer) {
                            openCollectionCanvasPreviewDrawer(normalizedCollectionAssignment);
                        }
                    };
                    // console.log("databaseRelation",databaseRelation)
                    return (
                        <Space direction="vertical" className="w-full">

                            <span>Component Type: {componentTypeLabel[item.componentType]}</span>
                            {normalizedCollectionAssignment && (
                                <div
                                    className="group flex w-full gap-3 py-2 text-sm transition hover:border-gray-300 cursor-pointer"
                                    role="button"
                                    tabIndex={0}
                                    onClick={handleCollectionCanvasPreview}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            handleCollectionCanvasPreview();
                                        }
                                    }}
                                >
                                    <div className="flex flex-1 flex-wrap items-center gap-1">
                                        <div className="flex items-center gap-2">
                                            <FolderOpenOutlined className="text-base text-blue-500" />
                                            <span className="font-semibold text-gray-900 group-hover:underline">
                                                {normalizedCollectionAssignment?.label ?? normalizedCollectionAssignment?.id ?? 'Untitled'}
                                                {collectionFieldPathLabel && <span className="text-gray-600">:{collectionFieldPathLabel}</span>}
                                            </span>
                                        </div>
                                        {collectionFieldType && (
                                            <Tag color="default" className="text-xs">:{collectionFieldType}</Tag>
                                        )}
                                        {collectionActionType && <Tag color="geekblue">{formatCollectionActionLabel(collectionActionType)}</Tag>}
                                        {collectionNotes && (
                                            <span className="text-gray-700 whitespace-pre-line">{collectionNotes}</span>
                                        )}
                                    </div>
                                    <Button
                                        size="middle"
                                        type="text"
                                        icon={<EditOutlined />}
                                        className="opacity-0 transition group-hover:opacity-100"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setSelectedInput({ ...item, uiName: selectedUI?.label });
                                            openUICanvasActionsCollectionCanvasDrawer?.();
                                        }}
                                    >
                                    </Button>
                                </div>
                            )}
                            {item?.manualDescription &&
                                Object.values(normalizeAndSortInputs(item?.manualDescription))
                                    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
                                    .map((manualItem) => {
                                        const manualDescriptionCount = issueData?.data?.find(item => item.id === manualItem.id);
                                        return (
                                            <div>
                                                <Space
                                                    className="justify-between w-full group !cursor-default"
                                                    key={manualItem?.id}
                                                >
                                                    <span className="break-words leading-snug">
                                                        <Checkbox
                                                            onChange={(e) => {
                                                                setSelectedDescriptions?.((prev = []) => {
                                                                    if (e.target.checked) {
                                                                        // ekle
                                                                        return [
                                                                            ...prev,
                                                                            {
                                                                                id: manualItem.id,
                                                                                inputId: item.id,
                                                                                key: "manualDescription",
                                                                            },
                                                                        ]
                                                                    } else {
                                                                        // çıkart
                                                                        return prev.filter((desc) => desc.id !== manualItem.id)
                                                                    }
                                                                })
                                                            }}
                                                            checked={!!selectedDescriptions?.find(desc => desc.id === manualItem.id)}
                                                        />
                                                        {manualItem.event && (
                                                            <Tag color={"#FCBD06"}
                                                                className="!text-black inline-block min-h-[22px] ml-1">
                                                                {manualItem?.event ?? ""}
                                                            </Tag>
                                                        )}
                                                        <span>{manualItem?.description}</span>
                                                    </span>
                                                    {!readOnly && (
                                                        <EditOutlined
                                                            className="invisible group-hover:visible !cursor-pointer text-[16px]"
                                                            onClick={() => {
                                                                openUICanvasManualDescriptionUpdateDrawer()
                                                                setSelectedInput({
                                                                    ...manualItem,
                                                                    inputId: item.id,
                                                                    uiName: selectedUI?.label
                                                                })
                                                            }}
                                                        />
                                                    )}
                                                </Space>
                                                {
                                                    isShowIssueStats && manualDescriptionCount && (
                                                        <div className="pl-5 pt-1">
                                                            {manualDescriptionCount.closedCount > 0 && (
                                                                <Tag className="!cursor-pointer" color="#0000ff"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: manualDescriptionCount?.issueIds,
                                                                        status: "closed"
                                                                    })}>closed
                                                                    - {manualDescriptionCount.closedCount}</Tag>
                                                            )}

                                                            {manualDescriptionCount.draftCount > 0 && (
                                                                <Tag color="#c8c8c8" className="!text-black !cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: manualDescriptionCount?.issueIds,
                                                                        status: "draft"
                                                                    })}>draft
                                                                    - {manualDescriptionCount.draftCount}</Tag>
                                                            )}

                                                            {manualDescriptionCount.waitingCount > 0 && (
                                                                <Tag color="#0000ff"
                                                                    className="!cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: manualDescriptionCount?.issueIds,
                                                                        status: "waiting"
                                                                    })}>waiting
                                                                    - {manualDescriptionCount.waitingCount}</Tag>
                                                            )}

                                                            {manualDescriptionCount.newCount > 0 && (
                                                                <Tag color="#ffa500" className="!text-black !cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: manualDescriptionCount?.issueIds,
                                                                        status: "new"
                                                                    })}>new
                                                                    - {manualDescriptionCount.newCount}</Tag>
                                                            )}

                                                            {manualDescriptionCount.ongoingCount > 0 && (
                                                                <Tag color="#008000"
                                                                    className="!cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: manualDescriptionCount?.issueIds,
                                                                        status: "ongoing"
                                                                    })}>ongoing
                                                                    - {manualDescriptionCount.ongoingCount}</Tag>
                                                            )}

                                                            {manualDescriptionCount.canceledCount > 0 && (
                                                                <Tag color="#EF4444"
                                                                    className="!cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: manualDescriptionCount?.issueIds,
                                                                        status: "canceled"
                                                                    })}>canceled
                                                                    - {manualDescriptionCount.canceledCount}</Tag>
                                                            )}
                                                            {
                                                                manualDescriptionCount.totalEH > 0 && <Tag
                                                                    className="!cursor-pointer"
                                                                    color="#ef4444"
                                                                    onClick={() => handleOpenIssueDrawer({ ids: manualDescriptionCount?.issueIds })}>EH- {manualDescriptionCount.totalEH}</Tag>
                                                            }
                                                            {
                                                                manualDescriptionCount.totalSH > 0 && <Tag
                                                                    color="#22c55e"
                                                                    onClick={() => handleOpenIssueDrawer({ ids: manualDescriptionCount?.issueIds })}>SH- {manualDescriptionCount.totalSH}</Tag>
                                                            }


                                                            {manualDescriptionCount.bugCount > 0 && (
                                                                <Tag className="!cursor-pointer" color="error" icon={<BugOutlined />}
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: manualDescriptionCount?.issueIds,
                                                                        type: "bug"
                                                                    })}>
                                                                    Bug-{manualDescriptionCount?.bugCount}
                                                                </Tag>
                                                            )}

                                                        </div>

                                                    )
                                                }

                                            </div>

                                        )
                                    })}

                            {item?.templateDescription &&
                                Object.entries(item?.templateDescription ?? {})
                                    .sort(([, a], [, b]) => (a?.order ?? 0) - (b?.order ?? 0))
                                    .map(([id, manualItem]) => {
                                        const templateDescriptionCount = issueData?.data?.find(
                                            (d) => d.id === id || d.id === manualItem?.templateDescId
                                        );

                                        return (
                                            <div key={id}>
                                                <Space
                                                    className="gap-x-1 group w-full justify-between !cursor-default"
                                                >
                                                    <span className="break-words leading-snug">
                                                        <Checkbox
                                                            onChange={(e) => {
                                                                setSelectedDescriptions?.((prev = []) => {
                                                                    if (e.target.checked)
                                                                        return [
                                                                            ...prev,
                                                                            {
                                                                                id,
                                                                                inputId: item.id,
                                                                                key: "templateDescription",
                                                                            },
                                                                        ];
                                                                    return prev.filter((desc) => desc.id !== id);
                                                                });
                                                            }}
                                                            checked={!!selectedDescriptions?.find(desc => desc.id === id)}
                                                        />
                                                        {manualItem?.label} {manualItem?.description}
                                                    </span>

                                                    {!readOnly && (
                                                        <EditOutlined
                                                            className="invisible group-hover:visible !cursor-pointer text-[16px]"
                                                            onClick={() => {
                                                                setSelectedInput({ ...item, uiName: selectedUI?.label });
                                                                openUICanvasActionsTemplateDescriptionUpdateDrawer();
                                                            }}
                                                        />
                                                    )}
                                                </Space>

                                                {isShowIssueStats && templateDescriptionCount && (
                                                    <div className="pl-5">
                                                        {templateDescriptionCount.closedCount > 0 && (
                                                            <Tag
                                                                color="#0000ff"
                                                                className="!cursor-pointer"
                                                                onClick={() =>
                                                                    handleOpenIssueDrawer({
                                                                        ids: templateDescriptionCount?.issueIds,
                                                                        status: "closed",
                                                                    })
                                                                }
                                                            >
                                                                closed - {templateDescriptionCount.closedCount}
                                                            </Tag>
                                                        )}

                                                        {templateDescriptionCount.draftCount > 0 && (
                                                            <Tag
                                                                color="#c8c8c8"
                                                                className="!text-black cursor-pointer"
                                                                onClick={() =>
                                                                    handleOpenIssueDrawer({
                                                                        ids: templateDescriptionCount?.issueIds,
                                                                        status: "draft",
                                                                    })
                                                                }
                                                            >
                                                                draft - {templateDescriptionCount.draftCount}
                                                            </Tag>
                                                        )}

                                                        {templateDescriptionCount.waitingCount > 0 && (
                                                            <Tag
                                                                color="geekblue"
                                                                className="!cursor-pointer"
                                                                onClick={() =>
                                                                    handleOpenIssueDrawer({
                                                                        ids: templateDescriptionCount?.issueIds,
                                                                        status: "waiting",
                                                                    })
                                                                }
                                                            >
                                                                waiting - {templateDescriptionCount.waitingCount}
                                                            </Tag>
                                                        )}

                                                        {templateDescriptionCount.newCount > 0 && (
                                                            <Tag
                                                                color="#ffa500"
                                                                className="!text-black !cursor-pointer"
                                                                onClick={() =>
                                                                    handleOpenIssueDrawer({
                                                                        ids: templateDescriptionCount?.issueIds,
                                                                        status: "new",
                                                                    })
                                                                }
                                                            >
                                                                new - {templateDescriptionCount.newCount}
                                                            </Tag>
                                                        )}

                                                        {templateDescriptionCount.ongoingCount > 0 && (
                                                            <Tag
                                                                color="#008000"
                                                                className="!cursor-pointer"
                                                                onClick={() =>
                                                                    handleOpenIssueDrawer({
                                                                        ids: templateDescriptionCount?.issueIds,
                                                                        status: "ongoing",
                                                                    })
                                                                }
                                                            >
                                                                ongoing - {templateDescriptionCount.ongoingCount}
                                                            </Tag>
                                                        )}

                                                        {templateDescriptionCount.canceledCount > 0 && (
                                                            <Tag
                                                                color="#EF4444"
                                                                className="!cursor-pointer"
                                                                onClick={() =>
                                                                    handleOpenIssueDrawer({
                                                                        ids: templateDescriptionCount?.issueIds,
                                                                        status: "canceled",
                                                                    })
                                                                }
                                                            >
                                                                canceled - {templateDescriptionCount.canceledCount}
                                                            </Tag>
                                                        )}

                                                        {templateDescriptionCount.totalEH > 0 && (
                                                            <Tag
                                                                className="!cursor-pointer"
                                                                color="#ef4444"
                                                                onClick={() =>
                                                                    handleOpenIssueDrawer({
                                                                        ids: templateDescriptionCount?.issueIds,
                                                                    })
                                                                }
                                                            >
                                                                EH - {templateDescriptionCount.totalEH}
                                                            </Tag>
                                                        )}

                                                        {templateDescriptionCount.totalSH > 0 && (
                                                            <Tag
                                                                className="!cursor-pointer"
                                                                color="#22c55e"
                                                                onClick={() =>
                                                                    handleOpenIssueDrawer({
                                                                        ids: templateDescriptionCount?.issueIds,
                                                                    })
                                                                }
                                                            >
                                                                SH - {templateDescriptionCount.totalSH}
                                                            </Tag>
                                                        )}

                                                        {templateDescriptionCount.bugCount > 0 && (
                                                            <Tag
                                                                className="!cursor-pointer"
                                                                color="error"
                                                                icon={<BugOutlined />}
                                                                onClick={() =>
                                                                    handleOpenIssueDrawer({
                                                                        ids: templateDescriptionCount?.issueIds,
                                                                        type: "bug",
                                                                    })
                                                                }
                                                            >
                                                                Bug - {templateDescriptionCount?.bugCount}
                                                            </Tag>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}


                            {item?.apiCall &&
                                Object.values(item?.apiCall)
                                    // .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
                                    .map((apiItem) => {
                                        const apiCallCount = issueData?.data?.find(item => item.id === apiItem.relId);
                                        return (
                                            <div>
                                                <Space key={apiItem.relId}
                                                    className="w-full justify-between group !cursor-default">
                                                    <span className="">
                                                        <Checkbox
                                                            onChange={(e) => {
                                                                setSelectedDescriptions?.((prev = []) => {
                                                                    if (e.target.checked)
                                                                        return [
                                                                            ...prev,
                                                                            {
                                                                                id: apiItem.relId,
                                                                                inputId: item.id,
                                                                                key: "apiCall",
                                                                            },
                                                                        ]
                                                                    return prev.filter((desc) => desc.id !== apiItem.relId)
                                                                })
                                                            }}
                                                            checked={!!selectedDescriptions?.find(desc => desc.id === apiItem.relId)}
                                                        />
                                                        {apiItem.event && (
                                                            <Tag color={"#3b82f6"} className="ml-1 inline-block min-h-[22px]">
                                                                {apiItem?.event}
                                                            </Tag>
                                                        )}
                                                        <span>
                                                            Call API{" "}
                                                            <strong
                                                                onClick={() => {
                                                                    setApiCanvasDrawerData({
                                                                        open: true,
                                                                        data: { id: apiItem?.api },
                                                                    })
                                                                }}
                                                                className={`!cursor-pointer hover:text-[#0000FF] hover:underline`}
                                                            >
                                                                {apiItem?.apiName}
                                                            </strong>
                                                            , <i>{apiItem?.description}</i>
                                                        </span>
                                                    </span>

                                                    {!readOnly && (
                                                        <EditOutlined
                                                            className="invisible group-hover:visible !cursor-pointer text-[16px]"
                                                            onClick={() => {
                                                                setSelectedInput({
                                                                    ...apiItem,
                                                                    inputId: item.id,
                                                                    uiName: item?.apiCall?.uiName
                                                                })
                                                                openUICanvasUpdateAPIRelationDrawer()
                                                            }}
                                                        />
                                                    )}
                                                </Space>
                                                {
                                                    isShowIssueStats && apiCallCount && (
                                                        <div className="pl-5 pt-1">
                                                            {apiCallCount.closedCount > 0 && (
                                                                <Tag color="#0000ff"
                                                                    className="!cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: apiCallCount?.issueIds,
                                                                        status: "closed"
                                                                    })}>closed
                                                                    - {apiCallCount.closedCount}</Tag>
                                                            )}

                                                            {apiCallCount.draftCount > 0 && (
                                                                <Tag color="#c8c8c8" className="!text-black !cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: apiCallCount?.issueIds,
                                                                        status: "draft"
                                                                    })}>draft
                                                                    - {apiCallCount.draftCount}</Tag>
                                                            )}

                                                            {apiCallCount.waitingCount > 0 && (
                                                                <Tag color="geekblue"
                                                                    className="!cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: apiCallCount?.issueIds,
                                                                        status: "waiting"
                                                                    })}>waiting - {apiCallCount.waitingCount}</Tag>
                                                            )}

                                                            {apiCallCount.newCount > 0 && (
                                                                <Tag color="#ffa500" className="!text-black !cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: apiCallCount?.issueIds,
                                                                        status: "new"
                                                                    })}>new
                                                                    - {apiCallCount.newCount}</Tag>
                                                            )}

                                                            {apiCallCount.ongoingCount > 0 && (
                                                                <Tag color="#008000"
                                                                    className="!cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: apiCallCount?.issueIds,
                                                                        status: "ongoing"
                                                                    })}>ongoing
                                                                    - {apiCallCount.ongoingCount}</Tag>
                                                            )}

                                                            {apiCallCount.canceledCount > 0 && (
                                                                <Tag color="#EF4444"
                                                                    className="!cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: apiCallCount?.issueIds,
                                                                        status: "canceled"
                                                                    })}>canceled
                                                                    - {apiCallCount.canceledCount}</Tag>
                                                            )}
                                                            {apiCallCount.totalEH > 0 &&
                                                                <Tag color="#ef4444"
                                                                    className="!cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: apiCallCount?.issueIds
                                                                    })}>EH- {apiCallCount.totalEH}</Tag>}

                                                            {apiCallCount.totalSH > 0 &&
                                                                <Tag color="#22c55e"
                                                                    className="!cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: apiCallCount?.issueIds
                                                                    })}>SH- {apiCallCount.totalSH}</Tag>}

                                                            {apiCallCount.bugCount > 0 && (
                                                                <Tag color="error" className="!cursor-pointer" icon={<BugOutlined />}
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: apiCallCount?.issueIds,
                                                                        type: "bug"
                                                                    })}>
                                                                    Bug-{apiCallCount?.bugCount}
                                                                </Tag>
                                                            )}
                                                        </div>

                                                    )
                                                }
                                            </div>
                                        )
                                    })}

                            {item?.databaseRelation &&
                                Object.values(normalizeAndSortInputs(item?.databaseRelation))
                                    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
                                    .map((dbItem) => {
                                        const databaseRelationCount = issueData?.data?.find(item => item.id === dbItem.dbRelId);
                                        return (
                                            <div>
                                                <Space
                                                    key={dbItem.dbRelId}
                                                    className="justify-between items-center gap-x-1 group !cursor-default w-full">
                                                    <span className="break-words leading-snug">
                                                        <Checkbox
                                                            onChange={(e) => {
                                                                setSelectedDescriptions?.((prev = []) => {
                                                                    if (e.target.checked)
                                                                        return [
                                                                            ...prev,
                                                                            {
                                                                                id: dbItem.dbRelId,
                                                                                inputId: item.id,
                                                                                key: "databaseRelation",
                                                                            },
                                                                        ]
                                                                    return prev.filter((desc) => desc.id !== dbItem.dbRelId)
                                                                })
                                                            }}
                                                            checked={!!selectedDescriptions?.find(desc => desc.id === dbItem.dbRelId)}
                                                        />

                                                        <strong
                                                            onClick={() => {
                                                                if (dbItem.table)
                                                                    setDBCanvasDrawerData({
                                                                        open: true,
                                                                        data: {
                                                                            id: dbItem.table,
                                                                        },
                                                                    })
                                                            }}
                                                            className="!cursor-pointer hover:text-[#0000FF] hover:underline  items-center gap-x-1"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg"
                                                                className="inline-block svg-icon mx-1"
                                                                fill="#3b82f6"
                                                                width="16" height="20"
                                                                viewBox="0 0 1024 1024" version="1.1"><path
                                                                    d="M512 0c-282.76736 0-512 71.63904-512 160.01024l0 128c0 88.3712 229.23264 160.01024 512 160.01024s512-71.63904 512-160.01024l0-128c0-88.3712-229.23264-160.01024-512-160.01024z" /><path
                                                                    d="M512 544.01024c-282.76736 0-512-71.63904-512-160.01024l0 192c0 88.3712 229.23264 160.01024 512 160.01024s512-71.63904 512-160.01024l0-192c0 88.3712-229.23264 160.01024-512 160.01024z" /><path
                                                                    d="M512 832c-282.76736 0-512-71.63904-512-160.01024l0 192c0 88.3712 229.23264 160.01024 512 160.01024s512-71.63904 512-160.01024l0-192c0 88.3712-229.23264 160.01024-512 160.01024z" /></svg>

                                                            {dbItem?.tableName}
                                                        </strong>
                                                        <i>
                                                            {`.${dbItem?.fieldName ?? ""}`}
                                                            {dbItem.action ? `( ${dbItem.action} )` : ""}, {dbItem?.description}
                                                        </i>
                                                    </span>
                                                    {!readOnly && (
                                                        <EditOutlined
                                                            className="invisible group-hover:visible !cursor-pointer text-[16px] self-end"
                                                            onClick={() => {
                                                                setSelectedInput({
                                                                    ...dbItem,
                                                                    inputId: item.id,
                                                                    uiName: dbItem?.uiName
                                                                })
                                                                openUICanvasUpdateDBRelationDrawer()
                                                            }}
                                                        />
                                                    )}
                                                </Space>
                                                {
                                                    isShowIssueStats && databaseRelationCount && (
                                                        <div className="pl-5 pt-1">
                                                            {databaseRelationCount.closedCount > 0 && (
                                                                <Tag className="!cursor-pointer" color="#0000ff"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: databaseRelationCount?.issueIds,
                                                                        status: "closed"
                                                                    })}>closed
                                                                    - {databaseRelationCount.closedCount}</Tag>
                                                            )}

                                                            {databaseRelationCount.draftCount > 0 && (
                                                                <Tag color="#c8c8c8" className="!text-black !cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: databaseRelationCount?.issueIds,
                                                                        status: "draft"
                                                                    })}>draft
                                                                    - {databaseRelationCount.draftCount}</Tag>
                                                            )}

                                                            {databaseRelationCount.waitingCount > 0 && (
                                                                <Tag color="geekblue" className="!cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: databaseRelationCount?.issueIds,
                                                                        status: "waiting"
                                                                    })}>waiting
                                                                    - {databaseRelationCount.waitingCount}</Tag>
                                                            )}

                                                            {databaseRelationCount.newCount > 0 && (
                                                                <Tag color="#ffa500" className="!text-black !cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: databaseRelationCount?.issueIds,
                                                                        status: "new"
                                                                    })}>new
                                                                    - {databaseRelationCount.newCount}</Tag>
                                                            )}

                                                            {databaseRelationCount.ongoingCount > 0 && (
                                                                <Tag color="#008000" className="!cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: databaseRelationCount?.issueIds,
                                                                        status: "ongoing"
                                                                    })}>ongoing
                                                                    - {databaseRelationCount.ongoingCount}</Tag>
                                                            )}

                                                            {databaseRelationCount.canceledCount > 0 && (
                                                                <Tag color="#EF4444" className="!cursor-pointer"
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: databaseRelationCount?.issueIds,
                                                                        status: "canceled"
                                                                    })}>canceled
                                                                    - {databaseRelationCount.canceledCount}</Tag>
                                                            )}
                                                            {
                                                                databaseRelationCount.totalEH > 0 && <Tag className="!cursor-pointer"
                                                                    color="#ef4444" onClick={() => handleOpenIssueDrawer({
                                                                        ids: databaseRelationCount?.issueIds
                                                                    })}>EH- {databaseRelationCount.totalEH}</Tag>
                                                            }
                                                            {
                                                                databaseRelationCount.totalSH > 0 && <Tag className="!cursor-pointer"
                                                                    color="#22c55e" onClick={() => handleOpenIssueDrawer({
                                                                        ids: databaseRelationCount?.issueIds
                                                                    })}>SH- {databaseRelationCount.totalSH}</Tag>
                                                            }

                                                            {databaseRelationCount.bugCount > 0 && (
                                                                <Tag color="error" className="!cursor-pointer" icon={<BugOutlined />}
                                                                    onClick={() => handleOpenIssueDrawer({
                                                                        ids: databaseRelationCount?.issueIds,
                                                                        type: "bug"
                                                                    })}>
                                                                    Bug-{databaseRelationCount?.bugCount}
                                                                </Tag>
                                                            )}
                                                        </div>

                                                    )
                                                }
                                            </div>
                                        )
                                    })}
                            {Object.keys(formAction ?? {})?.length > 0 && (
                                <div>

                                    <Space key={`form-action-${item?.id}`}
                                        className="justify-between group !cursor-default w-full">
                                        <span className="flex items-center gap-x-1 flex-wrap">
                                            <Checkbox
                                                onChange={(e) => {
                                                    setSelectedDescriptions?.((prev = []) => {
                                                        if (e.target.checked)
                                                            return [
                                                                ...prev,
                                                                {
                                                                    id: item.id,
                                                                    inputId: item.id,
                                                                    descId: formAction?.action,
                                                                    key: "formAction",
                                                                },
                                                            ]

                                                        return prev.filter((desc) => desc.id !== item.id)
                                                    })
                                                }}
                                                checked={!!selectedDescriptions?.find(desc => desc.id === item.id)}
                                            />
                                            On Click
                                            {formAction?.action && (
                                                <Tag color={"#80cc28"} className="!text-white text-nowrap min-h-[22px]">
                                                    {FormActionEventLabel[formAction?.action] ?? ""}
                                                </Tag>
                                            )}
                                            {formAction?.uiId && (
                                                <strong
                                                    className={` ${!readOnly ? "!cursor-pointer hover:underline" : "!cursor-default"} `}
                                                    onClick={() => {
                                                        if (!readOnly)
                                                            setUICanvasPreviewDrawerData({
                                                                open: true,
                                                                data: {
                                                                    id: formAction?.uiId,
                                                                    list: uiList
                                                                },
                                                            })
                                                    }}
                                                >
                                                    {uiList?.find((item) => item.id == formAction?.uiId)?.label}
                                                </strong>
                                            )}
                                            <span>{formAction?.condition && `,${formAction.condition}`}</span>
                                        </span>

                                        {!readOnly && (
                                            <EditOutlined
                                                className="invisible group-hover:visible !cursor-pointer text-[16px]"
                                                onClick={() => {
                                                    openUICanvasUpdateFormActionDrawer(true)
                                                    setSelectedInput({
                                                        ...formAction,
                                                        inputId: item.id,
                                                        uiName: formAction?.uiName
                                                    })
                                                }}
                                            />
                                        )}
                                    </Space>
                                    {
                                        isShowIssueStats && formActionRelationCount && (
                                            <div className="pl-5 pt-1">
                                                {formActionRelationCount.closedCount > 0 && (
                                                    <Tag className="!cursor-pointer" color="#0000ff"
                                                        onClick={() => handleOpenIssueDrawer({
                                                            ids: formActionRelationCount?.issueIds,
                                                            status: "closed"
                                                        })}>closed
                                                        - {formActionRelationCount.closedCount}</Tag>
                                                )}

                                                {formActionRelationCount.draftCount > 0 && (
                                                    <Tag color="#c8c8c8" className="!text-black !cursor-pointer"
                                                        onClick={() => handleOpenIssueDrawer({
                                                            ids: formActionRelationCount?.issueIds,
                                                            status: "draft"
                                                        })}>draft
                                                        - {formActionRelationCount.draftCount}</Tag>
                                                )}

                                                {formActionRelationCount.waitingCount > 0 && (
                                                    <Tag color="geekblue" className="!cursor-pointer"
                                                        onClick={() => handleOpenIssueDrawer({
                                                            ids: formActionRelationCount?.issueIds,
                                                            status: "waiting"
                                                        })}>waiting
                                                        - {formActionRelationCount.waitingCount}</Tag>
                                                )}

                                                {formActionRelationCount.newCount > 0 && (
                                                    <Tag color="#ffa500" className="!text-black !cursor-pointer"
                                                        onClick={() => handleOpenIssueDrawer({
                                                            ids: formActionRelationCount?.issueIds,
                                                            status: "new"
                                                        })}>new
                                                        - {formActionRelationCount.newCount}</Tag>
                                                )}

                                                {formActionRelationCount.ongoingCount > 0 && (
                                                    <Tag color="#008000" className="!cursor-pointer"
                                                        onClick={() => handleOpenIssueDrawer({
                                                            ids: formActionRelationCount?.issueIds,
                                                            status: "ongoing"
                                                        })}>ongoing
                                                        - {formActionRelationCount.ongoingCount}</Tag>
                                                )}

                                                {formActionRelationCount.canceledCount > 0 && (
                                                    <Tag color="#EF4444" className="!cursor-pointer"
                                                        onClick={() => handleOpenIssueDrawer({
                                                            ids: formActionRelationCount?.issueIds,
                                                            status: "canceled"
                                                        })}>canceled
                                                        - {formActionRelationCount.canceledCount}</Tag>
                                                )}
                                                {
                                                    formActionRelationCount.totalEH > 0 && <Tag className="!cursor-pointer"
                                                        color="#ef4444"
                                                        onClick={() => handleOpenIssueDrawer({
                                                            ids: formActionRelationCount?.issueIds
                                                        })}>EH- {formActionRelationCount.totalEH}</Tag>
                                                }
                                                {
                                                    formActionRelationCount.totalSH > 0 && <Tag className="!cursor-pointer"
                                                        color="#22c55e"
                                                        onClick={() => handleOpenIssueDrawer({
                                                            ids: formActionRelationCount?.issueIds
                                                        })}>SH- {formActionRelationCount.totalSH}</Tag>
                                                }

                                                {formActionRelationCount.bugCount > 0 && (
                                                    <Tag color="error" className="!cursor-pointer" icon={<BugOutlined />}
                                                        onClick={() => handleOpenIssueDrawer({
                                                            ids: formActionRelationCount?.issueIds,
                                                            type: "bug"
                                                        })}>
                                                        Bug-{formActionRelationCount?.bugCount}
                                                    </Tag>
                                                )}
                                            </div>

                                        )
                                    }
                                </div>
                            )}
                        </Space>
                    )
                },
            },
            !readOnly
                ? {
                    title: "",
                    key: "action",
                    width: 200,
                    className: `align-text-top ${readOnly ? "hidden" : ""}`,
                    render: (record) => {
                        const menuItems = [
                            ...baseActions,
                            ...(shouldShowExtraActions ? getAddRemoveActions(record) : [])
                        ].filter(Boolean);
                        const menu = (
                            <Menu
                                onClick={(e) => {
                                    handleAction(e.key, record)
                                }}
                                items={menuItems}
                            />
                        )
                        return (
                            <Dropdown overlay={menu} trigger={["click"]} className="w-full">
                                <Button
                                    className="w-full text-left flex justify-between items-center rounded-md  border-[#d9d9d9] h-[38px] bg-white">
                                    <span>Actions</span>
                                    <DownOutlined className="text-[#999]" />

                                </Button>
                            </Dropdown>
                        )
                    },
                }
                : null,
        ].filter(Boolean).flatMap(item => item)
        setInputColumns(columns)
    }

    const moveRow = async (dragIndex: number, hoverIndex: number) => {
        try {
            if (dragIndex === hoverIndex) return;

            const newData = [...inputTableData];
            const dragRow = { ...newData[dragIndex] };
            const hoverRow = newData[hoverIndex];

            // === Parent logic ===
            if (["tbl", "table"].includes(hoverRow.componentType)) {
                dragRow.fkTableId = hoverRow.id;
                dragRow.hasLabel = false
                dragRow.fkGroupId = null;
            } else if (["grp", "group"].includes(hoverRow.componentType)) {
                dragRow.fkGroupId = hoverRow.id;
                if (!dragRow.hasLabel && !["btn", "hlink"].includes(dragRow.componentType)) dragRow.hasLabel = true
                dragRow.fkTableId = null;
            } else {
                if (!dragRow.hasLabel && !["btn", "hlink"].includes(dragRow.componentType)) dragRow.hasLabel = true
                dragRow.fkTableId = hoverRow.fkTableId || null;
                dragRow.fkGroupId = hoverRow.fkGroupId || null;
            }

            // Remove old position and insert new
            newData.splice(dragIndex, 1);
            newData.splice(hoverIndex, 0, dragRow);

            // === Order update ===
            let orderCounter = 0;
            newData.forEach(item => {
                if (!item.fkTableId && !item.fkGroupId) {
                    item.order = orderCounter++;
                    const children = newData.filter(c =>
                        c.fkTableId === item.id || c.fkGroupId === item.id
                    );
                    children.forEach(child => {
                        child.order = orderCounter++;
                    });
                }
            });

            // === Firebase update (dot-notation ile sadece değişen alanlar) ===
            const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);
            const docSnap = await getDoc(uiCanvasDocRef);
            if (!docSnap.exists()) return;

            const canvasInputs = docSnap.data()?.input || {};
            const updatePayload: Record<string, any> = {};

            newData.forEach(item => {
                if (!canvasInputs[selectedUICanvasId][item.id]) return;
                updatePayload[`input.${selectedUICanvasId}.${item.id}.order`] = item.order ?? 0;
                updatePayload[`input.${selectedUICanvasId}.${item.id}.fkTableId`] = item.fkTableId ?? null;
                updatePayload[`input.${selectedUICanvasId}.${item.id}.fkGroupId`] = item.fkGroupId ?? null;
            });

            await updateDoc(uiCanvasDocRef, updatePayload);

            // Add to ui_canvas_history for drag and drop
            if (selectedUICanvasId) {
                await addDragDropHistoryRecord({
                    uiCanvasId: selectedUICanvasId,
                    draggedItem: {
                        id: dragRow.id,
                        inputName: dragRow.inputName,
                        oldIndex: dragIndex,
                        newIndex: hoverIndex,
                    },
                    actionType: 'DRAG_DROP_REORDER',
                });
            }

            message.success("Order updated successfully!");

        } catch (e) {
            console.error(e);
            message.error("Error updating order");
        }
    };

    // Add to ui_canvas_history for drag and drop
    const addDragDropHistoryRecord = async (historyData: {
        uiCanvasId: string;
        draggedItem: any;
        actionType: string;
    }) => {
        try {
            const uiCanvasHistoryDocRef = doc(db, 'ui_canvas_history', historyData.uiCanvasId);
            
            const historyRecord = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: userData?.uid || 'unknown',
                userName: userData?.name || userData?.email || 'Unknown User',
                userEmail: userData?.email || 'Unknown Email',
                actionType: historyData.actionType,
                fieldName: 'drag_drop_reorder',
                draggedItem: historyData.draggedItem,
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
                    drag_drop_reorder: [historyRecord],
                    allChanges: [historyRecord],
                });
            } else {
                // Update existing document
                await updateDoc(uiCanvasHistoryDocRef, {
                    updatedAt: serverTimestamp(),
                    drag_drop_reorder: arrayUnion(historyRecord),
                    allChanges: arrayUnion(historyRecord),
                });
            }

            console.log('Drag drop history record added successfully');
        } catch (error) {
            console.error('Error adding drag drop history record:', error);
        }
    }

    useEffect(() => {
        if (selectedUICanvasId && !readOnly || (isShowIssueStats && issueData)) {
            buildColumns()
        }
    }, [selectedUICanvasId, selectedUI, selectedDescriptions, isShowIssueStats, issueData, selectedUICanvasInputRows])

    useEffect(() => {
        if (selectedUICanvasId && readOnly) {
            buildColumns()
        }
    }, [selectedUICanvasId])


    const inputTableData = useMemo(() => {
        return buildDisplayOrderData(Object.values(selectedUI?.input || {}));
    }, [selectedUI?.input]);

    return { inputTableData, selectedInput, moveRow }
}