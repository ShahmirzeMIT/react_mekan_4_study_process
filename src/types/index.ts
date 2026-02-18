export interface Profile {
  name: string;
  title: string;
  avatar?: string;
  introduction: string;
  email: string;
  cvUrl?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  years: string;
  order?:any
  startDate?:any
  approved?:any
  isCurrent?:any
  endDate?:any
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  years: string;
  achievements: string[];
   order?:any
  startDate?:any
  approved?:any
  isCurrent?:any
  endDate?:any
}

export interface Project {
  id: string;
  title: string;
  role: string;
  description: string;
  technologies: string[];
  implementedBy: string[];
  repoPublic: boolean;
  repoUrl: string;
  order?:any
}

export interface Skill {
  id: string;
  name: string;
  level: string;
  description: string;
  order?:any
}

export interface Badge {
  id: string;
  title: string;
  issuer: string;
  date: string;
  fileUrl?: string;
  order?:any
  startDate?:any
  endDate?:any
  verifyUrl?:any
  copyLink?:any
}

export interface Recommendation {
  id: string;
  name: string;
  role: string;
  feedback: string;
}

export interface AuditLog {
  userId: string;
  userEmail: string;
  action: 'create' | 'update' | 'delete';
  collection: string;
  docId: string;
  timestamp: Date;
  changes?: any;
}

export interface AccessRequest {
  id?: string;
  userId: string;
  projectId: string;
  projectTitle: string;
  email: string;
  timestamp: Date;
  handled: boolean;
}
