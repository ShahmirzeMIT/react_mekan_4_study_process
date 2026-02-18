import {useMobileDetection} from "../hooks/useMobileDetection";
import {useAppTheme} from "../hooks/useAppTheme";
import {useProjectManagement} from "../hooks/useProjectManagement";
import {useProjectCreation} from "../hooks/useProjectCreation";
import ProjectSelector from "../ProjectSelector";
import {useLocalStorageProject} from "../hooks/useLocalStorageProject";
import {getActiveKey, menuItems} from "../hooks/MenuItems";
import {useNavigationContext} from "../hooks/useNavigationContext";
import {useUserContext} from "../hooks/useUserContext";


export function useMainLayoutActions() {
  // Import contexts from dedicated hooks
  const { navigate, location } = useNavigationContext();
  const { user, loading, auth } = useUserContext();
  
  const isMobile = useMobileDetection();
  const { appTheme, setTheme, defaultAlgorithm, darkAlgorithm } = useAppTheme();
  const { projects, currentProject, selectProject } = useProjectManagement();
  const {
    createProjectModalVisible,
    createProjectLoading,
    form,
    showCreateProjectModal,
    handleCreateProject,
    handleCancelCreateProject
  } = useProjectCreation();
  
  useLocalStorageProject();

  const handleMenuClick = (key: string) => {
    if (key === "logout") {
      auth.signOut();
      console.log("Logout clicked");
    } else if (key === "profile") {
      console.log("Profile clicked");
    } else {
      navigate(key);
    }
  };

  const projectSelector = (
    <ProjectSelector
      projects={projects}
      currentProject={currentProject}
      onSelectProject={selectProject}
      onCreateProject={showCreateProjectModal}
      handleCancelCreateProject={handleCancelCreateProject}
      form={form}
      createProjectModalVisible={createProjectModalVisible}
      createProjectLoading={createProjectLoading}
      handleCreateProject={handleCreateProject}
    />
  );

  return {
    theme: { defaultAlgorithm, darkAlgorithm },
    appTheme,
    setTheme,
    isMobile,
    menuItems,
    handleMenuClick,
    getActiveKey: () => getActiveKey(location.pathname),
    projectSelector,
    currentProject,
    projects,
    handleCreateProject: showCreateProjectModal,
    user,
    loading,
  };
}

export default useMainLayoutActions;