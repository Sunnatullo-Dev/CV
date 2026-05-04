export type AppLanguage = 'uz' | 'en' | 'ru';

export interface User {
  id: string;
  fullName: string;
  bio: string;
  avatarUrl?: string;
  githubUsername: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  role?: string;
  impact?: string;
  url?: string;
  repoUrl?: string;
  githubId?: number;
  tags: string[];
  image?: string;
  isPublic: boolean;
  order: number;
}

export interface PortfolioConfig {
  id: string;
  userId: string;
  slug: string;
  templateId: string;
  published: boolean;
  settings: {
    primaryColor: string;
    fontFamily: string;
    showGithubStats: boolean;
  };
}

export interface ResumeData {
  language: AppLanguage;
  headline: string;
  contactLinks: string[];
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: ResumeProject[];
  languages: string[];
  certifications: string[];
}

export interface Experience {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  gradYear: string;
}

export interface ResumeProject {
  title: string;
  description: string;
  tags: string[];
  url?: string;
  repoUrl?: string;
}
