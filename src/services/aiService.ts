import { GoogleGenAI } from "@google/genai";
import { buildResumeData } from "../lib/resume";
import { AppLanguage, Project, User } from "../types";

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
};

const CV_LANGUAGE_NAMES: Record<AppLanguage, string> = {
  uz: "o'zbek",
  en: "English",
  ru: "Russian",
};

const fallbackTips = [
  "Bio matnini natijaga yo'naltiring: tajriba, kuchli soha va biznes qiymatini bir jumlada ayting.",
  "Har bir loyiha uchun muammo, yechim va natijani alohida yozing. Bu rekruterga ish hajmini tez tushuntiradi.",
  "GitHub, LinkedIn va shaxsiy sayt linklarini to'ldiring. Ishonch signallari portfolio konversiyasini oshiradi.",
];

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
    links: "Contact links: GitHub, LinkedIn, and personal website will be added.",
    summary: "Professional Summary",
    skills: "Core Skills",
    experience: "Professional Experience",
    projects: "Selected Projects",
    education: "Education",
    languages: "Languages",
    emptyProjects: "This section will be filled with real case studies after importing GitHub projects.",
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

export const getPortfolioRecommendations = async (
  user: User,
  projects: Project[],
  language: AppLanguage = "uz",
) => {
  try {
    const ai = getAiClient();
    if (!ai) return fallbackTips;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Sen professional portfolio maslahatchisisan. Quyidagi foydalanuvchi ma'lumotlari va loyihalarini tahlil qilib,
        unga portfoliosini yaxshilash uchun 3 ta aniq va qisqa maslahat ber.
        Javobni faqat JSON formatida qaytar, massiv ko'rinishida: ["maslahat1", "maslahat2", "maslahat3"].

        Foydalanuvchi: ${user.fullName}
        Bio: ${user.bio}
        Loyihalar: ${projects.map((project) => `${project.title}: ${project.description}; role: ${project.role || "unknown"}; impact: ${project.impact || "unknown"}; texnologiyalar: ${project.tags.join(", ")}`).join("; ")}

        Maslahatlar ${CV_LANGUAGE_NAMES[language]} tilida bo'lsin.
      `,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);

    return fallbackTips;
  } catch (error) {
    console.error("AI Error:", error);
    return fallbackTips;
  }
};

export const generateAiCV = async (
  user: User,
  projects: Project[],
  language: AppLanguage = "uz",
) => {
  try {
    const visibleProjects = projects.filter((project) => project.isPublic !== false);
    const resumeData = buildResumeData(user, visibleProjects, language);
    const ai = getAiClient();

    if (!ai) return generateFallbackCv(user, visibleProjects, language);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Sen professional HR va ATS CV mutaxassisisan. Quyidagi structured resume data asosida professional CV yarat.
        CV Markdown formatida bo'lsin va aynan shu tartibdagi bo'limlarni o'z ichiga olsin:
        1. Sarlavha: ism-sharif, headline va aloqa linklari. Har bir link Markdown clickable formatda bo'lsin.
        2. Professional Summary: 3-4 qatordan oshmasin, kuchli va aniq bo'lsin.
        3. Core Skills: texnologiyalarni mantiqiy guruhlarga ajrat.
        4. Professional Experience: project role va impactdan foydalan. Kompaniya yoki ish joyini o'ylab topma.
        5. Selected Projects: har bir project uchun muammo, yechim va natija uslubida 2-3 bullet yoz.
        6. Education.
        7. Languages.

        Muhim qoida: mavjud bo'lmagan faktlarni, real ish joylarini yoki universitetlarni o'ylab topma.
        Ma'lumot yo'q joyda neutral professional wording ishlat.

        Structured resume data JSON:
        ${JSON.stringify(resumeData, null, 2)}

        CV ${CV_LANGUAGE_NAMES[language]} tilida, Markdown formatida, aniq, rekruterga tayyor va natijaga yo'naltirilgan professional uslubda bo'lsin.
      `,
    });

    return response.text || generateFallbackCv(user, visibleProjects, language);
  } catch (error) {
    console.error("CV AI Error:", error);
    return generateFallbackCv(user, projects, language);
  }
};
