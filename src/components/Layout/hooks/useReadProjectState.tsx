// hooks/useAuthState.ts
import {Project} from "@/types/project";
import {getAuth} from "firebase/auth";
import {useState} from "react";
import {useAuthState} from "react-firebase-hooks/auth";


export function useReadProjectState() {
  const auth = getAuth();
  const [user, loading, error] = useAuthState(auth);
  const [projects, setProjects] = useState<Project[]>([]);
  return {
    user,
    loading,
    error,
    auth,
    projects, setProjects
  };
}