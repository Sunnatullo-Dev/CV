import { Project, ResumeData, User } from '../types';

export interface AtsCheck {
  label: string;
  done: boolean;
  hint: string;
}

export interface AtsAnalysis {
  score: number;
  level: 'weak' | 'good' | 'excellent';
  checks: AtsCheck[];
}

export const analyzeResume = (resume: ResumeData, user: User, projects: Project[]): AtsAnalysis => {
  const impactProjects = projects.filter((project) => project.impact && project.impact.trim().length >= 20);
  const strongDescriptions = projects.filter((project) => project.description && project.description.trim().length >= 45);
  const checks: AtsCheck[] = [
    {
      label: 'Professional summary',
      done: resume.summary.trim().length >= 80,
      hint: "Bio 80+ belgidan iborat va natijaga yo'naltirilgan bo'lsin.",
    },
    {
      label: 'Contact links',
      done: resume.contactLinks.length >= 2,
      hint: "GitHub bilan birga LinkedIn yoki website qo'shing.",
    },
    {
      label: 'Skills keywords',
      done: resume.skills.length >= 6,
      hint: 'Kamida 6 ta texnologiya yoki professional keyword kerak.',
    },
    {
      label: 'Project depth',
      done: strongDescriptions.length >= 3,
      hint: "Kamida 3 ta loyiha 45+ belgili aniq tavsifga ega bo'lsin.",
    },
    {
      label: 'Impact metrics',
      done: impactProjects.length >= 2,
      hint: 'Kamida 2 ta loyihada natija, metric yoki biznes impact yozing.',
    },
    {
      label: 'Role clarity',
      done: resume.projects.filter((project) => project.role && project.role.trim().length > 2).length >= Math.min(3, Math.max(projects.length, 1)),
      hint: "Har bir muhim loyihada rolingiz aniq ko'rsatilgan bo'lsin.",
    },
    {
      label: 'GitHub signal',
      done: Boolean(user.githubUsername.trim()),
      hint: 'GitHub username rekruter uchun ishonch signalini beradi.',
    },
  ];

  const score = Math.round((checks.filter((item) => item.done).length / checks.length) * 100);
  const level = score >= 86 ? 'excellent' : score >= 65 ? 'good' : 'weak';

  return { score, level, checks };
};
