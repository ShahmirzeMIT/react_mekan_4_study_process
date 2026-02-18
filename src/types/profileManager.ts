export interface ProgressData {
    percentage: number;
    label: string;
  }
  
  export interface ChartData {
    name: string;
    value: number;
    color: string;
  }
  
  export interface StatsData {
    projectsCount: number;
    skillsCount: number;
  }
  
  export  interface QrCodeData {
    qrCode: string;
    copyLink: string;
  }
  
  export interface SkillField {
    id: string;
    name: string;
    value: number;
    maxValue?: number;
    type?:string;
    description?:string
  }
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
  export  interface ProfileData {
    name: string;
    title: string;
    avatar: string;
    introduction: string;
    email: string;
    cvUrl: string;
    isActive?: boolean;
    socialLinks?: {
      linkedin?: string;
      github?: string;
      twitter?: string;
      portfolio?: string;
    };
    chartData?: ChartData[];
    progress?: ProgressData;
    statsData?: StatsData;
    qrCode?: QrCodeData;
    skillFields?: SkillField[];
    updatedAt?: any;
    professionalLevel: ProfessionalLevelData;
    createdAt?: any;
  }
  
 export  interface ProfileManagerProps {
    userId: string;
  }
  