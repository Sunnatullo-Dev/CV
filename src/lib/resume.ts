import { AppLanguage, Project, ResumeData, User } from '../types';

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  uz: 'UZ',
  en: 'EN',
  ru: 'RU',
};

export const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  uz: "O'zbek",
  en: 'English',
  ru: 'Русский',
};

const FALLBACK_SUMMARY: Record<AppLanguage, string> = {
  uz: "Natijaga yo'naltirilgan developer. Murakkab biznes talablarini aniq, ishonchli va kengayadigan raqamli mahsulotlarga aylantirishga ixtisoslashgan.",
  en: 'Results-driven developer focused on turning complex business requirements into reliable, scalable digital products.',
  ru: 'Разработчик, ориентированный на результат: превращаю сложные бизнес-задачи в надежные и масштабируемые цифровые продукты.',
};

const FALLBACK_HEADLINE: Record<AppLanguage, string> = {
  uz: 'Full-stack Developer',
  en: 'Full-stack Developer',
  ru: 'Full-stack разработчик',
};

const FALLBACK_EDUCATION: Record<AppLanguage, string> = {
  uz: 'Professional self-directed learning and applied project experience',
  en: 'Professional self-directed learning and applied project experience',
  ru: 'Самостоятельное профессиональное обучение и практический проектный опыт',
};

export const buildResumeData = (
  user: User,
  projects: Project[],
  language: AppLanguage,
): ResumeData => {
  const socialLinks = user.socialLinks || {};
  const contactLinks = [
    user.githubUsername ? `https://github.com/${user.githubUsername}` : null,
    socialLinks.linkedin || null,
    socialLinks.website || null,
    socialLinks.twitter || null,
  ].filter(Boolean) as string[];

  const skills = Array.from(new Set(projects.flatMap((project) => project.tags))).filter(Boolean);

  return {
    language,
    headline: FALLBACK_HEADLINE[language],
    contactLinks,
    summary: user.bio?.trim() || FALLBACK_SUMMARY[language],
    skills: skills.length ? skills : ['React', 'TypeScript', 'API Integration', 'Product Thinking'],
    experience: projects.slice(0, 4).map((project) => ({
      company: project.title,
      role: project.role || FALLBACK_HEADLINE[language],
      startDate: 'Project',
      endDate: 'Present',
      description: [project.description, project.impact].filter(Boolean).join(' '),
    })),
    education: [
      {
        institution: FALLBACK_EDUCATION[language],
        degree: 'Software Engineering',
        gradYear: new Date().getFullYear().toString(),
      },
    ],
    projects: projects.map((project) => ({
      title: project.title,
      description: project.description,
      role: project.role,
      impact: project.impact,
      tags: project.tags,
      url: project.url,
      repoUrl: project.repoUrl,
    })),
    languages: [LANGUAGE_NAMES[language]],
    certifications: [],
  };
};
