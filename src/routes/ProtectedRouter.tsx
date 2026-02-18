import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Spin } from "antd";
import React from "react";
import { useAuth } from "@/auth/AuthContext";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading, token } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || !token)) {
      const fullPath = location.pathname + location.search + location.hash;
      sessionStorage.setItem("redirectAfterLogin", fullPath);
    }
  }, [user, loading, token, location]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  // Add this condition to redirect from "/" to "/ui-editor"
  if (location.pathname === "/") {
    return <Navigate to="/ui-editor" replace />;
  }

  return children;
};

export default ProtectedRoute;