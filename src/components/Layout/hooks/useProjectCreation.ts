// hooks/useProjectCreation.ts
import {useState} from "react";
import {Form, message} from "antd";
import {useAuthState} from "react-firebase-hooks/auth";
import {getAuth} from "firebase/auth";
import {
  addDoc, 
  arrayUnion, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  where
} from "firebase/firestore";
import {db} from "@/config/firebase";
import {setCurrentProject, useAppDispatch} from "@/store";
import {Project} from "@/store/slices/type";
import {generateProjectNumber} from "../actions/functions";

export function useProjectCreation() {
  const [createProjectModalVisible, setCreateProjectModalVisible] = useState(false);
  const [createProjectLoading, setCreateProjectLoading] = useState(false);
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const auth = getAuth();
  const [user] = useAuthState(auth);

  // Check if user has project creation access
  const checkProjectCreationAccess = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const projectAccessRef = doc(db, "project_create_access", user.uid);
      const projectAccessDoc = await getDoc(projectAccessRef);
      
      return projectAccessDoc.exists();
    } catch (error) {
      console.error("Error checking project creation access:", error);
      return false;
    }
  };

  // Get enabled features from project_default_modules - ONLY ACTIVE STATUS
  const getEnabledFeatures = async (): Promise<string[]> => {
    try {
      const defaultModulesCollection = collection(db, 'project_default_modules');
      
      // Query to get only ACTIVE modules sorted by created_at
      const q = query(
        defaultModulesCollection, 
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Collect all module IDs from ACTIVE documents
        const moduleIds: string[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.module_id && data.status === 'active') {
            moduleIds.push(data.module_id);
          }
        });
        
        
        
        // Remove duplicates and return
        return [...new Set(moduleIds)];
      }
      
      // Return default features if no active configuration found
      console.log("No active modules found in project_default_modules, using defaults");
      return ['business-canvas', 'crd-tree'];
    } catch (error) {
      console.error("Error getting enabled features from project_default_modules:", error);
      return ['business-canvas', 'crd-tree']; // Default fallback
    }
  };

  // Create project module permissions
  const createProjectModulePermissions = async (projectId: string, enabledFeatures: string[]) => {
    try {
      const modulePermissionDocRef = doc(db, "project_module_permission", projectId);
      
      const modules: any = {};
      enabledFeatures.forEach(featureKey => {
        modules[featureKey] = {
          enabled: true,
          expireDate: null
        };
      });

      await setDoc(modulePermissionDocRef, {
        created_date: serverTimestamp(),
        modules: modules,
        projectId: projectId,
        updated_by: user?.uid || 'system',
        updated_date: serverTimestamp()
      });

      console.log(`Created module permissions for project ${projectId} with ${enabledFeatures.length} active features`);
    } catch (error) {
      console.error("Error creating project module permissions:", error);
      throw error;
    }
  };

  // Create user page access - FIXED: Preserve existing entries
  const createUserPageAccess = async (projectId: string, enabledFeatures: string[]) => {
    if (!user) return;

    try {
      const userPageAccessDocRef = doc(db, "user_page_access", user.uid);
      
      // Get current user page access if exists
      let currentUserAccess: any = {
        createdAt: serverTimestamp(),
        uid: user.uid,
        updatedAt: serverTimestamp(),
        userEmail: user.email || user.uid,
        _list: []
      };

      try {
        const userAccessDoc = await getDoc(userPageAccessDocRef);
        if (userAccessDoc.exists()) {
          currentUserAccess = userAccessDoc.data();
        }
      } catch (error) {
        console.log(`No existing user page access for user ${user.uid}`);
      }

      // Get existing _list or create empty array
      const existingList = currentUserAccess._list || [];
      
      // Remove ONLY the entries for this specific project (not all entries)
      const filteredList = existingList.filter((item: any) => item.projectId !== projectId);
      
      // Add logout entry (always present for this project)
      const logoutEntry = {
        accessType: 'admin',
        createdAt: new Date().toISOString(),
        pageId: 'logout',
        projectId: projectId
      };

      // Add enabled features entries for this project (only active ones)
      const featureEntries = enabledFeatures.map(featureKey => ({
        accessType: 'admin',
        createdAt: new Date().toISOString(),
        pageId: featureKey,
        projectId: projectId
      }));

      // Combine: existing entries from other projects + new entries for this project
      const updatedList = [
        ...filteredList,  // Keep all entries from other projects
        logoutEntry,      // Add logout for this project
        ...featureEntries // Add ACTIVE features for this project
      ];

      // Update user page access document
      await setDoc(userPageAccessDocRef, {
        ...currentUserAccess,
        _list: updatedList,
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log(`Updated user page access for user ${user.uid}. Added ${featureEntries.length + 1} entries for project ${projectId} (${featureEntries.length} active modules), preserved ${filteredList.length} existing entries from other projects`);
    } catch (error) {
      console.error("Error creating user page access:", error);
      throw error;
    }
  };

  const showCreateProjectModal = async () => {
    if (!user) {
      message.error("Please sign in to create a project");
      return;
    }

    // Check if user has project creation access
    const hasAccess = await checkProjectCreationAccess();
    if (!hasAccess) {
      message.error("You don't have permission to create projects. Please contact administrator.");
      return;
    }

    setCreateProjectModalVisible(true);
  };

  const handleCreateProject = async (values: { name: string }) => {
    if (!user) {
      message.error("Please sign in to create a project");
      return;
    }

    // Double-check access before creating project
    const hasAccess = await checkProjectCreationAccess();
    if (!hasAccess) {
      message.error("You don't have permission to create projects. Please contact administrator.");
      return;
    }

    setCreateProjectLoading(true);
    try {
      // Get enabled features from project_default_modules - ONLY ACTIVE
      const enabledFeatures = await getEnabledFeatures();
  

      
      const currentDate = new Date();
      const createdDate = currentDate.toISOString().split('T')[0];
      const createdTime = currentDate.toTimeString().split(' ')[0];
      const projectNo = await generateProjectNumber();

      // Create project document
      const docRef = await addDoc(collection(db, "projects"), {
        name: values.name,
        project_name: values.name,
        userId: user.uid,
        created_by: user.uid,
        created_date: createdDate,
        created_time: createdTime,
        project_no: projectNo,
        digital_service_json: JSON.stringify({}),
        database_json: JSON.stringify({}),
        status: 'A',
        createdAt: currentDate,
      });

      const projectId = docRef.id;

      // Create project permissions
      await setDoc(doc(db, "project_permissions", projectId), {
        user_list: [
          {
            uid: user.uid,
            created_at: new Date(),
            created_by: user.uid,
            permission_type: "admin",
          },
        ],
      });

      // Update user permissions
      const userPermissionRef = doc(db, "user_permissions", user.uid);
      await setDoc(
        userPermissionRef,
        {
          project_list: arrayUnion(projectId),
        },
        { merge: true }
      );

      // Create project module permissions (only for active modules)
      await createProjectModulePermissions(projectId, enabledFeatures);

      // Create user page access (only for active modules)
      await createUserPageAccess(projectId, enabledFeatures);

      const newProject: Project = {
        id: projectId,
        name: values.name,
        userId: user.uid,
        createdAt: currentDate,
      };
      
      dispatch(setCurrentProject(newProject));
      message.success(`Project created successfully with ${enabledFeatures.length} active modules!`);
      setCreateProjectModalVisible(false);
      form.resetFields();
    } catch (e: any) {
      console.error("Error adding project: ", e);
      message.error("Error creating project: " + e.message);
    } finally {
      setCreateProjectLoading(false);
    }
  };

  const handleCancelCreateProject = () => {
    setCreateProjectModalVisible(false);
    form.resetFields();
  };

  return {
    createProjectModalVisible,
    createProjectLoading,
    form,
    showCreateProjectModal,
    handleCreateProject,
    handleCancelCreateProject,
    checkProjectCreationAccess
  };
}