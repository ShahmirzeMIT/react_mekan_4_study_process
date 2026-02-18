import { Button, Card, Select, Spin, List, Tag, Collapse, Empty, message, Typography, Drawer, Timeline, Descriptions, Badge, Alert, Avatar, Space, Tooltip, Image } from "antd";
import { CopyOutlined, EditOutlined, GithubOutlined, PlusCircleOutlined, ShareAltOutlined, CaretRightOutlined, DeleteOutlined, EyeOutlined, HistoryOutlined, CloseOutlined, WarningOutlined, UserOutlined, ApiOutlined, DatabaseOutlined, FormOutlined, LinkOutlined, FileTextOutlined, CodeOutlined, PictureOutlined } from "@ant-design/icons";
import React, { useState, useCallback, useEffect, useRef } from "react";
import ExportUICanvasSelect from "@/components/ui-canvas/common/ExportUICanvasSelect.tsx";
import { db } from "@/config/firebase";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp, onSnapshot, deleteDoc } from "firebase/firestore";
import AddComponentFromGithubDrawer from "@/ui-canvas/crd_tree_canvas/actions/AddComponentFromGithubDrawer";
import { TreeNode } from "@/ui-canvas/crd_tree_canvas/actions/treeNode";
import ActionsDrawer from "@/ui-canvas/crd_tree_canvas/actions/ActionsDrawer";

const { Option } = Select;
const { Panel } = Collapse;
const { Text } = Typography;

// Component types enum
enum ComponentType {
  Txt = "txt",
  Cmb = "cmb",
  Btn = "btn",
  Txa = "txa",
  Rbtn = "rbtn",
  IRbtn = 'irbtn',
  Cbox = "cbox",
  Date = "date",
  Time = "time",
  Lbl = "lbl",
  Icbox = "icbox",
  File = "file",
  Hlink = "hlink",
  Img = "img",
  Tbl = "tbl",
  Grp = "grp",
  Ytube = "ytube",
}

// Component types object
const componentTypesObj: Record<ComponentType, { id: ComponentType; label: string }> = {
  [ComponentType.Txt]: { id: ComponentType.Txt, label: "Edit Line" },
  [ComponentType.Btn]: { id: ComponentType.Btn, label: "Button" },
  [ComponentType.Img]: { id: ComponentType.Img, label: "Image" },
  [ComponentType.Cbox]: { id: ComponentType.Cbox, label: "Checkbox" },
  [ComponentType.Icbox]: { id: ComponentType.Icbox, label: "Inner Checkbox" },
  [ComponentType.Cmb]: { id: ComponentType.Cmb, label: "Select" },
  [ComponentType.Rbtn]: { id: ComponentType.Rbtn, label: "Radio" },
  [ComponentType.IRbtn]: { id: ComponentType.IRbtn, label: "Inner Radio" },
  [ComponentType.Txa]: { id: ComponentType.Txa, label: "Textarea" },
  [ComponentType.Tbl]: { id: ComponentType.Tbl, label: "Table" },
  [ComponentType.Grp]: { id: ComponentType.Grp, label: "Group" },
  [ComponentType.Date]: { id: ComponentType.Date, label: "Date Picker" },
  [ComponentType.Time]: { id: ComponentType.Time, label: "Time Picker" },
  [ComponentType.File]: { id: ComponentType.File, label: "File Picker" },
  [ComponentType.Hlink]: { id: ComponentType.Hlink, label: "Hyperlink" },
  [ComponentType.Lbl]: { id: ComponentType.Lbl, label: "Label" },
  [ComponentType.Ytube]: { id: ComponentType.Ytube, label: "YouTube" },
};

// Helper function to get component type label
const getComponentTypeLabel = (type: string): string => {
  return componentTypesObj[type as ComponentType]?.label || type;
};

interface GithubUrl {
  repoId: string;
  repoFullName: string;
  branch: string;
  filePath: string;
  fileName?: string;
  addedAt: string;
  parentId: string | null;
}

interface UICanvasData {
  id: string;
  label: string;
  description?: string;
  githubUrls?: GithubUrl[];
  [key: string]: any;
}

interface HistoryRecord {
  id?: string;
  uiCanvasId: string;
  userId: string;
  userName: string;
  userEmail: string;
  actionType: string;
  fieldName: string;
  oldValue: any;
  newValue: any;
  githubUrls?: GithubUrl[];
  githubUrl?: GithubUrl | null;
  timestamp: any;
  uiCanvasDocument?: any;
  userDocument?: any;
  allChanges?: any[];
}

export interface ActionsDrawerState {
  open: boolean;
  mode: any;
  parentId: string | null;
  targetNode: TreeNode | null;
  targetGithubUrl?: GithubUrl | null;
}

const initialState: ActionsDrawerState = {
  open: false,
  mode: "create",
  parentId: null,
  targetNode: null,
  targetGithubUrl: null,
};

// Helper function to sanitize Firestore document IDs
const sanitizeFirestoreId = (str: string): string => {
  return str.replace(/[\/.#$\[\]]/g, '_');
};

// Helper function to create a valid githubId for Firestore
const createGithubId = (repoId: string, filePath: string): string => {
  const sanitizedFilePath = sanitizeFirestoreId(filePath);
  return `${repoId}_${sanitizedFilePath}`;
};

// Helper function to find unique GitHub URL
const findGithubUrlIndex = (githubUrls: GithubUrl[], urlToFind: GithubUrl): number => {
  return githubUrls.findIndex(url => 
    url.repoId === urlToFind.repoId &&
    url.filePath === urlToFind.filePath &&
    url.addedAt === urlToFind.addedAt
  );
};

// Props interface
interface UICanvasHeadingProps {
  selectedUI: UICanvasData | null;
  onChangeUI: (id: string) => void;
  uiList: UICanvasData[];
  openUICreateModal: () => void;
  openUIUpdateModal: (ui: UICanvasData) => void;
  setIsOpenUICanvasDuplicateModal: (open: boolean) => void;
  targetRef: React.RefObject<any>;
  selectedUICanvasId: string | null;
  setIsOpenAIDrawer: (open: boolean) => void;
  setUICanvasPreviewDrawerData: (data: any) => void;
}

export default function UICanvasHeading({
  selectedUI,
  onChangeUI,
  uiList,
  openUICreateModal,
  openUIUpdateModal,
  setIsOpenUICanvasDuplicateModal,
  targetRef,
  selectedUICanvasId,
  setIsOpenAIDrawer,
  setUICanvasPreviewDrawerData,
}: UICanvasHeadingProps) {
  const [drawerState, setDrawerState] = useState<ActionsDrawerState>(initialState);
  const currentProject = useSelector((state: RootState) => state.project.currentProject);
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [fileContent, setFileContent] = useState<any>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [addComponentDrawerOpen, setAddComponentDrawerOpen] = useState<boolean>(false);
  const [selectedNodeForAddComponent, setSelectedNodeForAddComponent] = useState<TreeNode | null>(null);
  const [githubUrls, setGithubUrls] = useState<GithubUrl[]>([]);
  const [uiData, setUiData] = useState<UICanvasData | null>(null);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState<boolean>(false);
  const [historyDocument, setHistoryDocument] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  
  const currentUserData = JSON.parse(localStorage.getItem("userData") || "{}");
  const currentUserId = currentUserData?.uid;
  
  // Use refs to track previous values
  const prevSelectedUICanvasIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const unsubscribeHistoryRef = useRef<(() => void) | null>(null);

  // Main useEffect for Firestore listener
  useEffect(() => {
    // Cleanup previous listener if exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!selectedUICanvasId) {
      setGithubUrls([]);
      setUiData(null);
      prevSelectedUICanvasIdRef.current = null;
      return;
    }

    // Set up new listener
    prevSelectedUICanvasIdRef.current = selectedUICanvasId;

    const unsubscribe = onSnapshot(
      doc(db, 'ui_canvas_github_urls', selectedUICanvasId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as UICanvasData;
          setUiData(data);
          setGithubUrls(data.githubUrls || []);
        } else {
          setUiData(null);
          setGithubUrls([]);
        }
      },
      (error) => {
        console.error("Error listening to UI Canvas changes:", error);
        setGithubUrls([]);
        setUiData(null);
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [selectedUICanvasId]);

  // Sync from selectedUI prop
  useEffect(() => {
    if (!selectedUICanvasId && selectedUI) {
      setGithubUrls(selectedUI.githubUrls || []);
      setUiData(selectedUI);
    }
  }, [selectedUI, selectedUICanvasId]);

  // Set up real-time listener for history document when drawer is open
  useEffect(() => {
    if (historyDrawerOpen && selectedUICanvasId) {
      // Cleanup previous listener if exists
      if (unsubscribeHistoryRef.current) {
        unsubscribeHistoryRef.current();
        unsubscribeHistoryRef.current = null;
      }
      
      // Set up real-time listener for history document
      const historyDocRef = doc(db, 'ui_canvas_history', selectedUICanvasId);
      unsubscribeHistoryRef.current = onSnapshot(
        historyDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const historyData = docSnapshot.data();
            setHistoryDocument(historyData);
            setHistoryError(null);
          } else {
            setHistoryDocument(null);
            setHistoryError("No history found for this UI Canvas");
          }
        },
        (error) => {
          console.error('Error listening to history document:', error);
          setHistoryError(`Error loading history: ${error.message}`);
          setHistoryDocument(null);
        }
      );
    } else {
      // Cleanup listener when drawer closes
      if (unsubscribeHistoryRef.current) {
        unsubscribeHistoryRef.current();
        unsubscribeHistoryRef.current = null;
      }
    }
    
    return () => {
      if (unsubscribeHistoryRef.current) {
        unsubscribeHistoryRef.current();
        unsubscribeHistoryRef.current = null;
      }
    };
  }, [historyDrawerOpen, selectedUICanvasId]);

  // Create history record function
  const createGithubHistoryRecord = async (historyData: Omit<HistoryRecord, 'userId' | 'userName' | 'userEmail'>) => {
    try {
      if (!currentUserId || !selectedUICanvasId) {
        console.warn("No user or UI Canvas selected for history record");
        return;
      }

      const historyDocRef = doc(db, 'ui_canvas_history', selectedUICanvasId);
      
      const historyPayload: Omit<HistoryRecord, 'id'> = {
        ...historyData,
        userId: currentUserId,
        userName: currentUserData.name || currentUserData.email || 'Unknown User',
        userEmail: currentUserData.email || 'Unknown Email',
        uiCanvasDocument: doc(db, 'ui_canvas_github_urls', historyData.uiCanvasId),
        userDocument: doc(db, 'users', currentUserId),
      };

      const existingDoc = await getDoc(historyDocRef);
      
      if (existingDoc.exists()) {
        const existingData = existingDoc.data();
        const existingChanges = existingData.allChanges || [];
        
        const newChange = {
          actionType: historyPayload.actionType,
          fieldName: historyPayload.fieldName,
          oldValue: historyPayload.oldValue,
          newValue: historyPayload.newValue,
          githubUrl: historyPayload.githubUrl,
          githubUrls: historyPayload.githubUrls,
          timestamp: historyPayload.timestamp,
          userId: historyPayload.userId,
          userName: historyPayload.userName,
          userEmail: historyPayload.userEmail,
        };
        
        const updatedChanges = [newChange, ...existingChanges];
        const trimmedChanges = updatedChanges.slice(0, 50);
        
        await updateDoc(historyDocRef, {
          allChanges: trimmedChanges,
          lastUpdated: serverTimestamp(),
          uiCanvasId: selectedUICanvasId,
          uiCanvasLabel: uiData?.label || 'Unknown Canvas'
        });
      } else {
        const initialChange = {
          actionType: historyPayload.actionType,
          fieldName: historyPayload.fieldName,
          oldValue: historyPayload.oldValue,
          newValue: historyPayload.newValue,
          githubUrl: historyPayload.githubUrl,
          githubUrls: historyPayload.githubUrls,
          timestamp: historyPayload.timestamp,
          userId: historyPayload.userId,
          userName: historyPayload.userName,
          userEmail: historyPayload.userEmail,
        };
        
        await setDoc(historyDocRef, {
          allChanges: [initialChange],
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          uiCanvasId: selectedUICanvasId,
          uiCanvasLabel: uiData?.label || 'Unknown Canvas'
        });
      }
      
      console.log('GitHub history record created/updated successfully');
    } catch (error) {
      console.error('Error creating/updating GitHub history record:', error);
    }
  };

  const handleGenerateAI = async () => {
    setIsOpenAIDrawer(true);
  };

  // Handle deleting a GitHub URL
  const handleDeleteGithubUrl = async (githubUrl: GithubUrl) => {
    if (!selectedUICanvasId) {
      message.error("No UI Canvas selected");
      return;
    }

    try {
      const uiCanvasGithubUrlsRef = doc(db, 'ui_canvas_github_urls', selectedUICanvasId);
      
      const currentDoc = await getDoc(uiCanvasGithubUrlsRef);
      if (!currentDoc.exists()) {
        message.error("Document not found");
        return;
      }

      const currentData = currentDoc.data();
      const currentGithubUrls = currentData.githubUrls || [];
      
      const urlIndex = findGithubUrlIndex(currentGithubUrls, githubUrl);
      
      if (urlIndex === -1) {
        message.error("GitHub URL not found");
        return;
      }

      const updatedGithubUrls = [...currentGithubUrls];
      const removedUrl = updatedGithubUrls.splice(urlIndex, 1)[0];

      await updateDoc(uiCanvasGithubUrlsRef, {
        githubUrls: updatedGithubUrls,
        updated_at: serverTimestamp()
      });

      await createGithubHistoryRecord({
        uiCanvasId: selectedUICanvasId,
        actionType: 'GITHUB_URL_DELETE',
        fieldName: 'github_urls',
        oldValue: currentGithubUrls,
        newValue: updatedGithubUrls,
        githubUrl: removedUrl,
        timestamp: serverTimestamp(),
      });

      const githubId = createGithubId(githubUrl.repoId, githubUrl.filePath);
      const crdRelationRef = doc(db, 'crd_relation_ui_canvas', githubId);
      
      try {
        const crdDoc = await getDoc(crdRelationRef);
        if (crdDoc.exists()) {
          const crdData = crdDoc.data();
          if (crdData.ui_canvas_id === selectedUICanvasId) {
            await deleteDoc(crdRelationRef);
          }
        }
      } catch (crdError) {
        console.warn("Error deleting from crd_relation_ui_canvas:", crdError);
      }

      message.success("GitHub file removed successfully");
    } catch (error: any) {
      console.error("Error deleting GitHub URL:", error);
      message.error(`Failed to delete: ${error.message}`);
    }
  };

  // Handle adding files - FIXED: Fixed import issue
  const handleAddFiles = useCallback(async (
    parentId: string | null,
    files: Array<{
      repoId: string;
      repoFullName: string;
      branch: string;
      filePath: string;
      fileName?: string;
    }>
  ) => {
    if (!selectedUICanvasId) {
      message.error("No UI Canvas selected. Please select a UI Canvas first.");
      return [];
    }

    try {
      const newGithubUrls = files.map(file => ({
        repoId: file.repoId,
        repoFullName: file.repoFullName,
        branch: file.branch,
        filePath: file.filePath,
        fileName: file.fileName || file.filePath.split('/').pop(),
        addedAt: new Date().toISOString(),
        parentId: parentId || null
      }));

      const uiCanvasGithubUrlsRef = doc(db, 'ui_canvas_github_urls', selectedUICanvasId);
      const currentDoc = await getDoc(uiCanvasGithubUrlsRef);
      
      let existingGithubUrls: GithubUrl[] = [];
      if (currentDoc.exists()) {
        const currentData = currentDoc.data();
        existingGithubUrls = currentData.githubUrls || [];
      }

      const uniqueNewUrls = newGithubUrls.filter(newUrl => {
        return !existingGithubUrls.some(existingUrl => 
          existingUrl.repoId === newUrl.repoId &&
          existingUrl.filePath === newUrl.filePath
        );
      });

      if (uniqueNewUrls.length === 0) {
        message.warning("All files are already added");
        return [];
      }

      const allGithubUrls = [...existingGithubUrls, ...uniqueNewUrls];

      await setDoc(uiCanvasGithubUrlsRef, {
        id: selectedUICanvasId,
        githubUrls: allGithubUrls,
        updated_at: serverTimestamp(),
        created_by: currentUserId
      }, { merge: true });

      await createGithubHistoryRecord({
        uiCanvasId: selectedUICanvasId,
        actionType: 'GITHUB_URLS_ADD',
        fieldName: 'github_urls',
        oldValue: existingGithubUrls,
        newValue: allGithubUrls,
        githubUrls: uniqueNewUrls,
        timestamp: serverTimestamp(),
      });

      for (const url of uniqueNewUrls) {
        const githubId = createGithubId(url.repoId, url.filePath);
        const crdRelationRef = doc(db, 'crd_relation_ui_canvas', githubId);
        
        await setDoc(crdRelationRef, {
          github_id: githubId,
          ui_canvas_id: selectedUICanvasId,
          repo_id: url.repoId,
          repo_full_name: url.repoFullName,
          branch: url.branch,
          file_path: url.filePath,
          file_name: url.fileName,
          github_urls: [url],
          created_at: url.addedAt,
          updated_at: serverTimestamp(),
          created_by: currentUserId
        }, { merge: true });
      }

      message.success(`Added ${uniqueNewUrls.length} file(s) successfully`);
      return uniqueNewUrls.map(url => `github-${url.repoId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

    } catch (error: any) {
      console.error("Error adding GitHub files to UI Canvas:", error);
      message.error(`Failed to add GitHub files: ${error.message}`);
      return [];
    }
  }, [selectedUICanvasId, currentUserId, currentUserData, uiData?.label]);

  // Import DPS file function - FIXED: Using the working version from your first file
  const importDPSFile = async () => {
    if (!fileContent || !currentProject?.id) {
      message.error('No file content or project selected');
      return;
    }

    setImportLoading(true);
    try {
      const uiCanvasId = fileContent.id;
      const uiCanvasLabel = fileContent.label || fileContent.inputName || 'Imported UI Canvas';

      if (!uiCanvasId) {
        message.error('Invalid .dps file: Missing UI Canvas ID');
        return;
      }

      const projectRef = doc(db, 'projects', currentProject.id);
      const projectDoc = await getDoc(projectRef);

      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        let digitalServiceJson = {};

        try {
          if (projectData.digital_service_json) {
            digitalServiceJson = typeof projectData.digital_service_json === 'string'
              ? JSON.parse(projectData.digital_service_json)
              : projectData.digital_service_json;
          }
        } catch (error) {
          console.error('Error parsing existing digital_service_json:', error);
          digitalServiceJson = {};
        }

        digitalServiceJson[uiCanvasId] = uiCanvasLabel;

        await updateDoc(projectRef, {
          digital_service_json: JSON.stringify(digitalServiceJson)
        });

        console.log('Updated digital_service_json in projects collection');
      }

      // Use ui_canvas collection instead of ui_canvas_github_urls for imported files
      const uiCanvasRef = doc(db, 'ui_canvas', uiCanvasId);

      const uiCanvasData = {
        id: uiCanvasId,
        label: uiCanvasLabel,
        description: fileContent.description || '',
        projectId: currentProject.id,
        type: fileContent.type || 'ui',
        input: {
          [uiCanvasId]: fileContent.input || {}
        },
        css: fileContent.css || {},
        lastUpdated: fileContent.lastUpdated || {
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: 0
        },
        ...(fileContent.fkTableId && { fkTableId: fileContent.fkTableId }),
        ...(fileContent.fkGroupId && { fkGroupId: fileContent.fkGroupId }),
        ...(fileContent.fkUserStoryId && { fkUserStoryId: fileContent.fkUserStoryId }),
        githubUrls: fileContent.githubUrls || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        imported: true,
        import_date: new Date().toISOString()
      };

      await setDoc(uiCanvasRef, uiCanvasData);

      console.log('UI Canvas imported successfully:', uiCanvasId);
      message.success(`UI Canvas "${uiCanvasLabel}" imported successfully!`);

      setShowImportModal(false);
      setFileContent(null);

      if (onChangeUI) {
        onChangeUI(uiCanvasId);
      }

    } catch (error: any) {
      console.error('Error importing .dps file:', error);
      message.error(`Failed to import UI Canvas: ${error.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportCancel = () => {
    setShowImportModal(false);
    setFileContent(null);
  };

  // Convert GithubUrl to TreeNode
  const convertToTreeNode = (githubUrl: GithubUrl): TreeNode => {
    const fileName = githubUrl.fileName || githubUrl.filePath.split('/').pop() || 'Unnamed File';
    
    return {
      id: `github-${githubUrl.repoId}-${githubUrl.filePath}-${githubUrl.addedAt}`,
      name: fileName,
      type: "file" as const,
      canvasType: "ui" as const,
      githubRepoId: githubUrl.repoId,
      githubRepoFullName: githubUrl.repoFullName,
      githubBranch: githubUrl.branch,
      githubPath: githubUrl.filePath,
      pathName: githubUrl.filePath,
      fileName: fileName,
      children: [],
      isOpen: false,
      canvasId: selectedUICanvasId || '',
      canvasName: uiData?.label || '',
      externalPath: undefined,
      externalRepoFullName: undefined,
      externalBranch: undefined,
      collectionIds: []
    };
  };

  // Open view drawer for a GitHub file
  const openViewDrawer = (githubUrl: GithubUrl) => {
    const treeNode = convertToTreeNode(githubUrl);
    
    setDrawerState({
      open: true,
      mode: "view",
      parentId: null,
      targetNode: treeNode,
      targetGithubUrl: githubUrl,
    });
  };

  // Open edit drawer for a GitHub file
  const openEditDrawer = (githubUrl: GithubUrl) => {
    const treeNode = convertToTreeNode(githubUrl);
    
    setDrawerState({
      open: true,
      mode: "edit",
      parentId: null,
      targetNode: treeNode,
      targetGithubUrl: githubUrl,
    });
  };

  // Open history drawer
  const openHistoryDrawer = () => {
    if (!selectedUICanvasId) {
      message.warning("Please select a UI Canvas first");
      return;
    }
    setHistoryDrawerOpen(true);
  };

  // Close history drawer
  const closeHistoryDrawer = () => {
    setHistoryDrawerOpen(false);
    setHistoryDocument(null);
    setHistoryError(null);
  };

  // Get action icon
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'NAME_UPDATE':
        return <EditOutlined />;
      case 'GITHUB_URLS_ADD':
        return <GithubOutlined />;
      case 'GITHUB_URL_DELETE':
        return <DeleteOutlined />;
      case 'GITHUB_URL_UPDATE':
        return <LinkOutlined />;
      case 'CANVAS_DUPLICATED_FROM':
        return <CopyOutlined />;
      case 'CREATE':
        return <PlusCircleOutlined />;
      case 'EXTERNAL_LINK_CREATE':
        return <LinkOutlined />;
      case 'INPUT_CREATE':
        return <CodeOutlined />;
      case 'COMPONENT_INFO_UPDATE':
        return <FileTextOutlined />;
      case 'MANUAL_DESCRIPTION_CREATE':
      case 'MANUAL_DESCRIPTION_UPDATE':
        return <FileTextOutlined />;
      case 'TEMPLATE_DESCRIPTION_CREATE':
      case 'TEMPLATE_DESCRIPTION_UPDATE':
        return <FileTextOutlined />;
      case 'API_CALL_RELATION_UPDATE':
        return <ApiOutlined />;
      case 'DB_RELATION_CREATE':
      case 'DB_RELATION_UPDATE':
        return <DatabaseOutlined />;
      case 'COLLECTION_CANVAS_ASSIGN':
        return <FormOutlined />;
      case 'FORM_ACTION_CREATE':
      case 'FORM_ACTION_UPDATE':
        return <FormOutlined />;
      default:
        return <HistoryOutlined />;
    }
  };

  // Get action type color
  const getActionTypeColor = (actionType: string): string => {
    switch (actionType) {
      case 'NAME_UPDATE':
        return 'blue';
      case 'GITHUB_URLS_ADD':
      case 'INPUT_CREATE':
      case 'MANUAL_DESCRIPTION_CREATE':
      case 'TEMPLATE_DESCRIPTION_CREATE':
      case 'API_CALL_RELATION_CREATE':
      case 'DB_RELATION_CREATE':
      case 'EXTERNAL_LINK_CREATE':
      case 'FORM_ACTION_CREATE':
      case 'COLLECTION_CANVAS_ASSIGN':
        return 'green';
      case 'GITHUB_URL_DELETE':
        return 'red';
      case 'GITHUB_URL_UPDATE':
      case 'COMPONENT_INFO_UPDATE':
      case 'MANUAL_DESCRIPTION_UPDATE':
      case 'TEMPLATE_DESCRIPTION_UPDATE':
      case 'API_CALL_RELATION_UPDATE':
      case 'DB_RELATION_UPDATE':
      case 'FORM_ACTION_UPDATE':
        return 'orange';
      case 'CANVAS_DUPLICATED_FROM':
      case 'CREATE':
        return 'purple';
      default:
        return 'gray';
    }
  };

  // Get action type label
  const getActionTypeLabel = (actionType: string): string => {
    switch (actionType) {
      case 'NAME_UPDATE':
        return 'Canvas Name Updated';
      case 'GITHUB_URLS_ADD':
        return 'GitHub Files Added';
      case 'GITHUB_URL_DELETE':
        return 'GitHub File Removed';
      case 'GITHUB_URL_UPDATE':
        return 'GitHub File Updated';
      case 'CANVAS_DUPLICATED_FROM':
        return 'Canvas Duplicated';
      case 'CREATE':
        return 'Canvas Created';
      case 'EXTERNAL_LINK_CREATE':
        return 'External Link Created';
      case 'INPUT_CREATE':
        return 'Input Component Created';
      case 'COMPONENT_INFO_UPDATE':
        return 'Component Info Updated';
      case 'MANUAL_DESCRIPTION_CREATE':
        return 'Manual Description Created';
      case 'MANUAL_DESCRIPTION_UPDATE':
        return 'Manual Description Updated';
      case 'TEMPLATE_DESCRIPTION_CREATE':
        return 'Template Descriptions Created';
      case 'TEMPLATE_DESCRIPTION_UPDATE':
        return 'Template Descriptions Updated';
      case 'API_CALL_RELATION_UPDATE':
        return 'API Call Relation Updated';
      case 'DB_RELATION_CREATE':
        return 'Database Relation Created';
      case 'DB_RELATION_UPDATE':
        return 'Database Relation Updated';
      case 'COLLECTION_CANVAS_ASSIGN':
        return 'Collection Canvas Assigned';
      case 'FORM_ACTION_CREATE':
        return 'Form Action Created';
      case 'FORM_ACTION_UPDATE':
        return 'Form Action Updated';
      default:
        return actionType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Format field name
  const formatFieldName = (fieldName: string): string => {
    return fieldName.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format timestamp
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'Unknown date';
    
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString();
      } else if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleString();
      } else if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString();
      } else if (timestamp._seconds) {
        return new Date(timestamp._seconds * 1000).toLocaleString();
      }
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Helper to check if URL is an image
  const isImageUrl = (url: string): boolean => {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const urlLower = url.toLowerCase();
    return imageExtensions.some(ext => urlLower.includes(ext)) || 
           urlLower.includes('firebasestorage.googleapis.com') ||
           urlLower.includes('storage.googleapis.com');
  };

  // Render change details based on action type
  const renderChangeDetails = (change: any) => {
    const commonDetails = (
      <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text strong>{change.userName || 'Unknown User'}</Text>
          {change.userEmail && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ({change.userEmail})
            </Text>
          )}
        </div>
        
        {change.fieldName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text type="secondary">Field:</Text>
            <Tag color="default">{formatFieldName(change.fieldName)}</Tag>
          </div>
        )}
      </Space>
    );

    switch (change.actionType) {
      case 'NAME_UPDATE':
        return (
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {commonDetails}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary" style={{ minWidth: 80 }}>Old Name:</Text>
                <Text delete>{change.oldValue || 'N/A'}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary" style={{ minWidth: 80 }}>New Name:</Text>
                <Text strong style={{ color: '#1890ff' }}>{change.newValue || 'N/A'}</Text>
              </div>
            </div>
          </Space>
        );

      case 'GITHUB_URLS_ADD':
        return (
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {commonDetails}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Text type="secondary">Added {change.githubUrls?.length || 0} file(s):</Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {change.githubUrls?.map((url: GithubUrl, idx: number) => (
                  <Tooltip key={idx} title={`${url.repoFullName} - ${url.branch}`}>
                    <Tag color="green" icon={<GithubOutlined />} style={{ cursor: 'pointer' }}>
                      {url.fileName || url.filePath.split('/').pop()}
                    </Tag>
                  </Tooltip>
                ))}
              </div>
            </div>
          </Space>
        );

      case 'GITHUB_URL_DELETE':
        return (
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {commonDetails}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Text type="secondary" style={{ color: '#ff4d4f' }}>Removed GitHub File:</Text>
              {change.githubUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GithubOutlined style={{ color: '#ff4d4f' }} />
                  <Text>{change.githubUrl.filePath}</Text>
                </div>
              )}
            </div>
          </Space>
        );

      case 'EXTERNAL_LINK_CREATE':
        const url = change.url || change.newValue?.url || change.oldValue?.url;
        const type = change.type || change.newValue?.type || change.oldValue?.type || 'unknown';
        const title = change.title || change.newValue?.title || change.oldValue?.title || 'Untitled';
        
        return (
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {commonDetails}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Title:</Text>
                <Text strong>{title}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Type:</Text>
                <Tag color="blue">{type}</Tag>
              </div>
              {url && isImageUrl(url) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Text type="secondary">Image:</Text>
                  <Image
                    width={200}
                    src={url}
                    alt={title}
                    style={{ borderRadius: 4, border: '1px solid #f0f0f0' }}
                    placeholder={
                      <div style={{ width: 200, height: 150, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PictureOutlined style={{ fontSize: 24, color: '#bfbfbf' }} />
                      </div>
                    }
                  />
                  <Text style={{ fontSize: '11px', color: '#8c8c8c', wordBreak: 'break-all' }}>
                    {url}
                  </Text>
                </div>
              ) : url && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary">URL:</Text>
                  <Text 
                    style={{ 
                      fontSize: '12px', 
                      color: '#1890ff',
                      wordBreak: 'break-all',
                      padding: '4px 8px',
                      background: '#f0f8ff',
                      borderRadius: 4,
                      border: '1px solid #d9e7ff'
                    }}
                  >
                    <LinkOutlined style={{ marginRight: 4 }} />
                    {url}
                  </Text>
                </div>
              )}
            </div>
          </Space>
        );

      case 'INPUT_CREATE':
        const inputName = change.inputName || change.newValue?.name || 'Unnamed';
        const componentType = change.componentType || change.newValue?.componentType || change.componentInfo?.componentType;
        const componentLabel = componentType ? getComponentTypeLabel(componentType) : 'Unknown';
        
        return (
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {commonDetails}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Input Name:</Text>
                <Text strong style={{ color: '#52c41a' }}>{inputName}</Text>
              </div>
              {componentType && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text type="secondary">Component Type:</Text>
                  <Tag color="cyan">{componentLabel}</Tag>
                  
                </div>
              )}
              {change.componentInfo?.label && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text type="secondary">Label:</Text>
                  <Text>{change.componentInfo.label}</Text>
                </div>
              )}
            </div>
          </Space>
        );

      case 'COMPONENT_INFO_UPDATE':
        const oldComponentType = change.oldValue?.componentType || change.oldComponentInfo?.componentType;
        const newComponentType = change.newValue?.componentType || change.newComponentInfo?.componentType;
        const oldComponentLabel = oldComponentType ? getComponentTypeLabel(oldComponentType) : 'N/A';
        const newComponentLabel = newComponentType ? getComponentTypeLabel(newComponentType) : 'N/A';
        const inputNameForUpdate = change.inputName || change.oldValue?.name || change.newValue?.name || 'Unknown';
        
        return (
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {commonDetails}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Input:</Text>
                <Text strong>{inputNameForUpdate}</Text>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <Text type="secondary">Old Type:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag>{oldComponentLabel}</Tag>
                 
                  </div>
                  {change.oldValue?.label && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">Old Label:</Text>
                      <div style={{ marginTop: 4, padding: 4, background: '#fafafa', borderRadius: 2 }}>
                        <Text style={{ fontSize: '12px' }}>{change.oldValue.label}</Text>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <Text type="secondary">New Type:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag color="blue">{newComponentLabel}</Tag>
                
                  </div>
                  {change.newValue?.label && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">New Label:</Text>
                      <div style={{ marginTop: 4, padding: 4, background: '#e6f7ff', borderRadius: 2 }}>
                        <Text strong style={{ fontSize: '12px' }}>{change.newValue.label}</Text>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Space>
        );

      case 'CANVAS_DUPLICATED_FROM':
        return (
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {commonDetails}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Copied from:</Text>
                <Tag color="purple">{change.duplicatedCanvasName || change.oldValue || 'Unknown Canvas'}</Tag>
              </div>
            </div>
          </Space>
        );

      case 'MANUAL_DESCRIPTION_CREATE':
      case 'MANUAL_DESCRIPTION_UPDATE':
        return (
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {commonDetails}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Input:</Text>
                <Text strong>{change.inputName || change.oldValue?.inputName || change.newValue?.inputName || 'Unknown'}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Event:</Text>
                <Tag color="orange">{change.oldValue?.event || change.newValue?.event || change.event || 'N/A'}</Tag>
              </div>
              {change.actionType === 'MANUAL_DESCRIPTION_UPDATE' && (
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary">Old Description:</Text>
                    <div style={{ marginTop: 4, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                      <Text style={{ fontSize: '12px' }}>{change.oldValue?.description || 'N/A'}</Text>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary">New Description:</Text>
                    <div style={{ marginTop: 4, padding: 8, background: '#e6f7ff', borderRadius: 4 }}>
                      <Text strong style={{ fontSize: '12px' }}>{change.newValue?.description || 'N/A'}</Text>
                    </div>
                  </div>
                </div>
              )}
              {change.actionType === 'MANUAL_DESCRIPTION_CREATE' && (change.manualDescriptionValue || change.newValue) && (
                <div>
                  <Text type="secondary">Description:</Text>
                  <div style={{ marginTop: 4, padding: 8, background: '#f6ffed', borderRadius: 4 }}>
                    <Text style={{ fontSize: '12px' }}>
                      {change.manualDescriptionValue?.description || change.newValue?.description || 'N/A'}
                    </Text>
                  </div>
                </div>
              )}
            </div>
          </Space>
        );

      case 'TEMPLATE_DESCRIPTION_CREATE':
      case 'TEMPLATE_DESCRIPTION_UPDATE':
        return (
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {commonDetails}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Input:</Text>
                <Text strong>{change.inputName || change.oldValue?.inputName || change.newValue?.inputName || 'Unknown'}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Total Templates:</Text>
                <Tag color="green">{change.newCount || change.totalCount || change.newValue?.length || change.oldValue?.length || 0}</Tag>
              </div>
              {(change.actionType === 'TEMPLATE_DESCRIPTION_CREATE' && change.templateDescriptions) && (
                <div>
                  <Text type="secondary">Templates:</Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {change.templateDescriptions.map((template: any, idx: number) => (
                      <Tag key={idx} color={template.check ? 'green' : 'default'} style={{ fontSize: '10px' }}>
                        {template.description || template.id}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Space>
        );

      case 'API_CALL_RELATION_UPDATE':
        return (
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {commonDetails}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">API:</Text>
                <Text strong>{change.oldValue?.apiName || change.newValue?.apiName || change.apiName || 'Unknown'}</Text>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <Text type="secondary">Old Event:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag>{change.oldValue?.event || 'N/A'}</Tag>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <Text type="secondary">New Event:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag color="blue">{change.newValue?.event || 'N/A'}</Tag>
                  </div>
                </div>
              </div>
              {change.oldValue?.description && change.newValue?.description && (
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary">Old Description:</Text>
                    <div style={{ marginTop: 4, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                      <Text style={{ fontSize: '12px' }}>{change.oldValue.description}</Text>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary">New Description:</Text>
                    <div style={{ marginTop: 4, padding: 8, background: '#e6f7ff', borderRadius: 4 }}>
                      <Text strong style={{ fontSize: '12px' }}>{change.newValue.description}</Text>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Space>
        );

      case 'DB_RELATION_CREATE':
      case 'DB_RELATION_UPDATE':
        return (
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {commonDetails}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Table:</Text>
                <Text strong>{change.tableName || change.oldValue?.tableName || change.newValue?.tableName || 'Unknown'}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Field:</Text>
                <Tag>{change.fieldName || change.oldValue?.fieldName || change.newValue?.fieldName || 'Unknown'}</Tag>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Action:</Text>
                <Tag color="purple">{change.action || change.oldValue?.action || change.newValue?.action || 'Unknown'}</Tag>
              </div>
              {change.description && (
                <div>
                  <Text type="secondary">Description:</Text>
                  <div style={{ marginTop: 4, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                    <Text style={{ fontSize: '12px' }}>{change.description}</Text>
                  </div>
                </div>
              )}
            </div>
          </Space>
        );

      case 'COLLECTION_CANVAS_ASSIGN':
        return (
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {commonDetails}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Input:</Text>
                <Text strong>{change.inputName || change.oldValue?.inputName || change.newValue?.inputName || 'Unknown'}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Collection:</Text>
                <Tag color="cyan">{change.newAssignment?.label || change.oldAssignment?.label || change.newValue?.label || change.oldValue?.label || 'Unknown'}</Tag>
              </div>
              {(change.newAssignment?.description || change.newValue?.description) && (
                <div>
                  <Text type="secondary">Description:</Text>
                  <div style={{ marginTop: 4, padding: 8, background: '#e6f7ff', borderRadius: 4 }}>
                    <Text style={{ fontSize: '12px' }}>
                      {change.newAssignment?.description || change.newValue?.description}
                    </Text>
                  </div>
                </div>
              )}
            </div>
          </Space>
        );

      case 'FORM_ACTION_CREATE':
      case 'FORM_ACTION_UPDATE':
        return (
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {commonDetails}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Input:</Text>
                <Text strong>{change.inputName || change.oldFormAction?.inputName || change.newFormAction?.inputName || change.oldValue?.inputName || change.newValue?.inputName || 'Unknown'}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Action:</Text>
                <Tag color="blue">{change.oldFormAction?.action || change.newFormAction?.action || change.oldValue?.action || change.newValue?.action || 'Unknown'}</Tag>
              </div>
              {(change.oldFormAction?.condition || change.newFormAction?.condition || change.oldValue?.condition || change.newValue?.condition) && (
                <div>
                  <Text type="secondary">Condition:</Text>
                  <div style={{ marginTop: 4, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                    <Text style={{ fontSize: '12px' }}>
                      {change.newFormAction?.condition || change.oldFormAction?.condition || change.newValue?.condition || change.oldValue?.condition || 'N/A'}
                    </Text>
                  </div>
                </div>
              )}
            </div>
          </Space>
        );

      default:
        return (
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {commonDetails}
            {change.oldValue !== undefined && change.oldValue !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">Old Value:</Text>
                <Text style={{ 
                  maxWidth: 200, 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  fontSize: '12px',
                  padding: '4px 8px',
                  background: '#fafafa',
                  borderRadius: 2
                }}>
                  {typeof change.oldValue === 'object' ? JSON.stringify(change.oldValue) : String(change.oldValue)}
                </Text>
              </div>
            )}
            {change.newValue !== undefined && change.newValue !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary">New Value:</Text>
                <Text strong style={{ 
                  maxWidth: 200, 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  fontSize: '12px',
                  padding: '4px 8px',
                  background: '#e6f7ff',
                  borderRadius: 2
                }}>
                  {typeof change.newValue === 'object' ? JSON.stringify(change.newValue) : String(change.newValue)}
                </Text>
              </div>
            )}
          </Space>
        );
    }
  };

  const handleCloseActionsDrawer = () => {
    setDrawerState({
      open: false,
      mode: "create",
      parentId: null,
      targetNode: null,
      targetGithubUrl: null,
    });
  };

  // Handle GitHub file creation
  const handleCreateGithubFile = async (
    parentId: string | null,
    payload: {
      repoId: string;
      repoFullName: string;
      branch: string;
      filePath: string;
      fileName?: string;
      targetNodePathName?: string;
    }
  ) => {
    if (!selectedUICanvasId) {
      message.error("No UI Canvas selected");
      return false;
    }
    
    try {
      const files = [{
        repoId: payload.repoId,
        repoFullName: payload.repoFullName,
        branch: payload.branch,
        filePath: payload.filePath,
        fileName: payload.fileName
      }];
      
      const result = await handleAddFiles(parentId, files);
      return result.length > 0;
    } catch (error: any) {
      console.error("Error creating GitHub file:", error);
      message.error(`Failed to create GitHub file: ${error.message}`);
      return false;
    }
  };

  // Handle GitHub file linking
  const handleLinkGithubFile = async (
    nodeId: string,
    payload: {
      repoId: string;
      repoFullName: string;
      branch: string;
      filePath: string;
      fileName?: string;
    }
  ) => {
    if (!selectedUICanvasId || !drawerState.targetGithubUrl) {
      message.error("No UI Canvas selected or GitHub URL not found");
      return false;
    }

    try {
      const existingIndex = findGithubUrlIndex(githubUrls, drawerState.targetGithubUrl);
      
      if (existingIndex !== -1) {
        const updatedGithubUrls = [...githubUrls];
        const oldUrl = { ...updatedGithubUrls[existingIndex] };
        const updatedUrl = {
          ...oldUrl,
          repoId: payload.repoId,
          repoFullName: payload.repoFullName,
          branch: payload.branch,
          filePath: payload.filePath,
          fileName: payload.fileName || payload.filePath.split('/').pop(),
          addedAt: oldUrl.addedAt
        };
        
        updatedGithubUrls[existingIndex] = updatedUrl;
        
        const githubId = createGithubId(updatedUrl.repoId, updatedUrl.filePath);
        const uiCanvasGithubUrlsRef = doc(db, 'ui_canvas_github_urls', selectedUICanvasId);

        await setDoc(uiCanvasGithubUrlsRef, {
          id: selectedUICanvasId,
          githubUrls: updatedGithubUrls,
          updated_at: serverTimestamp(),
          created_by: currentUserId
        }, { merge: true });

        await createGithubHistoryRecord({
          uiCanvasId: selectedUICanvasId,
          actionType: 'GITHUB_URL_UPDATE',
          fieldName: 'github_url',
          oldValue: oldUrl,
          newValue: updatedUrl,
          githubUrl: updatedUrl,
          timestamp: serverTimestamp(),
        });

        const crdRelationRef = doc(db, 'crd_relation_ui_canvas', githubId);
        await setDoc(crdRelationRef, {
          github_id: githubId,
          ui_canvas_id: selectedUICanvasId,
          repo_id: updatedUrl.repoId,
          repo_full_name: updatedUrl.repoFullName,
          branch: updatedUrl.branch,
          file_path: updatedUrl.filePath,
          file_name: updatedUrl.fileName,
          github_urls: [updatedUrl],
          updated_at: serverTimestamp(),
          created_by: currentUserId
        }, { merge: true });

        setGithubUrls(updatedGithubUrls);
        message.success("GitHub file updated successfully!");
        return true;
      } else {
        return await handleCreateGithubFile(null, payload);
      }
    } catch (error: any) {
      console.error("Error linking GitHub file:", error);
      message.error(`Failed to link GitHub file: ${error.message}`);
      return false;
    }
  };

  // Determine which data to display
  const displayGithubUrls = selectedUICanvasId ? githubUrls : (selectedUI?.githubUrls || []);
  const displayUICount = displayGithubUrls.length;

  return (
    <>
      <Card
        bodyStyle={{ padding: 16 }}
        style={{
          borderRadius: 8,
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Select
            showSearch
            value={selectedUICanvasId ?? ''}
            placeholder="Load template"
            onChange={onChangeUI}
            style={{ flex: "1", width: "100%" }}
            optionLabelProp="label"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {[...uiList].sort((a, b) => {
              const labelA = (a.label || '').toLowerCase();
              const labelB = (b.label || '').toLowerCase();
              return labelA.localeCompare(labelB);
            }).map((item) => (
              <Option
                key={item.id}
                value={item.id}
                label={item.label}
                className="group"
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {item.label}
                    {item.githubUrls && item.githubUrls.length > 0 && (
                      <Tag color="green" >
                        {item.githubUrls.length} GitHub
                      </Tag>
                    )}
                  </div>

                  <Button
                    size="small"
                    type="text"
                    icon={<EditOutlined />}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      openUIUpdateModal(item);
                    }}
                  />
                </div>
              </Option>
            ))}
          </Select>
          
          <Button
            type="primary"
            onClick={openUICreateModal}
          >
            <PlusCircleOutlined style={{ fontSize: "20px" }} />
          </Button>
          
          <Button
            type="primary"
            onClick={openHistoryDrawer}
            disabled={!selectedUICanvasId}
            title={!selectedUICanvasId ? "Select a UI Canvas to view history" : "View History"}
          >
            <HistoryOutlined style={{ fontSize: "20px" }} />
          </Button>

          <Button
            type="primary"
            onClick={handleGenerateAI}
            disabled={loading}
          >
            {loading ? <Spin size="small" /> : "AI"}
          </Button>

          <a
            href={selectedUICanvasId ? `/ui-canvas/preview/${selectedUICanvasId}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="ant-btn css-dev-only-do-not-override-mc1tut ant-btn-primary ant-btn-color-primary ant-btn-variant-solid"
            style={{
              pointerEvents: selectedUICanvasId ? 'auto' : 'none',
              opacity: selectedUICanvasId ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span className="ant-btn-icon">
              <ShareAltOutlined />
            </span>
          </a>

          <Button
            type="primary"
            onClick={() => setAddComponentDrawerOpen(true)}
            disabled={!selectedUICanvasId}
            title={!selectedUICanvasId ? "Please select a UI Canvas first" : "Add GitHub files"}
            style={{ position: 'relative' }}
          >
            <GithubOutlined style={{ fontSize: '20px' }} />
            {displayUICount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#1890ff',
                color: 'white',
                fontSize: '10px',
                minWidth: '16px',
                height: '16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px'
              }}>
                {displayUICount}
              </span>
            )}
          </Button>

          <Button
            icon={<CopyOutlined />}
            onClick={() => setIsOpenUICanvasDuplicateModal(true)}
            disabled={!selectedUI}
          >
            Duplicate
          </Button>

          <ExportUICanvasSelect
            data={selectedUI}
            targetRef={targetRef}
            showImportModal={showImportModal}
            setShowImportModal={setShowImportModal}
            importDPSFile={importDPSFile}
            handleImportCancel={handleImportCancel}
            setFileContent={setFileContent}
            importLoading={importLoading}
            currentProject={currentProject}
          />
        </div>

        {/* GitHub Files List Section */}
        {selectedUICanvasId && (
          <div style={{ marginTop: 16 }}>
            <Collapse
              bordered={false}
              expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
              style={{ background: '#fafafa' }}
              defaultActiveKey={['0']}
            >
              <Panel
                header={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GithubOutlined style={{ color: '#1890ff' }} />
                    <span>GitHub Files ({displayGithubUrls.length})</span>
                  </div>
                }
                key="1"
              >
                {displayGithubUrls.length > 0 ? (
                  <div>
                    <List
                      size="small"
                      dataSource={displayGithubUrls}
                      renderItem={(item) => (
                        <List.Item
                          key={`${item.repoId}-${item.filePath}-${item.addedAt}`}
                          style={{
                            borderBottom: '1px solid #f0f0f0',
                            padding: '12px 0'
                          }}
                        >
                          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <GithubOutlined style={{ color: '#1890ff' }} />
                                <Text
                                  style={{
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    color: '#1890ff',
                                    cursor: 'pointer',
                                    maxWidth: '400px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                  onClick={() => openViewDrawer(item)}
                                  title={`Click to view ${item.filePath}`}
                                >
                                  {item.filePath}
                                </Text>
                                <Tag color="blue" >{item.branch}</Tag>
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                  {new Date(item.addedAt).toLocaleDateString()}
                                </Text>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 24 }}>
                                <Text style={{ fontSize: '12px', color: '#595959' }}>
                                  Name: {item.fileName}
                                </Text>
                                {item.repoFullName && (
                                  <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                    Repo: {item.repoFullName}
                                  </Text>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => openViewDrawer(item)}
                                title="View Details"
                              />
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => openEditDrawer(item)}
                                title="Edit"
                              />
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteGithubUrl(item)}
                                title="Remove"
                              />
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No GitHub files added yet"
                    style={{ margin: '24px 0' }}
                  >
                    <Button
                      type="primary"
                      onClick={() => setAddComponentDrawerOpen(true)}
                    >
                      Add GitHub Files
                    </Button>
                  </Empty>
                )}
              </Panel>
            </Collapse>
          </div>
        )}
      </Card>

      {/* Modern History Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <HistoryOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>UI Canvas History</div>
                {uiData && (
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    {uiData.label} • {historyDocument?.allChanges?.length || 0} changes
                  </div>
                )}
              </div>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={closeHistoryDrawer}
              style={{ border: 'none' }}
            />
          </div>
        }
        placement="right"
        onClose={closeHistoryDrawer}
        open={historyDrawerOpen}
        width={800}
        styles={{
          header: { padding: '16px 24px', borderBottom: '1px solid #f0f0f0' },
          body: { padding: 0 }
        }}
      >
        {historyLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#8c8c8c' }}>Loading history...</div>
          </div>
        ) : historyError ? (
          <Alert
            message="History Not Available"
            description={historyError}
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ margin: '40px 24px' }}
          />
        ) : !historyDocument || !historyDocument.allChanges || historyDocument.allChanges.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No history records found for this UI Canvas"
            style={{ margin: '80px 0' }}
          />
        ) : (
          <div style={{ padding: '24px' }}>
            {/* Summary Stats */}
    

            {/* Filters/Search - Can be added later */}
            {/* <div style={{ marginBottom: 16 }}>
              <Input placeholder="Search changes..." prefix={<SearchOutlined />} />
            </div> */}

            {/* Timeline */}
            <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '8px' }}>
              <Timeline
                mode="left"
                style={{ marginTop: '16px' }}
              >
                {historyDocument.allChanges.map((change: any, index: number) => (
                  <Timeline.Item
                    key={index}
                    dot={
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${getActionTypeColor(change.actionType)} 0%, ${getActionTypeColor(change.actionType)}80 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px'
                      }}>
                        {getActionIcon(change.actionType)}
                      </div>
                    }
                    color={getActionTypeColor(change.actionType)}
                  >
                    <Card
                      size="small"
                      style={{
                        marginLeft: '16px',
                        marginBottom: '16px',
                        borderLeft: `3px solid ${getActionTypeColor(change.actionType)}`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      bodyStyle={{ padding: '16px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <Badge 
                              color={getActionTypeColor(change.actionType)} 
                              text={
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>
                                  {getActionTypeLabel(change.actionType)}
                                </span>
                              } 
                            />
                            {change.userName && (
                              <Tag  color="default" style={{ fontSize: '11px' }}>
                                {change.userName.split(' ')[0]}
                              </Tag>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '4px' }}>
                            {formatTimestamp(change.timestamp)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Change Details */}
                      {renderChangeDetails(change)}
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </div>
        )}
      </Drawer>

      <AddComponentFromGithubDrawer
        open={addComponentDrawerOpen}
        node={selectedNodeForAddComponent}
        onClose={() => {
          setAddComponentDrawerOpen(false);
          setSelectedNodeForAddComponent(null);
        }}
        onCreateCrdFromGithub={() => {
          console.log("CRD creation would be triggered here");
          return Promise.resolve();
        }}
        onCrdPreparing={() => {
          console.log("CRD preparation starting");
        }}
        onAddFiles={handleAddFiles}
      />

      <ActionsDrawer
        open={drawerState.open}
        mode={drawerState.mode}
        parentId={drawerState.parentId}
        contextNode={drawerState.targetNode}
        onClose={handleCloseActionsDrawer}
        onCreateGithubFile={handleCreateGithubFile}
        onLinkGithubFile={handleLinkGithubFile}
      />
    </>
  );
}