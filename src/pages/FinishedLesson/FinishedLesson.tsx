import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  message,
  Spin,
  Empty,
  Tag,
  Modal,
  Timeline,
  Badge,
  Statistic,
  Divider,
  Tooltip,
  Progress,
  List,
  Layout,
  Input,
  Steps
} from 'antd';
import {
  TrophyOutlined,
  BookOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  StarOutlined,
  EyeOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  LeftOutlined,
  RightOutlined,
  ReadOutlined,
  FireOutlined,
  CloseOutlined
} from '@ant-design/icons';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;
const { Search } = Input;
const { Step } = Steps;

// Collection names
const COLLECTIONS = {
  FINISHED_CLASSES: 'platform_class_users_finished',
  LESSONS: 'platform_lessons',
  CLASSES: 'platform_classes',
  USER_TRACKING: 'platform_class_users_tracking',
  CLASS_USER_ACCESS: 'platform_class_users'
};

// Custom styles for lesson content
const lessonStyles = `
  .lesson-content {
    font-family: 'Segoe UI', Roboto, Arial, sans-serif;
    max-width: 900px;
    margin: 0 auto;
    padding: 30px;
    line-height: 1.8;
    color: #2c3e50;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  }
  .lesson-content h1 {
    font-size: 32px;
    color: #1a2b3c;
    border-bottom: 3px solid #3498db;
    padding-bottom: 15px;
    margin-top: 0;
    margin-bottom: 30px;
  }
  .lesson-content h2 {
    font-size: 26px;
    color: #1a2b3c;
    margin-top: 40px;
    margin-bottom: 20px;
  }
  .lesson-content h3 {
    font-size: 22px;
    color: #1a2b3c;
    margin-top: 30px;
    margin-bottom: 15px;
  }
  .lesson-content .info-box {
    background: linear-gradient(135deg, #f5f9ff 0%, #e8f2ff 100%);
    padding: 20px;
    border-radius: 12px;
    margin: 25px 0;
    border-left: 5px solid #3498db;
  }
  .lesson-content .example-box {
    background: linear-gradient(135deg, #f0faf0 0%, #e3f5e3 100%);
    padding: 20px;
    border-radius: 12px;
    margin: 25px 0;
    border-left: 5px solid #27ae60;
  }
  .lesson-content .exercise-box {
    background: linear-gradient(135deg, #f0f3fa 0%, #e3e9f5 100%);
    padding: 20px;
    border-radius: 12px;
    margin: 25px 0;
    border-left: 5px solid #8e44ad;
  }
  .lesson-content img {
    max-width: 100%;
    border-radius: 16px;
    margin: 30px 0;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  }
`;

// Main Component
export const FinishedLesson = () => {
  const [userData, setUserData] = useState(null);
  const [finishedClasses, setFinishedClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classLessons, setClassLessons] = useState([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLessonsModal, setShowLessonsModal] = useState(false);
  const [showLessonView, setShowLessonView] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [currentTrackingSession, setCurrentTrackingSession] = useState(null);
  const [trackingData, setTrackingData] = useState({ lessons: [] });
  
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalLessons: 0,
    totalTime: 0,
    averageProgress: 0
  });

  // Get user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserData(parsed);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  // Fetch finished classes
  useEffect(() => {
    if (!userData?.uid) return;

    setLoading(true);
    const finishedRef = doc(db, COLLECTIONS.FINISHED_CLASSES, userData.uid);

    const unsubscribe = onSnapshot(finishedRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const classes = data.classes || [];
        
        // Calculate stats
        const totalClasses = classes.length;
        const totalLessons = classes.reduce((sum, c) => sum + (c.totalLessons || 0), 0);
        const totalTime = classes.reduce((sum, c) => {
          if (c.finishedAt && c.startedAt) {
            const start = c.startedAt.toDate ? c.startedAt.toDate() : new Date(c.startedAt);
            const end = c.finishedAt.toDate ? c.finishedAt.toDate() : new Date(c.finishedAt);
            return sum + (end - start);
          }
          return sum;
        }, 0);
        
        const averageProgress = classes.reduce((sum, c) => 
          sum + ((c.completedLessons / c.totalLessons) * 100), 0) / (classes.length || 1);

        setStats({
          totalClasses,
          totalLessons,
          totalTime: Math.floor(totalTime / (1000 * 60)),
          averageProgress: Math.round(averageProgress)
        });

        const sortedClasses = sortClasses(classes, sortBy);
        setFinishedClasses(sortedClasses);
      } else {
        setFinishedClasses([]);
        setStats({
          totalClasses: 0,
          totalLessons: 0,
          totalTime: 0,
          averageProgress: 0
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData, sortBy]);

  // Fetch user's tracking data
  useEffect(() => {
    if (!userData?.uid) return;

    const trackingRef = doc(db, COLLECTIONS.USER_TRACKING, userData.uid);

    const unsubscribe = onSnapshot(trackingRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setTrackingData(docSnapshot.data());
      } else {
        setDoc(trackingRef, {
          uid: userData.uid,
          lessons: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
    });

    return () => unsubscribe();
  }, [userData]);

  // Fetch lessons for a specific class
  const fetchClassLessons = async (classItem) => {
    try {
      const lessonsRef = collection(db, COLLECTIONS.LESSONS);
      const q = query(
        lessonsRef,
        where('classId', '==', classItem.classId),
        orderBy('order', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const lessonsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setClassLessons(lessonsData);
      setSelectedClass(classItem);
      setShowLessonsModal(true);
      
    } catch (error) {
      console.error('Error fetching lessons:', error);
      message.error('Dərslər yüklənərkən xəta baş verdi');
    }
  };

  // Start watching class again
  const startWatchingAgain = async (classItem, startLessonId = null) => {
    if (!userData?.uid) return;

    try {
      setLessonsLoading(true);
      
      // Fetch lessons
      const lessonsRef = collection(db, COLLECTIONS.LESSONS);
      const q = query(
        lessonsRef,
        where('classId', '==', classItem.classId || classItem.id),
        orderBy('order', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const lessonsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setClassLessons(lessonsData);
      setSelectedClass(classItem);
      
      // Find starting lesson index
      let startIndex = 0;
      if (startLessonId) {
        const index = lessonsData.findIndex(l => l.id === startLessonId);
        if (index !== -1) startIndex = index;
      }
      
      setCurrentLessonIndex(startIndex);
      setShowLessonView(true);
      setShowLessonsModal(false);
      setShowDetailModal(false);
      
      // Start tracking the first lesson
      if (lessonsData.length > 0) {
        await startLessonTracking(lessonsData[startIndex]);
      }
      
    } catch (error) {
      console.error('Error starting class:', error);
      message.error('Dərs yüklənərkən xəta baş verdi');
    } finally {
      setLessonsLoading(false);
    }
  };

  // Start tracking a lesson
  const startLessonTracking = async (lesson) => {
    if (!userData?.uid || !selectedClass) return;

    try {
      const now = Timestamp.now();
      const trackingRef = doc(db, COLLECTIONS.USER_TRACKING, userData.uid);
      
      const trackingDoc = await getDoc(trackingRef);
      const currentLessons = trackingDoc.exists() ? trackingDoc.data().lessons || [] : [];
      
      // End any active tracking sessions for this class
      const updatedLessons = currentLessons.map(t => {
        if (t.classId === selectedClass.classId && !t.ended) {
          return { ...t, ended: now };
        }
        return t;
      });
      
      // Create new tracking session
      const newTracking = {
        id: moment().format('x'),
        uid: userData.uid,
        classId: selectedClass.classId || selectedClass.id,
        lessonId: lesson.id,
        title: lesson.title,
        started: now,
        ended: null,
        userDisplayName: userData.name,
        userEmail: userData.email,
        difficulty: lesson.difficulty || 'medium',
        duration: lesson.duration || 45
      };
      
      updatedLessons.push(newTracking);
      
      await updateDoc(trackingRef, {
        lessons: updatedLessons,
        updatedAt: now
      });
      
      setCurrentTrackingSession(newTracking);
      
    } catch (error) {
      console.error('Error tracking lesson:', error);
      message.error('Dərs izlənməsi zamanı xəta baş verdi');
    }
  };

  // Navigate to previous lesson
  const goToPreviousLesson = async () => {
    if (currentLessonIndex > 0) {
      const prevLesson = classLessons[currentLessonIndex - 1];
      setCurrentLessonIndex(currentLessonIndex - 1);
      await startLessonTracking(prevLesson);
    }
  };

  // Navigate to next lesson
  const goToNextLesson = async () => {
    if (currentLessonIndex < classLessons.length - 1) {
      const nextLesson = classLessons[currentLessonIndex + 1];
      setCurrentLessonIndex(currentLessonIndex + 1);
      await startLessonTracking(nextLesson);
    }
  };

  // Go back to finished classes view
  const goBackToFinished = () => {
    setShowLessonView(false);
    setSelectedClass(null);
    setClassLessons([]);
    setCurrentLessonIndex(0);
    setCurrentTrackingSession(null);
  };

  // Sort classes function
  const sortClasses = (classes, sortType) => {
    const sorted = [...classes];
    switch(sortType) {
      case 'date':
        return sorted.sort((a, b) => {
          const dateA = a.finishedAt?.toDate ? a.finishedAt.toDate() : new Date(a.finishedAt);
          const dateB = b.finishedAt?.toDate ? b.finishedAt.toDate() : new Date(b.finishedAt);
          return dateB - dateA;
        });
      case 'name':
        return sorted.sort((a, b) => a.className?.localeCompare(b.className));
      case 'progress':
        return sorted.sort((a, b) => 
          (b.completedLessons / b.totalLessons) - (a.completedLessons / a.totalLessons)
        );
      default:
        return sorted;
    }
  };

  // Filter classes by search
  const filteredClasses = finishedClasses.filter(item => 
    item.className?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.classSubject?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.classGrade?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    if (timestamp.toDate) {
      return moment(timestamp.toDate()).format('DD.MM.YYYY HH:mm');
    }
    return moment(timestamp).format('DD.MM.YYYY HH:mm');
  };

  // Format duration
  const formatDuration = (started, finished) => {
    if (!started || !finished) return '0 dəq';
    const start = started.toDate ? started.toDate() : new Date(started);
    const end = finished.toDate ? finished.toDate() : new Date(finished);
    const diff = Math.floor((end - start) / (1000 * 60));
    if (diff < 60) return `${diff} dəq`;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours} saat ${minutes} dəq`;
  };

  // Get random gradient for cards
  const getCardGradient = (index) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    ];
    return gradients[index % gradients.length];
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Content style={{ padding: '24px' }}>
        {!showLessonView ? (
          /* Finished Classes View */
          <>
     

            {/* Search and Filter */}
            <Card style={{ marginBottom: 24, borderRadius: 12 }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={12}>
                  <Search
                    placeholder="Sinif adı, fənn və ya sinif səviyyəsinə görə axtar..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    enterButton
                    size="large"
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Space style={{ float: 'right' }}>
                    <Text strong>Sırala:</Text>
                    <Button 
                      type={sortBy === 'date' ? 'primary' : 'default'}
                      onClick={() => setSortBy('date')}
                      icon={<CalendarOutlined />}
                    >
                      Tarix
                    </Button>
                    <Button 
                      type={sortBy === 'name' ? 'primary' : 'default'}
                      onClick={() => setSortBy('name')}
                      icon={<BookOutlined />}
                    >
                      Ad
                    </Button>
                    <Button 
                      type={sortBy === 'progress' ? 'primary' : 'default'}
                      onClick={() => setSortBy('progress')}
                      icon={<StarOutlined />}
                    >
                      Nəticə
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Finished Classes List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>Məlumatlar yüklənir...</p>
              </div>
            ) : filteredClasses.length > 0 ? (
              <List
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
                dataSource={filteredClasses}
                renderItem={(item, index) => (
                  <List.Item>
                    <Card
                      hoverable
                      style={{
                        borderRadius: 16,
                        overflow: 'hidden',
                        border: 'none',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                        height: '100%'
                      }}
                      cover={
                        <div style={{
                          height: 120,
                          background: getCardGradient(index),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          <TrophyOutlined style={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
                          <div style={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            background: 'rgba(255,255,255,0.2)',
                            padding: '4px 12px',
                            borderRadius: 20,
                            backdropFilter: 'blur(5px)'
                          }}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>
                              {item.completedLessons}/{item.totalLessons}
                            </Text>
                          </div>
                        </div>
                      }
                      actions={[
                        <Tooltip title="Detallara bax">
                          <EyeOutlined onClick={() => {
                            setSelectedClass(item);
                            setShowDetailModal(true);
                          }} />
                        </Tooltip>,
                        <Tooltip title="Dərsləri göstər">
                          <BookOutlined onClick={() => fetchClassLessons(item)} />
                        </Tooltip>,
                        <Tooltip title="Təkrar izlə">
                          <PlayCircleOutlined onClick={() => startWatchingAgain(item)} />
                        </Tooltip>
                      ]}
                    >
                      <Card.Meta
                        title={
                          <Space direction="vertical" size={0}>
                            <Text strong style={{ fontSize: 18 }}>{item.className}</Text>
                            <Text type="secondary">{item.classGrade}</Text>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                            <Space wrap>
                              <Tag color="purple" icon={<BookOutlined />}>
                                {item.classSubject}
                              </Tag>
                              <Tag color="cyan" icon={<CalendarOutlined />}>
                                {formatTime(item.finishedAt)}
                              </Tag>
                            </Space>
                            
                            <Progress 
                              percent={Math.round((item.completedLessons / item.totalLessons) * 100)} 
                              size="small"
                              strokeColor="#52c41a"
                            />
                            
                            <Space>
                              <ClockCircleOutlined style={{ color: '#faad14' }} />
                              <Text type="secondary">
                                {formatDuration(item.startedAt, item.finishedAt)}
                              </Text>
                            </Space>
                          </Space>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description={
                  <Space direction="vertical">
                    <Text>Hələ heç bir dərs bitirilməyib</Text>
                  </Space>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}

            {/* Detail Modal */}
            <Modal
              title={
                <Space>
                  <BookOutlined style={{ color: '#1890ff' }} />
                  <span>{selectedClass?.className}</span>
                </Space>
              }
              open={showDetailModal}
              onCancel={() => setShowDetailModal(false)}
              width={800}
              footer={[
                <Button key="close" onClick={() => setShowDetailModal(false)}>
                  Bağla
                </Button>,
                <Button 
                  key="watch" 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={() => {
                    startWatchingAgain(selectedClass);
                  }}
                >
                  Təkrar İzlə
                </Button>
              ]}
            >
              {selectedClass && (
                <div>
                  <Row gutter={[24, 24]}>
                    <Col span={24}>
                      <Card style={{ background: '#f5f5f5', borderRadius: 12 }}>
                        <Row gutter={16}>
                          <Col span={8}>
                            <Statistic
                              title="Ümumi dərslər"
                              value={selectedClass.totalLessons}
                              prefix={<BookOutlined />}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic
                              title="Bitirilən"
                              value={selectedClass.completedLessons}
                              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic
                              title="Nəticə"
                              value={Math.round((selectedClass.completedLessons / selectedClass.totalLessons) * 100)}
                              suffix="%"
                              prefix={<StarOutlined style={{ color: '#faad14' }} />}
                            />
                          </Col>
                        </Row>
                      </Card>
                    </Col>

                    <Col span={12}>
                      <Card title="Sinif məlumatları" size="small">
                        <List>
                          <List.Item>
                            <Space>
                              <Tag color="purple">Fənn</Tag>
                              <Text>{selectedClass.classSubject}</Text>
                            </Space>
                          </List.Item>
                          <List.Item>
                            <Space>
                              <Tag color="cyan">Sinif</Tag>
                              <Text>{selectedClass.classGrade}</Text>
                            </Space>
                          </List.Item>
                          <List.Item>
                            <Space>
                              <Tag color="blue">Dərs sayı</Tag>
                              <Text>{selectedClass.totalLessons}</Text>
                            </Space>
                          </List.Item>
                        </List>
                      </Card>
                    </Col>

                    <Col span={12}>
                      <Card title="Vaxt məlumatları" size="small">
                        <List>
                          <List.Item>
                            <Space>
                              <CalendarOutlined style={{ color: '#1890ff' }} />
                              <Text strong>Başlanğıc:</Text>
                              <Text>{formatTime(selectedClass.startedAt)}</Text>
                            </Space>
                          </List.Item>
                          <List.Item>
                            <Space>
                              <CheckCircleOutlined style={{ color: '#52c41a' }} />
                              <Text strong>Bitmə:</Text>
                              <Text>{formatTime(selectedClass.finishedAt)}</Text>
                            </Space>
                          </List.Item>
                          <List.Item>
                            <Space>
                              <ClockCircleOutlined style={{ color: '#faad14' }} />
                              <Text strong>Müddət:</Text>
                              <Text>{formatDuration(selectedClass.startedAt, selectedClass.finishedAt)}</Text>
                            </Space>
                          </List.Item>
                        </List>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}
            </Modal>

            {/* Lessons Modal */}
            <Modal
              title={
                <Space>
                  <BookOutlined style={{ color: '#1890ff' }} />
                  <span>Dərslər - {selectedClass?.className}</span>
                </Space>
              }
              open={showLessonsModal}
              onCancel={() => setShowLessonsModal(false)}
              width={700}
              footer={[
                <Button key="close" onClick={() => setShowLessonsModal(false)}>
                  Bağla
                </Button>,
                <Button 
                  key="watchAll" 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={() => startWatchingAgain(selectedClass)}
                >
                  Hamısını Təkrar İzlə
                </Button>
              ]}
            >
              <List
                dataSource={classLessons}
                style={{ maxHeight: 500, overflow: 'auto' }}
                renderItem={(lesson, index) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        icon={<PlayCircleOutlined />}
                        onClick={() => startWatchingAgain(selectedClass, lesson.id)}
                      >
                        İzlə
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </div>
                      }
                      title={
                        <Space>
                          <Text strong>{lesson.title}</Text>
                          <Tag color="blue">{lesson.duration || 45} dəq</Tag>
                          <Tag color={lesson.difficulty === 'easy' ? 'green' : lesson.difficulty === 'medium' ? 'orange' : 'red'}>
                            {lesson.difficulty === 'easy' ? 'Asan' : 
                             lesson.difficulty === 'medium' ? 'Orta' : 'Çətin'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Text type="secondary">
                          {lesson.summary || 'Bu dərs haqqında qısa məlumat...'}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
              {classLessons.length === 0 && (
                <Empty description="Bu sinifdə heç bir dərs tapılmadı" />
              )}
            </Modal>
          </>
        ) : (
          /* Lesson View - Full Page */
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Lesson Header */}
            <Card style={{ marginBottom: 24, borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Row align="middle" gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Space direction="vertical">
                    <Space>
                      <ReadOutlined style={{ color: '#1890ff', fontSize: 24 }} />
                      <Title level={3} style={{ margin: 0 }}>{selectedClass?.className}</Title>
                      {currentTrackingSession && (
                        <Badge status="processing" text="Aktiv" />
                      )}
                    </Space>
                    
                    <Space wrap>
                      <Tag icon={<BookOutlined />} color="blue">
                        {currentLessonIndex + 1} / {classLessons.length} dərs
                      </Tag>
                      <Tag icon={<FireOutlined />} color="orange">
                        {classLessons[currentLessonIndex]?.difficulty === 'easy' ? 'Asan' : 
                         classLessons[currentLessonIndex]?.difficulty === 'medium' ? 'Orta' : 'Çətin'}
                      </Tag>
                      <Tag icon={<ClockCircleOutlined />} color="cyan">
                        {classLessons[currentLessonIndex]?.duration || 45} dəq
                      </Tag>
                    </Space>
                  </Space>
                </Col>
                
                <Col xs={24} md={12}>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button
                      size="large"
                      icon={<LeftOutlined />}
                      onClick={goToPreviousLesson}
                      disabled={currentLessonIndex === 0}
                    >
                      Əvvəlki
                    </Button>
                    
                    <Button
                      size="large"
                      type="primary"
                      icon={<RightOutlined />}
                      onClick={goToNextLesson}
                      disabled={currentLessonIndex === classLessons.length - 1}
                    >
                      Növbəti
                    </Button>
                    
                    <Button
                      size="large"
                      icon={<CloseOutlined />}
                      onClick={goBackToFinished}
                    >
                      Bitirilənlərə Qayıt
                    </Button>
                  </Space>
                </Col>
              </Row>
              
              {/* Progress Steps */}
              <Divider style={{ margin: '16px 0' }} />
              <Steps
                current={currentLessonIndex}
                size="small"
                responsive
              >
                {classLessons.map((lesson, index) => (
                  <Step 
                    key={index}
                    title={`Dərs ${index + 1}`}
                  />
                ))}
              </Steps>
            </Card>

            {/* Lesson Content */}
            {lessonsLoading ? (
              <div style={{ textAlign: 'center', padding: 100 }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>Dərs yüklənir...</p>
              </div>
            ) : (
              <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                <style>{lessonStyles}</style>
                <div 
                  className="lesson-content"
                  dangerouslySetInnerHTML={{ 
                    __html: classLessons[currentLessonIndex]?.content || ''
                  }} 
                />
                
                {/* Navigation Footer */}
                <Divider />
                <Row justify="space-between" align="middle">
                  <Col>
                    <Text type="secondary">
                      <StarOutlined /> {classLessons[currentLessonIndex]?.title}
                    </Text>
                  </Col>
                  <Col>
                    <Space>
                      <Button
                        icon={<LeftOutlined />}
                        onClick={goToPreviousLesson}
                        disabled={currentLessonIndex === 0}
                      >
                        Əvvəlki Dərs
                      </Button>
                      <Button
                        type="primary"
                        icon={<RightOutlined />}
                        onClick={goToNextLesson}
                        disabled={currentLessonIndex === classLessons.length - 1}
                      >
                        Növbəti Dərs
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Card>
            )}
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default FinishedLesson;