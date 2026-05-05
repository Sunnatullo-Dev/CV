import React, { useMemo, useState } from "react";
import Markdown from "react-markdown";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  Eye,
  FileText,
  Github,
  Loader2,
  Palette,
  Plus,
  RotateCcw,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import axios from "axios";
import { AppLanguage, Project, User } from "../types";
import { cn } from "../lib/utils";
import { AiProfileAnswers, improveProfileWithAI, generateAiCV } from "../services/aiService";
import { getAppCopy } from "../lib/i18n";

type StudioStep = "profile" | "template" | "ready";

type SimpleStudioProps = {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  projects: Project[];
  onProjectsSynced: (projects: Project[]) => void;
  selectedTemplate: string;
  setSelectedTemplate: (id: string) => void;
  language: AppLanguage;
  onOpenPortfolio: () => void;
  onOpenCv: () => void;
  onResetWorkspace: () => void;
};

type GithubRepo = {
  id: number;
  name: string;
  description?: string | null;
  html_url?: string;
  homepage?: string | null;
  language?: string | null;
  topics?: string[];
  fork?: boolean;
  stargazers_count?: number;
};

const STEPS: Array<{ id: StudioStep; icon: React.ElementType }> = [
  { id: "profile", icon: UserRound },
  { id: "template", icon: Palette },
  { id: "ready", icon: CheckCircle2 },
];

const TEMPLATE_OPTIONS = [
  {
    id: "premium-developer",
    name: "Premium Developer",
    swatch: "from-sky-500 to-slate-900",
  },
  {
    id: "case-study-pro",
    name: "Case Study Pro",
    swatch: "from-amber-400 to-slate-900",
  },
  {
    id: "executive-architect",
    name: "Executive Architect",
    swatch: "from-stone-400 to-slate-950",
  },
  {
    id: "modern-technical",
    name: "Senior Developer",
    swatch: "from-cyan-400 to-slate-950",
  },
  {
    id: "modern-minimalist",
    name: "Product Engineer",
    swatch: "from-emerald-400 to-slate-900",
  },
  {
    id: "minimalist",
    name: "Minimalist Persona",
    swatch: "from-slate-300 to-slate-950",
  },
  {
    id: "dark",
    name: "Dark Technical",
    swatch: "from-indigo-500 to-black",
  },
  {
    id: "bento",
    name: "Modern Bento",
    swatch: "from-violet-400 to-indigo-700",
  },
  {
    id: "terminal",
    name: "DevOps Terminal",
    swatch: "from-lime-400 to-zinc-950",
  },
  {
    id: "serif",
    name: "Professional Serif",
    swatch: "from-amber-200 to-stone-800",
  },
  {
    id: "brutalist",
    name: "Bold Founder",
    swatch: "from-yellow-300 to-black",
  },
];

const emptyProjectDraft = {
  title: "",
  role: "",
  description: "",
  impact: "",
  tags: "",
  url: "",
  repoUrl: "",
};

const emptyAiDraft: AiProfileAnswers = {
  role: "",
  experience: "",
  skills: "",
  goal: "",
  targetRole: "",
  project: "",
};

const normalizeGithubUsername = (value: string) => value.trim().replace(/^@/, "");
const githubUsernamePattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

const normalizeProjectOrder = (items: Project[]) => items.map((project, order) => ({ ...project, order }));

export const SimpleStudio = ({
  user,
  setUser,
  projects,
  onProjectsSynced,
  selectedTemplate,
  setSelectedTemplate,
  language,
  onOpenPortfolio,
  onOpenCv,
  onResetWorkspace,
}: SimpleStudioProps) => {
  const copy = getAppCopy(language).studio;
  const [step, setStep] = useState<StudioStep>("profile");
  const [projectDraft, setProjectDraft] = useState(emptyProjectDraft);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isGeneratingCv, setIsGeneratingCv] = useState(false);
  const [aiCv, setAiCv] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [showAiOnboarding, setShowAiOnboarding] = useState(false);
  const [aiDraft, setAiDraft] = useState<AiProfileAnswers>(emptyAiDraft);
  const [isImprovingProfile, setIsImprovingProfile] = useState(false);

  const visibleProjects = useMemo(
    () => projects.filter((project) => project.isPublic !== false).sort((a, b) => a.order - b.order),
    [projects],
  );

  const selectedTemplateDetails = TEMPLATE_OPTIONS.find((template) => template.id === selectedTemplate) || TEMPLATE_OPTIONS[0];
  const selectedTemplateCopy = copy.templates[selectedTemplateDetails.id as keyof typeof copy.templates] || copy.templates["premium-developer"];

  const readiness = [
    { label: copy.ready.checklist.name, done: user.fullName.trim().length >= 3 },
    { label: copy.ready.checklist.bio, done: user.bio.trim().length >= 40 },
    { label: copy.ready.checklist.experience, done: Boolean(user.experienceSummary?.trim()) },
    { label: copy.ready.checklist.template, done: Boolean(selectedTemplate) },
    { label: copy.ready.checklist.project, done: visibleProjects.length > 0 },
  ];
  const readyCount = readiness.filter((item) => item.done).length;

  const updateUser = (patch: Partial<User>) => {
    setNotice(null);
    setUser((prev) => ({ ...prev, ...patch }));
  };

  const updateSocialLink = (key: "linkedin" | "twitter" | "website", value: string) => {
    setNotice(null);
    setUser((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [key]: value,
      },
    }));
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setNotice({ type: "error", text: copy.notices.avatarTooLarge });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      updateUser({ avatarUrl: String(reader.result) });
      setNotice({ type: "success", text: copy.notices.avatarAdded });
    };
    reader.readAsDataURL(file);
  };

  const updateDraft = (field: keyof typeof emptyProjectDraft, value: string) => {
    setNotice(null);
    setProjectDraft((prev) => ({ ...prev, [field]: value }));
  };

  const updateAiDraft = (field: keyof AiProfileAnswers, value: string) => {
    setNotice(null);
    setAiDraft((prev) => ({ ...prev, [field]: value }));
  };

  const applyAiOnboarding = async () => {
    const hasSignal = Object.values(aiDraft).some((value) => value.trim().length > 0);
    if (!hasSignal) {
      setNotice({ type: "error", text: copy.aiOnboarding.emptyError });
      return;
    }

    setIsImprovingProfile(true);
    setNotice(null);

    try {
      const profile = await improveProfileWithAI(aiDraft, user, visibleProjects, language);
      setUser((prev) => ({
        ...prev,
        bio: profile.bio || prev.bio,
        experienceSummary: profile.experienceSummary || prev.experienceSummary,
      }));

      if (profile.projectTitle && profile.projectDescription && visibleProjects.length === 0) {
        const nextProject: Project = {
          id: `ai-${Date.now()}`,
          userId: user.id || "1",
          title: profile.projectTitle,
          description: profile.projectDescription,
          impact: profile.projectImpact || "",
          role: profile.projectRole || aiDraft.targetRole || aiDraft.role || "Developer",
          tags: profile.tags?.length ? profile.tags : ["React", "TypeScript"],
          isPublic: true,
          order: projects.length,
        };
        onProjectsSynced(normalizeProjectOrder([...projects, nextProject]));
      }

      setShowAiOnboarding(false);
      setNotice({ type: "success", text: copy.aiOnboarding.success });
    } catch {
      setNotice({ type: "error", text: copy.notices.aiError });
    } finally {
      setIsImprovingProfile(false);
    }
  };

  const addManualProject = () => {
    const title = projectDraft.title.trim();
    const description = projectDraft.description.trim();

    if (title.length < 2 || description.length < 10) {
      setNotice({ type: "error", text: copy.notices.projectRequired });
      return;
    }

    const tags = projectDraft.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8);

    const nextProject: Project = {
      id: `manual-${Date.now()}`,
      userId: user.id || "1",
      title,
      description,
      role: projectDraft.role.trim() || "Developer",
      impact: projectDraft.impact.trim(),
      tags: tags.length ? tags : ["React", "TypeScript"],
      url: projectDraft.url.trim(),
      repoUrl: projectDraft.repoUrl.trim(),
      isPublic: true,
      order: projects.length,
    };

    onProjectsSynced(normalizeProjectOrder([...projects, nextProject]));
    setProjectDraft(emptyProjectDraft);
    setNotice({ type: "success", text: copy.notices.projectAdded });
  };

  const removeProject = (projectId: string) => {
    onProjectsSynced(normalizeProjectOrder(projects.filter((project) => project.id !== projectId)));
  };

  const toggleProject = (projectId: string) => {
    onProjectsSynced(
      projects.map((project) => (
        project.id === projectId ? { ...project, isPublic: project.isPublic === false } : project
      )),
    );
  };

  const importGithubProjects = async () => {
    const username = normalizeGithubUsername(user.githubUsername);

    if (!username || !githubUsernamePattern.test(username)) {
      setNotice({ type: "error", text: copy.notices.githubInvalid });
      return;
    }

    setIsImporting(true);
    setNotice(null);

    try {
      const response = await axios.get<GithubRepo[]>(`/api/github/repos/${username}`);
      const repos = response.data
        .filter((repo) => !repo.fork)
        .slice(0, 8);

      const githubProjects: Project[] = repos.map((repo, index) => {
        const tags = [repo.language, ...(repo.topics || [])]
          .filter(Boolean)
          .map(String)
          .slice(0, 5);

        return {
          id: String(repo.id),
          userId: user.id || "1",
          title: repo.name,
          description: repo.description || copy.notices.githubFallbackDescription,
          role: repo.language ? `${repo.language} Developer` : "Software Developer",
          impact: repo.stargazers_count ? `${repo.stargazers_count} GitHub star` : "",
          repoUrl: repo.html_url || "",
          url: repo.homepage || "",
          githubId: repo.id,
          tags: tags.length ? tags : ["Open Source"],
          isPublic: true,
          order: index,
        };
      });

      const manualProjects = projects.filter((project) => !project.githubId);
      onProjectsSynced(normalizeProjectOrder([...manualProjects, ...githubProjects]));
      updateUser({ githubUsername: username });
      setNotice({ type: "success", text: copy.notices.githubImportSuccess(githubProjects.length) });
    } catch {
      setNotice({ type: "error", text: copy.notices.githubImportError });
    } finally {
      setIsImporting(false);
    }
  };

  const generateCv = async () => {
    if (user.fullName.trim().length < 3 || user.bio.trim().length < 20) {
      setStep("profile");
      setNotice({ type: "error", text: copy.notices.aiNeedsProfile });
      return;
    }

    setStep("ready");
    setIsGeneratingCv(true);
    setNotice(null);

    try {
      const cv = await generateAiCV(user, visibleProjects, language, selectedTemplate);
      setAiCv(cv);
      setNotice({ type: "success", text: copy.notices.aiReady });
    } catch {
      setNotice({ type: "error", text: copy.notices.aiError });
    } finally {
      setIsGeneratingCv(false);
    }
  };

  const publishPortfolio = async () => {
    const username = normalizeGithubUsername(user.githubUsername);

    if (!username) {
      setStep("profile");
      setNotice({ type: "error", text: copy.notices.publishNeedsGithub });
      return;
    }

    setIsPublishing(true);
    setNotice(null);

    try {
      const response = await axios.post("/api/portfolio/generate", {
        userId: user.id || "1",
        githubUsername: username,
        templateId: selectedTemplate,
        user: { ...user, githubUsername: username },
        projects: visibleProjects,
        language,
        settings: { primaryColor: "#0f172a", fontFamily: "Inter", showGithubStats: true },
      });

      const url = response.data?.data?.url || "";
      setPublishedUrl(url);
      setNotice({ type: "success", text: copy.notices.publishReady });
    } catch {
      setNotice({ type: "error", text: copy.notices.publishError });
    } finally {
      setIsPublishing(false);
    }
  };

  const copyAiCv = async () => {
    if (!aiCv) return;
    await navigator.clipboard.writeText(aiCv);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1800);
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-4 sm:py-7 md:px-6">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{copy.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">{copy.title}</h1>
        </div>
        <button
          onClick={onResetWorkspace}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
        >
          <RotateCcw size={16} />
          {copy.reset}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          const isActive = step === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setStep(item.id)}
              className={cn(
                "flex h-12 min-w-0 items-center justify-center gap-2 rounded-md px-2 text-xs font-black transition sm:text-sm",
                isActive ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950",
              )}
            >
              <Icon size={16} />
              <span className="truncate">{index + 1}. {copy.steps[item.id]}</span>
            </button>
          );
        })}
      </div>

      {notice && (
        <div className={cn(
          "mt-4 rounded-lg border px-4 py-3 text-sm font-semibold",
          notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800",
        )}>
          {notice.text}
        </div>
      )}

      {step === "profile" && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-black text-slate-950">{copy.profile.sectionTitle}</h2>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{copy.profile.sectionSubtitle}</p>
              </div>
              <button
                onClick={() => setShowAiOnboarding(true)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-800 transition hover:bg-white"
              >
                <Sparkles size={15} />
                {copy.aiOnboarding.open}
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-[168px_minmax(0,1fr)]">
              <div>
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-slate-400">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName || copy.profile.photoAlt} className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <>
                      <Upload size={24} className="text-slate-500" />
                      <span className="px-3 text-xs font-bold text-slate-500">{copy.profile.uploadPhoto}</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" />
                </label>
              </div>

              <div className="grid gap-3">
                <Field label={copy.profile.fullName}>
                  <input
                    value={user.fullName}
                    onChange={(event) => updateUser({ fullName: event.target.value })}
                    placeholder={copy.profile.fullNamePlaceholder}
                    className="input-surface"
                  />
                </Field>

                <Field label={copy.profile.bio}>
                  <textarea
                    value={user.bio}
                    onChange={(event) => updateUser({ bio: event.target.value })}
                    placeholder={copy.profile.bioPlaceholder}
                    className="input-surface min-h-28 resize-none py-3"
                  />
                </Field>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label={copy.profile.experience}>
                <textarea
                  value={user.experienceSummary || ""}
                  onChange={(event) => updateUser({ experienceSummary: event.target.value })}
                  placeholder={copy.profile.experiencePlaceholder}
                  className="input-surface min-h-28 resize-none py-3"
                />
              </Field>

              <div className="grid gap-3">
                <Field label={copy.profile.github}>
                  <div className="relative">
                    <Github className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input
                      value={user.githubUsername}
                      onChange={(event) => updateUser({ githubUsername: normalizeGithubUsername(event.target.value) })}
                      placeholder="username"
                      className="input-surface pl-10"
                    />
                  </div>
                </Field>

                <Field label={copy.profile.linkedin}>
                  <input
                    value={user.socialLinks?.linkedin || ""}
                    onChange={(event) => updateSocialLink("linkedin", event.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="input-surface"
                  />
                </Field>

                <Field label={copy.profile.website}>
                  <input
                    value={user.socialLinks?.website || ""}
                    onChange={(event) => updateSocialLink("website", event.target.value)}
                    placeholder="https://..."
                    className="input-surface"
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-950">{copy.projects.title}</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">{copy.projects.publicCount(visibleProjects.length)}</p>
              </div>
              <button
                onClick={importGithubProjects}
                disabled={isImporting}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {isImporting ? <Loader2 size={15} className="animate-spin" /> : <Github size={15} />}
                {copy.projects.import}
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <input
                value={projectDraft.title}
                onChange={(event) => updateDraft("title", event.target.value)}
                placeholder={copy.projects.titlePlaceholder}
                className="input-surface"
              />
              <textarea
                value={projectDraft.description}
                onChange={(event) => updateDraft("description", event.target.value)}
                placeholder={copy.projects.descriptionPlaceholder}
                className="input-surface min-h-24 resize-none py-3"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={projectDraft.role}
                  onChange={(event) => updateDraft("role", event.target.value)}
                  placeholder={copy.projects.rolePlaceholder}
                  className="input-surface"
                />
                <input
                  value={projectDraft.tags}
                  onChange={(event) => updateDraft("tags", event.target.value)}
                  placeholder={copy.projects.tagsPlaceholder}
                  className="input-surface"
                />
              </div>
              <textarea
                value={projectDraft.impact}
                onChange={(event) => updateDraft("impact", event.target.value)}
                placeholder={copy.projects.impactPlaceholder}
                className="input-surface min-h-20 resize-none py-3"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={projectDraft.url}
                  onChange={(event) => updateDraft("url", event.target.value)}
                  placeholder={copy.projects.demoPlaceholder}
                  className="input-surface"
                />
                <input
                  value={projectDraft.repoUrl}
                  onChange={(event) => updateDraft("repoUrl", event.target.value)}
                  placeholder={copy.projects.repoPlaceholder}
                  className="input-surface"
                />
              </div>
              <button
                onClick={addManualProject}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-800 transition hover:border-slate-300 hover:bg-white"
              >
                <Plus size={17} />
                {copy.projects.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "profile" && projects.length > 0 && (
        <ProjectList projects={projects} onRemove={removeProject} onToggle={toggleProject} copy={copy.projects} />
      )}

      {step === "template" && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {TEMPLATE_OPTIONS.map((template) => {
              const isSelected = selectedTemplate === template.id;
              const templateCopy = copy.templates[template.id as keyof typeof copy.templates];

              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                    "group min-h-44 rounded-lg border bg-white p-4 text-left shadow-sm transition",
                    isSelected ? "border-slate-950 ring-2 ring-slate-950/10" : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  <div className={cn("mb-4 h-16 rounded-md bg-gradient-to-br", template.swatch)} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black text-slate-950">{template.name}</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{templateCopy.role}</p>
                    </div>
                    {isSelected && <CheckCircle2 size={19} className="shrink-0 text-emerald-600" />}
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">{templateCopy.tone}</p>
                </button>
              );
            })}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className={cn("h-24 rounded-md bg-gradient-to-br", selectedTemplateDetails.swatch)} />
            <h2 className="mt-4 text-lg font-black text-slate-950">{selectedTemplateDetails.name}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{selectedTemplateCopy.role}</p>
            <TemplateLivePreview
              user={user}
              projects={visibleProjects}
              swatch={selectedTemplateDetails.swatch}
              templateName={selectedTemplateDetails.name}
              copy={copy}
            />
            <div className="mt-5 grid gap-2">
              <button
                onClick={onOpenPortfolio}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <Eye size={17} />
                {copy.actions.viewPortfolio}
              </button>
              <button
                onClick={onOpenCv}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 transition hover:bg-slate-50"
              >
                <FileText size={17} />
                {copy.actions.viewCv}
              </button>
              <button
                onClick={() => setStep("ready")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-800 transition hover:bg-white"
              >
                <CheckCircle2 size={17} />
                {copy.actions.goReady}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "ready" && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{copy.ready.title}</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{readyCount}/5</h2>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-950 text-lg font-black text-white">
                {Math.round((readyCount / readiness.length) * 100)}%
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              {readiness.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
                  <span className="text-sm font-bold text-slate-700">{item.label}</span>
                  <span className={cn("text-xs font-black", item.done ? "text-emerald-600" : "text-amber-600")}>
                    {item.done ? copy.ready.done : copy.ready.needed}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-2">
              <button
                onClick={generateCv}
                disabled={isGeneratingCv}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {isGeneratingCv ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
                {copy.actions.generateAiCv}
              </button>
              <button
                onClick={onOpenPortfolio}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 transition hover:bg-slate-50"
              >
                <Eye size={17} />
                {copy.actions.portfolio}
              </button>
              <button
                onClick={onOpenCv}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 transition hover:bg-slate-50"
              >
                <FileText size={17} />
                {copy.actions.cvPreview}
              </button>
              <button
                onClick={publishPortfolio}
                disabled={isPublishing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-800 transition hover:bg-white disabled:opacity-60"
              >
                {isPublishing ? <Loader2 size={17} className="animate-spin" /> : <Share2 size={17} />}
                {copy.actions.publish}
              </button>
            </div>

            {publishedUrl && (
              <a
                href={publishedUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-800"
              >
                <ExternalLink size={16} />
                {copy.actions.portfolioLink}
              </a>
            )}
          </div>

          <div className="min-h-[440px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">AI CV</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{user.fullName || copy.ready.candidateFallback}</h2>
              </div>
              <button
                onClick={copyAiCv}
                disabled={!aiCv}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-800 transition hover:bg-white disabled:opacity-50"
              >
                <Clipboard size={15} />
                {copyState === "copied" ? copy.actions.copied : copy.actions.copy}
              </button>
            </div>

            {isGeneratingCv ? (
              <div className="flex min-h-[330px] items-center justify-center">
                <div className="text-center">
                  <Loader2 size={28} className="mx-auto animate-spin text-slate-500" />
                  <p className="mt-3 text-sm font-bold text-slate-500">{copy.ready.generating}</p>
                </div>
              </div>
            ) : aiCv ? (
              <div className="prose prose-slate mt-5 max-w-none prose-headings:font-black prose-a:text-slate-950">
                <Markdown>{aiCv}</Markdown>
              </div>
            ) : (
              <div className="flex min-h-[330px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
                <div>
                  <Sparkles size={28} className="mx-auto text-slate-400" />
                  <p className="mt-3 text-sm font-bold text-slate-600">{copy.ready.emptyAi}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAiOnboarding && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 px-3 pb-3 pt-16 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{copy.aiOnboarding.title}</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{copy.aiOnboarding.open}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{copy.aiOnboarding.subtitle}</p>
              </div>
              <button
                onClick={() => setShowAiOnboarding(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                aria-label={copy.aiOnboarding.cancel}
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <Field label={copy.aiOnboarding.role}>
                <input
                  value={aiDraft.role}
                  onChange={(event) => updateAiDraft("role", event.target.value)}
                  placeholder={copy.aiOnboarding.rolePlaceholder}
                  className="input-surface"
                />
              </Field>
              <Field label={copy.aiOnboarding.targetRole}>
                <input
                  value={aiDraft.targetRole}
                  onChange={(event) => updateAiDraft("targetRole", event.target.value)}
                  placeholder={copy.aiOnboarding.targetRolePlaceholder}
                  className="input-surface"
                />
              </Field>
              <Field label={copy.aiOnboarding.skills}>
                <textarea
                  value={aiDraft.skills}
                  onChange={(event) => updateAiDraft("skills", event.target.value)}
                  placeholder={copy.aiOnboarding.skillsPlaceholder}
                  className="input-surface min-h-24 resize-none py-3"
                />
              </Field>
              <Field label={copy.aiOnboarding.experience}>
                <textarea
                  value={aiDraft.experience}
                  onChange={(event) => updateAiDraft("experience", event.target.value)}
                  placeholder={copy.aiOnboarding.experiencePlaceholder}
                  className="input-surface min-h-24 resize-none py-3"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label={copy.aiOnboarding.goal}>
                  <input
                    value={aiDraft.goal}
                    onChange={(event) => updateAiDraft("goal", event.target.value)}
                    placeholder={copy.aiOnboarding.goalPlaceholder}
                    className="input-surface"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label={copy.aiOnboarding.project}>
                  <textarea
                    value={aiDraft.project}
                    onChange={(event) => updateAiDraft("project", event.target.value)}
                    placeholder={copy.aiOnboarding.projectPlaceholder}
                    className="input-surface min-h-24 resize-none py-3"
                  />
                </Field>
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-col gap-2 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowAiOnboarding(false)}
                className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                {copy.aiOnboarding.cancel}
              </button>
              <button
                onClick={applyAiOnboarding}
                disabled={isImprovingProfile}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {isImprovingProfile ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
                {isImprovingProfile ? copy.aiOnboarding.generating : copy.aiOnboarding.apply}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
    {children}
  </label>
);

const TemplateLivePreview = ({
  user,
  projects,
  swatch,
  templateName,
  copy,
}: {
  user: User;
  projects: Project[];
  swatch: string;
  templateName: string;
  copy: ReturnType<typeof getAppCopy>["studio"];
}) => {
  const previewProject = projects[0];
  const skills = previewProject?.tags?.slice(0, 3) || ["React", "TypeScript", "API"];

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{copy.templatePreview.title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{copy.templatePreview.subtitle}</p>
        </div>
        <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black text-slate-500 shadow-sm">{templateName}</span>
      </div>
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className={cn("h-16 bg-gradient-to-br", swatch)} />
        <div className="p-3">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-sm font-black text-white">
              {(user.fullName || copy.ready.candidateFallback).charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">{user.fullName || copy.ready.candidateFallback}</p>
              <p className="truncate text-[11px] font-bold text-slate-500">{user.githubUsername ? `github.com/${user.githubUsername}` : copy.templatePreview.contact}</p>
            </div>
          </div>
          <p className="line-clamp-3 text-xs font-semibold leading-5 text-slate-600">
            {user.bio || copy.profile.bioPlaceholder}
          </p>
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-black text-slate-950">{previewProject?.title || copy.templatePreview.projectFallback}</p>
            <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-5 text-slate-500">
              {previewProject?.description || copy.templatePreview.noProjects}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {skills.map((skill) => (
                <span key={skill} className="rounded bg-white px-2 py-1 text-[10px] font-bold text-slate-500">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectList = ({
  projects,
  onRemove,
  onToggle,
  copy,
}: {
  projects: Project[];
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  copy: ReturnType<typeof getAppCopy>["studio"]["projects"];
}) => (
  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {projects
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((project) => (
        <article key={project.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                <BriefcaseBusiness size={16} />
              </div>
              <h3 className="truncate text-sm font-black text-slate-950">{project.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{project.description}</p>
            </div>
            <button
              onClick={() => onRemove(project.id)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              aria-label={copy.delete}
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                {tag}
              </span>
            ))}
          </div>

          <button
            onClick={() => onToggle(project.id)}
            className={cn(
              "mt-4 inline-flex h-9 w-full items-center justify-center rounded-md text-xs font-black transition",
              project.isPublic === false ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700",
            )}
          >
            {project.isPublic === false ? copy.hidden : copy.visible}
          </button>
        </article>
      ))}
  </div>
);
