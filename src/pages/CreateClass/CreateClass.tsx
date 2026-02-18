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
  InputNumber,
  Alert,
  Steps,
  Checkbox,
  Radio,
  Spin,
  Progress,
  Tabs,
  Image
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileOutlined,
  SaveOutlined,
  BookOutlined,
  EyeOutlined,
  ScheduleOutlined,
  TeamOutlined,
  ReadOutlined,
  CodeOutlined,
  DragOutlined,
  WarningOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  GlobalOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
  PictureOutlined
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
  writeBatch
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import HtmlEditorComp from './HtmlEditorComp';
import HtmlCodeShow from './HtmlCodeShow';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;
const { TabPane } = Tabs;

// Collection names with platform_ prefix
const COLLECTIONS = {
  CLASSES: 'platform_classes',
  LESSONS: 'platform_lessons'
};

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyCSYojEExI98cnAmn4fsg7LbjnHfaEd6c4';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Şəkil URL-ləri üçün placeholder (picsum photos - pulsuz şəkillər)
const getRandomImageUrl = (width = 800, height = 400, id = 1) => {
  return `https://picsum.photos/${width}/${height}?random=${id}`;
};

// Sadə və öyrədici dərs formatı - FOKUS DƏRS + ŞƏKİLLƏR
const getLessonHTMLTemplate = (title, content, examples, exercises, keywords, images = []) => {
  // Şəkilləri HTML-ə əlavə et
  const imagesHTML = images.length > 0 ? `
    <h2 style="font-size: 22px; color: #2c3e50; margin-top: 30px;">Şəkilli İzahlar</h2>
    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0;">
      ${images.map((img, idx) => `
        <div style="flex: 1; min-width: 300px; text-align: center;">
          <img src="${img.url}" alt="${img.alt || 'Şəkil'}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          ${img.caption ? `<p style="margin-top: 8px; color: #666; font-style: italic;">${img.caption}</p>` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  return `
    <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333;">
      
      <h1 style="font-size: 28px; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-top: 0;">${title}</h1>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3498db;">
        <strong style="color: #2c3e50;">📚 Bu dərsdə öyrənəcəksiniz:</strong>
        <ul style="margin-top: 10px; padding-left: 20px;">
          <li>${content.substring(0, 150)}...</li>
        </ul>
      </div>
      
      <h2 style="font-size: 22px; color: #2c3e50; margin-top: 30px;">Dərsin Məzmunu</h2>
      <div style="background: white; padding: 15px; border-radius: 5px;">
        ${content}
      </div>
      
      ${imagesHTML}
      
      ${examples ? `
        <h2 style="font-size: 22px; color: #2c3e50; margin-top: 30px;">Nümunələr</h2>
        <div style="background-color: #f0f9f0; padding: 15px; border-radius: 5px; border-left: 4px solid #27ae60;">
          <strong style="color: #27ae60;">📝 Nümunələr:</strong>
          <div style="margin-top: 10px;">${examples}</div>
        </div>
      ` : ''}
      
      ${exercises ? `
        <h2 style="font-size: 22px; color: #2c3e50; margin-top: 30px;">Tapşırıqlar</h2>
        <div style="background-color: #f0f5ff; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db;">
          <strong style="color: #3498db;">✍️ Tapşırıqlar:</strong>
          <div style="margin-top: 10px;">${exercises}</div>
        </div>
      ` : ''}
      
      ${keywords && keywords.length > 0 ? `
        <h2 style="font-size: 22px; color: #2c3e50; margin-top: 30px;">Açar Sözlər</h2>
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
          ${keywords.map(k => `<span style="display: inline-block; background: #e9ecef; padding: 5px 10px; margin: 5px; border-radius: 3px; font-size: 14px;">${k}</span>`).join('')}
        </div>
      ` : ''}
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #7f8c8d; font-size: 14px;">
        <p>Bu dərs AI tərəfindən yaradılıb və öyrənmək üçün nəzərdə tutulub.</p>
      </div>
    </div>
  `;
};

// Main Component
export const CreateClass = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [isClassModalVisible, setIsClassModalVisible] = useState(false);
  const [isLessonDrawerVisible, setIsLessonDrawerVisible] = useState(false);
  const [isAIGeneratorVisible, setIsAIGeneratorVisible] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [indexBuilding, setIndexBuilding] = useState(false);
  const [form] = Form.useForm();
  const [lessonForm] = Form.useForm();
  const [lessonContent, setLessonContent] = useState('');

  // AI Generator state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLessonCount, setAiLessonCount] = useState(3);
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [aiIncludeExamples, setAiIncludeExamples] = useState(true);
  const [aiIncludeExercises, setAiIncludeExercises] = useState(true);
  const [aiIncludeImages, setAiIncludeImages] = useState(true);
  const [aiLanguage, setAiLanguage] = useState('az');
  const [aiLessonType, setAiLessonType] = useState('theory');
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedLessons, setGeneratedLessons] = useState([]);
  const [selectedLessons, setSelectedLessons] = useState([]);

  // Fetch classes on component mount with real-time updates
  useEffect(() => {
    const classesRef = collection(db, COLLECTIONS.CLASSES);
    const q = query(classesRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        key: doc.id
      }));
      setClasses(classesData);
    }, (error) => {
      message.error('Error fetching classes: ' + error.message);
    });

    return () => unsubscribe();
  }, []);

  // Fetch lessons with real-time updates when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setLessons([]);
      return;
    }

    const lessonsRef = collection(db, COLLECTIONS.LESSONS);
    
    try {
      const q = query(
        lessonsRef,
        where('classId', '==', selectedClass.id),
        orderBy('order', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const lessonsData = snapshot.docs.map((doc, index) => ({
          id: doc.id,
          ...doc.data(),
          key: doc.id,
          sno: index + 1
        }));
        setLessons(lessonsData);
        setIndexBuilding(false);
      }, (error) => {
        if (error.message.includes('index is currently building')) {
          setIndexBuilding(true);
          const fallbackQuery = query(
            lessonsRef,
            where('classId', '==', selectedClass.id)
          );
          
          const fallbackUnsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
            const lessonsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              key: doc.id
            }));
            
            const sortedData = lessonsData
              .sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                  return a.order - b.order;
                }
                if (a.order !== undefined) return -1;
                if (b.order !== undefined) return 1;
                return (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0);
              })
              .map((item, index) => ({ ...item, sno: index + 1 }));
              
            setLessons(sortedData);
          }, (fallbackError) => {
            console.error('Error fetching lessons:', fallbackError);
            message.error('Error fetching lessons: ' + fallbackError.message);
          });
          
          return fallbackUnsubscribe;
        } else {
          console.error('Error fetching lessons:', error);
          message.error('Error fetching lessons: ' + error.message);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up lessons listener:', error);
      message.error('Error setting up lessons listener: ' + error.message);
    }
  }, [selectedClass]);

  // Generate lessons using Gemini AI
  const generateLessonsWithAI = async () => {
    if (!aiPrompt) {
      message.warning('Zəhmət olmasa dərs mövzusunu daxil edin');
      return;
    }

    if (!selectedClass) {
      message.warning('Zəhmət olmasa əvvəlcə bir sinif seçin');
      return;
    }

    setAiGenerating(true);
    setAiProgress(0);
    setGeneratedLessons([]);

    try {
      const difficultyText = aiDifficulty === 'easy' ? 'asan' : aiDifficulty === 'medium' ? 'orta' : 'çətin';
      const languageText = aiLanguage === 'az' ? 'Azərbaycan' : aiLanguage === 'en' ? 'İngilis' : 'Rus';
      const lessonTypeText = aiLessonType === 'theory' ? 'nəzəri' : aiLessonType === 'practice' ? 'praktik' : 'qarışıq';
      
      // Şəkillər daxil olan prompt
      const prompt = `
        Mənə ${aiLessonCount} ədəd ${difficultyText} çətinlik səviyyəsində, ${lessonTypeText} tipli dərs yaradın.
        Mövzu: ${aiPrompt}
        Sinif: ${selectedClass?.name || 'Ümumi'}
        Dil: ${languageText}
        
        Hər dərs aşağıdakı struktura uyğun olmalıdır:
        
        1. Başlıq: Qısa və aydın
        2. Məzmun: 500-800 söz, aydın izah, sadə dil
        3. Nümunələr: ${aiIncludeExamples ? '3-5 real nümunə' : 'yox'}
        4. Tapşırıqlar: ${aiIncludeExercises ? '3-5 tapşırıq' : 'yox'}
        5. Açar sözlər: 5-10 açar söz
        ${aiIncludeImages ? '6. Şəkillər: Hər dərsə aid 2-3 şəkil təsviri əlavə edin. Şəkillər üçün [ŞƏKİL: təsvir, URL?] formatında qeyd edin.' : ''}
        
        Hər dərsi aşağıdakı formatda yazın:
        
        DƏRS ${1}:
        BAŞLIQ: [dərsin başlığı]
        MƏZMUN: [dərsin məzmunu - sadə dildə, aydın izah]
        ${aiIncludeImages ? 'ŞƏKİLLƏR: [ŞƏKİL 1: təsvir, ŞƏKİL 2: təsvir, ...]' : ''}
        NÜMUNƏLƏR: [nümunələr - hər biri ayrı sətirdə]
        TAPŞIRIQLAR: [tapşırıqlar - hər biri ayrı sətirdə]
        AÇAR SÖZLƏR: [açar söz1, açar söz2, açar söz3, ...]
        
        DƏRS ${2}:
        ...
        
        Sadəcə mətni qaytarın, əlavə izahat yazmayın. HTML kodları yazmayın, sadə mətn formatında yazın.
      `;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setAiProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      clearInterval(progressInterval);
      setAiProgress(100);

      const generatedText = response.data.candidates[0].content.parts[0].text;
      
      // Parse the generated text into lessons
      const lessons = parseGeneratedText(generatedText);
      
      if (lessons.length === 0) {
        throw new Error('Heç bir dərs yaradılmadı');
      }

      setGeneratedLessons(lessons);
      setSelectedLessons(lessons.map((_, index) => index));
      
      message.success(`${lessons.length} dərs uğurla yaradıldı`);
      
    } catch (error) {
      console.error('AI generation error:', error);
      message.error('AI dərsləri yaradılarkən xəta: ' + error.message);
    } finally {
      setAiGenerating(false);
    }
  };

  // Parse generated text into structured lessons
  const parseGeneratedText = (text) => {
    const lessons = [];
    const lessonBlocks = text.split(/DƏRS \d+:/g).filter(block => block.trim().length > 0);
    
    lessonBlocks.forEach((block, index) => {
      const titleMatch = block.match(/BAŞLIQ:\s*(.+?)(?=MƏZMUN:|ŞƏKİLLƏR:|NÜMUNƏLƏR:|TAPŞIRIQLAR:|AÇAR SÖZLƏR:|$)/i);
      const contentMatch = block.match(/MƏZMUN:\s*(.+?)(?=ŞƏKİLLƏR:|NÜMUNƏLƏR:|TAPŞIRIQLAR:|AÇAR SÖZLƏR:|$)/is);
      const imagesMatch = block.match(/ŞƏKİLLƏR:\s*(.+?)(?=NÜMUNƏLƏR:|TAPŞIRIQLAR:|AÇAR SÖZLƏR:|$)/is);
      const examplesMatch = block.match(/NÜMUNƏLƏR:\s*(.+?)(?=TAPŞIRIQLAR:|AÇAR SÖZLƏR:|$)/is);
      const exercisesMatch = block.match(/TAPŞIRIQLAR:\s*(.+?)(?=AÇAR SÖZLƏR:|$)/is);
      const keywordsMatch = block.match(/AÇAR SÖZLƏR:\s*(.+?)(?=$)/i);
      
      const title = titleMatch ? titleMatch[1].trim() : `Dərs ${index + 1}`;
      const content = contentMatch ? contentMatch[1].trim() : 'Məzmun tapılmadı';
      const imagesText = imagesMatch ? imagesMatch[1].trim() : '';
      const examples = examplesMatch ? examplesMatch[1].trim() : '';
      const exercises = exercisesMatch ? exercisesMatch[1].trim() : '';
      const keywords = keywordsMatch 
        ? keywordsMatch[1].split(',').map(k => k.trim()) 
        : [selectedClass?.subject || 'Ümumi'];
      
      // Şəkilləri parse et
      const images = [];
      if (imagesText && aiIncludeImages) {
        const imageMatches = imagesText.match(/ŞƏKİL \d+:\s*([^,]+)(?:,\s*(https?:\/\/[^\s]+))?/gi);
        if (imageMatches) {
          imageMatches.forEach((match, idx) => {
            const parts = match.split(/[:\s,]+/);
            const caption = parts.slice(2).join(' ').trim();
            images.push({
              url: getRandomImageUrl(800, 400, index * 10 + idx),
              alt: caption,
              caption: caption
            });
          });
        } else {
          // Əgər AI şəkil təsviri verməyibsə, mövzuya uyğun placeholder şəkillər əlavə et
          images.push({
            url: getRandomImageUrl(800, 400, index * 10 + 1),
            alt: title,
            caption: `${title} - Şəkilli izah`
          });
        }
      }
      
      // Format examples and exercises as HTML lists if needed
      const formattedExamples = examples.split('\n').filter(line => line.trim()).map(line => `<li>${line}</li>`).join('');
      const formattedExercises = exercises.split('\n').filter(line => line.trim()).map(line => `<li>${line}</li>`).join('');
      
      // Generate HTML content using the template with images
      const htmlContent = getLessonHTMLTemplate(
        title,
        content.replace(/\n/g, '<br>'),
        formattedExamples ? `<ul>${formattedExamples}</ul>` : '',
        formattedExercises ? `<ol>${formattedExercises}</ol>` : '',
        keywords,
        images
      );
      
      lessons.push({
        title,
        content: htmlContent,
        summary: content.substring(0, 150) + '...',
        duration: 45,
        difficulty: aiDifficulty,
        keywords,
        examples: formattedExamples,
        exercises: formattedExercises,
        images: images,
        rawContent: content
      });
    });
    
    return lessons;
  };

  // Save selected lessons to Firestore
  const saveSelectedLessons = async () => {
    if (selectedLessons.length === 0) {
      message.warning('Heç bir dərs seçilməyib');
      return;
    }

    setLoading(true);

    try {
      const batch = writeBatch(db);
      const lessonsRef = collection(db, COLLECTIONS.LESSONS);
      
      const lessonsToSave = selectedLessons.map(index => generatedLessons[index]);
      
      lessonsToSave.forEach((lesson, index) => {
        const lessonData = {
          title: lesson.title,
          content: lesson.content,
          summary: lesson.summary,
          duration: lesson.duration,
          difficulty: lesson.difficulty,
          keywords: lesson.keywords,
          examples: lesson.examples,
          exercises: lesson.exercises,
          images: lesson.images || [],
          classId: selectedClass.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          status: 'draft',
          order: lessons.length + index,
          isAIGenerated: true,
          aiPrompt: aiPrompt,
          hasImages: (lesson.images && lesson.images.length > 0) || false
        };
        
        const newLessonRef = doc(lessonsRef);
        batch.set(newLessonRef, lessonData);
      });

      // Update class lesson count
      const classRef = doc(db, COLLECTIONS.CLASSES, selectedClass.id);
      batch.update(classRef, {
        lessonCount: lessons.length + lessonsToSave.length,
        updatedAt: Timestamp.now()
      });

      await batch.commit();
      
      message.success(`${lessonsToSave.length} dərs uğurla əlavə edildi`);
      setIsAIGeneratorVisible(false);
      setAiPrompt('');
      setAiLessonCount(3);
      setCurrentStep(0);
      setGeneratedLessons([]);
      setSelectedLessons([]);
      
    } catch (error) {
      console.error('Error saving lessons:', error);
      message.error('Dərslər yadda saxlanılarkən xəta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (values) => {
    try {
      setLoading(true);
      
      const cleanValues = {
        name: values.name || '',
        description: values.description || '',
        grade: values.grade || '',
        subject: values.subject || '',
        tags: values.tags || []
      };

      const classData = {
        ...cleanValues,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lessonCount: 0,
        status: 'active'
      };

      if (editingClass) {
        await updateDoc(doc(db, COLLECTIONS.CLASSES, editingClass.id), {
          ...classData,
          updatedAt: Timestamp.now()
        });
        message.success('Class updated successfully');
      } else {
        await addDoc(collection(db, COLLECTIONS.CLASSES), classData);
        message.success('Class created successfully');
      }

      setIsClassModalVisible(false);
      form.resetFields();
      setEditingClass(null);
    } catch (error) {
      console.error('Error saving class:', error);
      message.error('Error saving class: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (classId) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, COLLECTIONS.CLASSES, classId));
      message.success('Class deleted successfully');
      if (selectedClass?.id === classId) {
        setSelectedClass(null);
      }
    } catch (error) {
      message.error('Error deleting class: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async (values) => {
    try {
      setLoading(true);
      
      if (!lessonContent || lessonContent === '<p><br></p>' || lessonContent === '<p></p>') {
        message.error('Please add lesson content');
        setLoading(false);
        return;
      }

      const cleanValues = {
        title: values.title || '',
        status: values.status || 'draft'
      };

      const lessonData = {
        title: cleanValues.title,
        content: lessonContent,
        classId: selectedClass.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: cleanValues.status,
        order: lessons.length,
        summary: values.summary || '',
        duration: values.duration || 45,
        difficulty: values.difficulty || 'medium',
        keywords: values.keywords || []
      };

      if (editingLesson) {
        await updateDoc(doc(db, COLLECTIONS.LESSONS, editingLesson.id), {
          ...lessonData,
          updatedAt: Timestamp.now()
        });
        message.success('Lesson updated successfully');
      } else {
        await addDoc(collection(db, COLLECTIONS.LESSONS), lessonData);
        
        const classRef = doc(db, COLLECTIONS.CLASSES, selectedClass.id);
        await updateDoc(classRef, {
          lessonCount: lessons.length + 1,
          updatedAt: Timestamp.now()
        });
        
        message.success('Lesson created successfully');
      }

      setIsLessonDrawerVisible(false);
      lessonForm.resetFields();
      setLessonContent('');
      setEditingLesson(null);
    } catch (error) {
      console.error('Error saving lesson:', error);
      message.error('Error saving lesson: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, COLLECTIONS.LESSONS, lessonId));
      
      const classRef = doc(db, COLLECTIONS.CLASSES, selectedClass.id);
      await updateDoc(classRef, {
        lessonCount: Math.max(0, lessons.length - 1),
        updatedAt: Timestamp.now()
      });
      
      message.success('Lesson deleted successfully');
    } catch (error) {
      message.error('Error deleting lesson: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(lessons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      sno: index + 1
    }));
    setLessons(updatedItems);

    try {
      const batch = writeBatch(db);
      
      items.forEach((item, index) => {
        const lessonRef = doc(db, COLLECTIONS.LESSONS, item.id);
        batch.update(lessonRef, { 
          order: index,
          updatedAt: Timestamp.now()
        });
      });

      await batch.commit();
      message.success('Lesson order updated successfully');
    } catch (error) {
      console.error('Error updating lesson order:', error);
      message.error('Error updating lesson order: ' + error.message);
      const originalItems = lessons.map((item, index) => ({
        ...item,
        sno: index + 1
      }));
      setLessons(originalItems);
    }
  };

  const openLessonDrawer = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      lessonForm.setFieldsValue({
        title: lesson.title,
        status: lesson.status,
        summary: lesson.summary,
        duration: lesson.duration,
        difficulty: lesson.difficulty,
        keywords: lesson.keywords
      });
      setLessonContent(lesson.content || '');
    } else {
      setEditingLesson(null);
      lessonForm.resetFields();
      setLessonContent('');
    }
    setIsLessonDrawerVisible(true);
  };

  const showContentPreview = (record) => {
    Modal.info({
      title: record.title,
      width: 900,
      content: (
        <div style={{ 
          maxHeight: '600px', 
          overflow: 'auto', 
          padding: '24px',
          background: '#fff',
          borderRadius: '8px'
        }}>
          <div dangerouslySetInnerHTML={{ __html: record.content }} />
        </div>
      ),
      okText: 'Bağla',
      okButtonProps: {
        style: { background: '#1890ff' }
      }
    });
  };

  const migrateLessons = async () => {
    if (!selectedClass || lessons.length === 0) return;
    
    const lessonsWithoutOrder = lessons.filter(l => l.order === undefined);
    if (lessonsWithoutOrder.length === 0) return;
    
    Modal.confirm({
      title: 'Köhnə dərsləri yenilə',
      content: `${lessonsWithoutOrder.length} köhnə dərs tapıldı. Onlara sıra nömrəsi əlavə edilsin?`,
      okText: 'Bəli',
      cancelText: 'Xeyr',
      onOk: async () => {
        try {
          setLoading(true);
          const batch = writeBatch(db);
          
          lessons.forEach((lesson, index) => {
            if (lesson.order === undefined) {
              const lessonRef = doc(db, COLLECTIONS.LESSONS, lesson.id);
              batch.update(lessonRef, { 
                order: index,
                updatedAt: Timestamp.now()
              });
            }
          });
          
          await batch.commit();
          message.success('Köhnə dərslər yeniləndi');
        } catch (error) {
          console.error('Error migrating lessons:', error);
          message.error('Xəta baş verdi: ' + error.message);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  useEffect(() => {
    if (lessons.length > 0) {
      const lessonsWithoutOrder = lessons.filter(l => l.order === undefined);
      if (lessonsWithoutOrder.length > 0) {
        const timer = setTimeout(() => {
          migrateLessons();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [lessons]);

  return (
    <Layout style={{ minHeight: '100vh', padding: '24px', background: '#f0f2f5' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <Space align="center">
          <BookOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
          <Title level={3} style={{ margin: 0 }}>Dərslərin İdarə Edilməsi</Title>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingClass(null);
            form.resetFields();
            setIsClassModalVisible(true);
          }}
          size="large"
        >
          Yeni Sinif Yarat
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column - Classes List */}
        <Col xs={24} md={8}>
          <Card 
            title={
              <Space>
                <TeamOutlined />
                <span>Siniflər</span>
              </Space>
            }
            extra={<Tag color="blue">{classes.length} sinif</Tag>}
            style={{ 
              height: 'calc(100vh - 200px)', 
              overflow: 'auto',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
            bodyStyle={{ padding: '12px' }}
          >
            <List
              itemLayout="horizontal"
              dataSource={classes}
              loading={loading}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    background: selectedClass?.id === item.id ? '#e6f7ff' : 'white',
                    border: selectedClass?.id === item.id ? '1px solid #1890ff' : '1px solid #f0f0f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onClick={() => setSelectedClass(item)}
                  actions={[
                    <Tooltip title="Redaktə et">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClass(item);
                          form.setFieldsValue({
                            name: item.name,
                            description: item.description,
                            grade: item.grade,
                            subject: item.subject,
                            tags: item.tags || []
                          });
                          setIsClassModalVisible(true);
                        }}
                      />
                    </Tooltip>,
                    <Tooltip title="Sil">
                      <Popconfirm
                        title="Bu sinfi silmək istədiyinizə əminsiniz?"
                        onConfirm={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(item.id);
                        }}
                        okText="Bəli"
                        cancelText="Xeyr"
                      >
                        <Button 
                          type="text" 
                          size="small"
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </Tooltip>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={<BookOutlined />} 
                        style={{ 
                          background: selectedClass?.id === item.id ? '#1890ff' : '#f0f0f0',
                          color: selectedClass?.id === item.id ? 'white' : '#595959'
                        }} 
                      />
                    }
                    title={<Text strong>{item.name || ''}</Text>}
                    description={
                      <Space size={[0, 4]} wrap>
                        {item.grade && <Tag color="cyan">{item.grade}</Tag>}
                        {item.subject && <Tag color="purple">{item.subject}</Tag>}
                        <Tag color="blue">{item.lessonCount || 0} dərs</Tag>
                        {item.isAIGenerated && (
                          <Tag color="purple" icon={<RobotOutlined />}>AI</Tag>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Right Column - Lessons Table with Drag and Drop */}
        <Col xs={24} md={16}>
          <Card 
            title={
              <Space>
                <ScheduleOutlined />
                <span>
                  {selectedClass 
                    ? `Dərslər - ${selectedClass.name}` 
                    : 'Dərslər (Sinif seçin)'}
                </span>
              </Space>
            }
            extra={
              selectedClass ? (
                <Space>
                  {indexBuilding && (
                    <Tag icon={<WarningOutlined />} color="warning">
                      Index qurulur... Müvəqqəti sıralama
                    </Tag>
                  )}
                  {lessons.filter(l => l.order === undefined).length > 0 && (
                    <Tag icon={<WarningOutlined />} color="orange">
                      {lessons.filter(l => l.order === undefined).length} köhnə dərs (avtomatik yenilənir)
                    </Tag>
                  )}
                  <Tag icon={<DragOutlined />} color="blue">
                    Dərsləri sürükləyib yerlərini dəyişin
                  </Tag>
                  <Button
                    type="primary"
                    icon={<RobotOutlined />}
                    style={{ background: '#722ed1', borderColor: '#722ed1' }}
                    onClick={() => setIsAIGeneratorVisible(true)}
                  >
                    AI ilə Dərs Yarat
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => openLessonDrawer()}
                  >
                    Yeni Dərs
                  </Button>
                </Space>
              ) : null
            }
            style={{ 
              height: 'calc(100vh - 200px)', 
              overflow: 'auto',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            {selectedClass ? (
              lessons.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="lessons">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {lessons.map((lesson, index) => (
                          <Draggable
                            key={lesson.id}
                            draggableId={lesson.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  marginBottom: '8px',
                                }}
                              >
                                <Card
                                  size="small"
                                  style={{
                                    background: snapshot.isDragging ? '#f9f9f9' : 'white',
                                    border: snapshot.isDragging ? '2px dashed #1890ff' : '1px solid #f0f0f0',
                                    boxShadow: snapshot.isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                                    opacity: lesson.order === undefined ? 0.8 : 1,
                                  }}
                                  bodyStyle={{ padding: '12px' }}
                                >
                                  <Row align="middle" gutter={16}>
                                    <Col span={1}>
                                      <div {...provided.dragHandleProps}>
                                        <DragOutlined style={{ 
                                          fontSize: '18px', 
                                          color: '#999',
                                          cursor: 'grab'
                                        }} />
                                      </div>
                                    </Col>
                                    <Col span={1}>
                                      <Tag color={lesson.order === undefined ? "orange" : "blue"}>
                                        {index + 1}
                                      </Tag>
                                    </Col>
                                    <Col span={5}>
                                      <Space>
                                        <ReadOutlined style={{ color: '#1890ff' }} />
                                        <Text strong>{lesson.title || ''}</Text>
                                        {lesson.order === undefined && (
                                          <Tooltip title="Köhnə dərs, yenilənir...">
                                            <WarningOutlined style={{ color: '#faad14' }} />
                                          </Tooltip>
                                        )}
                                        {lesson.isAIGenerated && (
                                          <Tooltip title="AI tərəfindən yaradılıb">
                                            <RobotOutlined style={{ color: '#722ed1' }} />
                                          </Tooltip>
                                        )}
                                        {lesson.hasImages && (
                                          <Tooltip title="Şəkillər var">
                                            <PictureOutlined style={{ color: '#52c41a' }} />
                                          </Tooltip>
                                        )}
                                      </Space>
                                    </Col>
                                    <Col span={2}>
                                      <Tag color={lesson.difficulty === 'easy' ? 'green' : lesson.difficulty === 'medium' ? 'orange' : 'red'}>
                                        {lesson.difficulty === 'easy' ? 'Asan' : lesson.difficulty === 'medium' ? 'Orta' : 'Çətin'}
                                      </Tag>
                                    </Col>
                                    <Col span={2}>
                                      <Badge 
                                        color={lesson.status === 'published' ? 'green' : lesson.status === 'draft' ? 'orange' : 'default'}
                                        text={lesson.status === 'published' ? 'Dərc' : lesson.status === 'draft' ? 'Qaralama' : 'Arxiv'} 
                                      />
                                    </Col>
                                    <Col span={3}>
                                      <Text type="secondary">
                                        {lesson.duration || 45} dəq
                                      </Text>
                                    </Col>
                                    <Col span={3}>
                                      <Text type="secondary">
                                        {lesson.createdAt ? new Date(lesson.createdAt.toDate()).toLocaleDateString('az-AZ') : '-'}
                                      </Text>
                                    </Col>
                                    <Col span={7} style={{ textAlign: 'right' }}>
                                      <Space size="small">
                                        <Tooltip title="Məzmunu göstər">
                                          <Button 
                                            type="text"
                                            size="small"
                                            icon={<EyeOutlined />}
                                            onClick={() => showContentPreview(lesson)}
                                          />
                                        </Tooltip>
                                        <Tooltip title="HTML kodu göstər">
                                          <Button 
                                            type="text"
                                            size="small"
                                            icon={<CodeOutlined />}
                                            onClick={() => {
                                              Modal.info({
                                                title: `${lesson.title} - HTML Kodu`,
                                                width: 900,
                                                content: (
                                                  <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                                                    <pre style={{ background: '#f5f5f5', padding: 15, borderRadius: 5 }}>
                                                      {lesson.content}
                                                    </pre>
                                                  </div>
                                                ),
                                                okText: 'Bağla'
                                              });
                                            }}
                                          />
                                        </Tooltip>
                                        <Tooltip title="Redaktə et">
                                          <Button
                                            type="text"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => openLessonDrawer(lesson)}
                                          />
                                        </Tooltip>
                                        <Tooltip title="Sil">
                                          <Popconfirm
                                            title="Bu dərsi silmək istədiyinizə əminsiniz?"
                                            onConfirm={() => handleDeleteLesson(lesson.id)}
                                            okText="Bəli"
                                            cancelText="Xeyr"
                                          >
                                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                          </Popconfirm>
                                        </Tooltip>
                                      </Space>
                                    </Col>
                                  </Row>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <FileOutlined style={{ fontSize: 48, color: '#ccc' }} />
                  <p style={{ marginTop: '16px', color: '#999' }}>
                    Hələ dərs yoxdur. "Yeni Dərs" düyməsini klikləyin.
                  </p>
                  <Button
                    type="primary"
                    icon={<RobotOutlined />}
                    style={{ background: '#722ed1', borderColor: '#722ed1', marginTop: '16px' }}
                    onClick={() => setIsAIGeneratorVisible(true)}
                  >
                    AI ilə Dərs Yarat
                  </Button>
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 48px' }}>
                <TeamOutlined style={{ fontSize: 64, color: '#ccc' }} />
                <Title level={4} type="secondary" style={{ marginTop: '16px' }}>
                  Sinif Seçin
                </Title>
                <Text type="secondary">
                  Dərsləri görmək üçün sol paneldən bir sinif seçin
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Class Modal */}
      <Modal
        title={editingClass ? 'Sinifi Redaktə Et' : 'Yeni Sinif Yarat'}
        open={isClassModalVisible}
        onCancel={() => {
          setIsClassModalVisible(false);
          form.resetFields();
          setEditingClass(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateClass}
          initialValues={{
            name: '',
            description: '',
            grade: '',
            subject: '',
            tags: []
          }}
        >
          <Form.Item
            name="name"
            label="Sinif Adı"
            rules={[{ required: true, message: 'Sinif adını daxil edin' }]}
          >
            <Input placeholder="Məsələn: 10A, Riyaziyyat 101" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Təsvir"
          >
            <TextArea rows={4} placeholder="Sinif haqqında qısa məlumat" />
          </Form.Item>

          <Form.Item
            name="grade"
            label="Sinif Səviyyəsi"
          >
            <Input placeholder="Məsələn: 10-cu sinif, Başlanğıc" />
          </Form.Item>

          <Form.Item
            name="subject"
            label="Fənn"
          >
            <Input placeholder="Məsələn: Riyaziyyat, Fizika, Tarix" />
          </Form.Item>

          <Form.Item
            name="tags"
            label="Teqlər"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Teqlər daxil edin"
              allowClear
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingClass ? 'Yenilə' : 'Yarat'}
              </Button>
              <Button onClick={() => setIsClassModalVisible(false)}>
                Ləğv Et
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Lesson Drawer with HtmlEditorComp */}
      <Drawer
        title={editingLesson ? 'Dərsi Redaktə Et' : 'Yeni Dərs Yarat'}
        placement="right"
        width={1200}
        onClose={() => {
          setIsLessonDrawerVisible(false);
          lessonForm.resetFields();
          setLessonContent('');
          setEditingLesson(null);
        }}
        open={isLessonDrawerVisible}
        extra={
          <Space>
            <Button onClick={() => {
              setIsLessonDrawerVisible(false);
              lessonForm.resetFields();
              setLessonContent('');
              setEditingLesson(null);
            }}>
              Ləğv Et
            </Button>
            <Button 
              type="primary" 
              onClick={() => lessonForm.submit()} 
              loading={loading}
              icon={<SaveOutlined />}
            >
              {editingLesson ? 'Yenilə' : 'Yarat'}
            </Button>
          </Space>
        }
      >
        <Form
          form={lessonForm}
          layout="vertical"
          onFinish={handleCreateLesson}
          initialValues={{
            title: '',
            status: 'draft',
            duration: 45,
            difficulty: 'medium',
            keywords: []
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Dərsin Başlığı"
                rules={[{ required: true, message: 'Dərsin başlığını daxil edin' }]}
              >
                <Input placeholder="Dərsin başlığı" size="large" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="duration"
                label="Müddət (dəqiqə)"
              >
                <InputNumber min={5} max={180} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="difficulty"
                label="Çətinlik"
              >
                <Select>
                  <Option value="easy">Asan</Option>
                  <Option value="medium">Orta</Option>
                  <Option value="hard">Çətin</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="summary"
            label="Qısa Xülasə"
          >
            <TextArea rows={2} placeholder="Dərsin qısa xülasəsi" />
          </Form.Item>

          <Form.Item
            name="keywords"
            label="Açar Sözlər"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Açar sözlər daxil edin"
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
          >
            <Select>
              <Option value="draft">Qaralama</Option>
              <Option value="published">Dərc Edilib</Option>
              <Option value="archived">Arxivləşdirilib</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Dərsin Məzmunu"
            required
            help="HTML editoru ilə məzmun yaradın"
          >
            <HtmlEditorComp 
              data={{
                value: lessonContent,
                onChange: setLessonContent
              }} 
            />
          </Form.Item>

          <Divider>Canlı Önizləmə</Divider>
          
          <Card
            title="Önizləmə"
            bordered
            style={{ marginBottom: 24 }}
            bodyStyle={{
              padding: "20px",
              background: "#fff",
              maxHeight: "400px",
              overflow: "auto"
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: lessonContent }} />
          </Card>

          <Divider>HTML Kodu</Divider>
          
          <Card
            title="HTML Kodu"
            bordered
            style={{ marginBottom: 24 }}
          >
            <pre style={{ background: '#f5f5f5', padding: 15, borderRadius: 5, maxHeight: 300, overflow: 'auto' }}>
              {lessonContent}
            </pre>
          </Card>
        </Form>
      </Drawer>

      {/* AI Lesson Generator Modal */}
      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#722ed1' }} />
            <span>AI ilə Dərs Yaradılması</span>
          </Space>
        }
        open={isAIGeneratorVisible}
        onCancel={() => {
          setIsAIGeneratorVisible(false);
          setAiPrompt('');
          setAiLessonCount(3);
          setCurrentStep(0);
          setGeneratedLessons([]);
          setSelectedLessons([]);
        }}
        footer={null}
        width={900}
      >
        <Spin spinning={aiGenerating}>
          {!selectedClass && (
            <Alert
              message="Xəbərdarlıq"
              description="Dərs yaratmaq üçün əvvəlcə bir sinif seçməlisiniz."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Steps current={currentStep} style={{ marginBottom: 24 }}>
            <Step title="Mövzu" icon={<QuestionCircleOutlined />} />
            <Step title="Parametrlər" icon={<SettingOutlined />} />
            <Step title="Yaradılma" icon={<ThunderboltOutlined />} />
            <Step title="Seçim" icon={<CheckCircleOutlined />} />
          </Steps>

          {currentStep === 0 && (
            <Form layout="vertical">
              <Form.Item label="Dərs Mövzusu / Prompt" required>
                <TextArea
                  rows={4}
                  placeholder="Məsələn: Riyaziyyat - Törəmə mövzusunda 3 dərs yarat"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
              </Form.Item>
              <Alert
                message="İpucu"
                description="Mövzunu dəqiq yazın. Məsələn: 'Fizika - Nyuton qanunları', 'Tarix - Qarabağ xanlığı', 'Ədəbiyyat - Səməd Vurğun'"
                type="info"
                showIcon
              />
            </Form>
          )}

          {currentStep === 1 && (
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Dərs Sayı">
                    <InputNumber
                      min={1}
                      max={20}
                      value={aiLessonCount}
                      onChange={setAiLessonCount}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Çətinlik">
                    <Select value={aiDifficulty} onChange={setAiDifficulty}>
                      <Option value="easy">Asan</Option>
                      <Option value="medium">Orta</Option>
                      <Option value="hard">Çətin</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Dərs Tipi">
                    <Select value={aiLessonType} onChange={setAiLessonType}>
                      <Option value="theory">Nəzəri</Option>
                      <Option value="practice">Praktik</Option>
                      <Option value="mixed">Qarışıq</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Dil">
                    <Select value={aiLanguage} onChange={setAiLanguage}>
                      <Option value="az">Azərbaycan</Option>
                      <Option value="en">İngilis</Option>
                      <Option value="ru">Rus</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Əlavə Seçimlər">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Checkbox 
                    checked={aiIncludeExamples} 
                    onChange={(e) => setAiIncludeExamples(e.target.checked)}
                  >
                    Nümunələr əlavə et
                  </Checkbox>
                  <Checkbox 
                    checked={aiIncludeExercises} 
                    onChange={(e) => setAiIncludeExercises(e.target.checked)}
                  >
                    Tapşırıqlar əlavə et
                  </Checkbox>
                  <Checkbox 
                    checked={aiIncludeImages} 
                    onChange={(e) => setAiIncludeImages(e.target.checked)}
                  >
                    Şəkillər əlavə et (pulsuz şəkillər)
                  </Checkbox>
                </Space>
              </Form.Item>
            </Form>
          )}

          {currentStep === 2 && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              {aiGenerating ? (
                <>
                  <Progress type="circle" percent={aiProgress} status="active" />
                  <Title level={4} style={{ marginTop: 20 }}>Dərslər yaradılır...</Title>
                  <Paragraph>
                    <Text type="secondary">Zəhmət olmasa gözləyin. Bu bir neçə saniyə çəkə bilər.</Text>
                  </Paragraph>
                </>
              ) : (
                <>
                  <ThunderboltOutlined style={{ fontSize: 48, color: '#722ed1', marginBottom: 16 }} />
                  <Title level={4}>Dərslər yaradılmağa hazırdır!</Title>
                  <Paragraph>
                    <Text strong>Mövzu:</Text> {aiPrompt}<br />
                    <Text strong>Dərs sayı:</Text> {aiLessonCount}<br />
                    <Text strong>Çətinlik:</Text> {aiDifficulty === 'easy' ? 'Asan' : aiDifficulty === 'medium' ? 'Orta' : 'Çətin'}<br />
                    <Text strong>Sinif:</Text> {selectedClass?.name}
                  </Paragraph>
                  <Alert
                    message="Qeyd"
                    description="AI tərəfindən yaradılan dərsləri yoxlamaq və redaktə etmək tövsiyə olunur."
                    type="info"
                    showIcon
                  />
                </>
              )}
            </div>
          )}

          {currentStep === 3 && generatedLessons.length > 0 && (
            <div>
              <Alert
                message={`${generatedLessons.length} dərs yaradıldı`}
                description="İstədiyiniz dərsləri seçin və 'Seçilmişləri Yadda Saxla' düyməsini klikləyin."
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <List
                itemLayout="horizontal"
                dataSource={generatedLessons}
                style={{ maxHeight: 400, overflow: 'auto' }}
                renderItem={(lesson, index) => (
                  <List.Item
                    actions={[
                      <Checkbox 
                        checked={selectedLessons.includes(index)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLessons([...selectedLessons, index]);
                          } else {
                            setSelectedLessons(selectedLessons.filter(i => i !== index));
                          }
                        }}
                      >
                        Seç
                      </Checkbox>,
                      <Button 
                        type="link" 
                        size="small"
                        onClick={() => {
                          Modal.info({
                            title: lesson.title,
                            width: 900,
                            content: (
                              <div style={{ maxHeight: 500, overflow: 'auto', padding: 20 }}>
                                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                              </div>
                            ),
                            okText: 'Bağla'
                          });
                        }}
                      >
                        Önizlə
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar style={{ background: '#722ed1' }}>{index + 1}</Avatar>}
                      title={
                        <Space>
                          {lesson.title}
                          {lesson.images && lesson.images.length > 0 && (
                            <PictureOutlined style={{ color: '#52c41a' }} />
                          )}
                        </Space>
                      }
                      description={
                        <Space>
                          <Tag color="blue">{lesson.duration} dəq</Tag>
                          <Tag color={lesson.difficulty === 'easy' ? 'green' : lesson.difficulty === 'medium' ? 'orange' : 'red'}>
                            {lesson.difficulty === 'easy' ? 'Asan' : lesson.difficulty === 'medium' ? 'Orta' : 'Çətin'}
                          </Tag>
                          <Tag color="purple">{lesson.keywords.slice(0, 3).join(', ')}</Tag>
                          {lesson.images && lesson.images.length > 0 && (
                            <Tag color="green">{lesson.images.length} şəkil</Tag>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Geri
            </Button>
            <Space>
              {currentStep === 3 ? (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={saveSelectedLessons}
                  loading={loading}
                  disabled={selectedLessons.length === 0}
                >
                  Seçilmişləri Yadda Saxla ({selectedLessons.length})
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={() => {
                    if (currentStep === 0 && !aiPrompt) {
                      message.warning('Zəhmət olmasa mövzu daxil edin');
                      return;
                    }
                    if (currentStep === 2) {
                      generateLessonsWithAI();
                      setCurrentStep(3);
                    } else {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                  disabled={currentStep === 2 && aiGenerating}
                >
                  {currentStep === 2 ? 'Yarat' : 'İrəli'}
                </Button>
              )}
            </Space>
          </div>
        </Spin>
      </Modal>
    </Layout>
  );
};

export default CreateClass;