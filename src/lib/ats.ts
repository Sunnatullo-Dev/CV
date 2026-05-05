import { AppLanguage, Project, ResumeData, User } from '../types';

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

const ATS_COPY: Record<AppLanguage, Array<{ label: string; hint: string }>> = {
  uz: [
    { label: 'Professional summary', hint: "Bio 80+ belgidan iborat va natijaga yo'naltirilgan bo'lsin." },
    { label: 'Aloqa linklari', hint: "GitHub bilan birga LinkedIn yoki website qo'shing." },
    { label: 'Skill keywordlar', hint: 'Kamida 6 ta texnologiya yoki professional keyword kerak.' },
    { label: 'Loyiha chuqurligi', hint: "Kamida 3 ta loyiha 45+ belgili aniq tavsifga ega bo'lsin." },
    { label: 'Impact metriclar', hint: 'Kamida 2 ta loyihada natija, metric yoki biznes impact yozing.' },
    { label: 'Rol aniqligi', hint: "Har bir muhim loyihada rolingiz aniq ko'rsatilgan bo'lsin." },
    { label: 'GitHub signali', hint: 'GitHub username rekruter uchun ishonch signalini beradi.' },
  ],
  en: [
    { label: 'Professional summary', hint: 'Bio should be 80+ characters and focused on outcomes.' },
    { label: 'Contact links', hint: 'Add LinkedIn or a website together with GitHub.' },
    { label: 'Skills keywords', hint: 'Add at least 6 technologies or professional keywords.' },
    { label: 'Project depth', hint: 'At least 3 projects should have clear 45+ character descriptions.' },
    { label: 'Impact metrics', hint: 'Add outcomes, metrics, or business impact to at least 2 projects.' },
    { label: 'Role clarity', hint: 'Your role should be clear for every important project.' },
    { label: 'GitHub signal', hint: 'GitHub username gives recruiters an extra trust signal.' },
  ],
  ru: [
    { label: 'Профессиональное summary', hint: 'Био должно быть 80+ символов и фокусироваться на результате.' },
    { label: 'Контактные ссылки', hint: 'Добавьте LinkedIn или website вместе с GitHub.' },
    { label: 'Skill keywords', hint: 'Добавьте минимум 6 технологий или профессиональных ключевых слов.' },
    { label: 'Глубина проектов', hint: 'Минимум 3 проекта должны иметь четкое описание на 45+ символов.' },
    { label: 'Impact-метрики', hint: 'Добавьте результат, метрики или бизнес-эффект минимум к 2 проектам.' },
    { label: 'Ясность роли', hint: 'Ваша роль должна быть понятна в каждом важном проекте.' },
    { label: 'GitHub-сигнал', hint: 'GitHub username дает рекрутеру дополнительный сигнал доверия.' },
  ],
};

export const analyzeResume = (resume: ResumeData, user: User, projects: Project[], language: AppLanguage = 'uz'): AtsAnalysis => {
  const impactProjects = projects.filter((project) => project.impact && project.impact.trim().length >= 20);
  const strongDescriptions = projects.filter((project) => project.description && project.description.trim().length >= 45);
  const copy = ATS_COPY[language] || ATS_COPY.uz;
  const checks: AtsCheck[] = [
    {
      label: copy[0].label,
      done: resume.summary.trim().length >= 80,
      hint: copy[0].hint,
    },
    {
      label: copy[1].label,
      done: resume.contactLinks.length >= 2,
      hint: copy[1].hint,
    },
    {
      label: copy[2].label,
      done: resume.skills.length >= 6,
      hint: copy[2].hint,
    },
    {
      label: copy[3].label,
      done: strongDescriptions.length >= 3,
      hint: copy[3].hint,
    },
    {
      label: copy[4].label,
      done: impactProjects.length >= 2,
      hint: copy[4].hint,
    },
    {
      label: copy[5].label,
      done: resume.projects.filter((project) => project.role && project.role.trim().length > 2).length >= Math.min(3, Math.max(projects.length, 1)),
      hint: copy[5].hint,
    },
    {
      label: copy[6].label,
      done: Boolean(user.githubUsername.trim()),
      hint: copy[6].hint,
    },
  ];

  const score = Math.round((checks.filter((item) => item.done).length / checks.length) * 100);
  const level = score >= 86 ? 'excellent' : score >= 65 ? 'good' : 'weak';

  return { score, level, checks };
};
