import axios from "axios";
import { buildResumeData } from "../lib/resume";
import { AppLanguage, Project, User } from "../types";

const fallbackTips: Record<AppLanguage, string[]> = {
  uz: [
    "Bio matnini natijaga yo'naltiring: tajriba, kuchli soha va biznes qiymatini bir jumlada ayting.",
    "Har bir loyiha uchun muammo, yechim va natijani alohida yozing. Bu rekruterga ish hajmini tez tushuntiradi.",
    "GitHub, LinkedIn va shaxsiy sayt linklarini to'ldiring. Ishonch signallari portfolio konversiyasini oshiradi.",
  ],
  en: [
    "Make the bio outcome-oriented: experience, strongest domain, and business value in one clear paragraph.",
    "For each project, separate the problem, solution, and result so recruiters understand the scope quickly.",
    "Fill in GitHub, LinkedIn, and website links. Trust signals improve portfolio conversion.",
  ],
  ru: [
    "Сделайте био ориентированным на результат: опыт, сильная область и бизнес-ценность в одном ясном абзаце.",
    "Для каждого проекта отдельно укажите проблему, решение и результат, чтобы рекрутер быстро понял масштаб работы.",
    "Заполните GitHub, LinkedIn и website. Сигналы доверия повышают конверсию портфолио.",
  ],
};

const FALLBACK_COPY = {
  uz: {
    links: "Aloqa linklari: GitHub, LinkedIn va shaxsiy sayt qo'shiladi.",
    summary: "Professional xulosa",
    skills: "Texnik ko'nikmalar",
    experience: "Professional tajriba",
    projects: "Tanlangan loyihalar",
    education: "Ta'lim",
    languages: "Tillar",
    emptyProjects: "GitHub loyihalari import qilingandan keyin bu bo'lim real case studylar bilan to'ldiriladi.",
  },
  en: {
    links: "Contact links: GitHub, LinkedIn, and personal website will be added.",
    summary: "Professional Summary",
    skills: "Core Skills",
    experience: "Professional Experience",
    projects: "Selected Projects",
    education: "Education",
    languages: "Languages",
    emptyProjects: "This section will be filled with real case studies after importing GitHub projects.",
  },
  ru: {
    links: "Контактные ссылки: GitHub, LinkedIn и личный website будут добавлены.",
    summary: "Профессиональное summary",
    skills: "Ключевые навыки",
    experience: "Профессиональный опыт",
    projects: "Избранные проекты",
    education: "Образование",
    languages: "Языки",
    emptyProjects: "Этот раздел заполнится реальными case studies после импорта GitHub-проектов.",
  },
};

const generateFallbackCv = (user: User, projects: Project[], language: AppLanguage = "uz") => {
  const visibleProjects = projects.filter((project) => project.isPublic !== false);
  const resume = buildResumeData(user, visibleProjects, language);
  const copy = FALLBACK_COPY[language];

  const projectLines = resume.projects.length > 0
    ? resume.projects.slice(0, 5).map((project) => (
      `### ${project.title}\n- ${project.role ? `${project.role}: ` : ""}${project.description}\n${project.impact ? `- Impact: ${project.impact}\n` : ""}- Tech stack: ${project.tags.join(", ") || "Open Source"}\n- Link: ${project.url || project.repoUrl || "portfolio orqali ko'rsatiladi"}`
    )).join("\n\n")
    : `- ${copy.emptyProjects}`;

  const experienceLines = resume.experience.length > 0
    ? resume.experience.map((item) => (
      `### ${item.role} - ${item.company}\n- ${item.description}`
    )).join("\n\n")
    : `- ${copy.emptyProjects}`;

  const educationLines = resume.education.map((item) => (
    `- ${item.degree}, ${item.institution} (${item.gradYear})`
  )).join("\n");

  return `# ${user.fullName || "Professional Developer"}\n${resume.headline}\n\n${resume.contactLinks.join(" | ") || copy.links}\n\n## ${copy.summary}\n${resume.summary}\n\n## ${copy.skills}\n${resume.skills.map((skill) => `- ${skill}`).join("\n")}\n\n## ${copy.experience}\n${experienceLines}\n\n## ${copy.projects}\n${projectLines}\n\n## ${copy.education}\n${educationLines}\n\n## ${copy.languages}\n${resume.languages.map((item) => `- ${item}`).join("\n")}`;
};

const generateTailoredFallbackCv = (
  user: User,
  projects: Project[],
  language: AppLanguage,
  jobDescription: string,
) => {
  const baseCv = generateFallbackCv(user, projects, language);
  const keywords = Array.from(new Set(
    jobDescription
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/i)
      .map((word) => word.trim())
      .filter((word) => word.length > 3)
      .slice(0, 12),
  ));

  return `${baseCv}\n\n## Target role alignment\n- Vakansiya keywordlari: ${keywords.join(", ") || "asosiy texnologiyalar"}.\n- Summary va project bulletlarda aynan vakansiyadagi texnologiya, impact va ownership signallarini kuchaytirish tavsiya qilinadi.\n- Mavjud bo'lmagan tajriba yoki kompaniya nomlarini qo'shmang; faqat real project dalillarini kuchaytiring.`;
};

export const getPortfolioRecommendations = async (
  user: User,
  projects: Project[],
  language: AppLanguage = "uz",
) => {
  try {
    const response = await axios.post("/api/ai/recommendations", { user, projects, language });
    return response.data?.tips || fallbackTips[language];
  } catch (error) {
    console.error("AI Error:", error);
    return fallbackTips[language];
  }
};

export const generateAiCV = async (
  user: User,
  projects: Project[],
  language: AppLanguage = "uz",
  templateId = "minimalist",
) => {
  try {
    const visibleProjects = projects.filter((project) => project.isPublic !== false);
    const resumeData = buildResumeData(user, visibleProjects, language);
    const response = await axios.post("/api/ai/cv", { user, projects: visibleProjects, language, resumeData, templateId });
    return response.data?.cv || generateFallbackCv(user, visibleProjects, language);
  } catch (error) {
    console.error("CV AI Error:", error);
    return generateFallbackCv(user, projects, language);
  }
};

export const tailorCvForJob = async (
  user: User,
  projects: Project[],
  language: AppLanguage = "uz",
  jobDescription: string,
) => {
  try {
    const visibleProjects = projects.filter((project) => project.isPublic !== false);
    const resumeData = buildResumeData(user, visibleProjects, language);
    const response = await axios.post("/api/ai/tailor", {
      user,
      projects: visibleProjects,
      language,
      resumeData,
      jobDescription,
    });

    return response.data?.cv || generateTailoredFallbackCv(user, visibleProjects, language, jobDescription);
  } catch (error) {
    console.error("Tailor CV AI Error:", error);
    return generateTailoredFallbackCv(user, projects, language, jobDescription);
  }
};
