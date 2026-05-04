import { GoogleGenAI } from "@google/genai";
import { AppLanguage, User, Project } from "../types";

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
};

const fallbackTips = [
  "Bio matnini natijaga yo'naltiring: tajriba, kuchli soha va biznes qiymatini bir jumlada ayting.",
  "Har bir loyiha uchun muammo, yechim va natijani alohida yozing. Bu rekruterga ish hajmini tez tushuntiradi.",
  "GitHub, LinkedIn va shaxsiy sayt linklarini to'ldiring. Ishonch signallari portfolio konversiyasini oshiradi."
];

const CV_LANGUAGE_NAMES: Record<AppLanguage, string> = {
  uz: "o'zbek",
  en: "English",
  ru: "Russian",
};

const generateFallbackCv = (user: User, projects: Project[], language: AppLanguage = "uz") => {
  const socialLinks = user.socialLinks || {};
  const allTags = Array.from(new Set(projects.flatMap((project) => project.tags))).filter(Boolean);
  const links = [
    user.githubUsername ? `[GitHub](https://github.com/${user.githubUsername})` : null,
    socialLinks.linkedin ? `[LinkedIn](${socialLinks.linkedin})` : null,
    socialLinks.website ? `[Website](${socialLinks.website})` : null,
  ].filter(Boolean).join(" | ");

  const projectLines = projects.length > 0
    ? projects.slice(0, 5).map((project) => (
      `### ${project.title}\n- ${project.description}\n- Texnologiyalar: ${project.tags.join(", ") || "asosiy texnologiyalar"}\n- Link: ${project.url || project.repoUrl || "portfolio orqali ko'rsatiladi"}`
    )).join("\n\n")
    : "- GitHub loyihalari import qilingandan keyin bu bo'lim real case studylar bilan to'ldiriladi.";

  const sections = {
    uz: {
      links: "Aloqa linklari: GitHub, LinkedIn va shaxsiy sayt qo'shiladi.",
      summary: "Professional xulosa",
      skills: "Texnik ko'nikmalar",
      projects: "Tanlangan loyihalar",
      workStyle: "Ish uslubi",
      fallbackSummary: "Natijaga yo'naltirilgan developer. Murakkab biznes talablarini aniq, ishonchli va kengayadigan raqamli mahsulotlarga aylantirishga ixtisoslashgan.",
      bullets: [
        "Talablarni tez tushunish, prioritetlash va aniq texnik yechimga aylantirish.",
        "Kod sifati, o'qilishi va keyinchalik kengaytirishga e'tibor berish.",
        "Natijani foydalanuvchi tajribasi va biznes qiymati bilan bog'lash.",
      ],
    },
    en: {
      links: "Contact links: GitHub, LinkedIn, and personal website will be added.",
      summary: "Professional Summary",
      skills: "Technical Skills",
      projects: "Selected Projects",
      workStyle: "Working Style",
      fallbackSummary: "Results-driven developer focused on turning complex business requirements into reliable, scalable digital products.",
      bullets: [
        "Translate requirements into clear technical solutions quickly.",
        "Prioritize readable, maintainable, and scalable code.",
        "Connect delivery quality with user experience and business value.",
      ],
    },
    ru: {
      links: "Контактные ссылки: GitHub, LinkedIn и личный сайт будут добавлены.",
      summary: "Профессиональное резюме",
      skills: "Технические навыки",
      projects: "Избранные проекты",
      workStyle: "Подход к работе",
      fallbackSummary: "Разработчик, ориентированный на результат: превращаю сложные бизнес-задачи в надежные и масштабируемые цифровые продукты.",
      bullets: [
        "Быстро превращаю требования в понятные технические решения.",
        "Делаю акцент на читаемом, поддерживаемом и масштабируемом коде.",
        "Связываю качество реализации с пользовательским опытом и бизнес-ценностью.",
      ],
    },
  }[language];

  return `# ${user.fullName || "Professional Developer"}\n${links || sections.links}\n\n## ${sections.summary}\n${user.bio || sections.fallbackSummary}\n\n## ${sections.skills}\n${allTags.length ? allTags.map((tag) => `- ${tag}`).join("\n") : "- Frontend development\n- Backend/API integration\n- Product thinking\n- GitHub workflow"}\n\n## ${sections.projects}\n${projectLines}\n\n## ${sections.workStyle}\n${sections.bullets.map((bullet) => `- ${bullet}`).join("\n")}`;
};

export const getPortfolioRecommendations = async (user: User, projects: Project[]) => {
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
        Loyihalar: ${projects.map(p => `${p.title}: ${p.description} (Texnologiyalar: ${p.tags.join(", ")})`).join("; ")}
        
        Maslahatlar o'zbek tilida bo'lsin.
      `,
    });

    const text = response.text || "";
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return fallbackTips;
  } catch (error) {
    console.error("AI Error:", error);
    return fallbackTips;
  }
};

export const generateAiCV = async (user: User, projects: Project[], language: AppLanguage = "uz") => {
  try {
    const ai = getAiClient();
    if (!ai) return generateFallbackCv(user, projects, language);

    const socialLinks = user.socialLinks || {};
    const linksList = [
      `GitHub: https://github.com/${user.githubUsername}`,
      socialLinks.linkedin ? `LinkedIn: ${socialLinks.linkedin}` : null,
      socialLinks.twitter ? `Twitter: ${socialLinks.twitter}` : null,
      socialLinks.website ? `Website: ${socialLinks.website}` : null,
    ].filter(Boolean).join(", ");

    const allTags = Array.from(new Set(projects.flatMap(p => p.tags)));
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Sen professional HR mutaxassisisan. Quyidagi foydalanuvchi ma'lumotlari asosida professional CV yarat. 
        CV Markdown formatida bo'lsin va quyidagi bo'limlarni o'z ichiga olsin:
        1. **Sarlavha**: Ism-sharif va aloqa ma'lumotlari (${linksList}). Har bir sotsial tarmoq uchun Markdown formatida bosiladigan linklar (clickable links) yarat (masalan: [GitHub](https://github.com/${user.githubUsername})).
        2. **Professional xulosa (Summary)**: Foydalanuvchining maqsadi va tajribasi haqida qisqa, lekin kuchli matn. Bio: ${user.bio}.
        3. **Texnik ko'nikmalar (Skills)**: Loyihalarda ishlatilgan barcha texnologiyalar (${allTags.join(", ")}) asosida ko'nikmalarni mantiqiy guruhlarga ajrat (masalan: Dasturlash tillari, Freymvorklar, Ma'lumotlar bazasi, Asbob-uskunalar).
        4. **Ish tajribasi (Work Experience)**: Loyihalarni professional darajadagi ish tajribasi sifatida taqdim et. Loyiha tavsifidan kelib chiqib, foydalanuvchi uchun mos lavozim (masalan: "Senior Web Developer", "UI/UX Designer") va bajargan vazifalarini professional bullet-pointlar ko'rinishida tasvirlab ber.
        5. **Loyihalar (Projects)**: Eng asosiy loyihalar, texnologiyalar va erishilgan natijalar bilan.
        6. **Ta'lim (Education)**: Ma'lumot yo'q bo'lsa, foydalanuvchi sohasiga mos keladigan professional ta'lim darajasini (masalan: "Self-taught Developer" yoki tegishli kurslar) ko'rsat.
        
        Ma'lumotlar:
        Ism: ${user.fullName}
        Bio: ${user.bio}
        GitHub: ${user.githubUsername}
        Ijtimoiy tarmoqlar: ${linksList}
        Loyihalar: ${projects.map(p => `${p.title}: ${p.description} (Texnologiyalar: ${p.tags.join(", ")})`).join("; ")}
        
        CV ${CV_LANGUAGE_NAMES[language]} tilida, Markdown formatida, aniq, rekruterga tayyor va natijaga yo'naltirilgan professional uslubda bo'lsin.
      `,
    });

    return response.text || "CV yaratishda xatolik yuz berdi.";
  } catch (error) {
    console.error("CV AI Error:", error);
    return "Kechirasiz, CV yaratib bo'lmadi. Keyinroq urinib ko'ring.";
  }
};
