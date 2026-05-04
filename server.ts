import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import crypto from "crypto";

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

  // PDF Export API (Placeholder - MVP uchun backend logikasi)
  app.post("/api/export/pdf", async (req, res) => {
    const { resumeData } = req.body;
    // Kelajakda WeasyPrint yoki Puppeteer integratsiyasi uchun joy
    res.json({ message: "PDF generation logic will be implemented here", data: resumeData });
  });

  // Portfolio Generate API
  app.post("/api/portfolio/generate", (req, res) => {
    const { userId, githubUsername, templateId, settings } = req.body;
    
    if (!githubUsername) {
      return res.status(400).json({ error: "GitHub username is required" });
    }

    // Dynamic slug yaratish
    const slug = githubUsername.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Kelajakda bu yerda DB (PostgreSQL) ga saqlash logikasi bo'ladi
    const portfolioConfig = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      slug,
      templateId,
      settings,
      published: true,
      url: `${process.env.APP_URL || "http://localhost:3000"}/p/${slug}`
    };

    res.json({ 
      success: true, 
      message: "Portfolio successfully generated", 
      data: portfolioConfig 
    });
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
