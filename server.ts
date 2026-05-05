import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import crypto from "crypto";
import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";
import { buildResumeData } from "./src/lib/resume";
import type { AppLanguage, Project, ResumeData, User } from "./src/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const PORTFOLIOS_FILE = path.join(DATA_DIR, "portfolios.json");

type StoredPortfolio = {
  id: string;
  userId: string;
  slug: string;
  templateId: string;
  published: boolean;
  settings: Record<string, unknown>;
  user: Record<string, unknown>;
  projects: unknown[];
  language: string;
  url: string;
  createdAt: string;
  updatedAt: string;
};

type PortfolioStore = Record<string, StoredPortfolio>;

const readPortfolioStore = async (): Promise<PortfolioStore> => {
  try {
    const raw = await fs.readFile(PORTFOLIOS_FILE, "utf8");
    return JSON.parse(raw) as PortfolioStore;
  } catch {
    return {};
  }
};

const writePortfolioStore = async (store: PortfolioStore) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(PORTFOLIOS_FILE, JSON.stringify(store, null, 2), "utf8");
};

const createSlug = (value: string) => (
  value
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
);

const AI_MODEL = "gemini-3-flash-preview";

const CV_LANGUAGE_NAMES: Record<AppLanguage, string> = {
  uz: "o'zbek",
  en: "English",
  ru: "Russian",
};

const normalizeLanguage = (value: unknown): AppLanguage => (
  value === "en" || value === "ru" || value === "uz" ? value : "uz"
);

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
};

const fallbackTips = [
  "Bio matnini natijaga yo'naltiring: tajriba, kuchli soha va biznes qiymatini bir jumlada ayting.",
  "Har bir loyiha uchun muammo, yechim va natijani alohida yozing. Bu rekruterga ish hajmini tez tushuntiradi.",
  "GitHub, LinkedIn va shaxsiy sayt linklarini to'ldiring. Ishonch signallari portfolio konversiyasini oshiradi.",
];

const buildFallbackCv = (user: User, projects: Project[], language: AppLanguage) => {
  const resume = buildResumeData(user, projects, language);
  const projectLines = resume.projects.length
    ? resume.projects.slice(0, 5).map((project) => (
      `### ${project.title}\n- ${project.role ? `${project.role}: ` : ""}${project.description}\n${project.impact ? `- Impact: ${project.impact}\n` : ""}- Tech stack: ${project.tags.join(", ") || "Open Source"}\n- Link: ${project.url || project.repoUrl || "portfolio orqali ko'rsatiladi"}`
    )).join("\n\n")
    : "- GitHub loyihalari import qilingandan keyin bu bo'lim real case studylar bilan to'ldiriladi.";

  return `# ${user.fullName || "Professional Developer"}\n${resume.headline}\n\n${resume.contactLinks.join(" | ") || "GitHub / LinkedIn / Website"}\n\n## Professional Summary\n${resume.summary}\n\n## Core Skills\n${resume.skills.map((skill) => `- ${skill}`).join("\n")}\n\n## Professional Experience\n${resume.experience.map((item) => `### ${item.role} - ${item.company}\n- ${item.description}`).join("\n\n") || "- Project experience will appear after GitHub import."}\n\n## Selected Projects\n${projectLines}\n\n## Education\n${resume.education.map((item) => `- ${item.degree}, ${item.institution} (${item.gradYear})`).join("\n")}\n\n## Languages\n${resume.languages.map((item) => `- ${item}`).join("\n")}`;
};

const getResumeInput = (body: Record<string, unknown>) => {
  const user = (body.user || {}) as User;
  const projects = Array.isArray(body.projects) ? body.projects as Project[] : [];
  const language = normalizeLanguage(body.language);
  const resumeData = (body.resumeData || buildResumeData(user, projects, language)) as ResumeData;
  return { user, projects, language, resumeData };
};

// Telegram InitData Verification
function verifyTelegramInitData(initData: string): boolean {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN not set, skipping verification for development");
    return true; // Dev modeda ruxsat beramiz
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    urlParams.delete("hash");

    const params = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(BOT_TOKEN)
      .digest();

    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(params)
      .digest("hex");

    return calculatedHash === hash;
  } catch (e) {
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Verify API
  app.post("/api/auth/verify", (req, res) => {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ error: "No initData provided" });

    const isValid = verifyTelegramInitData(initData);
    if (!isValid) return res.status(401).json({ error: "Invalid Telegram data" });

    res.json({ success: true });
  });

  // GitHub Proxy API
  // Client-side'da GitHub API key-ni saqlash xavfli bo'lgani uchun server orqali proxy qilamiz
  app.get("/api/github/repos/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const response = await axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch GitHub repos" });
    }
  });

  app.post("/api/ai/recommendations", async (req, res) => {
    const { user, projects, language } = getResumeInput(req.body);
    const ai = getAiClient();
    if (!ai) return res.json({ tips: fallbackTips });

    try {
      const response = await ai.models.generateContent({
        model: AI_MODEL,
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
      const tips = jsonMatch ? JSON.parse(jsonMatch[0]) : fallbackTips;
      res.json({ tips });
    } catch (error) {
      res.json({ tips: fallbackTips });
    }
  });

  app.post("/api/ai/cv", async (req, res) => {
    const { user, projects, language, resumeData } = getResumeInput(req.body);
    const ai = getAiClient();
    if (!ai) return res.json({ cv: buildFallbackCv(user, projects, language) });

    try {
      const response = await ai.models.generateContent({
        model: AI_MODEL,
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

      res.json({ cv: response.text || buildFallbackCv(user, projects, language) });
    } catch (error) {
      res.json({ cv: buildFallbackCv(user, projects, language) });
    }
  });

  app.post("/api/ai/tailor", async (req, res) => {
    const { user, projects, language, resumeData } = getResumeInput(req.body);
    const jobDescription = String(req.body.jobDescription || "").trim();
    const fallback = `${buildFallbackCv(user, projects, language)}\n\n## Target role alignment\n- Vakansiya matnidagi asosiy talablarni summary, skills va project bulletlarda real dalillar bilan kuchaytiring.\n- Mavjud bo'lmagan tajriba yoki kompaniya nomlarini qo'shmang.`;
    const ai = getAiClient();

    if (!jobDescription) {
      return res.status(400).json({ error: "Job description is required" });
    }

    if (!ai) return res.json({ cv: fallback });

    try {
      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: `
          Sen senior recruiter va ATS optimization mutaxassisisan. Quyidagi CV data va vakansiya matni asosida CV'ni aynan shu ishga moslab qayta yoz.

          Qoidalar:
          - CV Markdown formatida bo'lsin.
          - Mavjud bo'lmagan fakt, kompaniya, yil yoki sertifikat o'ylab topma.
          - Vakansiyadagi keywordlarni tabiiy joylashtir.
          - Summary, Core Skills va Selected Projects bo'limlarini vakansiyaga mos kuchaytir.
          - Har bir loyiha bulletida muammo, yechim va impact ko'rinsin.
          - CV ${CV_LANGUAGE_NAMES[language]} tilida bo'lsin.

          Structured resume data JSON:
          ${JSON.stringify(resumeData, null, 2)}

          Vakansiya matni:
          ${jobDescription}
        `,
      });

      res.json({ cv: response.text || fallback });
    } catch (error) {
      res.json({ cv: fallback });
    }
  });

  // PDF Export API (structured export fallback)
  app.post("/api/export/pdf", async (req, res) => {
    const { resumeData } = req.body;
    res.json({ message: "Use the client PDF exporter or browser print dialog.", data: resumeData });
  });

  // Portfolio Generate API
  app.post("/api/portfolio/generate", async (req, res) => {
    const { userId, githubUsername, templateId, settings, user, projects, language } = req.body;
    const username = githubUsername || user?.githubUsername;
    
    if (!username) {
      return res.status(400).json({ error: "GitHub username is required" });
    }

    const slug = createSlug(username);
    if (!slug) {
      return res.status(400).json({ error: "Valid GitHub username is required" });
    }
    
    const store = await readPortfolioStore();
    const now = new Date().toISOString();
    const existing = store[slug];
    const url = `${process.env.APP_URL || "http://localhost:3000"}/p/${slug}`;
    const portfolioConfig: StoredPortfolio = {
      id: existing?.id || crypto.randomUUID(),
      userId,
      slug,
      templateId,
      settings: settings || { primaryColor: "#000", fontFamily: "Inter", showGithubStats: true },
      user: user || { githubUsername: username },
      projects: Array.isArray(projects) ? projects : [],
      language: language || "uz",
      published: true,
      url,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    store[slug] = portfolioConfig;
    await writePortfolioStore(store);

    res.json({ 
      success: true, 
      message: "Portfolio successfully generated", 
      data: portfolioConfig 
    });
  });

  app.get("/api/portfolio/:slug", async (req, res) => {
    const slug = createSlug(req.params.slug);
    const store = await readPortfolioStore();
    const portfolio = store[slug];

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    res.json({ success: true, data: portfolio });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
