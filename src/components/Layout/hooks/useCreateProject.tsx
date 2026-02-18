import {message,} from 'antd';
import {addDoc, arrayUnion, collection, doc, setDoc} from 'firebase/firestore';

import {generateProjectNumber} from '../actions/functions';
import {db} from '@/config/firebase';
import useCreateModal from './useCreateModal';

const useCreateProject = () => {
const {
    createProjectLoading,
    setCreateProjectLoading,
    createProjectModalVisible,
    setCreateProjectModalVisible,
    form,
    user,
    loading
 }= useCreateModal();
  const handleCreateProject = async (values) => {
    if (!user) {
      message.error("Please sign in to create a project");
      return;
    }

    setCreateProjectLoading(true);
    try {
      // Get current date and time
      const currentDate = new Date();
      const createdDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const createdTime = currentDate.toTimeString().split(' ')[0]; // HH:MM:SS format
      
      // Generate project number
      const projectNo = await generateProjectNumber();

      // Create the project document with additional fields
      const docRef = await addDoc(collection(db, "projects"), {
        name: values.name,
        project_name: values.name,
        userId: user.uid,
        created_by: user.uid,
        created_date: createdDate,
        created_time: createdTime,
        project_no: projectNo,
        status: 'A',
        createdAt: currentDate,
      });

      // Create a project_permissions document with project ID as document ID
      await setDoc(doc(db, "project_permissions", docRef.id), {
        user_list: [
          {
            uid: user.uid,
            created_at: new Date(),
            created_by: user.uid,
            permission_type: "admin",
          },
        ],
      });

      // Update user_permissions collection
      const userPermissionRef = doc(db, "user_permissions", user.uid);
      await setDoc(
        userPermissionRef,
        {
          project_list: arrayUnion(docRef.id),
        },
        { merge: true }
      );

      // Select the newly created project
      const newProject = {
        id: docRef.id,
        name: values.name,
        userId: user.uid,
        createdAt: currentDate,
      };
      
      // In a real app, you would dispatch to Redux here
      // dispatch(setCurrentProject(newProject));
      console.log("Project created:", newProject);

      message.success("Project created successfully!");
      setCreateProjectModalVisible(false);
      form.resetFields();
    } catch (e) {
      console.error("Error adding project: ", e);
      message.error("Error creating project: " + e.message);
    } finally {
      setCreateProjectLoading(false);
    }
  };

  return {
    createProjectLoading,
    createProjectModalVisible,
    setCreateProjectModalVisible,
    form,
    handleCreateProject
  };
};


export default useCreateProject