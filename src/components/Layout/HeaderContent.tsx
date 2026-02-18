import React, {useRef, useState, useEffect} from 'react';
import {Avatar, Button, Dropdown, message, Tooltip, Typography, Menu} from 'antd';
import {ImportOutlined, MenuOutlined, UserOutlined, LogoutOutlined, CloudUploadOutlined, FileZipOutlined, DownloadOutlined, DoubleLeftOutlined, DoubleRightOutlined, MoonOutlined, SunOutlined} from '@ant-design/icons';
import Logo from '@/assets/images/Logo.png';
import {useSelector} from 'react-redux';
import {RootState} from '@/store';
import {toast} from 'sonner';
import axios from 'axios';
import {useUserContext} from '@/components/Layout/hooks/useUserContext';
import {useNavigationContext} from '@/components/Layout/hooks/useNavigationContext';
import {useNotifications} from '@/components/Layout/hooks/useNotifications';


const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const { Text } = Typography;

// Updated API call function to handle file uploads
export const callApiWithToken = async (url: string, params?: any, isFileUpload = false) => {
    try {
        const token = localStorage.getItem("token");
        
        let config = {
            headers: {
                "Authorization": `Bearer ${token}`,
            }
        };

        let response;

        if (isFileUpload) {
            // For file uploads, use FormData and multipart/form-data
            config.headers["Content-Type"] = "multipart/form-data";
            response = await axios.post(BASE_URL + `/api${url}`, params, config);
        } else {
            // For regular JSON requests
            config.headers["Content-Type"] = "application/json";
            response = await axios.post(BASE_URL + `/api${url}`, params, config);
        }
        
        return response.data;

    } catch (error: any) {
        console.log('API Error:', error);
        if (error.response?.status === 403) {
            window.location.href = '/login';
            localStorage.removeItem("token");
        }
        toast.error(error.response?.data?.error || "An error occurred");
        return error.response?.data || {error: "Unknown error"};
    }
};

const HeaderContent = ({ 
  isMobile, 
  appTheme, 
  setTheme, 
  setDrawerVisible,
  projectSelector,
  sidebarCollapsed,
  setSidebarCollapsed 
}) => {
  const { currentProject } = useSelector((state: RootState) => state.project);
  const { users } = useSelector((state: RootState) => state.auth);
  const fileInputRef = useRef(null);
  const { logout, user } = useUserContext();
  const { navigate } = useNavigationContext();
  
  // Get user info
  const userData = user || JSON.parse(localStorage.getItem('userData') || '{}');
  const currentUserFromStore = users?.find((u: any) => u.uid === userData?.uid);
  const photoURL = currentUserFromStore?.photoURL || userData?.photoURL || null;
  const displayName = userData?.displayName || userData?.email?.split('@')[0] || 'User';
  const email = userData?.email || '';

  



  const toggleSidebar = () => {
    const newCollapsedState = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsedState);
    // Save to localStorage
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsedState));
  };

  const handleProfileMenuClick = async ({ key }: { key: string }) => {
    if (key === 'logout') {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('Logout failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        sessionStorage.removeItem('redirectAfterLogin');
        navigate('/login');
      }
    } else if (key === 'profile') {
      navigate('/profile');
    }
  };

  const profileMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  return (
    <div style={{ 
      padding: isMobile ? '0 16px' : '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: appTheme === 'dark' ? '#001529' : '#fff',
      borderBottom: '1px solid #f0f0f0',
      height: '64px',
      minHeight: '64px'
    }}>
      {/* Left Section - Logo and Title */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: isMobile ? '12px' : '16px',
        flex: 1,
        minWidth: 0 // Important for text truncation
      }}>
        {/* NEW: Sidebar Collapse Toggle - Desktop only */}
        {!isMobile && (
          <Tooltip title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
            <Button
              type="text"
              icon={sidebarCollapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
              onClick={toggleSidebar}
              style={{
                color: appTheme === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.85)',
                padding: 0,
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}
            />
          </Tooltip>
        )}
        
      

        {/* Title */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          // marginLeft: '14px'
        }}>
          <Text 
            style={{
              fontSize: '22px',
              fontWeight: 300,
              color: appTheme === 'dark' ? '#fff' : '#000',
              lineHeight: 1.2,
              margin: 0,
              fontFamily: '"TT Fors Light", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}
          >
             <span style={{ fontSize: '14px', fontWeight: 400, color: appTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)', marginLeft: '8px' }}>Beta</span>
          </Text>
        </div>

      
      </div>

      {/* Right Section - Actions */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? '8px' : '16px',
        flexShrink: 0
      }}>
        {/* Mobile Menu Button */}
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setDrawerVisible(true)}
            style={{
              color: appTheme === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.85)'
            }}
          />
        )}

        {/* User Info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          marginRight: isMobile ? '8px' : '0',
        }}>
          <Text 
            strong
            style={{
              fontSize: '14px',
              lineHeight: '20px',
              color: appTheme === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.85)',
              margin: 0,
            }}
          >
            {displayName}
          </Text>
          <Text 
            style={{
              fontSize: '12px',
              lineHeight: '16px',
              color: appTheme === 'dark' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.45)',
              margin: 0,
            }}
          >
            {email}
          </Text>
        </div>

        {/* User Avatar with Dropdown */}
        <Dropdown
          menu={{
            items: profileMenuItems,
            onClick: handleProfileMenuClick,
          }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Avatar 
            src={photoURL}
            icon={<UserOutlined />}
            style={{
              backgroundColor: photoURL ? 'transparent' : (appTheme === 'dark' ? '#1890ff' : '#f56a00'),
              cursor: 'pointer'
            }}
          />
        </Dropdown>


      </div>
    </div>
  );
};

export default HeaderContent;