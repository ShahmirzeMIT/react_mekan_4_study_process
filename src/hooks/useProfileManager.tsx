import React, { useState, useEffect } from 'react';
import { Form, message } from 'antd';
import { addDoc, collection, doc, getDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { UploadProps } from 'antd/es/upload/interface';
import { ProfileData, SkillField } from '@/types/profileManager';
import { auth, db, storage } from '@/config/firebase';
import { defaultEmptySkillFields } from './defaultEmptySkillFields';

// Updated Types
export interface ProfessionalLevelData {
  professional: {
    percentage: number;
    description: string;
  };
  practitioner: {
    percentage: number;
    description: string;
  };
  fundamental: {
    percentage: number;
    description: string;
  };
  starter: {
    percentage: number;
    description: string;
  };
}

export default function useProfileManager({ userId }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string>('');
  const [currentCvUrl, setCurrentCvUrl] = useState<string>('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [skillFields, setSkillFields] = useState<SkillField[]>(defaultEmptySkillFields);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [gidCamps, setGidCamps] = useState<any[]>([]);
  const [previousUserData, setPreviousUserData] = useState<ProfileData | null>(null);
  const [currentLoadedUserId, setCurrentLoadedUserId] = useState<string>('');

  // Updated default professional level data (4 levels)
  const defaultProfessionalLevel: ProfessionalLevelData = {
    professional: {
      percentage: 0,
      description: 'Expert-level skills with leadership capabilities'
    },
    practitioner: {
      percentage: 0,
      description: 'Advanced skills with real-world experience'
    },
    fundamental: {
      percentage: 0,
      description: 'Core understanding of basic concepts'
    },
    starter: {
      percentage: 0,
      description: 'Beginner level with basic knowledge'
    }
  };

  // Reset form to empty/default state
  const resetFormToEmpty = () => {
    const emptyData = {
      name: "",
      title: "",
      avatar: "",
      introduction: "",
      email: "",
      cvUrl: "",
      isActive: true,
      socialLinks: {
        linkedin: "",
        github: "",
        twitter: "",
        portfolio: ""
      },
      chartData: [
        { name: "Execution & Delivery", value: 0, color: "#FF6B12" },
        { name: "Team Collaboration", value: 0, color: "#1E1647" },
        { name: "Technical Frequency", value: 0, color: "#C0C0C0" },
        { name: "Others", value: 0, color: "#FFD700" },
      ],
      progress: {
        percentage: 0,
        label: "Per Project"
      },
      statsData: {
        projectsCount: 0,
        skillsCount: 0
      },
      qrCode: {
        qrCode: "",
        copyLink: ""
      },
      skillFields: [...defaultEmptySkillFields],
      professionalLevel: { ...defaultProfessionalLevel }
    };

    form.setFieldsValue(emptyData);
    setSkillFields([...defaultEmptySkillFields]);
    setAvatarFile(null);
    setCvFile(null);
    setCurrentAvatar('');
    setCurrentCvUrl('');
  };

  // Skill field management functions
  const handleSaveSkillField = (id: string, newName: string) => {
    const updatedSkillFields = skillFields.map(field => 
      field.id === id ? { ...field, name: newName } : field
    );
    setSkillFields(updatedSkillFields);
    form.setFieldValue('skillFields', updatedSkillFields);
    setEditingField(null);
  };

  const handleSkillValueChange = (id: string, newValue: number) => {
    const updatedSkillFields = skillFields.map(field => 
      field.id === id ? { ...field, value: Math.min(newValue, field.maxValue || 100) } : field
    );
    setSkillFields(updatedSkillFields);
    form.setFieldValue('skillFields', updatedSkillFields);
  };

  const handleSkillTypeChange = (id: string, newType: string) => {
    const updatedSkillFields = skillFields.map(field => 
      field.id === id ? { ...field, type: newType } : field
    );
    setSkillFields(updatedSkillFields);
    form.setFieldValue('skillFields', updatedSkillFields);
  };

  const handleSkillDescriptionChange = (id: string, newDescription: string) => {
    const updatedSkillFields = skillFields.map(field => 
      field.id === id ? { ...field, description: newDescription } : field
    );
    setSkillFields(updatedSkillFields);
    form.setFieldValue('skillFields', updatedSkillFields);
  };

  const handleEditSkillField = (id: string) => {
    setEditingField(id);
  };

  const handleDeleteSkillField = (id: string) => {
    const updatedSkillFields = skillFields.filter(field => field.id !== id);
    setSkillFields(updatedSkillFields);
    form.setFieldValue('skillFields', updatedSkillFields);
    message.success('Skill field deleted successfully');
  };

  const addNewSkillField = () => {
    const newSkillField: SkillField = {
      id: `skill_${Date.now()}`,
      name: `New Skill ${skillFields.length + 1}`,
      value: 0,
      maxValue: 100,
      type: 'develop',
      description: ''
    };
    
    const updatedSkillFields = [...skillFields, newSkillField];
    setSkillFields(updatedSkillFields);
    form.setFieldValue('skillFields', updatedSkillFields);
    setEditingField(newSkillField.id);
  };

  // Skill ortalamalarını hesapla
  const calculateSkillAverages = (allSkills: any[]): Record<string, number> => {
    const skillGroups: Record<string, number[]> = {};

    allSkills.forEach(skill => {
      if (skill.id && typeof skill.value === 'number') {
        if (!skillGroups[skill.id]) {
          skillGroups[skill.id] = [];
        }
        skillGroups[skill.id].push(skill.value);
      }
    });

    const averages: Record<string, number> = {};
    Object.entries(skillGroups).forEach(([skillId, values]) => {
      const sum = values.reduce((total, value) => total + value, 0);
      averages[skillId] = Math.round(sum / values.length);
    });

    return averages;
  };

  // Skill fields'i güncelle veya oluştur
  const updateOrCreateSkillFields = (
    currentSkillFields: SkillField[], 
    skillAverages: Record<string, number>,
    defaultFields: SkillField[],
    gidCampData: any[]
  ): SkillField[] => {
    const result: SkillField[] = [...currentSkillFields];

    // Mevcut field'ları güncelle
    result.forEach(field => {
      if (skillAverages[field.id] !== undefined) {
        field.value = skillAverages[field.id];
      }
    });

    // Yeni field'ları ekle
    Object.entries(skillAverages).forEach(([skillId, averageValue]) => {
      const existingField = result.find(field => field.id === skillId);
      if (!existingField) {
        const defaultField = defaultFields.find(field => field.id === skillId);
        if (defaultField) {
          result.push({
            ...defaultField,
            value: averageValue
          });
        } else {
          result.push({
            id: skillId,
            name: `Skill ${skillId}`,
            value: averageValue,
            maxValue: 100,
            type: 'develop',
            description: ''
          });
        }
      }
    });

    return result;
  };

  // GID Camp verilerinden skill fields'i güncelleme
  const updateSkillFieldsFromGidCamps = async (gidCampData: any[]) => {
    try {
      const allSkillFieldsFromGidCamps: any[] = [];
      
      gidCampData.forEach(camp => {
        if (camp.skill_fields && Array.isArray(camp.skill_fields)) {
          camp.skill_fields.forEach((skill: any) => {
            allSkillFieldsFromGidCamps.push({
              ...skill,
              campId: camp.id,
              campName: camp.content || `Camp ${camp.order}`
            });
          });
        }
      });

      const skillAverages = calculateSkillAverages(allSkillFieldsFromGidCamps);
      const updatedSkillFields = updateOrCreateSkillFields(skillFields, skillAverages, defaultEmptySkillFields, gidCampData);
      
      setSkillFields(updatedSkillFields);
      form.setFieldValue('skillFields', updatedSkillFields);

      message.success(`Updated ${Object.keys(skillAverages).length} skills from GID camp evaluations`);

    } catch (error) {
      console.error('Error updating skill fields from GID camps:', error);
      message.error('Failed to update skills from GID camps');
    }
  };

  // Manual olarak GID camp verilerini yeniden yükleme fonksiyonu
  const reloadGidCampData = async () => {
    if (!userId) {
      return;
    }

    try {
      setLoading(true);
      message.success('GID camp data reloaded successfully');
    } catch (error) {
      console.error('Error reloading GID camp data:', error);
      message.error('Failed to reload GID camp data');
    } finally {
      setLoading(false);
    }
  };

  // Learner profilden veri çekme fonksiyonu
  const importFromLearner = async () => {
    if (!userId) {
      message.error('No user selected');
      return;
    }

    setImportLoading(true);
    try {
      const learnerDocRef = doc(db, 'profile_users_preview_learner', userId, 'profile', 'data');
      const learnerDocSnap = await getDoc(learnerDocRef);
      
      if (learnerDocSnap.exists()) {
        const learnerData = learnerDocSnap.data() as ProfileData;
        
        // Eğer learnerData'da skillFields yoksa, default skill fields kullan
        const importedSkillFields = learnerData.skillFields || defaultEmptySkillFields;
        
        // Handle backward compatibility for old professionalLevel structure
        let importedProfessionalLevel = learnerData.professionalLevel;
        if (importedProfessionalLevel) {
          // Convert old structure (with overall) to new structure (4 levels)
          importedProfessionalLevel = {
            professional: importedProfessionalLevel.professional || {
              percentage: 0,
              description: 'Expert-level skills with leadership capabilities'
            },
            practitioner: importedProfessionalLevel.practitioner || {
              percentage: 0,
              description: 'Advanced skills with real-world experience'
            },
            fundamental: importedProfessionalLevel.fundamental || {
              percentage: 0,
              description: 'Core understanding of basic concepts'
            },
            starter: importedProfessionalLevel.starter || {
              percentage: 0,
              description: 'Beginner level with basic knowledge'
            }
          };
        }
        
        const updatedData = {
          ...form.getFieldsValue(),
          name: learnerData.name || form.getFieldValue('name'),
          title: learnerData.title || form.getFieldValue('title'),
          introduction: learnerData.introduction || form.getFieldValue('introduction'),
          email: learnerData.email || form.getFieldValue('email'),
          avatar: learnerData.avatar || form.getFieldValue('avatar'),
          cvUrl: learnerData.cvUrl || form.getFieldValue('cvUrl'),
          socialLinks: {
            linkedin: learnerData.socialLinks?.linkedin || form.getFieldValue(['socialLinks', 'linkedin']),
            github: learnerData.socialLinks?.github || form.getFieldValue(['socialLinks', 'github']),
            twitter: learnerData.socialLinks?.twitter || form.getFieldValue(['socialLinks', 'twitter']),
            portfolio: learnerData.socialLinks?.portfolio || form.getFieldValue(['socialLinks', 'portfolio']),
          },
          chartData: learnerData.chartData || form.getFieldValue('chartData'),
          progress: learnerData.progress || form.getFieldValue('progress'),
          statsData: learnerData.statsData || form.getFieldValue('statsData'),
          professionalLevel: importedProfessionalLevel || form.getFieldValue('professionalLevel') || { ...defaultProfessionalLevel },
          skillFields: importedSkillFields,
        };

        form.setFieldsValue(updatedData);
        setSkillFields(importedSkillFields);
        
        if (learnerData.avatar) {
          setCurrentAvatar(learnerData.avatar);
        }
        if (learnerData.cvUrl) {
          setCurrentCvUrl(learnerData.cvUrl);
        }

        message.success('Profile data imported successfully from Learner profile!');
        setImportModalVisible(false);
      } else {
        message.warning('No learner profile data found to import');
      }
    } catch (error: any) {
      console.error('Import from learner error:', error);
      message.error('Failed to import from learner profile: ' + error.message);
    } finally {
      setImportLoading(false);
    }
  };

  const loadProfileData = async () => {
    if (!userId) {
      return;
    }

    // Clear form immediately when userId changes to prevent showing previous user's data
    if (currentLoadedUserId !== userId) {
      resetFormToEmpty();
    }

    setLoading(true);
    try {
      const docRef = doc(db, 'profile_users', userId, 'profile', 'data');
      const docSnap = await getDoc(docRef);
      
      let profileData: ProfileData | null = null;
    
      if (docSnap.exists()) {
        profileData = docSnap.data() as ProfileData;
      } 
      
      if (profileData) {
        // Handle backward compatibility for professionalLevel
        let professionalLevelData = profileData.professionalLevel;
        if (professionalLevelData) {
          // If it has old structure (with overall), convert to new structure
          if ('overall' in professionalLevelData) {
            professionalLevelData = {
              professional: {
                percentage: 0,
                description: 'Expert-level skills with leadership capabilities'
              },
              practitioner: professionalLevelData.practitioner || {
                percentage: 0,
                description: 'Advanced skills with real-world experience'
              },
              fundamental: professionalLevelData.fundamental || {
                percentage: 0,
                description: 'Core understanding of basic concepts'
              },
              starter: professionalLevelData.starter || {
                percentage: 0,
                description: 'Beginner level with basic knowledge'
              }
            };
          }
        }
        
        const completeProfileData = {
          ...profileData,
          professionalLevel: professionalLevelData || { ...defaultProfessionalLevel }
        };
        
        form.setFieldsValue(completeProfileData);
        setCurrentAvatar(profileData.avatar || '');
        setCurrentCvUrl(profileData.cvUrl || '');
        
        const loadedSkillFields = profileData.skillFields || defaultEmptySkillFields;
        setSkillFields(loadedSkillFields);
        form.setFieldValue('skillFields', loadedSkillFields);
        
        setCurrentLoadedUserId(userId);
      } else {
        resetFormToEmpty();
        setCurrentLoadedUserId(userId);
      }
    } catch (error: any) {
      console.error('Load profile error:', error);
      if (error.code === 'permission-denied') {
        message.error('Permission denied: Cannot access profile data');
      } else {
        message.error('Failed to load profile data: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Main useEffect
  useEffect(() => {
    loadProfileData();
  }, [userId]);

  // File upload handlers
  const handleAvatarUpload: UploadProps['beforeUpload'] = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return false;
    }

    setAvatarFile(file);
    return false;
  };

  const handleCvUpload: UploadProps['beforeUpload'] = (file) => {
    const isPdf = file.type === 'application/pdf';
    const isDoc = file.type.includes('document') || file.name.endsWith('.doc') || file.name.endsWith('.docx');
    
    if (!isPdf && !isDoc) {
      message.error('You can only upload PDF or Word documents!');
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('File must be smaller than 5MB!');
      return false;
    }

    setCvFile(file);
    return false;
  };

  const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
    try {
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${path}_${timestamp}.${fileExtension}`;
      
      const storageRef = ref(storage, `profiles/${userId}/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      message.success(`${path === 'avatars' ? 'Avatar' : 'CV'} uploaded successfully`);
      return downloadURL;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload ${path}: ${error.message}`);
    }
  };

  const cleanObject = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(cleanObject).filter(item => item !== null && item !== undefined);
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = cleanObject(value);
        if (cleanedValue !== null && cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
      return cleaned;
    }
    
    return obj;
  };

  const handleSubmit = async (values: ProfileData) => {
    if (!userId) {
      return;
    }

    if (!values.name || values.name.trim() === '') {
      message.error('Full Name is required');
      return;
    }

    // Validate professional level percentages
    if (values.professionalLevel) {
      const { professional, practitioner, fundamental, starter } = values.professionalLevel;
      
      const validatePercentage = (value: any, fieldName: string) => {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          message.error(`${fieldName} must be a valid number`);
          return false;
        }
        if (numValue < 0 || numValue > 100) {
          message.error(`${fieldName} must be between 0 and 100`);
          return false;
        }
        return true;
      };

      if (professional && !validatePercentage(professional.percentage, 'Professional percentage')) {
        return;
      }
      
      if (practitioner && !validatePercentage(practitioner.percentage, 'Practitioner percentage')) {
        return;
      }
      
      if (fundamental && !validatePercentage(fundamental.percentage, 'Fundamental percentage')) {
        return;
      }
      
      if (starter && !validatePercentage(starter.percentage, 'Starter percentage')) {
        return;
      }
    }

    setSaving(true);
    try {
      let avatarUrl = currentAvatar;
      let cvUrl = currentCvUrl;

      if (avatarFile) {
        avatarUrl = await uploadFileToStorage(avatarFile, 'avatars');
        setCurrentAvatar(avatarUrl);
        setAvatarFile(null);
      }

      if (cvFile) {
        cvUrl = await uploadFileToStorage(cvFile, 'cv');
        setCurrentCvUrl(cvUrl);
        setCvFile(null);
      }

      // Ensure percentages are numbers
      const processedValues = {
        ...values,
        professionalLevel: values.professionalLevel ? {
          professional: {
            percentage: Number(values.professionalLevel.professional?.percentage) || 0,
            description: values.professionalLevel.professional?.description || ''
          },
          practitioner: {
            percentage: Number(values.professionalLevel.practitioner?.percentage) || 0,
            description: values.professionalLevel.practitioner?.description || ''
          },
          fundamental: {
            percentage: Number(values.professionalLevel.fundamental?.percentage) || 0,
            description: values.professionalLevel.fundamental?.description || ''
          },
          starter: {
            percentage: Number(values.professionalLevel.starter?.percentage) || 0,
            description: values.professionalLevel.starter?.description || ''
          }
        } : { ...defaultProfessionalLevel }
      };

      const profileData: ProfileData = {
        ...processedValues,
        avatar: avatarUrl,
        cvUrl: cvUrl,
        skillFields: skillFields.length > 0 ? skillFields : defaultEmptySkillFields,
        updatedAt: new Date(),
        ...(!form.getFieldValue('createdAt') && { createdAt: new Date() })
      };

      const batch = writeBatch(db);

      const profileUsersRef = doc(db, 'profile_users', userId, 'profile', 'data');
      batch.set(profileUsersRef, profileData, { merge: true });

      const previewLearnerRef = doc(db, 'profile_users_preview_learner', userId, 'profile', 'data');
      batch.set(previewLearnerRef, profileData, { merge: true });

      await batch.commit();

      await logAuditAction('update', 'profile', 'data');
      message.success('Profile updated successfully in both collections!');
      
    } catch (error: any) {
      console.error('Save profile error:', error);
      if (error.code === 'permission-denied') {
        message.error('Permission denied: Cannot update profile. Check Firestore rules.');
      } else if (error.message.includes('upload')) {
        message.error(error.message);
      } else {
        message.error('Failed to update profile: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const logAuditAction = async (action: string, collectionName: string, docId: string) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const formValues = form.getFieldsValue();
        const cleanedChanges = cleanObject(formValues);
        
        await addDoc(collection(db, 'auditLogs'), {
          userId: user.uid,
          userEmail: user.email,
          action,
          collection: collectionName,
          docId,
          targetUserId: userId,
          timestamp: new Date(),
          changes: cleanedChanges
        });
      }
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  };

  const resetAllFields = () => {
    const currentName = form.getFieldValue('name') || '';
    
    const resetData = {
      name: currentName,
      title: "",
      introduction: "",
      email: "",
      socialLinks: {
        linkedin: "",
        github: "",
        twitter: "",
        portfolio: ""
      },
      chartData: [
        { name: "Execution & Delivery", value: 0, color: "#FF6B12" },
        { name: "Team Collaboration", value: 0, color: "#1E1647" },
        { name: "Technical Frequency", value: 0, color: "#C0C0C0" },
        { name: "Others", value: 0, color: "#FFD700" },
      ],
      progress: {
        percentage: 0,
        label: "Per Project"
      },
      statsData: {
        projectsCount: 0,
        skillsCount: 0
      },
      qrCode: {
        qrCode: "",
        copyLink: ""
      },
      skillFields: [...defaultEmptySkillFields],
      professionalLevel: { ...defaultProfessionalLevel }
    };

    form.setFieldsValue(resetData);
    setSkillFields([...defaultEmptySkillFields]);
    setAvatarFile(null);
    setCvFile(null);
    setCurrentAvatar('');
    setCurrentCvUrl('');
  };

  const clearAllFields = () => {
    resetFormToEmpty();
  };

  return {
    form,
    loading, 
    setLoading,
    saving, 
    setSaving,
    avatarFile, 
    setAvatarFile,
    cvFile, 
    setCvFile,
    currentAvatar, 
    setCurrentAvatar,
    currentCvUrl, 
    setCurrentCvUrl, 
    editingField, 
    setEditingField,
    skillFields, 
    setSkillFields,
    importModalVisible,
    setImportModalVisible,
    importLoading,
    importFromLearner,
    loadProfileData,
    handleAvatarUpload,
    handleCvUpload,
    uploadFileToStorage,
    handleSubmit,
    logAuditAction,
    resetAllFields,
    clearAllFields,
    gidCamps, 
    updateSkillFieldsFromGidCamps,
    reloadGidCampData,
    previousUserData,
    handleSaveSkillField,
    handleSkillValueChange,
    handleSkillTypeChange,
    handleSkillDescriptionChange,
    handleEditSkillField,
    handleDeleteSkillField,
    addNewSkillField
  };
}