import React from 'react';
import { Drawer, List, Typography, Button, Space, Tag, Empty, Spin } from 'antd';
import { CheckOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Notification } from '../hooks/useNotifications';
import { useProjectManagement } from '../hooks/useProjectManagement';

const { Text, Title } = Typography;

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  loading: boolean;
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  open,
  onClose,
  notifications,
  loading,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const navigate = useNavigate();
  const unreadNotifications = notifications.filter((n) => !n.read);
  const unreadCount = unreadNotifications.length;
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onNotificationClick(notification);
  };

  const handleShowAll = () => {
    onClose();
    navigate('/notifications');
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
      return 'Unknown';
    }
  };
  const { projects } = useProjectManagement();

  const getProjectName = (id: string) => {
    if (!id) return
    return projects.find(item => item.id === id).name
  }
  return (
    <Drawer
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>
            Notifications
          </Title>

        </div>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      extra={
        <div className='flex flex-col'>
          <Button type="link" onClick={handleShowAll}>
            Show All Notifications
          </Button>
          {unreadCount > 0 && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={onMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}

        </div>
      }
    >
      {
        loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }} >
            <Spin size="large" />
          </div >
        ) : unreadNotifications.length === 0 ? (
          <Empty description="No unread notifications" />
        ) : (
          <List
            dataSource={unreadNotifications}
            renderItem={(notification) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  backgroundColor: '#f0f7ff',
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '4px',
                  border: '1px solid #1890ff',
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <div className='flex items-start flex-col'>
                        <Text strong>{notification.title}</Text>
                        <Tag color='lime'>
                          {getProjectName(notification.projectId)}
                        </Tag>
                      </div>
                      <Tag color="blue" icon={<CheckOutlined />}>
                        New
                      </Tag>

                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: '4px' }}>{notification.message}</div>
                      {notification.repoFullName && (
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          <strong>Repo:</strong> {notification.repoFullName}
                        </div>
                      )}
                      {(notification.description || notification.body) && (
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', marginTop: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                          <strong>Description:</strong> {notification.description || notification.body}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {formatDate(notification.createdAt)}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
    </Drawer >
  );
};

export default NotificationDrawer;

