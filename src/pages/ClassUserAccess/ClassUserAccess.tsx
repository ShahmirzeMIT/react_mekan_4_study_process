import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Modal,
  message,
  Table,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Select,
  Tag,
  Layout,
  Divider,
  Drawer,
  Badge,
  List,
  Avatar,
  Checkbox,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  BookOutlined,
  UserOutlined,
  TeamOutlined,
  ReloadOutlined,
  SwapOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  setDoc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { callApiWithToken } from '@/utils/callApi';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

// Collection names with platform_ prefix
const COLLECTIONS = {
  CLASSES: 'platform_classes',
  CLASS_USER_ACCESS: 'platform_class_users'
};

// Main Component
export const ClassUserAccess = () => {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [accessList, setAccessList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [classSearch, setClassSearch] = useState('');

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch classes from Firestore
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch all access data
  useEffect(() => {
    fetchAllAccess();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await callApiWithToken('/get-auth/users');
      
      if (response.status === 200) {
        const usersData = response.users.map(user => ({
          ...user,
          key: user.uid,
          label: user.displayName || user.email || 'No Name',
          value: user.uid
        }));
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('İstifadəçilər yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const classesRef = collection(db, COLLECTIONS.CLASSES);
      const q = query(classesRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const classesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          key: doc.id,
          label: doc.data().name || 'Unnamed Class',
          value: doc.id
        }));
        setClasses(classesData);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching classes:', error);
      message.error('Siniflər yüklənərkən xəta baş verdi');
    }
  };

  const fetchAllAccess = async () => {
    try {
      const accessRef = collection(db, COLLECTIONS.CLASS_USER_ACCESS);
      const q = query(accessRef);
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const accessData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          key: doc.id
        }));
        setAccessList(accessData);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching access list:', error);
      message.error('İcazə siyahısı yüklənərkən xəta baş verdi');
    }
  };

  const handleUserChange = async (userId) => {
    setSelectedUserId(userId);
    
    if (userId) {
      try {
        const userClassRef = doc(db, COLLECTIONS.CLASS_USER_ACCESS, userId);
        const userClassSnap = await getDoc(userClassRef);
        
        if (userClassSnap.exists()) {
          const data = userClassSnap.data();
          setSelectedClassIds(data.classes || []);
        } else {
          setSelectedClassIds([]);
        }
      } catch (error) {
        console.error('Error fetching user classes:', error);
        message.error('İstifadəçi sinifləri yüklənərkən xəta baş verdi');
      }
    } else {
      setSelectedClassIds([]);
    }
  };

  const handleSaveUserClasses = async () => {
    if (!selectedUserId) {
      message.warning('Zəhmət olmasa bir istifadəçi seçin');
      return;
    }

    try {
      setLoading(true);
      
      const selectedUser = users.find(u => u.uid === selectedUserId);
      const userClassRef = doc(db, COLLECTIONS.CLASS_USER_ACCESS, selectedUserId);
      
      // Check if document exists
      const docSnap = await getDoc(userClassRef);
      
      const data = {
        classes: selectedClassIds,
        updatedAt: Timestamp.now(),
        userEmail: selectedUser?.email,
        userDisplayName: selectedUser?.displayName || '',
        userPhotoURL: selectedUser?.photoURL || ''
      };

      if (docSnap.exists()) {
        await updateDoc(userClassRef, {
          ...data,
          updatedAt: Timestamp.now()
        });
      } else {
        await setDoc(userClassRef, {
          ...data,
          createdAt: Timestamp.now(),
          uid: selectedUserId
        });
      }

      message.success('İstifadəçi sinifləri uğurla yeniləndi');
    } catch (error) {
      console.error('Error saving user classes:', error);
      message.error('Xəta baş verdi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter users for dropdown
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Filter classes for multiselect
  const filteredClasses = classes.filter(cls => 
    cls.name?.toLowerCase().includes(classSearch.toLowerCase()) ||
    cls.grade?.toLowerCase().includes(classSearch.toLowerCase()) ||
    cls.subject?.toLowerCase().includes(classSearch.toLowerCase())
  );

  // Access Table Columns
  const accessColumns = [
    {
      title: 'İstifadəçi',
      dataIndex: 'userDisplayName',
      key: 'userDisplayName',
      render: (text, record) => (
        <Space>
          <Avatar 
            src={record.userPhotoURL} 
            icon={!record.userPhotoURL && <UserOutlined />}
            size="small"
          />
          <Text strong>{text || record.userEmail || 'Adsız İstifadəçi'}</Text>
        </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: 'userEmail',
      key: 'userEmail',
      render: (email) => email || '-'
    },
    {
      title: 'UID',
      dataIndex: 'uid',
      key: 'uid',
      render: (uid) => <Text copyable={{ text: uid }}>{uid.substring(0, 12)}...</Text>
    },
    {
      title: 'İcazə Verilən Siniflər',
      dataIndex: 'classes',
      key: 'classes',
      render: (classIds) => {
        if (!classIds || classIds.length === 0) {
          return <Tag color="red">İcazə yoxdur</Tag>;
        }
        
        const classNames = classIds.map(id => {
          const cls = classes.find(c => c.id === id);
          return cls?.name || id.substring(0, 8);
        });

        return (
          <Space wrap>
            {classNames.map((name, index) => (
              <Tag key={index} color="blue">{name}</Tag>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'Sinif Sayı',
      dataIndex: 'classes',
      key: 'classCount',
      render: (classIds) => (
        <Badge 
          count={classIds?.length || 0} 
          style={{ backgroundColor: classIds?.length ? '#52c41a' : '#f5222d' }}
        />
      )
    },
    {
      title: 'Son Yenilənmə',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => date ? new Date(date.toDate()).toLocaleString('az-AZ') : '-'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', padding: '24px', background: '#f0f2f5' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <Row gutter={[24, 24]} align="middle">
          <Col span={24}>
            <Space align="center" style={{ marginBottom: '16px' }}>
              <TeamOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
              <Title level={3} style={{ margin: 0 }}>Sinif Giriş İcazələri</Title>
            </Space>
          </Col>
          
          <Col xs={24} md={10}>
            <Form.Item label="İstifadəçi seçin" required>
              <Select
                showSearch
                placeholder="İstifadəçi axtar..."
                style={{ width: '100%' }}
                value={selectedUserId}
                onChange={handleUserChange}
                onSearch={setUserSearch}
                filterOption={false}
                loading={loading}
                allowClear
                size="large"
                dropdownRender={(menu) => (
                  <>
                    <div style={{ padding: '8px' }}>
                      <Search
                        placeholder="İstifadəçi axtar..."
                        onSearch={setUserSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        allowClear
                      />
                    </div>
                    {menu}
                  </>
                )}
              >
                {filteredUsers.map(user => (
                  <Option key={user.uid} value={user.uid}>
                    <Space>
                      <Avatar 
                        src={user.photoURL} 
                        icon={!user.photoURL && <UserOutlined />}
                        size="small"
                      />
                      <Text strong>{user.displayName || user.email}</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {user.email}
                      </Text>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={10}>
            <Form.Item label="Siniflər seçin">
              <Select
                mode="multiple"
                showSearch
                placeholder="Sinif axtar..."
                style={{ width: '100%' }}
                value={selectedClassIds}
                onChange={setSelectedClassIds}
                onSearch={setClassSearch}
                filterOption={false}
                disabled={!selectedUserId}
                size="large"
                dropdownRender={(menu) => (
                  <>
                    <div style={{ padding: '8px' }}>
                      <Search
                        placeholder="Sinif axtar..."
                        onSearch={setClassSearch}
                        onChange={(e) => setClassSearch(e.target.value)}
                        allowClear
                      />
                    </div>
                    {menu}
                  </>
                )}
              >
                {filteredClasses.map(cls => (
                  <Option key={cls.id} value={cls.id}>
                    <Space>
                      <BookOutlined style={{ color: '#1890ff' }} />
                      <Text strong>{cls.name}</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {cls.grade || ''} {cls.subject || ''}
                      </Text>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={4}>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveUserClasses}
                loading={loading}
                size="large"
                block
                disabled={!selectedUserId}
              >
                Yadda Saxla
              </Button>
              <Tooltip title="Yenilə">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    fetchUsers();
                    fetchClasses();
                  }}
                  size="large"
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Selected User Info */}
      {selectedUserId && (
        <Card style={{ marginBottom: '24px', background: '#e6f7ff', borderColor: '#91d5ff' }}>
          <Row gutter={16} align="middle">
            <Col span={1}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} />
            </Col>
            <Col span={23}>
              <Space>
                <Text strong>Seçilmiş İstifadəçi:</Text>
                <Avatar 
                  src={users.find(u => u.uid === selectedUserId)?.photoURL}
                  icon={<UserOutlined />}
                />
                <Text>{users.find(u => u.uid === selectedUserId)?.displayName}</Text>
                <Text type="secondary">({users.find(u => u.uid === selectedUserId)?.email})</Text>
                <Divider type="vertical" />
                <Text strong>Seçilmiş Siniflər:</Text>
                <Text>{selectedClassIds.length} sinif</Text>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* Access Table */}
      <Card 
        title={
          <Space>
            <TeamOutlined />
            <span>İcazə Siyahısı</span>
          </Space>
        }
        extra={<Tag color="blue">{accessList.length} giriş icazəsi</Tag>}
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
      >
        <Table
          columns={accessColumns}
          dataSource={accessList}
          rowKey="id"
          loading={loading}
          pag={{ 
            pageSize: 10,
            showTotal: (total) => `Cəmi ${total} icazə`
          }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '16px', background: '#fafafa' }}>
                <Title level={5}>İcazə Verilən Siniflər:</Title>
                {record.classes && record.classes.length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {record.classes.map(classId => {
                      const cls = classes.find(c => c.id === classId);
                      return (
                        <Col span={8} key={classId}>
                          <Card size="small">
                            <Space>
                              <BookOutlined style={{ color: '#1890ff' }} />
                              <Text strong>{cls?.name || 'Sinif tapılmadı'}</Text>
                            </Space>
                            <div style={{ marginTop: 8 }}>
                              <Tag color="cyan">{cls?.grade || 'Səviyyə yox'}</Tag>
                              <Tag color="purple">{cls?.subject || 'Fənn yox'}</Tag>
                            </div>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                ) : (
                  <Alert message="Bu istifadəçinin heç bir sinif icazəsi yoxdur" type="warning" />
                )}
              </div>
            ),
          }}
        />
      </Card>
    </Layout>
  );
};

export default ClassUserAccess;