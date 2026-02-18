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
  Divider,
  Tooltip,
  Avatar,
  Progress,
  List,
  Alert,
  Layout,
  Steps
} from 'antd';
import {
  PlayCircleOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  BookOutlined,
  ReadOutlined,
  RobotOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  CalendarOutlined,
  EyeOutlined,
  CloseOutlined,
  StarOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  FireOutlined
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
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
  arrayRemove,
  arrayUnion
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { Content, Header } = Layout;
const { Step } = Steps;

// Collection names
const COLLECTIONS = {
  CLASSES: 'platform_classes',
  CLASS_USER_ACCESS: 'platform_class_users',
  LESSONS: 'platform_lessons',
  USER_TRACKING: 'platform_class_users_tracking',
  FINISHED_CLASSES: 'platform_class_users_finished'
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
    box-shadow: 0 2px 10px rgba(52,152,219,0.1);
  }
  .lesson-content .example-box {
    background: linear-gradient(135deg, #f0faf0 0%, #e3f5e3 100%);
    padding: 20px;
    border-radius: 12px;
    margin: 25px 0;
    border-left: 5px solid #27ae60;
    box-shadow: 0 2px 10px rgba(39,174,96,0.1);
  }
  .lesson-content .exercise-box {
    background: linear-gradient(135deg, #f0f3fa 0%, #e3e9f5 100%);
    padding: 20px;
    border-radius: 12px;
    margin: 25px 0;
    border-left: 5px solid #8e44ad;
    box-shadow: 0 2px 10px rgba(142,68,173,0.1);
  }
  .lesson-content img {
    max-width: 100%;
    border-radius: 16px;
    margin: 30px 0;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    transition: transform 0.3s ease;
  }
  .lesson-content img:hover {
    transform: scale(1.02);
  }
  .lesson-content ul, .lesson-content ol {
    padding-left: 25px;
    margin: 20px 0;
  }
  .lesson-content li {
    margin: 12px 0;
    font-size: 16px;
  }
  .lesson-content .keywords {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 30px 0;
  }
  .lesson-content .keyword-tag {
    background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
    padding: 8px 16px;
    border-radius: 30px;
    font-size: 14px;
    color: #495057;
    font-weight: 500;
  }
`;

// Main Component
export const Lessons = () => {
  const [userData, setUserData] = useState(null);
  const [userClasses, setUserClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classLessons, setClassLessons] = useState([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [trackingData, setTrackingData] = useState({ lessons: [] });
  const [finishedClasses, setFinishedClasses] = useState({ classes: [] });
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [currentTrackingSession, setCurrentTrackingSession] = useState(null);
  const [showLessonView, setShowLessonView] = useState(false);

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

  // Fetch user's classes from platform_class_users
  useEffect(() => {
    if (!userData?.uid) return;

    setLoading(true);
    const userClassesRef = doc(db, COLLECTIONS.CLASS_USER_ACCESS, userData.uid);

    const unsubscribe = onSnapshot(userClassesRef, 
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const classIds = data.classes || [];
          
          if (classIds.length > 0) {
            const classesPromises = classIds.map(async (classId) => {
              const classDoc = await getDoc(doc(db, COLLECTIONS.CLASSES, classId));
              if (classDoc.exists()) {
                return { id: classDoc.id, ...classDoc.data() };
              }
              return null;
            });
            
            const classesData = (await Promise.all(classesPromises)).filter(c => c !== null);
            setUserClasses(classesData);
          } else {
            setUserClasses([]);
          }
        } else {
          await setDoc(doc(db, COLLECTIONS.CLASS_USER_ACCESS, userData.uid), {
            uid: userData.uid,
            classes: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            userDisplayName: userData.name,
            userEmail: userData.email,
            userPhotoURL: userData.photoURL || null
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user classes:', error);
        message.error('Siniflər yüklənərkən xəta baş verdi');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userData]);

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

  // Fetch user's finished classes
  useEffect(() => {
    if (!userData?.uid) return;

    const finishedRef = doc(db, COLLECTIONS.FINISHED_CLASSES, userData.uid);

    const unsubscribe = onSnapshot(finishedRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setFinishedClasses(docSnapshot.data());
      } else {
        setDoc(finishedRef, {
          uid: userData.uid,
          classes: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
    });

    return () => unsubscribe();
  }, [userData]);

  // Fetch lessons when class is selected
  const fetchClassLessons = async (classItem) => {
    setLessonsLoading(true);
    
    try {
      const lessonsRef = collection(db, COLLECTIONS.LESSONS);
      const q = query(
        lessonsRef,
        where('classId', '==', classItem.id),
        orderBy('order', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const lessonsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setClassLessons(lessonsData);
      setSelectedClass(classItem);
      setCurrentLessonIndex(0);
      setShowLessonView(true);
      
      // Check if there's an active tracking session
      const activeTracking = trackingData.lessons?.find(
        t => t.classId === classItem.id && !t.ended
      );
      
      if (activeTracking) {
        setCurrentTrackingSession(activeTracking);
        const lessonIndex = lessonsData.findIndex(l => l.id === activeTracking.lessonId);
        if (lessonIndex !== -1) {
          setCurrentLessonIndex(lessonIndex);
        }
      } else if (lessonsData.length > 0) {
        // Start tracking first lesson
        await startLessonTracking(lessonsData[0], 'start');
      }
      
    } catch (error) {
      console.error('Error fetching lessons:', error);
      message.error('Dərslər yüklənərkən xəta baş verdi');
    } finally {
      setLessonsLoading(false);
    }
  };

  // Start tracking a lesson
  const startLessonTracking = async (lesson, action = 'start') => {
    if (!userData?.uid || !selectedClass) return;

    try {
      const now = Timestamp.now();
      const trackingRef = doc(db, COLLECTIONS.USER_TRACKING, userData.uid);
      
      if (action === 'start') {
        const trackingDoc = await getDoc(trackingRef);
        const currentLessons = trackingDoc.exists() ? trackingDoc.data().lessons || [] : [];
        
        const updatedLessons = currentLessons.map(t => {
          if (t.classId === selectedClass.id && !t.ended) {
            return { ...t, ended: now };
          }
          return t;
        });
        
        const newTracking = {
          id: moment().format('x'),
          uid: userData.uid,
          classId: selectedClass.id,
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
      }
      
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
      await startLessonTracking(prevLesson, 'start');
    }
  };

  // Navigate to next lesson
  const goToNextLesson = async () => {
    if (currentLessonIndex < classLessons.length - 1) {
      const nextLesson = classLessons[currentLessonIndex + 1];
      setCurrentLessonIndex(currentLessonIndex + 1);
      await startLessonTracking(nextLesson, 'start');
    }
  };

  // Go back to classes view
  const goBackToClasses = () => {
    setShowLessonView(false);
    setSelectedClass(null);
    setClassLessons([]);
    setCurrentLessonIndex(0);
  };

  // Finish the entire class
  const finishClass = async () => {
    if (!userData?.uid || !selectedClass) return;

    Modal.confirm({
      title: 'Dərsi Bitir',
      content: 'Bu dərsi bitirmək istədiyinizə əminsiniz?',
      okText: 'Bəli, bitir',
      cancelText: 'Xeyr',
      onOk: async () => {
        try {
          const now = Timestamp.now();
          const batch = writeBatch(db);
          
          // Update tracking
          const trackingRef = doc(db, COLLECTIONS.USER_TRACKING, userData.uid);
          const trackingDoc = await getDoc(trackingRef);
          
          if (trackingDoc.exists()) {
            const currentLessons = trackingDoc.data().lessons || [];
            const updatedLessons = currentLessons.map(t => {
              if (t.classId === selectedClass.id && !t.ended) {
                return { ...t, ended: now };
              }
              return t;
            });
            
            batch.update(trackingRef, { 
              lessons: updatedLessons,
              updatedAt: now 
            });
          }
          
          // Add to finished classes
          const finishedRef = doc(db, COLLECTIONS.FINISHED_CLASSES, userData.uid);
          const finishedDoc = await getDoc(finishedRef);
          
          const completedLessons = trackingData.lessons?.filter(
            t => t.classId === selectedClass.id && t.ended
          ).length || 0;
          
          const finishedClassData = {
            classId: selectedClass.id,
            className: selectedClass.name,
            classGrade: selectedClass.grade,
            classSubject: selectedClass.subject,
            finishedAt: now,
            totalLessons: classLessons.length,
            completedLessons: completedLessons,
            userDisplayName: userData.name,
            userEmail: userData.email,
            coverImage: `https://source.unsplash.com/random/800x400/?${selectedClass.subject}`
          };
          
          if (finishedDoc.exists()) {
            const currentFinished = finishedDoc.data().classes || [];
            batch.update(finishedRef, {
              classes: [...currentFinished, finishedClassData],
              updatedAt: now
            });
          } else {
            batch.set(finishedRef, {
              uid: userData.uid,
              classes: [finishedClassData],
              createdAt: now,
              updatedAt: now
            });
          }
          
          // Remove from active classes
          const userClassesRef = doc(db, COLLECTIONS.CLASS_USER_ACCESS, userData.uid);
          batch.update(userClassesRef, {
            classes: arrayRemove(selectedClass.id),
            updatedAt: now
          });
          
          await batch.commit();
          
          message.success('Dərs uğurla bitirildi! 🎉');
          goBackToClasses();
          
        } catch (error) {
          console.error('Error finishing class:', error);
          message.error('Dərsi bitirərkən xəta baş verdi');
        }
      }
    });
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Davam edir';
    if (timestamp.toDate) {
      return moment(timestamp.toDate()).format('DD.MM.YYYY HH:mm');
    }
    return moment(timestamp).format('DD.MM.YYYY HH:mm');
  };

  // Get duration
  const getDuration = (started, ended) => {
    if (!started || !ended) return 'Davam edir';
    const start = started.toDate ? started.toDate() : new Date(started);
    const end = ended.toDate ? ended.toDate() : new Date(ended);
    const diff = Math.floor((end - start) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes} dəq ${seconds} saniyə`;
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
      {/* Header */}
      <Header style={{ 
        background: 'white', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Space size="large">
          <BookOutlined style={{ fontSize: 28, color: '#1890ff' }} />
          <Title level={3} style={{ margin: 0, color: '#1a2b3c' }}>
            {showLessonView ? selectedClass?.name : 'Dərslərim'}
          </Title>
        </Space>
        
        <Space>
          {showLessonView && (
            <Button 
              icon={<CloseOutlined />}
              onClick={goBackToClasses}
              size="large"
            >
              Geri
            </Button>
          )}
          
      
        </Space>
      </Header>

      <Content style={{ padding: '24px' }}>
        {!showLessonView ? (
          /* Classes Grid View */
          <div>
            <Title level={2} style={{ marginBottom: 24, color: '#1a2b3c' }}>
              Siniflərim
              <Tag color="blue" style={{ marginLeft: 12 }}>{userClasses.length} sinif</Tag>
            </Title>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>Siniflər yüklənir...</p>
              </div>
            ) : userClasses.length > 0 ? (
              <Row gutter={[24, 24]}>
                {userClasses.map((item, index) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={item.id}>
                    <Card
                      hoverable
                      style={{
                        borderRadius: 16,
                        overflow: 'hidden',
                        border: 'none',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        cursor: 'pointer'
                      }}
                      cover={
                        <div style={{
                          height: 140,
                          background: getCardGradient(index),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          <BookOutlined style={{ fontSize: 64, color: 'rgba(255,255,255,0.3)' }} />
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
                              {item.lessonCount || 0} dərs
                            </Text>
                          </div>
                        </div>
                      }
                      onClick={() => fetchClassLessons(item)}
                    >
                      <Card.Meta
                        title={
                          <Space direction="vertical" size={0}>
                            <Text strong style={{ fontSize: 18 }}>{item.name}</Text>
                            <Text type="secondary">{item.grade}</Text>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                            <Space wrap>
                              <Tag color="purple">{item.subject}</Tag>
                              <Tag color="cyan" icon={<ClockCircleOutlined />}>
                                {item.duration || 45} dəq
                              </Tag>
                            </Space>
                            
                            <Button 
                              type="primary" 
                              icon={<PlayCircleOutlined />}
                              block
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchClassLessons(item);
                              }}
                            >
                              Dərsə Başla
                            </Button>
                          </Space>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty 
                description={
                  <Space direction="vertical">
                    <Text>Heç bir sinifiniz yoxdur</Text>
                    <Button type="primary" ghost>Sinif Əlavə Et</Button>
                  </Space>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
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
                      <Title level={3} style={{ margin: 0 }}>{selectedClass?.name}</Title>
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
                      danger
                      type="primary"
                      icon={<TrophyOutlined />}
                      onClick={finishClass}
                    >
                      Dərsi Bitir
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
                    icon={index === currentLessonIndex ? <PlayCircleOutlined /> : undefined}
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

      {/* Tracking History Modal */}
      <Modal
        title={
          <Space>
            <HistoryOutlined style={{ color: '#1890ff' }} />
            <span>İzlənən Dərslər</span>
          </Space>
        }
        open={showTrackingModal}
        onCancel={() => setShowTrackingModal(false)}
        width={800}
        footer={null}
      >
        <Timeline mode="left">
          {(trackingData.lessons || []).map((item) => (
            <Timeline.Item
              key={item.id}
              color={item.ended ? 'green' : 'blue'}
              label={
                <Space direction="vertical" size={0}>
                  <Text strong>{formatTime(item.started)}</Text>
                  {item.ended && (
                    <Text type="secondary">{formatTime(item.ended)}</Text>
                  )}
                </Space>
              }
            >
              <Card size="small" style={{ maxWidth: 500 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <BookOutlined />
                    <Text strong>{item.title}</Text>
                  </Space>
                  <Space>
                    <Tag color="purple">
                      {item.difficulty === 'easy' ? 'Asan' : 
                       item.difficulty === 'medium' ? 'Orta' : 'Çətin'}
                    </Tag>
                    <Tag color="blue">{item.duration} dəq</Tag>
                  </Space>
                  <Text type="secondary">
                    Müddət: {getDuration(item.started, item.ended)}
                  </Text>
                  {!item.ended && (
                    <Badge status="processing" text="Davam edir" />
                  )}
                </Space>
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>
        {(!trackingData.lessons || trackingData.lessons.length === 0) && (
          <Empty description="Hələ heç bir dərs izlənməyib" />
        )}
      </Modal>

      {/* Finished Classes Modal */}
      <Modal
        title={
          <Space>
            <TrophyOutlined style={{ color: '#52c41a' }} />
            <span>Bitirilən Dərslər</span>
          </Space>
        }
        open={showFinishedModal}
        onCancel={() => setShowFinishedModal(false)}
        width={800}
        footer={null}
      >
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={finishedClasses.classes || []}
          renderItem={(item) => (
            <List.Item>
              <Card style={{ borderRadius: 12, overflow: 'hidden' }}>
                <Row align="middle" gutter={16}>
                  <Col span={4}>
                    <div style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <TrophyOutlined style={{ fontSize: 30, color: 'white' }} />
                    </div>
                  </Col>
                  <Col span={12}>
                    <Space direction="vertical" size={0}>
                      <Text strong style={{ fontSize: 16 }}>{item.className}</Text>
                      <Space wrap>
                        <Tag color="cyan">{item.classGrade}</Tag>
                        <Tag color="purple">{item.classSubject}</Tag>
                        <Tag color="blue">{item.totalLessons} dərs</Tag>
                      </Space>
                      <Space>
                        <CalendarOutlined />
                        <Text type="secondary">
                          Bitirildi: {formatTime(item.finishedAt)}
                        </Text>
                      </Space>
                    </Space>
                  </Col>
                  <Col span={8} style={{ textAlign: 'right' }}>
                    <Progress 
                      type="circle" 
                      percent={Math.round((item.completedLessons / item.totalLessons) * 100)} 
                      width={60}
                      strokeColor="#52c41a"
                    />
                  </Col>
                </Row>
              </Card>
            </List.Item>
          )}
        />
        {(!finishedClasses.classes || finishedClasses.classes.length === 0) && (
          <Empty description="Hələ heç bir dərs bitirilməyib" />
        )}
      </Modal>
    </Layout>
  );
};

export default Lessons;