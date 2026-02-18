// hooks/useProjectManagement.ts
import {useEffect} from "react";
import { useSearchParams } from "react-router-dom";
import {collection, getDocs, orderBy, query} from "firebase/firestore";
import {db} from "@/config/firebase";
import {setCurrentProject, useAppDispatch, useAppSelector, clearProjectSelection} from "@/store";
import {useReadProjectState} from "./useReadProjectState";

export function useProjectManagement() {
  const dispatch = useAppDispatch();
  const { currentProject } = useAppSelector((state) => state.project);
  const [searchParams, setSearchParams] = useSearchParams();
const {
    user,
    projects, setProjects
  }=useReadProjectState()



  // Fetch projects from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchProjects = async () => {
      try {
        // 1. Fetch all projects ordered by createdAt
        const projectsQuery = query(
          collection(db, "projects"),
          orderBy("createdAt", "desc")
        );

        const projectSnapshots = await getDocs(projectsQuery);
        const allProjects = [];
        projectSnapshots.forEach((docSnap) => {
          const data = docSnap.data();
          allProjects.push({
            id: docSnap.id,
            name: data.name,
            userId: data.userId,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
          });
        });

        if (allProjects.length === 0) {
          setProjects([]);
          return;
        }

        // 2. Fetch project_permissions to check user access
        const permissionsSnapshots = await getDocs(collection(db, "project_permissions"));

        const allowedProjectIds = [];
        permissionsSnapshots.forEach((permissionDoc) => {
          const permissionData = permissionDoc.data();

          if (Array.isArray(permissionData.user_list)) {
            const hasAccess = permissionData.user_list.some(
              (userObj) => userObj.uid === user.uid
            );

            if (hasAccess) {
              allowedProjectIds.push(permissionDoc.id); // project_permissions docId = projectId
            }
          }
        });

        // 3. Filter only the projects that are in allowedProjectIds
        const filteredProjects = allProjects.filter((project) =>
          allowedProjectIds.includes(project.id)
        );

        setProjects(filteredProjects);

        // 4. Try to restore project from localStorage first, then auto-select the first project if none is selected
        if (filteredProjects.length > 0) {
          if (!currentProject) {
            // Try to load from localStorage first
            const savedProject = localStorage.getItem("currentProject");
            if (savedProject) {
              try {
                const project: any = JSON.parse(savedProject);
                // Check if the saved project exists in the filtered projects
                const foundProject = filteredProjects.find(p => p.id === project.id);
                if (foundProject) {
                  dispatch(setCurrentProject(foundProject));
                  return; // Exit early if we found and set the saved project
                } else {
                  // Saved project doesn't exist in filtered projects, remove it from localStorage
                  localStorage.removeItem("currentProject");
                }
              } catch (e) {
                console.error("Failed to parse saved project:", e);
                localStorage.removeItem("currentProject");
              }
            }
            // If no saved project or saved project not found, select the first project
            dispatch(setCurrentProject(filteredProjects[0]));
          } else {
            // If currentProject exists, verify it's still in the filtered projects
            const projectStillExists = filteredProjects.find(p => p.id === currentProject.id);
            if (!projectStillExists) {
              // Current project no longer exists, try to restore from localStorage or select first
              const savedProject = localStorage.getItem("currentProject");
              if (savedProject) {
                try {
                  const project: any = JSON.parse(savedProject);
                  const foundProject = filteredProjects.find(p => p.id === project.id);
                  if (foundProject) {
                    dispatch(setCurrentProject(foundProject));
                  } else {
                    // Saved project doesn't exist, select first
                    dispatch(setCurrentProject(filteredProjects[0]));
                  }
                } catch (e) {
                  console.error("Failed to parse saved project:", e);
                  localStorage.removeItem("currentProject");
                  dispatch(setCurrentProject(filteredProjects[0]));
                }
              } else {
                // No saved project, select first
                dispatch(setCurrentProject(filteredProjects[0]));
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      }
    };

    fetchProjects();
  }, [user, currentProject, dispatch, setProjects]);

  const selectProject = (projectId: string) => {
    const selected = projects.find((project) => project.id === projectId);
    if (selected) {
      // If URL contains a db param, reset it and clear stored selection for this project
      if (searchParams.get("db")) {
        const next = new URLSearchParams(searchParams);
        next.delete("db");
        setSearchParams(next);
        localStorage.removeItem("dbId");
      }
      dispatch(setCurrentProject(selected));
    }
  };

  return {
    projects,
    currentProject,
    selectProject
  };
}