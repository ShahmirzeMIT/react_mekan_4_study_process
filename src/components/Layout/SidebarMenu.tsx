import React from 'react';
import { Drawer, Menu } from 'antd';
import {
  AppstoreOutlined,
  BuildOutlined,
  UserOutlined,
  BookOutlined,
  FormOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { SubMenu } = Menu;

// Map module_id to Ant Design icons
const iconMap: Record<string, React.ReactNode> = {
'sinif-yarat':<BookOutlined/>
};

// Default icon for unknown modules (won't be used)
const DefaultIcon = <AppstoreOutlined />;

// Interface for menu item
interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: MenuItem[];
}

const SidebarMenu = ({
  isMobile,
  drawerVisible,
  setDrawerVisible,
  appTheme,
  activeKey,
}: {
  isMobile: boolean;
  drawerVisible: boolean;
  setDrawerVisible: (visible: boolean) => void;
  appTheme: string;
  activeKey: string;
}) => {
  const navigate = useNavigate();

  // Static menu items - only the ones we want
  const menuItems: MenuItem[] = [
    {
      key: "dashboard",
      icon: <AppstoreOutlined />,
      label: "DashBoard",
    },
    {
      key: "sinif-yarat",
      icon: <BookOutlined />,
      label: "Sinif Yarat",
    },
    {   
      key: "şagird-icazeleri",
      icon:<UserOutlined/>,
      label: "Şagird Icazələri",
    },
        {   
      key: "test-hazirla",
      icon:<FormOutlined/>,
      label: "Test Hazirla",
    },
      {   
      key: "test-icazələri",
      icon:<UnlockOutlined/>,
      label: "Test İcazələri",
    }

  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(`/${key}`);

    if (isMobile) {
      setDrawerVisible(false);
    }
  };

  // Recursive function to render menu items
  const renderMenuItems = (items: MenuItem[]) =>
    items.map((item) => {
      if (item.children && item.children.length > 0) {
        return (
          <SubMenu
            key={item.key}
            icon={item.icon}
            title={<span>{item.label}</span>}
          >
            {renderMenuItems(item.children)}
          </SubMenu>
        );
      }

      return (
        <Menu.Item
          key={item.key}
          icon={item.icon}
        >
          <span>{item.label}</span>
        </Menu.Item>
      );
    });

  const menuContent = (
    <Menu
      mode="inline"
      selectedKeys={[activeKey]}
      style={{
        height: '100%',
        borderRight: 0,
        background: appTheme === 'dark' ? '#001529' : '#fff',
      }}
      onClick={handleMenuClick}
    >
      {renderMenuItems(menuItems)}
    </Menu>
  );

  if (isMobile) {
    return (
      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        bodyStyle={{ padding: 0 }}
      >
        {menuContent}
      </Drawer>
    );
  }

  return menuContent;
};

export default SidebarMenu;