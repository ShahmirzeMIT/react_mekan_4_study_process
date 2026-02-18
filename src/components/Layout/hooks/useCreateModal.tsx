import {auth} from "@/config/firebase";
import {Form} from "antd";
import {useState} from "react";
import {useAuthState} from "react-firebase-hooks/auth";

const useCreateModal = () => {
      const [createProjectLoading, setCreateProjectLoading] = useState(false);
  const [createProjectModalVisible, setCreateProjectModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [user, loading] = useAuthState(auth);
 return {
    createProjectLoading,
    setCreateProjectLoading,
    createProjectModalVisible,
    setCreateProjectModalVisible,
    form,
    user,
    loading
 }

}

export default useCreateModal