// components/MenuItems.tsx
import React from "react";
import {
    ApiOutlined,
    AppstoreOutlined,
    BranchesOutlined,
    BuildOutlined,
    ClusterOutlined,
    CodeOutlined,
    DatabaseOutlined,
    EditOutlined,
    GithubOutlined,
    LogoutOutlined,
    MessageOutlined,
    ProjectOutlined,
    RobotOutlined,
    UnorderedListOutlined,
    UserOutlined,
    NodeIndexOutlined,
    ProductOutlined,
    FundProjectionScreenOutlined
} from "@ant-design/icons";

export type MenuItem = {
  key: string;
  icon: React.ReactNode;
  label: string;
};

export const menuItems: MenuItem[] = [
  { key: "ui-canvas", icon: <AppstoreOutlined />, label: "UI Canvas" },
  { key: "ui-editor", icon: <BuildOutlined />, label: "UI Editor" },
  { key: "db", icon: <DatabaseOutlined />, label: "Database" },
  { key: "api", icon: <ApiOutlined />, label: "API Canvas" },
  { key: "flow", icon: <BranchesOutlined />, label: "Flow Designer" },
  { key: "backlog", icon: <ProjectOutlined />, label: "Backlog" },
  { key: "code-builder", icon: <CodeOutlined />, label: "Code Builder" },
  { key: "github-action", icon: <GithubOutlined />, label: "Canvas-Git Actions" },
  { key: "discuss", icon: <MessageOutlined />, label: "Discuss" },
  { key: "google-gemini", icon: <RobotOutlined />, label: "Google Gemini" }, // <-- Google Gemini Menu
  { key: "mermaid-converter", icon: <ClusterOutlined />, label: "Mermaid Converter" }, // <-- Mermaid Converter Menu
  { key: "merdeio-editor", icon: <EditOutlined />, label: "Merdeio Editor" }, // <-- NEW Merdeio Editor Menu
  {key: "crd-tree", icon: <NodeIndexOutlined/>, label: "CRD Tree"}, // <-- NEW MENU ITEM
  { key: "user-managment", icon: <UnorderedListOutlined />, label: "User Management" },
  { key: "profile", icon: <UserOutlined />, label: "Profile" },
  { key: "logout", icon: <LogoutOutlined />, label: "Logout" },
  { key: "product-features-canvas", icon: <ProductOutlined />, label: "Product Features Canvas" },
  { key: "project-dashboard", icon: <FundProjectionScreenOutlined />, label: "Project Dashboard" },
];

export const getActiveKey = (pathname: string): string => {
  // Remove leading slash and split path
  const cleanPath = pathname.replace(/^\//, '').replace(/\/$/, '');
  const pathParts = cleanPath.split("/");
  
  // Handle nested routes (e.g., settings/github-repositories)
  if (pathParts.length > 1) {
    const nestedKey = pathParts.join("/");
    // Check if nested key exists in menu items (for settings submenus)
    if (menuItems.some((item) => item.key === nestedKey)) {
      return nestedKey;
    }
    // Return parent key for nested routes (e.g., "settings" for "settings/github-repositories")
    return pathParts[0];
  }
  
  // For single-level routes, get the last part
  const path = pathParts[0] || "";
  
  // Route to SidebarMenu key mapping
  // Maps router path to SidebarMenu key
  const routeToMenuKeyMap: Record<string, string> = {
    "": "ui-canvas",
    "ui": "ui-canvas",
    "ui-canvas": "ui-canvas",
    "ui-editor": "ui-editor",
    "db": "db",
    "api": "api",
    "api-testing": "api-testing",
    "monetization": "monetization",
    "flow": "flow",
    "data-flow": "data-flow",
    "user-managment": "user-managment",
    "mermaid-convertor": "mermaid-convertor",
    "merdeio-editor": "merdeio-editor",
    "discuss": "discuss",
    "code-builder": "code-builder",
    "github-action": "github-action",
    "sprint": "sprint", // Main sprint page
    "sprint-management": "sprint-management", // This is under performance-management in sidebar
    "backlog": "backlog-canvas", // Router has "backlog" but sidebar has "backlog-canvas"
    "backlog-canvas": "backlog-canvas",
    "business-canvas": "business-canvas",
    "crd-tree": "crd-tree",
    "calendar": "calendar",
    "dashboard": "dashboard",
    "collection": "collection",
    "import": "import",
    "performance-management": "performance-management",
    "performance-management2": "performance-management2",
    "pm-dataflow": "pm-dataflow",
    "settings": "settings",
  };
  
  // Check route map first
  if (routeToMenuKeyMap[path]) {
    return routeToMenuKeyMap[path];
  }
  
  // Fallback: check if path exists in menuItems
  const exists = menuItems.some((item) => item.key === path);
  if (exists) {
    return path;
  }
  
  // Default to ui-canvas
  return "ui-canvas";
};
