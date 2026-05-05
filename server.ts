import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import crypto from "crypto";
import fs from "fs/promises";

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
