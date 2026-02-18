import { Button, Card, Select, Spin, List, Tag, Collapse, Empty, message, Typography, Drawer, Timeline, Descriptions, Badge, Space } from "antd";
import { CopyOutlined, EditOutlined, GithubOutlined, PlusCircleOutlined, ShareAltOutlined, LinkOutlined, FileOutlined, CaretRightOutlined, DeleteOutlined, EyeOutlined, HistoryOutlined, CloseOutlined } from "@ant-design/icons";
import React, { useState, useCallback, useEffect, useRef } from "react";
import ExportAPICanvasSelect from "@/components/api-canvas/ExportAPICanvasSelect.tsx";
import { db } from "@/config/firebase";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot, deleteDoc, serverTimestamp, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import AddComponentFromGithubDrawer from "@/ui-canvas/crd_tree_canvas/actions/AddComponentFromGithubDrawer";
import { TreeNode } from "@/ui-canvas/crd_tree_canvas/actions/treeNode";
import ActionsDrawer from "@/ui-canvas/crd_tree_canvas/actions/ActionsDrawer";
const { Option } = Select;
const { Panel } = Collapse;
const { Text, Title } = Typography;

interface GithubUrl {
  repoId: string;
  repoFullName: string;
  branch: string;
  filePath: string;
  fileName?: string;
  addedAt: string;
  parentId: string | null;
}

interface APICanvasData {
  id: string;
  name: string;
  config?: {
    method: string;
    filePath: string;
    localUrl: string;
    localHeader: string;
  };
  input?: Array<{
    name: string;
    description: string;
  }>;
  operation?: Array<{
    type: string;
    description: string;
  }>;
  output?: any[];
  projectId: string;
  requestBody?: string;
  responseBody?: string;
  type: string;
  githubUrls?: GithubUrl[];
  [key: string]: any;
}

export interface ActionsDrawerState {
  open: boolean;
  mode: any;
  parentId: string | null;
  targetNode: TreeNode | null;
  targetGithubUrl?: GithubUrl | null;
}

// History interfaces
interface HistoryRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  actionType: string;
  fieldName: string;
  oldValue?: any;
  newValue?: any;
  apiCanvasId: string;
  apiCanvasName?: string;
  githubUrl?: GithubUrl;
  timestamp: any;
}

interface HistoryDocument {
  apiCanvasId: string;
  apiCanvasName: string;
  createdAt: any;
  updatedAt: any;
  allChanges: HistoryRecord[];
  [key: string]: any;
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

// Helper function to find unique GitHub URL by combination of repoId, filePath, and addedAt
const findGithubUrlIndex = (githubUrls: GithubUrl[], urlToFind: GithubUrl): number => {
  return githubUrls.findIndex(url =>
    url.repoId === urlToFind.repoId &&
    url.filePath === urlToFind.filePath &&
    url.addedAt === urlToFind.addedAt
  );
};

// History drawer component
interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  historyRecords: HistoryRecord[];
  loading: boolean;
  apiCanvasName?: string;
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ 
  open, 
  onClose, 
  historyRecords, 
  loading,
  apiCanvasName 
}) => {
  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'GITHUB_FILE_ADD':
        return 'green';
      case 'GITHUB_FILE_DELETE':
        return 'red';
      case 'GITHUB_FILE_UPDATE':
        return 'blue';
      case 'API_CANVAS_UPDATE':
        return 'purple';
      case 'API_CANVAS_IMPORT':
        return 'orange';
      case 'API_CANVAS_CREATE':
        return 'cyan';
      default:
        return 'gray';
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    switch (actionType) {
      case 'GITHUB_FILE_ADD':
        return 'GitHub File Added';
      case 'GITHUB_FILE_DELETE':
        return 'GitHub File Removed';
      case 'GITHUB_FILE_UPDATE':
        return 'GitHub File Updated';
      case 'API_CANVAS_UPDATE':
        return 'API Canvas Updated';
      case 'API_CANVAS_IMPORT':
        return 'API Canvas Imported';
      case 'API_CANVAS_CREATE':
        return 'API Canvas Created';
      default:
        return actionType.replace(/_/g, ' ');
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    if (timestamp.toDate) {
      const date = timestamp.toDate();
      return date.toLocaleString();
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString();
    }
    return 'Invalid date';
  };

  const renderValue = (value: any) => {
    if (value === null || value === undefined) return 'None';
    if (typeof value === 'object') {
      return (
        <div style={{ maxHeight: '150px', overflowY: 'auto', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
          <pre style={{ margin: 0, fontSize: '12px' }}>
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      );
    }
    return String(value);
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>Change History</Title>
            {apiCanvasName && (
              <Text type="secondary">{apiCanvasName}</Text>
            )}
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
          />
        </div>
      }
      width={600}
      open={open}
      onClose={onClose}
      closable={false}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading history...</div>
        </div>
      ) : historyRecords.length === 0 ? (
        <Empty
          description="No history records found"
          style={{ margin: '40px 0' }}
        />
      ) : (
        <Timeline
          mode="left"
          items={historyRecords.map((record, index) => ({
            key: record.id,
            color: getActionTypeColor(record.actionType),
            children: (
              <div style={{ padding: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <Badge 
                      color={getActionTypeColor(record.actionType)} 
                      text={
                        <Text strong style={{ fontSize: '14px' }}>
                          {getActionTypeLabel(record.actionType)}
                        </Text>
                      } 
                    />
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        by {record.userName} ({record.userEmail})
                      </Text>
                    </div>
                  </div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {formatTimestamp(record.timestamp)}
                  </Text>
                </div>

                {record.fieldName && (
                  <div style={{ margin: '8px 0' }}>
                    <Text strong>Field: </Text>
                    <Tag color="blue">{record.fieldName}</Tag>
                  </div>
                )}

                {record.githubUrl && (
                  <Descriptions 
                    size="small" 
                    column={1} 
                    style={{ margin: '8px 0', background: '#fafafa', padding: '8px', borderRadius: '4px' }}
                  >
                    <Descriptions.Item label="Repository">
                      {record.githubUrl.repoFullName}
                    </Descriptions.Item>
                    <Descriptions.Item label="File Path">
                      {record.githubUrl.filePath}
                    </Descriptions.Item>
                    <Descriptions.Item label="Branch">
                      {record.githubUrl.branch}
                    </Descriptions.Item>
                  </Descriptions>
                )}

                {record.oldValue !== undefined && (
                  <div style={{ margin: '8px 0' }}>
                    <Text strong type="secondary">Old Value:</Text>
                    <div style={{ marginTop: 4 }}>
                      {renderValue(record.oldValue)}
                    </div>
                  </div>
                )}

                {record.newValue !== undefined && (
                  <div style={{ margin: '8px 0' }}>
                    <Text strong type="success">New Value:</Text>
                    <div style={{ marginTop: 4 }}>
                      {renderValue(record.newValue)}
                    </div>
                  </div>
                )}

                {index < historyRecords.length - 1 && (
                  <div style={{ height: '1px', background: '#f0f0f0', margin: '16px 0' }} />
                )}
              </div>
            ),
          }))}
        />
      )}
    </Drawer>
  );
};

export default function CrudApiEndPoint({
  endpoints,
  selectedEndpoint,
  handleEndpointChange,
  getMethodColor,
  targetRef,
  setIsDrawerVisible,
  setIsCopyEndpointModalVisible,
  setIsEditEndpointModalVisible,
  setIsExportCanvasModalVisible
}) {
  const [drawerState, setDrawerState] = useState<ActionsDrawerState>(initialState);
  const currentProject = useSelector((state: RootState) => state.project.currentProject);
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [fileContent, setFileContent] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [addComponentDrawerOpen, setAddComponentDrawerOpen] = useState<boolean>(false);
  const [selectedNodeForAddComponent, setSelectedNodeForAddComponent] = useState<TreeNode | null>(null);
  const [githubUrls, setGithubUrls] = useState<GithubUrl[]>([]);
  const [apiData, setApiData] = useState<APICanvasData | null>(null);
  const currentUserData = JSON.parse(localStorage.getItem("userData") || "{}");
  const currentUserId = currentUserData?.uid;

  // History state
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Use refs to track previous values
  const prevSelectedEndpointIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Function to create history record for API Canvas
  const createApiHistoryRecord = async (
    actionType: string,
    fieldName: string,
    oldValue: any,
    newValue: any,
    apiCanvasId: string,
    additionalData?: {
      apiCanvasName?: string;
      githubUrl?: GithubUrl;
    }
  ) => {
    try {
      if (!currentUserId || !apiCanvasId) {
        console.warn("No user or API Canvas ID for history record");
        return;
      }

      const historyRecord: HistoryRecord = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: currentUserId,
        userName: currentUserData?.name || currentUserData?.email || 'Unknown User',
        userEmail: currentUserData?.email || 'Unknown Email',
        actionType,
        fieldName,
        oldValue,
        newValue,
        apiCanvasId,
        apiCanvasName: additionalData?.apiCanvasName,
        githubUrl: additionalData?.githubUrl,
        timestamp: new Date().toISOString(), // Use ISO string for array
      };

      const historyDocRef = doc(db, 'api_canvas_history', apiCanvasId);
      const existingDoc = await getDoc(historyDocRef);
      
      if (existingDoc.exists()) {
        const existingData = existingDoc.data() as HistoryDocument;
        const existingChanges = existingData.allChanges || [];
        
        // Create updated changes array
        const updatedChanges = [historyRecord, ...existingChanges].slice(0, 100);
        
        // Create update data object
        const updateData: any = {
          apiCanvasId: apiCanvasId,
          apiCanvasName: additionalData?.apiCanvasName || apiData?.name || 'Unknown API Canvas',
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
          apiCanvasId: apiCanvasId,
          apiCanvasName: additionalData?.apiCanvasName || apiData?.name || 'Unknown API Canvas',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          allChanges: [historyRecord],
          [`${actionType.toLowerCase()}_records`]: [historyRecord],
        });
      }
      
      console.log(`API Canvas history record created: ${actionType}`);
    } catch (error) {
      console.error('Error creating API Canvas history record:', error);
    }
  };

  // Function to load history records
  const loadHistoryRecords = async (apiCanvasId: string) => {
    if (!apiCanvasId) {
      setHistoryRecords([]);
      return;
    }

    setLoadingHistory(true);
    try {
      const historyDocRef = doc(db, 'api_canvas_history', apiCanvasId);
      const historyDoc = await getDoc(historyDocRef);
      
      if (historyDoc.exists()) {
        const data = historyDoc.data() as HistoryDocument;
        // Sort by timestamp descending (newest first)
        const sortedRecords = (data.allChanges || [])
          .sort((a, b) => {
            const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
            const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
            return timeB - timeA;
          });
        setHistoryRecords(sortedRecords);
      } else {
        setHistoryRecords([]);
      }
    } catch (error) {
      console.error('Error loading history records:', error);
      message.error('Failed to load history');
      setHistoryRecords([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Main useEffect for Firestore listener
  useEffect(() => {
    // Cleanup previous listener if exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!selectedEndpoint?.id) {
      setGithubUrls([]);
      setApiData(null);
      prevSelectedEndpointIdRef.current = null;
      return;
    }

    // Set up new listener for api_canvas_github_urls collection
    prevSelectedEndpointIdRef.current = selectedEndpoint.id;

    const unsubscribe = onSnapshot(
      doc(db, 'api_canvas_github_urls', selectedEndpoint.id),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as any;
          console.log('API Canvas Firestore data received:', data);
          console.log('githubUrls count:', data.githubUrls?.length || 0);

          setApiData({
            ...data,
            id: selectedEndpoint.id,
            name: data.name || selectedEndpoint.name || ''
          });
          setGithubUrls(data.githubUrls || []);
        } else {
          console.log('No api_canvas_github_urls document found');
          setApiData(null);
          setGithubUrls([]);
        }
      },
      (error) => {
        console.error("Error listening to API Canvas changes:", error);
        setGithubUrls([]);
        setApiData(null);
      }
    );

    unsubscribeRef.current = unsubscribe;

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [selectedEndpoint?.id]);

  // Sync from selectedEndpoint prop - only update if we don't have selectedEndpoint.id
  useEffect(() => {
    if (!selectedEndpoint?.id && selectedEndpoint) {
      setGithubUrls(selectedEndpoint.githubUrls || []);
      setApiData(selectedEndpoint);
    }
  }, [selectedEndpoint]);

  // Handle deleting a GitHub URL with history
  const handleDeleteGithubUrl = async (githubUrl: GithubUrl) => {
    if (!selectedEndpoint?.id) {
      message.error("No API Endpoint selected");
      return;
    }

    try {
      // Create history record before deletion
      await createApiHistoryRecord(
        'GITHUB_FILE_DELETE',
        'github_url',
        githubUrl,
        null,
        selectedEndpoint.id,
        {
          apiCanvasName: selectedEndpoint.name,
          githubUrl: githubUrl
        }
      );

      // Remove from api_canvas_github_urls collection
      const apiCanvasGithubUrlsRef = doc(db, 'api_canvas_github_urls', selectedEndpoint.id);

      // Get current document to verify
      const currentDoc = await getDoc(apiCanvasGithubUrlsRef);
      if (!currentDoc.exists()) {
        message.error("Document not found");
        return;
      }

      const currentData = currentDoc.data();
      const currentGithubUrls = currentData.githubUrls || [];

      // Find the exact URL to remove
      const urlIndex = findGithubUrlIndex(currentGithubUrls, githubUrl);

      if (urlIndex === -1) {
        message.error("GitHub URL not found");
        return;
      }

      // Create new array without the removed item
      const updatedGithubUrls = [...currentGithubUrls];
      updatedGithubUrls.splice(urlIndex, 1);

      // Update api_canvas_github_urls collection
      await updateDoc(apiCanvasGithubUrlsRef, {
        githubUrls: updatedGithubUrls,
        updated_at: new Date().toISOString()
      });

      // Also update the main api_canvas document
      const apiCanvasRef = doc(db, "api_canvas", selectedEndpoint.id);
      await updateDoc(apiCanvasRef, {
        githubUrls: updatedGithubUrls,
        updated_at: new Date().toISOString()
      });

      // Also delete from crd_relation_api_canvas if it exists
      const githubId = createGithubId(githubUrl.repoId, githubUrl.filePath);
      const crd_relation_api_canvasRef = doc(db, 'crd_relation_api_canvas', githubId);

      try {
        const crdDoc = await getDoc(crd_relation_api_canvasRef);
        if (crdDoc.exists()) {
          const crdData = crdDoc.data();
          // Only delete if this is the only API Canvas reference
          if (crdData.api_canvas_id === selectedEndpoint.id) {
            await deleteDoc(crd_relation_api_canvasRef);
          }
        }
      } catch (crdError) {
        console.warn("Error deleting from crd_relation_api_canvas:", crdError);
      }

      message.success("GitHub file removed successfully");
    } catch (error: any) {
      console.error("Error deleting GitHub URL:", error);
      message.error(`Failed to delete: ${error.message}`);
    }
  };

  // Create a stable callback function for adding files with history
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
    console.log("Adding files from GitHub:", { parentId, files });

    if (!selectedEndpoint?.id) {
      message.error("No API Endpoint selected. Please select an API Endpoint first.");
      return [];
    }

    try {
      // Create GitHub URL objects
      const newGithubUrls = files.map(file => ({
        repoId: file.repoId,
        repoFullName: file.repoFullName,
        branch: file.branch,
        filePath: file.filePath,
        fileName: file.fileName || file.filePath.split('/').pop(),
        addedAt: new Date().toISOString(),
        parentId: parentId || null
      }));

      // Get current document from api_canvas_github_urls collection
      const apiCanvasGithubUrlsRef = doc(db, 'api_canvas_github_urls', selectedEndpoint.id);
      const currentDoc = await getDoc(apiCanvasGithubUrlsRef);

      let existingGithubUrls: GithubUrl[] = [];
      if (currentDoc.exists()) {
        const currentData = currentDoc.data();
        existingGithubUrls = currentData.githubUrls || [];
      }

      // Check for duplicates
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

      // Create history records for each new file
      for (const newUrl of uniqueNewUrls) {
        await createApiHistoryRecord(
          'GITHUB_FILE_ADD',
          'github_url',
          null,
          newUrl,
          selectedEndpoint.id,
          {
            apiCanvasName: selectedEndpoint.name,
            githubUrl: newUrl
          }
        );
      }

      // Combine existing and new URLs
      const allGithubUrls = [...existingGithubUrls, ...uniqueNewUrls];

      // Update the main api_canvas document
      const apiCanvasRef = doc(db, "api_canvas", selectedEndpoint.id);
      await updateDoc(apiCanvasRef, {
        githubUrls: allGithubUrls,
        updated_at: new Date().toISOString()
      });

      // Update api_canvas_github_urls collection
      await setDoc(apiCanvasGithubUrlsRef, {
        id: selectedEndpoint.id,
        name: selectedEndpoint.name || '',
        githubUrls: allGithubUrls,
        updated_at: new Date().toISOString(),
        created_by: currentUserId
      }, { merge: true });

      // Create documents in crd_relation_api_canvas for each GitHub URL
      for (const url of uniqueNewUrls) {
        const githubId = createGithubId(url.repoId, url.filePath);
        console.log(`Creating crd_relation_api_canvas document with ID: ${githubId}`);

        const crd_relation_api_canvasRef = doc(db, 'crd_relation_api_canvas', githubId);

        await setDoc(crd_relation_api_canvasRef, {
          github_id: githubId,
          api_canvas_id: selectedEndpoint.id,
          api_canvas_name: selectedEndpoint.name || '',
          repo_id: url.repoId,
          repo_full_name: url.repoFullName,
          branch: url.branch,
          file_path: url.filePath,
          file_name: url.fileName,
          created_at: url.addedAt,
          updated_at: new Date().toISOString(),
          created_by: currentUserId
        }, { merge: true });

        console.log(`Created crd_relation_api_canvas document for githubId: ${githubId}`);
      }

      message.success(`Added ${uniqueNewUrls.length} file(s) successfully`);
      return uniqueNewUrls.map(url => `github-${url.repoId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

    } catch (error: any) {
      console.error("Error adding GitHub files to API Canvas:", error);
      message.error(`Failed to add GitHub files: ${error.message}`);
      return [];
    }
  }, [selectedEndpoint?.id, currentUserId, createApiHistoryRecord]);

  // Import function with history
  const importDPSFile = async () => {
    if (!fileContent || !currentProject?.id) {
      message.error('No file content or project selected');
      return;
    }

    setImportLoading(true);
    try {
      const apiCanvasId = fileContent.id;
      const apiCanvasName = fileContent.name || fileContent.label || 'Imported API Endpoint';

      if (!apiCanvasId) {
        message.error('Invalid .dps file: Missing API Canvas ID');
        return;
      }

      const projectRef = doc(db, 'projects', currentProject.id);
      const projectDoc = await getDoc(projectRef);

      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        let digitalServiceJson = {};

        try {
          if (projectData.api_json) {
            digitalServiceJson = typeof projectData.api_json === 'string'
              ? JSON.parse(projectData.api_json)
              : projectData.api_json;
          }
        } catch (error) {
          console.error('Error parsing existing api_json:', error);
          digitalServiceJson = {};
        }

        digitalServiceJson[apiCanvasId] = apiCanvasName;

        await updateDoc(projectRef, {
          api_json: JSON.stringify(digitalServiceJson)
        });
      }

      // Create history record for import
      await createApiHistoryRecord(
        'API_CANVAS_IMPORT',
        'api_canvas',
        null,
        {
          id: apiCanvasId,
          name: apiCanvasName,
          githubUrlsCount: fileContent.githubUrls?.length || 0
        },
        apiCanvasId,
        {
          apiCanvasName: apiCanvasName
        }
      );

      const apiCanvasGithubUrlsRef = doc(db, 'api_canvas_github_urls', apiCanvasId);

      // Also save to api_canvas_github_urls collection
      await setDoc(apiCanvasGithubUrlsRef, {
        id: apiCanvasId,
        name: apiCanvasName,
        githubUrls: fileContent.githubUrls || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: currentUserId
      });

      console.log('API Canvas imported successfully:', apiCanvasId);
      message.success(`API Endpoint "${apiCanvasName}" imported successfully!`);

      setShowImportModal(false);
      setFileContent(null);

      if (handleEndpointChange) {
        handleEndpointChange(apiCanvasId);
      }

    } catch (error: any) {
      console.error('Error importing .dps file:', error);
      message.error(`Failed to import API Endpoint: ${error.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportCancel = () => {
    setShowImportModal(false);
    setFileContent(null);
  };

  // Function to convert GithubUrl to TreeNode
  const convertToTreeNode = (githubUrl: GithubUrl): TreeNode => {
    const fileName = githubUrl.fileName || githubUrl.filePath.split('/').pop() || 'Unnamed File';

    return {
      id: `github-${githubUrl.repoId}-${githubUrl.filePath}-${githubUrl.addedAt}`,
      name: fileName,
      type: "file" as const,
      canvasType: "api" as const,
      githubRepoId: githubUrl.repoId,
      githubRepoFullName: githubUrl.repoFullName,
      githubBranch: githubUrl.branch,
      githubPath: githubUrl.filePath,
      pathName: githubUrl.filePath,
      fileName: fileName,
      children: [],
      isOpen: false,
      canvasId: selectedEndpoint?.id || '',
      canvasName: apiData?.name || '',
      externalPath: undefined,
      externalRepoFullName: undefined,
      externalBranch: undefined,
      collectionIds: []
    };
  };

  // Function to open view drawer for a GitHub file
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

  // Function to open edit drawer for a GitHub file
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

  const handleCloseActionsDrawer = () => {
    setDrawerState({
      open: false,
      mode: "create",
      parentId: null,
      targetNode: null,
      targetGithubUrl: null,
    });
  };

  // Handle GitHub file creation (from ActionsDrawer) with history
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
    console.log("Creating GitHub file:", payload);

    if (!selectedEndpoint?.id) {
      message.error("No API Endpoint selected");
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

  // Handle GitHub file linking (from ActionsDrawer) with history
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
    if (!selectedEndpoint?.id || !drawerState.targetGithubUrl) {
      message.error("No API Endpoint selected or GitHub URL not found");
      return false;
    }

    console.log("handleLinkGithubFile called with:", {
      nodeId,
      payload,
      selectedEndpointId: selectedEndpoint.id,
      currentUserId,
      githubUrlsCount: githubUrls.length,
      targetGithubUrl: drawerState.targetGithubUrl
    });

    try {
      // Find the existing githubUrl
      const existingIndex = findGithubUrlIndex(githubUrls, drawerState.targetGithubUrl);

      console.log("Existing index found:", existingIndex);

      if (existingIndex !== -1) {
        // Create history record for update
        await createApiHistoryRecord(
          'GITHUB_FILE_UPDATE',
          'github_url',
          drawerState.targetGithubUrl,
          {
            ...drawerState.targetGithubUrl,
            repoId: payload.repoId,
            repoFullName: payload.repoFullName,
            branch: payload.branch,
            filePath: payload.filePath,
            fileName: payload.fileName || payload.filePath.split('/').pop()
          },
          selectedEndpoint.id,
          {
            apiCanvasName: selectedEndpoint.name,
            githubUrl: drawerState.targetGithubUrl
          }
        );

        // Create updated githubUrls array
        const updatedGithubUrls = [...githubUrls];
        const updatedUrl = {
          ...updatedGithubUrls[existingIndex],
          repoId: payload.repoId,
          repoFullName: payload.repoFullName,
          branch: payload.branch,
          filePath: payload.filePath,
          fileName: payload.fileName || payload.filePath.split('/').pop(),
          addedAt: updatedGithubUrls[existingIndex].addedAt // Keep original addedAt
        };

        updatedGithubUrls[existingIndex] = updatedUrl;

        // Update in Firestore
        const githubId = createGithubId(updatedUrl.repoId, updatedUrl.filePath);

        // Update main api_canvas document
        const apiCanvasRef = doc(db, "api_canvas", selectedEndpoint.id);
        await updateDoc(apiCanvasRef, {
          githubUrls: updatedGithubUrls,
          updated_at: new Date().toISOString()
        });

        // Update api_canvas_github_urls collection
        const apiCanvasGithubUrlsRef = doc(db, 'api_canvas_github_urls', selectedEndpoint.id);
        await setDoc(apiCanvasGithubUrlsRef, {
          id: selectedEndpoint.id,
          name: selectedEndpoint.name || '',
          githubUrls: updatedGithubUrls,
          updated_at: new Date().toISOString(),
          created_by: currentUserId
        }, { merge: true });

        // Update crd_relation_api_canvas
        const crd_relation_api_canvasRef = doc(db, 'crd_relation_api_canvas', githubId);
        await setDoc(crd_relation_api_canvasRef, {
          github_id: githubId,
          api_canvas_id: selectedEndpoint.id,
          api_canvas_name: selectedEndpoint.name || '',
          repo_id: updatedUrl.repoId,
          repo_full_name: updatedUrl.repoFullName,
          branch: updatedUrl.branch,
          file_path: updatedUrl.filePath,
          file_name: updatedUrl.fileName,
          updated_at: new Date().toISOString(),
          created_by: currentUserId
        }, { merge: true });

        // Update local state
        setGithubUrls(updatedGithubUrls);

        message.success("GitHub file updated successfully!");
        return true;
      } else {
        console.log("GitHub URL not found in existing list, creating new entry");
        return await handleCreateGithubFile(null, payload);
      }
    } catch (error: any) {
      console.error("Error linking GitHub file:", error);
      message.error(`Failed to link GitHub file: ${error.message}`);
      return false;
    }
  };

  // Function to open history drawer
  const openHistoryDrawer = async () => {
    if (!selectedEndpoint?.id) {
      message.warning("Please select an API Endpoint first");
      return;
    }

    setHistoryDrawerOpen(true);
    await loadHistoryRecords(selectedEndpoint.id);
  };

  // Close history drawer
  const closeHistoryDrawer = () => {
    setHistoryDrawerOpen(false);
    setHistoryRecords([]);
  };

  // Determine which data to display
  const displayGithubUrls = selectedEndpoint?.id ? githubUrls : (selectedEndpoint?.githubUrls || []);
  const displayApiCount = displayGithubUrls.length;

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
            style={{ flex: 1 }}
            placeholder="Select API Endpoint"
            value={selectedEndpoint?.id}
            onChange={handleEndpointChange}
            optionLabelProp="label"
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          >
            {[...endpoints].sort((a, b) => {
              const nameA = (a.name || '').toLowerCase();
              const nameB = (b.name || '').toLowerCase();
              return nameA.localeCompare(nameB);
            }).map((endpoint) => (
              <Option
                key={endpoint.id}
                value={endpoint.id}
                label={endpoint.name}
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
                    {endpoint.name}
                    {endpoint.githubUrls && endpoint.githubUrls.length > 0 && (
                      <Tag color="green" size="small">
                        {endpoint.githubUrls.length} GitHub
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
                      setIsEditEndpointModalVisible(true);
                    }}
                  />
                </div>
              </Option>
            ))}
          </Select>

          <Button
            type="primary"
            onClick={() => setIsDrawerVisible(true)}
          >
            <PlusCircleOutlined style={{ fontSize: "20px" }} />
          </Button>

          <a
            href={selectedEndpoint?.id ? `/api-canvas/preview/${selectedEndpoint.id}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="ant-btn css-dev-only-do-not-override-mc1tut ant-btn-primary ant-btn-color-primary ant-btn-variant-solid"
            style={{
              pointerEvents: selectedEndpoint?.id ? 'auto' : 'none',
              opacity: selectedEndpoint?.id ? 1 : 0.5,
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
            disabled={!selectedEndpoint?.id}
            title={!selectedEndpoint?.id ? "Please select an API Endpoint first" : "Add GitHub files"}
            style={{ position: 'relative' }}
          >
            <GithubOutlined style={{ fontSize: '20px' }} />
            {displayApiCount > 0 && (
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
                {displayApiCount}
              </span>
            )}
          </Button>

          {/* History Button */}
          <Button
            type="primary"
            onClick={openHistoryDrawer}
            disabled={!selectedEndpoint?.id}
            title={!selectedEndpoint?.id ? "Select an API Endpoint to view history" : "View History"}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <HistoryOutlined />
          </Button>

          <Button
            icon={<CopyOutlined />}
            onClick={() => setIsCopyEndpointModalVisible(true)}
            disabled={!selectedEndpoint}
          >
            Duplicate
          </Button>

          <ExportAPICanvasSelect
            data={selectedEndpoint}
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
        {selectedEndpoint?.id && (
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
                      renderItem={(item, index) => (
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
                                <Tag color="blue" size="small">{item.branch}</Tag>
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

      {/* History Drawer */}
      <HistoryDrawer
        open={historyDrawerOpen}
        onClose={closeHistoryDrawer}
        historyRecords={historyRecords}
        loading={loadingHistory}
        apiCanvasName={selectedEndpoint?.name}
      />
    </>
  );
}