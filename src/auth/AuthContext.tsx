import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { callApi } from "@/utils/callApi";
import { message } from "antd";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  logout: () => Promise<void>;
  logoutLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
  logout: async () => {},
  logoutLoading: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Logout function
  const logout = async () => {
    setLogoutLoading(true);
    try {
      // First sign out from Firebase
      await signOut(auth);
      
      // Then call your backend logout API if user exists
      if (user?.uid) {
        try {
          const response = await callApi("/auth/log-out", {
            uid: user.uid
          });
          
          if (response.success) {
            message.success("Backend logout successful");
          }
        } catch (apiError) {
          console.error("Backend logout failed:", apiError);
        }
      }
      
    } catch (error) {
      console.error("Firebase logout error:", error);
    } finally {
      // Always clear local state and storage
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      sessionStorage.removeItem("redirectAfterLogin");
      setLogoutLoading(false);
    }
  };

  // Check token validity
  const isTokenValid = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      return Date.now() < expirationTime - 60000; // 1 minute buffer
    } catch {
      return false;
    }
  };

  // Refresh token function
  const refreshToken = async (firebaseUser: User): Promise<string> => {
    try {
      const newToken = await firebaseUser.getIdToken(true);
      localStorage.setItem("token", newToken);
      return newToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw error;
    }
  };

  // Auth state and token setup
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    let unsubscribe: () => void;

    const initializeAuth = async () => {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            setUser(firebaseUser);
            
            let idToken = await firebaseUser.getIdToken();
            
            if (!isTokenValid(idToken)) {
              idToken = await refreshToken(firebaseUser);
            }
            
            setToken(idToken);
            localStorage.setItem("token", idToken);

            // Set up token refresh interval
            refreshInterval = setInterval(async () => {
              try {
                const newToken = await refreshToken(firebaseUser);
                setToken(newToken);
              } catch (error) {
                console.error("Auto token refresh failed:", error);
                await logout();
              }
            }, 55 * 60 * 1000);

          } else {
            // User signed out
            setUser(null);
            setToken(null);
            localStorage.removeItem("token");
            if (refreshInterval) clearInterval(refreshInterval);
          }
        } catch (error) {
          console.error("Auth state change error:", error);
          setUser(null);
          setToken(null);
          localStorage.removeItem("token");
        } finally {
          setLoading(false);
        }
      });
    };

    initializeAuth();

    return () => {
      if (unsubscribe) unsubscribe();
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  const value = {
    user,
    loading,
    token,
    logout,
    logoutLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};