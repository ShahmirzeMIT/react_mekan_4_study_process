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
  Alert,
  Statistic,
  Empty,
  Tabs,
  Progress
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
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  FormOutlined,
  CopyOutlined,
  EyeOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  CodeOutlined,
  ExportOutlined,
  ImportOutlined,
  SearchOutlined,
  FilterOutlined,
  LockOutlined,
  UnlockOutlined,
  UserAddOutlined,
  UserDeleteOutlined
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
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { callApiWithToken } from '@/utils/callApi';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;

// Collection names with platform_ prefix
const COLLECTIONS = {
  EXAMS: 'platform_exams',
  EXAM_USER_ACCESS: 'platform_exam_users'
};

// Main Component
export const ExamAccess = () => {
  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedExamIds, setSelectedExamIds] = useState([]);
  const [accessList, setAccessList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [examSearch, setExamSearch] = useState('');
  const [activeTab, setActiveTab] = useState('1');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExams: 0,
    totalAccess: 0,
    examsWithAccess: 0
  });

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch exams from Firestore
  useEffect(() => {
    fetchExams();
  }, []);

  // Fetch all access data
  useEffect(() => {
    fetchAllAccess();
  }, []);

  // Update stats when data changes
  useEffect(() => {
    updateStats();
  }, [users, exams, accessList]);

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

  const fetchExams = async () => {
    try {
      const examsRef = collection(db, COLLECTIONS.EXAMS);
      const q = query(examsRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const examsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          key: doc.id,
          label: doc.data().title || 'Unnamed Exam',
          value: doc.id
        }));
        setExams(examsData);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching exams:', error);
      message.error('İmtahanlar yüklənərkən xəta baş verdi');
    }
  };

  const fetchAllAccess = async () => {
    try {
      const accessRef = collection(db, COLLECTIONS.EXAM_USER_ACCESS);
      const q = query(accessRef);
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const accessData = snapshot.docs.map(doc => ({
          id: doc.id,
          uid: doc.id, // document ID is the user's UID
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

  const updateStats = () => {
    const totalUsers = users.length;
    const totalExams = exams.length;
    const totalAccess = accessList.length;
    
    // Count exams that have at least one user with access
    const examAccessMap = new Map();
    accessList.forEach(access => {
      if (access.exams && Array.isArray(access.exams)) {
        access.exams.forEach(examId => {
          examAccessMap.set(examId, (examAccessMap.get(examId) || 0) + 1);
        });
      }
    });
    
    setStats({
      totalUsers,
      totalExams,
      totalAccess,
      examsWithAccess: examAccessMap.size
    });
  };

  const handleUserChange = async (userId) => {
    setSelectedUserId(userId);
    
    if (userId) {
      try {
        const userExamRef = doc(db, COLLECTIONS.EXAM_USER_ACCESS, userId);
        const userExamSnap = await getDoc(userExamRef);
        
        if (userExamSnap.exists()) {
          const data = userExamSnap.data();
          setSelectedExamIds(data.exams || []);
        } else {
          setSelectedExamIds([]);
        }
      } catch (error) {
        console.error('Error fetching user exams:', error);
        message.error('İstifadəçi imtahanları yüklənərkən xəta baş verdi');
      }
    } else {
      setSelectedExamIds([]);
    }
  };

  const handleSaveUserExams = async () => {
    if (!selectedUserId) {
      message.warning('Zəhmət olmasa bir istifadəçi seçin');
      return;
    }

    try {
      setLoading(true);
      
      const selectedUser = users.find(u => u.uid === selectedUserId);
      const userExamRef = doc(db, COLLECTIONS.EXAM_USER_ACCESS, selectedUserId);
      
      // Check if document exists
      const docSnap = await getDoc(userExamRef);
      
      const data = {
        exams: selectedExamIds,
        updatedAt: Timestamp.now(),
        userEmail: selectedUser?.email,
        userDisplayName: selectedUser?.displayName || '',
        userPhotoURL: selectedUser?.photoURL || ''
      };

      if (docSnap.exists()) {
        await updateDoc(userExamRef, {
          ...data,
          updatedAt: Timestamp.now()
        });
      } else {
        await setDoc(userExamRef, {
          ...data,
          createdAt: Timestamp.now(),
          uid: selectedUserId
        });
      }

      message.success('İstifadəçi imtahanları uğurla yeniləndi');
      
      // Switch to access list tab to show updated data
      setActiveTab('2');
    } catch (error) {
      console.error('Error saving user exams:', error);
      message.error('Xəta baş verdi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUserAccess = async (userId) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, COLLECTIONS.EXAM_USER_ACCESS, userId));
      message.success('İstifadəçi icazəsi silindi');
    } catch (error) {
      console.error('Error removing user access:', error);
      message.error('Xəta baş verdi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAddAccess = async (examId, userIds) => {
    try {
      setLoading(true);
      const batch = writeBatch(db);
      
      for (const userId of userIds) {
        const userExamRef = doc(db, COLLECTIONS.EXAM_USER_ACCESS, userId);
        const userExamSnap = await getDoc(userExamRef);
        
        if (userExamSnap.exists()) {
          const currentExams = userExamSnap.data().exams || [];
          if (!currentExams.includes(examId)) {
            batch.update(userExamRef, {
              exams: [...currentExams, examId],
              updatedAt: Timestamp.now()
            });
          }
        } else {
          const user = users.find(u => u.uid === userId);
          batch.set(userExamRef, {
            exams: [examId],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            uid: userId,
            userEmail: user?.email,
            userDisplayName: user?.displayName || '',
            userPhotoURL: user?.photoURL || ''
          });
        }
      }
      
      await batch.commit();
      message.success(`İmtahan ${userIds.length} istifadəçiyə əlavə edildi`);
    } catch (error) {
      console.error('Error bulk adding access:', error);
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

  // Filter exams for multiselect
  const filteredExams = exams.filter(exam => 
    exam.title?.toLowerCase().includes(examSearch.toLowerCase()) ||
    exam.description?.toLowerCase().includes(examSearch.toLowerCase())
  );

  // Access Table Columns
  const accessColumns = [
    {
      title: 'İstifadəçi',
      dataIndex: 'userDisplayName',
      key: 'userDisplayName',
      render: (text, record) => {
        const user = users.find(u => u.uid === record.uid);
        return (
          <Space>
            <Avatar 
              src={record.userPhotoURL || user?.photoURL} 
              icon={!record.userPhotoURL && !user?.photoURL && <UserOutlined />}
              size="small"
            />
            <div>
              <Text strong>{text || record.userEmail || 'Adsız İstifadəçi'}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.userEmail || user?.email}
              </Text>
            </div>
          </Space>
        );
      }
    },
    {
      title: 'İcazə Verilən İmtahanlar',
      dataIndex: 'exams',
      key: 'exams',
      render: (examIds) => {
        if (!examIds || examIds.length === 0) {
          return <Tag color="red" icon={<LockOutlined />}>İcazə yoxdur</Tag>;
        }
        
        const examTitles = examIds.map(id => {
          const exam = exams.find(e => e.id === id);
          return exam?.title || id.substring(0, 8);
        });

        return (
          <Space wrap>
            {examTitles.map((title, index) => (
              <Tooltip key={index} title={title}>
                <Tag color="blue" icon={<BookOutlined />}>
                  {title.length > 20 ? title.substring(0, 20) + '...' : title}
                </Tag>
              </Tooltip>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'İmtahan Sayı',
      dataIndex: 'exams',
      key: 'examCount',
      render: (examIds) => {
        const count = examIds?.length || 0;
        return (
          <Badge 
            count={count} 
            style={{ 
              backgroundColor: count > 0 ? '#52c41a' : '#f5222d',
              fontSize: '12px'
            }}
            showZero
          />
        );
      }
    },
    {
      title: 'Son Yenilənmə',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => date ? new Date(date.toDate()).toLocaleString('az-AZ') : '-'
    },
    {
      title: 'Əməliyyatlar',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="İcazələri redaktə et">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedUserId(record.uid);
                setSelectedExamIds(record.exams || []);
                setActiveTab('1');
              }}
            />
          </Tooltip>
          <Tooltip title="İcazəni sil">
            <Popconfirm
              title="Bu istifadəçinin bütün imtahan icazələrini silmək istədiyinizə əminsiniz?"
              onConfirm={() => handleRemoveUserAccess(record.uid)}
              okText="Bəli"
              cancelText="Xeyr"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  // Exams that have access
  const examsWithAccessList = exams.map(exam => {
    const usersWithAccess = accessList.filter(access => 
      access.exams?.includes(exam.id)
    );
    
    return {
      ...exam,
      usersWithAccess: usersWithAccess.length,
      accessUsers: usersWithAccess.map(a => a.uid)
    };
  }).filter(exam => exam.usersWithAccess > 0);

  return (
    <Layout style={{ minHeight: '100vh', padding: '24px', background: '#f0f2f5' }}>
      {/* Header with Stats */}
   

      {/* Main Content Tabs */}
      <Card 
        style={{ 
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
          {/* Tab 1: Assign Access */}
          <TabPane 
            tab={
              <span>
                <UserAddOutlined />
                İcazə Təyin Et
              </span>
            } 
            key="1"
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card 
                  title={
                    <Space>
                      <UserOutlined style={{ color: '#1890ff' }} />
                      <span>İstifadəçi Seçimi</span>
                    </Space>
                  }
                  size="small"
                  bordered={false}
                >
                  <Form layout="vertical">
                    <Form.Item label="İstifadəçi" required>
                      <Select
                        showSearch
                        placeholder="İstifadəçi axtar..."
                        style={{ width: '100%',height:'70px' }}
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
                                prefix={<SearchOutlined />}
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
                              <div>
                                <Text strong>{user.displayName || user.email}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                  {user.email}
                                </Text>
                              </div>
                            </Space>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    {selectedUserId && (
                      <>
                        <Divider />
                        
                        <Form.Item label="İcazə Veriləcək İmtahanlar">
                          <Select
                            mode="multiple"
                            showSearch
                            placeholder="İmtahan axtar..."
                            style={{ width: '100%',height:'70px' }}
                            value={selectedExamIds}
                            onChange={setSelectedExamIds}
                            onSearch={setExamSearch}
                            filterOption={false}
                            disabled={!selectedUserId}
                            size="large"
                            dropdownRender={(menu) => (
                              <>
                                <div style={{ padding: '8px' }}>
                                  <Search
                                    placeholder="İmtahan axtar..."
                                    onSearch={setExamSearch}
                                    onChange={(e) => setExamSearch(e.target.value)}
                                    allowClear
                                    prefix={<SearchOutlined />}
                                  />
                                </div>
                                {menu}
                              </>
                            )}
                          >
                            {filteredExams.map(exam => (
                              <Option key={exam.id} value={exam.id}>
                                <Space>
                                  <BookOutlined style={{ color: '#1890ff' }} />
                                  <div>
                                    <Text strong>{exam.title}</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: '11px' }}>
                                      {exam.totalQuestions || 0} sual • {exam.duration || 0} dəq
                                    </Text>
                                  </div>
                                </Space>
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>

                        <div style={{ marginTop: 16 }}>
                          <Text type="secondary">
                            Seçilmiş imtahanlar: {selectedExamIds.length}
                          </Text>
                        </div>

                        <Divider />

                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          onClick={handleSaveUserExams}
                          loading={loading}
                          size="large"
                          block
                        >
                          İcazələri Yadda Saxla
                        </Button>
                      </>
                    )}

                    {!selectedUserId && (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Zəhmət olmasa istifadəçi seçin"
                      />
                    )}
                  </Form>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card 
                  title={
                    <Space>
                      <BookOutlined style={{ color: '#52c41a' }} />
                      <span>İmtahan Statistikası</span>
                    </Space>
                  }
                  size="small"
                  bordered={false}
                >
                  {examsWithAccessList.length > 0 ? (
                    <List
                      size="small"
                      dataSource={examsWithAccessList.slice(0, 5)}
                      renderItem={exam => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<BookOutlined style={{ color: '#1890ff' }} />}
                            title={exam.title}
                            description={
                              <Progress 
                                percent={Math.round((exam.usersWithAccess / stats.totalUsers) * 100)} 
                                size="small"
                                format={() => `${exam.usersWithAccess} istifadəçi`}
                                strokeColor="#52c41a"
                              />
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Hələ heç bir imtahana icazə verilməyib"
                    />
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* Tab 2: Access List */}
          <TabPane 
            tab={
              <span>
                <TeamOutlined />
                İcazə Siyahısı
              </span>
            } 
            key="2"
          >
            <Table
              columns={accessColumns}
              dataSource={accessList}
              rowKey="uid"
              loading={loading}
              pagination={{ 
                pageSize: 10,
                showTotal: (total) => `Cəmi ${total} icazə`,
                showSizeChanger: true,
                showQuickJumper: true
              }}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: '16px', background: '#fafafa' }}>
                    <Title level={5}>İcazə Verilən İmtahanlar:</Title>
                    {record.exams && record.exams.length > 0 ? (
                      <Row gutter={[16, 16]}>
                        {record.exams.map(examId => {
                          const exam = exams.find(e => e.id === examId);
                          return (
                            <Col xs={24} sm={12} md={8} key={examId}>
                              <Card 
                                size="small"
                                style={{ 
                                  background: '#f0f5ff',
                                  borderColor: '#91d5ff'
                                }}
                              >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                  <Space>
                                    <BookOutlined style={{ color: '#1890ff' }} />
                                    <Text strong>{exam?.title || 'İmtahan tapılmadı'}</Text>
                                  </Space>
                                  <div>
                                    <Tag color="cyan">{exam?.totalQuestions || 0} sual</Tag>
                                    <Tag color="purple">{exam?.duration || 0} dəq</Tag>
                                    <Tag color={exam?.status === 'published' ? 'green' : 'orange'}>
                                      {exam?.status === 'published' ? 'Dərc edilib' : 'Qaralama'}
                                    </Tag>
                                  </div>
                                </Space>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                    ) : (
                      <Alert 
                        message="Bu istifadəçinin heç bir imtahan icazəsi yoxdur" 
                        type="warning" 
                        showIcon 
                      />
                    )}
                  </div>
                ),
              }}
            />
          </TabPane>

          {/* Tab 3: Bulk Actions */}
          <TabPane 
            tab={
              <span>
                <ExportOutlined />
                Toplu Əməliyyatlar
              </span>
            } 
            key="3"
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card 
                  title="İmtahana Toplu İstifadəçi Əlavə Et"
                  extra={<Tag color="blue">Yeni</Tag>}
                >
                  <Form layout="vertical">
                    <Form.Item label="İmtahan seçin" required>
                      <Select
                        placeholder="İmtahan seçin"
                        style={{ width: '100%' }}
                        size="large"
                        showSearch
                        optionFilterProp="children"
                      >
                        {exams.map(exam => (
                          <Option key={exam.id} value={exam.id}>
                            {exam.title}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item label="İstifadəçilər seçin" required>
                      <Select
                        mode="multiple"
                        placeholder="İstifadəçilər seçin"
                        style={{ width: '100%' }}
                        size="large"
                        showSearch
                        optionFilterProp="children"
                      >
                        {users.map(user => (
                          <Option key={user.uid} value={user.uid}>
                            {user.displayName || user.email}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      block
                      size="large"
                    >
                      İcazələri Əlavə Et
                    </Button>
                  </Form>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card 
                  title="İmtahandan Toplu İstifadəçi Sil"
                  extra={<Tag color="red">Təhlükəli</Tag>}
                >
                  <Form layout="vertical">
                    <Form.Item label="İmtahan seçin" required>
                      <Select
                        placeholder="İmtahan seçin"
                        style={{ width: '100%' }}
                        size="large"
                        showSearch
                        optionFilterProp="children"
                      >
                        {examsWithAccessList.map(exam => (
                          <Option key={exam.id} value={exam.id}>
                            {exam.title} ({exam.usersWithAccess} istifadəçi)
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Popconfirm
                      title="Bu əməliyyatı təsdiqləyirsiniz?"
                      description="Seçilmiş imtahan bütün istifadəçilərdən silinəcək"
                      okText="Bəli"
                      cancelText="Xeyr"
                    >
                      <Button 
                        danger 
                        icon={<DeleteOutlined />}
                        block
                        size="large"
                      >
                        Bütün İcazələri Sil
                      </Button>
                    </Popconfirm>
                  </Form>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* Footer Stats */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Text type="secondary">
                  <UserOutlined /> Ümumi istifadəçi: {stats.totalUsers}
                </Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">
                  <BookOutlined /> Ümumi imtahan: {stats.totalExams}
                </Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">
                  <TeamOutlined /> İcazəsi olan istifadəçi: {accessList.length}
                </Text>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};

export default ExamAccess;