import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../shared/Button";
import { ChevronRight, ChevronLeft, Github, Layout, CheckCircle, FileText, Loader2, Rocket, Linkedin, Twitter, Globe, ArrowUp, ArrowDown, Terminal, Sparkles, BrainCircuit, Lightbulb, Info, FileJson, FileUser, Copy, Download, Cpu, Edit3, Save, X, Monitor, QrCode, Share2 } from "lucide-react";
import axios from "axios";
import { cn } from "../../lib/utils";
import { AppLanguage, User, Project } from "../../types";
import { getPortfolioRecommendations, generateAiCV, tailorCvForJob } from "../../services/aiService";
import Markdown from "react-markdown";

const STEPS = [
  { id: "info", title: "Ma'lumotlar", icon: FileText },
  { id: "github", title: "GitHub", icon: Github },
  { id: "template", title: "Template", icon: Layout },
  { id: "publish", title: "Tayyor", icon: CheckCircle },
];

interface WizardProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  projects: Project[];
  onProjectsSynced: (projects: Project[]) => void;
  selectedTemplate: string;
  setSelectedTemplate: (id: string) => void;
  language: AppLanguage;
  onOpenPreview: () => void;
  onOpenResume: () => void;
  isAiModalOpen?: boolean;
  onAiModalClose?: () => void;
}

type FieldErrors = Record<string, string>;

const GITHUB_USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

const normalizeGithubUsername = (value: string) => value.trim().replace(/^@/, "");

const isValidGithubUsername = (value: string) => {
  const username = normalizeGithubUsername(value);
  return username.length > 0 && GITHUB_USERNAME_PATTERN.test(username);
};

const isValidUrl = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return true;

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const hasErrors = (errors: FieldErrors) => Object.keys(errors).length > 0;

const getFirstError = (errors: FieldErrors) => Object.values(errors)[0] || null;

const validateProfile = (user: User): FieldErrors => {
  const errors: FieldErrors = {};

  if (user.fullName.trim().length < 3) {
    errors.fullName = "Ism kamida 3 ta belgidan iborat bo'lishi kerak.";
  }

  if (user.bio.trim().length < 40) {
    errors.bio = "Bio kamida 40 ta belgidan iborat bo'lsa, CV professionalroq chiqadi.";
  }

  if (!isValidUrl(user.socialLinks?.linkedin)) {
    errors.linkedin = "LinkedIn linki http yoki https bilan boshlanishi kerak.";
  }

  if (!isValidUrl(user.socialLinks?.twitter)) {
    errors.twitter = "Twitter/X linki http yoki https bilan boshlanishi kerak.";
  }

  if (!isValidUrl(user.socialLinks?.website)) {
    errors.website = "Website linki http yoki https bilan boshlanishi kerak.";
  }

  return errors;
};

const validateGithub = (username: string): FieldErrors => {
  const errors: FieldErrors = {};
  const normalized = normalizeGithubUsername(username);

  if (normalized && !isValidGithubUsername(normalized)) {
    errors.githubUsername = "GitHub username faqat harf, raqam va tirelardan iborat bo'lishi kerak.";
  }

  return errors;
};

export const PortfolioWizard = ({ 
  user, 
  setUser, 
  projects, 
  onProjectsSynced, 
  selectedTemplate, 
  setSelectedTemplate,
  language,
  onOpenPreview,
  onOpenResume,
  isAiModalOpen = false,
  onAiModalClose
}: WizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [isGeneratingTips, setIsGeneratingTips] = useState(false);
  const [showAiModal, setShowAiModal] = useState(isAiModalOpen);
  const [cvContent, setCvContent] = useState<string | null>(null);
  const [isGeneratingCv, setIsGeneratingCv] = useState(false);
  const [cvCopyState, setCvCopyState] = useState<'idle' | 'copied'>('idle');
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [linkCopyState, setLinkCopyState] = useState<'idle' | 'copied'>('idle');
  const [activeAiTab, setActiveAiTab] = useState<'tips' | 'cv' | 'tailor'>('tips');
  const [jobDescription, setJobDescription] = useState('');
  const [tailoredCvContent, setTailoredCvContent] = useState<string | null>(null);
  const [isTailoringCv, setIsTailoringCv] = useState(false);
  const [tailoredCopyState, setTailoredCopyState] = useState<'idle' | 'copied'>('idle');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    setShowAiModal(isAiModalOpen);
    if (isAiModalOpen) {
      setActiveAiTab('cv');
    }
  }, [isAiModalOpen]);

  useEffect(() => {
    setCvContent(null);
    setAiTips([]);
  }, [language]);

  const handleCloseModal = () => {
    setShowAiModal(false);
    if (onAiModalClose) onAiModalClose();
  };

  const fetchAiCV = async () => {
    setIsGeneratingCv(true);
    try {
      const cv = await generateAiCV(user, projects, language);
      setCvContent(cv);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCv(false);
    }
  };

  useEffect(() => {
    if (!showAiModal || activeAiTab !== 'cv' || cvContent || isGeneratingCv) return;
    fetchAiCV();
  }, [activeAiTab, cvContent, isGeneratingCv, showAiModal]);

  const fetchAiTips = async () => {
    if (projects.length === 0) return;
    setIsGeneratingTips(true);
    try {
      const tips = await getPortfolioRecommendations(user, projects, language);
      setAiTips(tips);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTips(false);
    }
  };

  const fetchTailoredCv = async () => {
    if (!jobDescription.trim()) {
      setError("Vakansiya matnini kiriting.");
      return;
    }

    setError(null);
    setIsTailoringCv(true);
    try {
      const cv = await tailorCvForJob(user, projects, language, jobDescription);
      setTailoredCvContent(cv);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTailoringCv(false);
    }
  };

  useEffect(() => {
    if (currentStep === 2 && aiTips.length === 0) {
      fetchAiTips();
    }
  }, [currentStep, projects, language]);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateCurrentStep = () => {
    const errors = currentStep === 0 ? validateProfile(user) : currentStep === 1 ? validateGithub(user.githubUsername) : {};
    setFieldErrors(errors);

    if (hasErrors(errors)) {
      setError(getFirstError(errors));
      return false;
    }

    return true;
  };

  const validateReadyToPublish = () => {
    const errors: FieldErrors = {
      ...validateProfile(user),
      ...validateGithub(user.githubUsername),
    };
    const visibleProjects = projects.filter((project) => project.isPublic !== false);

    if (!user.githubUsername.trim()) {
      errors.githubUsername = "Portfolio publish qilish uchun GitHub username kerak.";
    }

    if (visibleProjects.length === 0) {
      errors.projects = "Kamida bitta public loyiha import qiling yoki ko'rsatiladigan qilib belgilang.";
    }

    setFieldErrors(errors);

    if (hasErrors(errors)) {
      setError(getFirstError(errors));
      return false;
    }

    return true;
  };

  const nextStep = () => {
    setError(null);
    if (!validateCurrentStep()) return;
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };
  const prevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handlePublish = async () => {
    if (currentStep < STEPS.length - 1) {
      nextStep();
      return;
    }

    if (!validateReadyToPublish()) return;

    setIsPublishing(true);
    setError(null);
    try {
      const response = await axios.post("/api/portfolio/generate", {
        userId: user.id || "1",
        githubUsername: user.githubUsername,
        templateId: selectedTemplate,
        user,
        projects: projects.filter((project) => project.isPublic !== false),
        language,
        settings: { primaryColor: "#000", fontFamily: "Inter" }
      });
      const result = response.data;
      if (result.success) {
        setPublishedUrl(result.data?.url || `devport.uz/${user.githubUsername || "username"}`);
      }
    } catch (err: any) {
      console.error("Publishing failed:", err);
      const message = err.response?.data?.error || err.message || "Noma'lum xatolik yuz berdi";
      setError(message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      {/* Progress Bar - Compact Mode */}
      <div className="flex justify-between items-center mb-8 px-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm",
                    isActive ? "bg-indigo-600 text-white scale-110 shadow-indigo-200" : 
                    isCompleted ? "bg-indigo-50 text-indigo-600" : 
                    "bg-white border border-slate-200 text-slate-400"
                  )}
                >
                  {isCompleted ? <CheckCircle size={18} /> : <Icon size={18} />}
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2 rounded-full transition-all duration-500",
                  idx < currentStep ? "bg-indigo-600" : "bg-slate-200"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 min-h-[460px] flex flex-col">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 0 && <PersonalInfoStep user={user} setUser={setUser} fieldErrors={fieldErrors} onClearFieldError={clearFieldError} />}
              {currentStep === 1 && (
                <GithubStep 
                  user={user} 
                  setUser={setUser} 
                  projects={projects} 
                  onProjectsSynced={onProjectsSynced} 
                  fieldErrors={fieldErrors}
                  onClearFieldError={clearFieldError}
                />
              )}
              {currentStep === 2 && <ProfessionalTemplateStep selected={selectedTemplate} onSelect={setSelectedTemplate} aiTips={aiTips} isGenerating={isGeneratingTips} />}
              {currentStep === 3 && (
                <PublishStep
                  user={user}
                  projects={projects}
                  selectedTemplate={selectedTemplate}
                  language={language}
                  publishedUrl={publishedUrl}
                  linkCopyState={linkCopyState}
                  onOpenPreview={onOpenPreview}
                  onOpenResume={onOpenResume}
                  onOpenAi={() => {
                    setShowAiModal(true);
                    setActiveAiTab('cv');
                    if (!cvContent) fetchAiCV();
                  }}
                  onCopyLink={async () => {
                    const url = publishedUrl || `https://devport.uz/${user.githubUsername || "username"}`;
                    await navigator.clipboard.writeText(url);
                    setLinkCopyState('copied');
                    window.setTimeout(() => setLinkCopyState('idle'), 1800);
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            {error}
          </div>
        )}

        {/* Navigation - Inline for better mobile feel */}
        <div className="flex flex-wrap gap-3 mt-8">
          {currentStep > 0 && (
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={isPublishing}
              className="flex-1 h-12 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-semibold"
            >
              <ChevronLeft className="mr-2" size={18} /> Orqaga
            </Button>
          )}

          {currentStep >= 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setShowAiModal(true);
                setActiveAiTab('cv');
                if (!cvContent) fetchAiCV();
              }}
              className="flex-1 h-12 rounded-2xl border-indigo-100 text-indigo-600 hover:bg-indigo-50 transition-all font-semibold"
            >
              <Sparkles className="mr-2 text-indigo-400" size={18} /> AI CV
            </Button>
          )}

          <Button 
            onClick={handlePublish} 
            disabled={isPublishing}
            className={cn(
              "flex-[2] h-12 rounded-2xl transition-all font-bold text-base shadow-lg",
              currentStep === STEPS.length - 1 ? "bg-green-600 hover:bg-green-700 shadow-green-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
            )}
          >
            {isPublishing ? (
              <Loader2 className="animate-spin mr-2" size={18} />
            ) : currentStep === STEPS.length - 1 ? (
              <Rocket className="mr-2" size={18} />
            ) : null}
            {currentStep === STEPS.length - 1 ? (publishedUrl ? "Variant tayyor" : "Tayyor variantni chiqarish") : "Davom etish"} 
            {currentStep !== STEPS.length - 1 && <ChevronRight className="ml-2" size={18} />}
          </Button>
        </div>
      </div>

      {/* Floating AI Assistant FAB */}
      {currentStep >= 0 && (
        <div className="fixed bottom-24 right-4 z-50 hidden md:block md:bottom-8 md:right-8">
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setActiveAiTab('tips');
              setShowAiModal(true);
            }}
            className="w-12 h-12 md:w-14 md:h-14 bg-slate-950 text-white rounded-lg flex items-center justify-center shadow-xl shadow-slate-900/15 border border-white/20 group relative"
          >
            <Sparkles size={24} className="relative z-10" />
            <div className="absolute bottom-full right-0 mb-3 bg-slate-900 text-white px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl border border-slate-800 pointer-events-none">
              AI Maslahatlar
            </div>
          </motion.button>
        </div>
      )}

      {/* AI Master Modal Overlay */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-lg overflow-hidden shadow-2xl"
            >
              <div className="bg-slate-950 p-6 md:p-8 text-white relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                      <BrainCircuit size={20} className="text-slate-100" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-normal">AI CV Assistant</h2>
                      <p className="text-xs text-slate-300 font-bold tracking-widest uppercase opacity-80">Portfolio & CV tahlili</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                  >
                    <ChevronRight size={24} className="rotate-90 md:rotate-180" />
                  </button>
                </div>

                <div className="flex gap-2 relative z-10">
                  <button 
                    onClick={() => setActiveAiTab('tips')}
                    className={cn(
                      "px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all",
                      activeAiTab === 'tips' ? "bg-white text-slate-950 shadow-lg" : "hover:bg-white/10 text-slate-200"
                    )}
                  >
                    Maslahatlar
                  </button>
                  <button 
                    onClick={() => {
                      setActiveAiTab('cv');
                      if (!cvContent) fetchAiCV();
                    }}
                    className={cn(
                      "px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all",
                      activeAiTab === 'cv' ? "bg-white text-slate-950 shadow-lg" : "hover:bg-white/10 text-slate-200"
                    )}
                  >
                    AI CV Yaratish
                  </button>
                  <button 
                    onClick={() => setActiveAiTab('tailor')}
                    className={cn(
                      "px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all",
                      activeAiTab === 'tailor' ? "bg-white text-slate-950 shadow-lg" : "hover:bg-white/10 text-slate-200"
                    )}
                  >
                    Job match
                  </button>
                </div>
              </div>

              <div className="p-8 md:p-12 min-h-[450px] bg-slate-50/30 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {activeAiTab === 'tips' ? (
                  isGeneratingTips ? (
                    <div className="py-20 flex flex-col items-center text-center">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 border-4 border-indigo-100 rounded-full border-t-indigo-600 animate-spin" />
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Portfolio tahlil qilinmoqda</h3>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto italic">Loyihalaringiz va ko'nikmalaringiz asosida eng yaxshi maslahatlarni tayyorlayapman...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Shaxsiy Maslahatlar</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {aiTips.map((tip, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group hover:border-indigo-100 hover:shadow-md transition-all"
                          >
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600 group-hover:scale-110 transition-transform">
                              <Lightbulb size={18} />
                            </div>
                            <p className="text-xs md:text-sm leading-relaxed font-bold text-slate-700">
                              {tip}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )
                ) : activeAiTab === 'cv' ? (
                  <div className="space-y-6">
                    {isGeneratingCv ? (
                      <div className="py-20 flex flex-col items-center text-center">
                        <div className="relative mb-6">
                          <div className="w-20 h-20 border-4 border-indigo-100 rounded-full border-t-indigo-600 animate-spin" />
                          <FileUser className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">AI CV Yaratilmoqda</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto italic">Sizning tajribangiz asosida professional rezyume matni shakllantirilmoqda...</p>
                      </div>
                    ) : cvContent ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-green-500 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Structured ATS CV (Markdown)</span>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                await navigator.clipboard.writeText(cvContent);
                                setCvCopyState('copied');
                                window.setTimeout(() => setCvCopyState('idle'), 1800);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold uppercase transition-colors"
                            >
                              <Copy size={12} /> {cvCopyState === 'copied' ? 'Nusxalandi' : 'Nusxalash'}
                            </button>
                            <button 
                              onClick={() => fetchAiCV()}
                              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-[10px] font-bold uppercase transition-colors"
                            >
                              <Sparkles size={12} /> Qayta yaratish
                            </button>
                          </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm prose prose-sm max-w-none text-slate-700">
                          <Markdown>{cvContent}</Markdown>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="py-20 text-center">
                        <Button onClick={fetchAiCV} variant="primary" className="rounded-full">
                          AI CV Yaratishni boshlash
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-blue-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vakansiyaga mos CV</span>
                      </div>
                      <textarea
                        value={jobDescription}
                        onChange={(event) => setJobDescription(event.target.value)}
                        placeholder="Vakansiya matnini shu yerga qo'ying: talablar, texnologiyalar, rol va mas'uliyatlar..."
                        className="min-h-[170px] w-full rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium leading-6 text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                      />
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs leading-5 text-slate-500">
                          AI faqat mavjud tajriba va projectlarga tayanib, CV'ni shu role uchun kuchaytiradi.
                        </p>
                        <Button
                          onClick={fetchTailoredCv}
                          disabled={isTailoringCv || jobDescription.trim().length < 20}
                          className="h-10 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white hover:bg-slate-800"
                        >
                          {isTailoringCv ? <Loader2 className="mr-2 animate-spin" size={15} /> : <Sparkles className="mr-2" size={15} />}
                          Moslashtirish
                        </Button>
                      </div>
                    </div>

                    {tailoredCvContent && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Job-specific ATS CV</span>
                          <button
                            onClick={async () => {
                              await navigator.clipboard.writeText(tailoredCvContent);
                              setTailoredCopyState('copied');
                              window.setTimeout(() => setTailoredCopyState('idle'), 1800);
                            }}
                            className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase transition-colors hover:bg-slate-200"
                          >
                            <Copy size={12} />
                            {tailoredCopyState === 'copied' ? 'Nusxalandi' : 'Nusxalash'}
                          </button>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm prose prose-sm max-w-none text-slate-700">
                          <Markdown>{tailoredCvContent}</Markdown>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
                
                <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Info size={12} />
                    <span>Gemini AI Engine yordamida yaratildi</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCloseModal}
                    className="rounded-full px-8"
                  >
                    Yopish
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PersonalInfoStep = ({
  user,
  setUser,
  fieldErrors,
  onClearFieldError,
}: {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  fieldErrors: FieldErrors;
  onClearFieldError: (field: string) => void;
}) => {
  const [imageError, setImageError] = useState<string | null>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setImageError("Rasm 2MB dan kichik bo'lishi kerak.");
      return;
    }

    setImageError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setUser(prev => ({ ...prev, avatarUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-2 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
        <div className="relative group flex w-28 shrink-0 justify-center">
          <div className="w-24 h-24 rounded-3xl bg-indigo-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <FileUser size={40} className="text-indigo-400" />
            )}
          </div>
          <label className="absolute bottom-0 right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg border-2 border-white cursor-pointer hover:bg-indigo-700 transition-colors">
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            <Download size={14} className="rotate-180" />
          </label>
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-normal text-slate-900">Professional Profil</h2>
          <p className="text-slate-500 text-sm leading-relaxed">Rasmingiz va asosiy ma'lumotlaringizni kiriting. AI shular asosida CV yaratadi.</p>
          {imageError && <FieldError>{imageError}</FieldError>}
        </div>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">To'liq ismingiz</label>
          <input 
            className={cn(
              "w-full h-14 px-5 rounded-2xl border focus:ring-4 transition-all font-medium text-slate-700 bg-slate-50/50",
              fieldErrors.fullName ? "border-red-300 focus:border-red-500 focus:ring-red-50" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-50"
            )}
            placeholder="Samandarov Sunnatulla" 
            value={user.fullName}
            onChange={(e) => {
              onClearFieldError("fullName");
              setUser(prev => ({ ...prev, fullName: e.target.value }));
            }}
          />
          {fieldErrors.fullName && <FieldError>{fieldErrors.fullName}</FieldError>}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Tanishtiruv (Bio)</label>
          <textarea 
            className={cn(
              "w-full p-5 rounded-2xl border focus:ring-4 transition-all min-h-[140px] font-medium text-slate-700 leading-relaxed bg-slate-50/50",
              fieldErrors.bio ? "border-red-300 focus:border-red-500 focus:ring-red-50" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-50"
            )}
            placeholder="Tajribali Full-stack Developer..." 
            value={user.bio}
            onChange={(e) => {
              onClearFieldError("bio");
              setUser(prev => ({ ...prev, bio: e.target.value }));
            }}
          />
          {fieldErrors.bio && <FieldError>{fieldErrors.bio}</FieldError>}
        </div>

        <div className="pt-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 block mb-3">Ijtimoiy tarmoqlar</label>
          <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className={cn(
                  "w-full h-12 pl-12 pr-4 rounded-xl border transition-all text-sm font-medium bg-slate-50/30",
                  fieldErrors.linkedin ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-indigo-500"
                )}
                placeholder="LinkedIn URL" 
                value={user.socialLinks?.linkedin || ""}
                onChange={(e) => {
                  onClearFieldError("linkedin");
                  setUser(prev => ({ 
                    ...prev, 
                    socialLinks: { ...prev.socialLinks, linkedin: e.target.value } 
                  }));
                }}
              />
              {fieldErrors.linkedin && <FieldError>{fieldErrors.linkedin}</FieldError>}
            </div>
            <div className="relative">
              <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className={cn(
                  "w-full h-12 pl-12 pr-4 rounded-xl border transition-all text-sm font-medium bg-slate-50/30",
                  fieldErrors.twitter ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-indigo-500"
                )}
                placeholder="Twitter URL" 
                value={user.socialLinks?.twitter || ""}
                onChange={(e) => {
                  onClearFieldError("twitter");
                  setUser(prev => ({ 
                    ...prev, 
                    socialLinks: { ...prev.socialLinks, twitter: e.target.value } 
                  }));
                }}
              />
              {fieldErrors.twitter && <FieldError>{fieldErrors.twitter}</FieldError>}
            </div>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className={cn(
                  "w-full h-12 pl-12 pr-4 rounded-xl border transition-all text-sm font-medium bg-slate-50/30",
                  fieldErrors.website ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-indigo-500"
                )}
                placeholder="Shaxsiy veb-sayt" 
                value={user.socialLinks?.website || ""}
                onChange={(e) => {
                  onClearFieldError("website");
                  setUser(prev => ({ 
                    ...prev, 
                    socialLinks: { ...prev.socialLinks, website: e.target.value } 
                  }));
                }}
              />
              {fieldErrors.website && <FieldError>{fieldErrors.website}</FieldError>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GithubStep = ({ 
  user, 
  setUser, 
  projects, 
  onProjectsSynced,
  fieldErrors,
  onClearFieldError,
}: { 
  user: User, 
  setUser: any, 
  projects: Project[], 
  onProjectsSynced: (p: Project[]) => void,
  fieldErrors: FieldErrors,
  onClearFieldError: (field: string) => void,
}) => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(user.githubUsername);
  const [editingProject, setEditingProject] = useState<(Project & { tagsText: string }) | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [editorErrors, setEditorErrors] = useState<FieldErrors>({});

  const fetchRepos = async () => {
    const normalizedUsername = normalizeGithubUsername(username);
    if (!normalizedUsername) {
      setSyncError("GitHub username kiriting.");
      return;
    }

    if (!isValidGithubUsername(normalizedUsername)) {
      setSyncError("GitHub username faqat harf, raqam va tirelardan iborat bo'lishi kerak.");
      return;
    }

    setLoading(true);
    setSyncError(null);
    try {
      const res = await axios.get(`/api/github/repos/${normalizedUsername}`);
      const repos = res.data;
      
      const formattedProjects: Project[] = repos.map((repo: any, index: number) => ({
        id: String(repo.id),
        userId: user.id,
        title: repo.name,
        description: repo.description || "Tavsif mavjud emas.",
        role: repo.language ? `${repo.language} Developer` : "Software Developer",
        impact: "",
        repoUrl: repo.html_url,
        url: repo.homepage,
        tags: [repo.language || "Open Source"],
        isPublic: true,
        order: index
      }));

      onProjectsSynced(formattedProjects);
      setUser((prev: User) => ({ ...prev, githubUsername: normalizedUsername }));
    } catch (e) {
      console.error(e);
      setSyncError("GitHub foydalanuvchisi topilmadi yoki API javob bermadi.");
    } finally {
      setLoading(false);
    }
  };

  const updateUsername = (val: string) => {
    onClearFieldError("githubUsername");
    setSyncError(null);
    setUsername(val);
    setUser((prev: User) => ({ ...prev, githubUsername: normalizeGithubUsername(val) }));
  };

  const handleImageUpload = (projectId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setImageError("Project rasmi 2MB dan kichik bo'lishi kerak.");
      return;
    }

    setImageError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const updatedProjects = projects.map(p => 
        p.id === projectId ? { ...p, image: base64 } : p
      );
      onProjectsSynced(updatedProjects);
    };
    reader.readAsDataURL(file);
  };

  const moveProject = (index: number, direction: 'up' | 'down') => {
    const newProjects = [...projects].sort((a, b) => a.order - b.order);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newProjects.length) return;

    const item = newProjects.splice(index, 1)[0];
    newProjects.splice(targetIndex, 0, item);

    // Re-assign orders
    const orderedProjects = newProjects.map((p, idx) => ({
      ...p,
      order: idx
    }));

    onProjectsSynced(orderedProjects);
  };

  const openProjectEditor = (project: Project) => {
    setEditorErrors({});
    setEditingProject({
      ...project,
      tagsText: project.tags.join(", "),
    });
  };

  const saveProject = () => {
    if (!editingProject) return;

    const errors: FieldErrors = {};

    if (editingProject.title.trim().length < 2) {
      errors.title = "Loyiha nomi kamida 2 ta belgidan iborat bo'lishi kerak.";
    }

    if (editingProject.description.trim().length < 20) {
      errors.description = "Tavsif kamida 20 ta belgidan iborat bo'lsa, portfolio ishonchliroq ko'rinadi.";
    }

    if (!isValidUrl(editingProject.url)) {
      errors.url = "Live URL http yoki https bilan boshlanishi kerak.";
    }

    if (!isValidUrl(editingProject.repoUrl)) {
      errors.repoUrl = "Repo URL http yoki https bilan boshlanishi kerak.";
    }

    if (hasErrors(errors)) {
      setEditorErrors(errors);
      return;
    }

    const tags = editingProject.tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const updatedProjects = projects.map((project) => (
      project.id === editingProject.id
        ? {
          ...project,
          title: editingProject.title.trim() || project.title,
          description: editingProject.description.trim() || "Tavsif mavjud emas.",
          role: editingProject.role?.trim(),
          impact: editingProject.impact?.trim(),
          url: editingProject.url?.trim(),
          repoUrl: editingProject.repoUrl?.trim(),
          tags: tags.length ? tags : ["Open Source"],
          isPublic: editingProject.isPublic,
        }
        : project
    ));

    onProjectsSynced(updatedProjects);
    setEditorErrors({});
    setEditingProject(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold mb-1 tracking-normal text-slate-900">GitHub Integratsiyasi</h2>
        <p className="text-slate-500 text-sm">Username-ni kiriting va loyihalarni avtomatik tortib oling.</p>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="relative group">
          <Github className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input 
            className={cn(
              "w-full h-14 pl-14 pr-5 rounded-2xl border focus:ring-4 transition-all font-medium text-slate-700 bg-slate-50/50",
              fieldErrors.githubUsername || syncError ? "border-red-300 focus:border-red-500 focus:ring-red-50" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-50"
            )}
            placeholder="GitHub Username" 
            value={username}
            onChange={(e) => updateUsername(e.target.value)}
          />
        </div>
        {(fieldErrors.githubUsername || syncError) && <FieldError>{fieldErrors.githubUsername || syncError}</FieldError>}
        <Button 
          onClick={fetchRepos} 
          disabled={loading || !username.trim()}
          className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-200"
        >
          {loading ? (
            <Loader2 className="animate-spin mr-2" size={20} />
          ) : (
            <Github className="mr-2" size={20} />
          )}
          Loyihalarni sinxronlashtirish
        </Button>
      </div>

      {projects.length > 0 && (
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Loyihalar ro'yxati</h3>
          {imageError && <FieldError>{imageError}</FieldError>}
          {[...projects].sort((a, b) => a.order - b.order).map((project, index) => (
            <div key={project.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4 group sm:flex-row sm:items-center">
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => moveProject(index, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-all"
                >
                  <ArrowUp size={14} />
                </button>
                <button 
                  onClick={() => moveProject(index, 'down')}
                  disabled={index === projects.length - 1}
                  className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-all"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-slate-300">
                  {project.image ? (
                    <img src={project.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Layout size={20} />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-sm text-slate-900 truncate">{project.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">{project.role || project.repoUrl}</p>
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <button
                  onClick={() => openProjectEditor(project)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
                >
                  <Edit3 size={12} />
                  Edit
                </button>
                <label className="cursor-pointer">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(project.id, e)} 
                  />
                  <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm">
                    {project.image ? "Change" : "Upload"}
                  </div>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editingProject && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProject(null)}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h3 className="text-lg font-black text-slate-950">Loyihani professional tahrirlash</h3>
                  <p className="text-sm text-slate-500">Case study, CV va portfolio uchun aniqroq matn yozing.</p>
                </div>
                <button onClick={() => setEditingProject(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6 custom-scrollbar">
                <ProjectField label="Loyiha nomi" error={editorErrors.title}>
                  <input
                    value={editingProject.title}
                    onChange={(e) => {
                      setEditorErrors((prev) => ({ ...prev, title: "" }));
                      setEditingProject((prev) => prev ? { ...prev, title: e.target.value } : prev);
                    }}
                    className={cn(
                      "w-full h-12 rounded-xl border bg-slate-50/50 px-4 text-sm font-semibold text-slate-800 outline-none focus:ring-4",
                      editorErrors.title ? "border-red-300 focus:border-red-500 focus:ring-red-50" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-50"
                    )}
                  />
                </ProjectField>

                <ProjectField label="Sizning rolingiz">
                  <input
                    value={editingProject.role || ""}
                    onChange={(e) => setEditingProject((prev) => prev ? { ...prev, role: e.target.value } : prev)}
                    placeholder="Full-stack Developer, Frontend Engineer..."
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />
                </ProjectField>

                <ProjectField label="Professional tavsif" error={editorErrors.description}>
                  <textarea
                    value={editingProject.description}
                    onChange={(e) => {
                      setEditorErrors((prev) => ({ ...prev, description: "" }));
                      setEditingProject((prev) => prev ? { ...prev, description: e.target.value } : prev);
                    }}
                    className={cn(
                      "min-h-[120px] w-full rounded-xl border bg-slate-50/50 p-4 text-sm font-medium leading-6 text-slate-800 outline-none focus:ring-4",
                      editorErrors.description ? "border-red-300 focus:border-red-500 focus:ring-red-50" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-50"
                    )}
                  />
                </ProjectField>

                <ProjectField label="Natija yoki impact">
                  <textarea
                    value={editingProject.impact || ""}
                    onChange={(e) => setEditingProject((prev) => prev ? { ...prev, impact: e.target.value } : prev)}
                    placeholder="Masalan: sahifa yuklanishini 35% tezlashtirdim, admin jarayonini avtomatlashtirdim..."
                    className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm font-medium leading-6 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />
                </ProjectField>

                <div className="grid gap-4 md:grid-cols-2">
                  <ProjectField label="Live URL" error={editorErrors.url}>
                    <input
                      value={editingProject.url || ""}
                      onChange={(e) => {
                        setEditorErrors((prev) => ({ ...prev, url: "" }));
                        setEditingProject((prev) => prev ? { ...prev, url: e.target.value } : prev);
                      }}
                      placeholder="https://..."
                      className={cn(
                        "w-full h-12 rounded-xl border bg-slate-50/50 px-4 text-sm font-medium text-slate-800 outline-none focus:ring-4",
                        editorErrors.url ? "border-red-300 focus:border-red-500 focus:ring-red-50" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-50"
                      )}
                    />
                  </ProjectField>
                  <ProjectField label="Repo URL" error={editorErrors.repoUrl}>
                    <input
                      value={editingProject.repoUrl || ""}
                      onChange={(e) => {
                        setEditorErrors((prev) => ({ ...prev, repoUrl: "" }));
                        setEditingProject((prev) => prev ? { ...prev, repoUrl: e.target.value } : prev);
                      }}
                      placeholder="https://github.com/..."
                      className={cn(
                        "w-full h-12 rounded-xl border bg-slate-50/50 px-4 text-sm font-medium text-slate-800 outline-none focus:ring-4",
                        editorErrors.repoUrl ? "border-red-300 focus:border-red-500 focus:ring-red-50" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-50"
                      )}
                    />
                  </ProjectField>
                </div>

                <ProjectField label="Texnologiyalar">
                  <input
                    value={editingProject.tagsText}
                    onChange={(e) => setEditingProject((prev) => prev ? { ...prev, tagsText: e.target.value } : prev)}
                    placeholder="React, TypeScript, Node.js"
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />
                </ProjectField>

                <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Portfolio’da ko‘rsatish</p>
                    <p className="text-xs text-slate-500">Public bo‘lmagan yoki kuchsiz loyihani yashirib qo‘yish mumkin.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingProject.isPublic}
                    onChange={(e) => setEditingProject((prev) => prev ? { ...prev, isPublic: e.target.checked } : prev)}
                    className="h-5 w-5 rounded border-slate-300 text-indigo-600"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setEditingProject(null)} className="rounded-xl border-slate-200">
                  Bekor qilish
                </Button>
                <Button onClick={saveProject} className="rounded-xl bg-slate-950 text-white hover:bg-slate-800">
                  <Save className="mr-2" size={16} />
                  Saqlash
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 shrink-0">
          <Rocket size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-indigo-900">Professional Maslahat</h4>
          <p className="text-sm text-indigo-700 leading-relaxed opacity-80 mt-1">
            Har bir loyiha uchun o'ziga xos rasm yuklang, bu portfoliongizni jozibador qiladi.
          </p>
        </div>
      </div>
    </div>
  );
};

const FieldError = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-1 text-xs font-semibold leading-5 text-red-600">{children}</p>
);

const ProjectField = ({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) => (
  <label className="block space-y-2">
    <span className="ml-1 text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    {children}
    {error && <FieldError>{error}</FieldError>}
  </label>
);

const TEMPLATE_DETAILS: Record<string, { philosophy: string; features: string[] }> = {
  'premium-developer': {
    philosophy: "Premium developer portfolio. Ish beruvchi birinchi ekranda positioning, signal va tanlangan loyihalarni ko'radi.",
    features: ["Premium hero", "Project signal panel", "Clean cards", "Recruiter-friendly layout"]
  },
  'case-study-pro': {
    philosophy: "Case studyga asoslangan shablon. Har bir loyiha muammo, yechim va natija sifatida ko'rsatiladi.",
    features: ["Large case cards", "Impact bloklari", "Storytelling layout", "Product builder uslubi"]
  },
  'executive-architect': {
    philosophy: "Senior developer, solution architect va consultantlar uchun sokin, nufuzli va premium ko'rinish.",
    features: ["Executive profile", "Architecture signal", "Minimal ranglar", "Premium typography"]
  },
  'modern-minimalist': {
    philosophy: "Tozalik va fokus. Ortiqcha detallarsiz faqat muhim ma'lumotlarga qaratilgan zamonaviy yondashuv.",
    features: ["Keng bo'shliqlar", "Yupqa chiziqlar", "Oq/Kulrang ranglar palitrasi", "Minimalistik animatsiyalar"]
  },
  'modern-technical': {
    philosophy: "Professional tahliliy ko'rinish. Muhandislar va texnik mutaxassislar uchun ma'lumotlarni tartibli va mukammal ko'rsatuvchi interfeys.",
    features: ["Grid-based layout", "Texnik metrikalar", "Aniqlik darajasi", "Professional monoxrom ranglar"]
  },
  'minimalist': {
    philosophy: "Soddalik va qulaylik. Har qanday foydalanuvchi uchun tushunarli va professional ko'rinish.",
    features: ["Yumshoq burchaklar", "Klassik layout", "O'qishga qulay shriftlar", "An'anaviy portfel uslubi"]
  },
  'dark': {
    philosophy: "Texnik mukammallik. Dasturchilar va kod ihlosmandlari uchun maxsus qorong'u rejim.",
    features: ["Qorong'u rejim", "Sintaksis yoritilishi", "O'ta aniq detallar", "Texnologik atmosfera"]
  },
  'bento': {
    philosophy: "Zamonaviy grid tizimi. Ma'lumotlarni bloklarga bo'lib ko'rsatish orqali vizual jozibadorlik.",
    features: ["Blokli dizayn", "Guruhlangan ma'lumotlar", "Dinamik grid layout", "Apple-style interfeys"]
  },
  'brutalist': {
    philosophy: "Dadil va xom dizayn. Neo-brutalizm elementlari bilan ajralib turishni xohlovchilar uchun.",
    features: ["Qalin ramkalar", "Yorqin ranglar", "Noan'anaviy shakllar", "Maksimal konstrast"]
  },
  'terminal': {
    philosophy: "Klassik CLI muxlislari uchun. Buyruqlar paneli (Terminal) ko'rinishidagi retro dizayn.",
    features: ["Yashil terminal rangi", "Monospace shrift", "Kodli buyruqlar uslubi", "Xakerlik estetikasi"]
  },
  'serif': {
    philosophy: "Elegant va nufuzli. Akademik va klassik uslubni xush ko'ruvchilar uchun mos keluvchi dizayn.",
    features: ["Serif shriftlar (Playfair)", "Klassik kitob uslubi", "Yuqori darajadagi tipografiya", "Elegant va minimal"]
  }
};

const PROFESSIONAL_TEMPLATES = [
  {
    id: 'premium-developer',
    name: 'Premium Developer',
    audience: 'Modern developer portfolio',
    icon: Monitor,
    tone: 'blue',
  },
  {
    id: 'case-study-pro',
    name: 'Case Study Pro',
    audience: 'Product and project storytelling',
    icon: FileJson,
    tone: 'amber',
  },
  {
    id: 'executive-architect',
    name: 'Executive Architect',
    audience: 'Senior, architect, consultant',
    icon: Cpu,
    tone: 'slate',
  },
  {
    id: 'minimalist',
    name: 'Minimalist Persona',
    audience: 'Universal developer CV',
    icon: Layout,
    tone: 'slate',
  },
  {
    id: 'modern-technical',
    name: 'Senior Developer',
    audience: 'Backend, full-stack, architect',
    icon: Cpu,
    tone: 'dark',
  },
  {
    id: 'modern-minimalist',
    name: 'Product Engineer',
    audience: 'Frontend, UI, product builders',
    icon: Rocket,
    tone: 'blue',
  },
  {
    id: 'bento',
    name: 'Creative Bento',
    audience: 'Case studies and screenshots',
    icon: Layout,
    tone: 'purple',
  },
  {
    id: 'serif',
    name: 'Minimal Executive',
    audience: 'Senior and consulting profile',
    icon: FileText,
    tone: 'amber',
  },
  {
    id: 'terminal',
    name: 'DevOps Terminal',
    audience: 'Infra, CLI, open-source profile',
    icon: Terminal,
    tone: 'green',
  },
  {
    id: 'dark',
    name: 'Dark Technical',
    audience: 'Engineering portfolio',
    icon: BrainCircuit,
    tone: 'dark',
  },
  {
    id: 'brutalist',
    name: 'Bold Founder',
    audience: 'Startup and product builder',
    icon: Sparkles,
    tone: 'yellow',
  },
];

const ProfessionalTemplateStep = ({ selected, onSelect, aiTips, isGenerating }: { selected: string, onSelect: (id: string) => void, aiTips: string[], isGenerating: boolean }) => {
  const selectedTemplate = PROFESSIONAL_TEMPLATES.find((template) => template.id === selected) || PROFESSIONAL_TEMPLATES[0];
  const SelectedIcon = selectedTemplate.icon;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold mb-1 tracking-normal text-slate-900">Template gallery</h2>
          <p className="text-slate-500 text-sm">Rolingiz va portfolio maqsadingizga mos professional shablonni tanlang.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
          <SelectedIcon size={15} />
          {selectedTemplate.name}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {PROFESSIONAL_TEMPLATES.map((template) => {
            const Icon = template.icon;
            const isSelected = template.id === selected;

            return (
              <button
                key={template.id}
                onClick={() => onSelect(template.id)}
                className={cn(
                  "group rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg",
                  isSelected ? "border-slate-950 bg-white shadow-xl shadow-slate-200/70" : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white"
                )}
              >
                <TemplateMiniPreview tone={template.tone} />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
                      <Icon size={17} />
                    </div>
                    <h3 className="text-sm font-black text-slate-950">{template.name}</h3>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{template.audience}</p>
                  </div>
                  {isSelected && (
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white">
                      <CheckCircle size={14} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4">
            <TemplateMiniPreview tone={selectedTemplate.tone} large />
          </div>
          <div className="mb-4 flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              <SelectedIcon size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-950">{selectedTemplate.name}</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{selectedTemplate.audience}</p>
            </div>
          </div>

          <p className="text-sm font-medium leading-6 text-slate-600">
            {TEMPLATE_DETAILS[selectedTemplate.id].philosophy}
          </p>

          <div className="mt-5 grid gap-2">
            {TEMPLATE_DETAILS[selectedTemplate.id].features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                <CheckCircle size={13} className="text-emerald-600" />
                {feature}
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="mt-8 pt-8 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-normal text-slate-900">AI Shaxsiy Maslahatlar</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Template tanlash va portfolio kuchaytirish uchun</p>
          </div>
        </div>

        {isGenerating ? (
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse">
            <Loader2 className="animate-spin text-indigo-400" size={16} />
            <span className="text-xs text-slate-400 font-medium">Maslahatlar tahlil qilinmoqda...</span>
          </div>
        ) : aiTips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiTips.slice(0, 3).map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 bg-white rounded-2xl border border-indigo-50 shadow-sm hover:border-indigo-100 hover:shadow-md transition-all flex gap-3"
              >
                <div className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb size={12} />
                </div>
                <p className="text-[11px] font-bold text-slate-700 leading-relaxed">{tip}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-medium italic">Loyihalaringiz bo'yicha maslahatlar olish uchun GitHub integratsiyasini yakunlang.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TemplateMiniPreview = ({ tone, large = false }: { tone: string; large?: boolean }) => {
  const isDark = tone === 'dark';
  const isTerminal = tone === 'green';
  const isBold = tone === 'yellow';
  const accent = tone === 'purple' ? 'bg-purple-500' : tone === 'amber' ? 'bg-amber-700' : tone === 'green' ? 'bg-emerald-500' : tone === 'yellow' ? 'bg-black' : tone === 'blue' ? 'bg-blue-600' : 'bg-slate-950';

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border p-3",
      large ? "h-44" : "h-28",
      isDark || isTerminal ? "border-slate-800 bg-slate-950" : isBold ? "border-black bg-yellow-300" : "border-slate-200 bg-white"
    )}>
      <div className="flex items-center gap-2">
        <div className={cn("h-6 w-6 rounded-md", accent)} />
        <div className="space-y-1">
          <div className={cn("h-2 rounded-full", large ? "w-28" : "w-20", isDark || isTerminal ? "bg-slate-500" : "bg-slate-300")} />
          <div className={cn("h-2 rounded-full", large ? "w-20" : "w-14", isDark || isTerminal ? "bg-slate-700" : "bg-slate-200")} />
        </div>
      </div>
      <div className={cn("mt-4 grid gap-2", large ? "grid-cols-3" : "grid-cols-2")}>
        {[0, 1, 2, 3, 4, 5].slice(0, large ? 6 : 4).map((item) => (
          <div key={item} className={cn(
            "rounded-lg border p-2",
            isDark || isTerminal ? "border-slate-800 bg-slate-900" : isBold ? "border-black bg-white" : "border-slate-200 bg-slate-50"
          )}>
            <div className={cn("mb-2 h-2 rounded-full", item % 2 === 0 ? accent : isDark || isTerminal ? "bg-slate-700" : "bg-slate-300")} />
            <div className={cn("h-2 w-2/3 rounded-full", isDark || isTerminal ? "bg-slate-700" : "bg-slate-200")} />
          </div>
        ))}
      </div>
    </div>
  );
};

const TemplateStep = ({ selected, onSelect, aiTips, isGenerating }: { selected: string, onSelect: (id: string) => void, aiTips: string[], isGenerating: boolean }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold mb-1 tracking-normal text-slate-900">Template tanlash</h2>
          <p className="text-slate-500 text-sm">Professional ko'rinishdagi dizaynni tanlang.</p>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-slate-400">
          <Info size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest italic">Tavsif uchun ustiga olib boring</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
          <div 
            onClick={() => onSelect('modern-minimalist')}
            onMouseEnter={() => setHoveredId('modern-minimalist')}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "group border-2 rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-300",
              selected === 'modern-minimalist' ? 
              "border-indigo-600 bg-white shadow-xl shadow-indigo-50" : 
              "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
              selected === 'modern-minimalist' ? "bg-indigo-50 text-indigo-600 shadow-sm" : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm"
            )}>
              <div className="w-6 h-6 border border-current rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-current rounded-full" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className={cn("text-sm font-bold", selected === 'modern-minimalist' ? "text-indigo-900" : "text-slate-700")}>
                Modern Minimalist
              </h3>
            </div>
            {selected === 'modern-minimalist' && (
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                <CheckCircle size={12} />
              </div>
            )}
          </div>

          <div 
            onClick={() => onSelect('modern-technical')}
            onMouseEnter={() => setHoveredId('modern-technical')}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "group border-2 rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-300",
              selected === 'modern-technical' ? 
              "border-slate-900 bg-slate-900 shadow-xl" : 
              "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
              selected === 'modern-technical' ? "bg-slate-800 text-indigo-400" : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm"
            )}>
              <Cpu size={20} />
            </div>
            <div className="flex-1">
              <h3 className={cn("text-sm font-bold", selected === 'modern-technical' ? "text-white" : "text-slate-700")}>
                Modern Technical
              </h3>
            </div>
            {selected === 'modern-technical' && (
              <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg">
                <CheckCircle size={12} />
              </div>
            )}
          </div>

          <div 
            onClick={() => onSelect('minimalist')}
            onMouseEnter={() => setHoveredId('minimalist')}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "group border-2 rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-300",
              selected === 'minimalist' ? 
              "border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100" : 
              "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
              selected === 'minimalist' ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm"
            )}>
              <Layout size={20} />
            </div>
            <div className="flex-1">
              <h3 className={cn("text-sm font-bold", selected === 'minimalist' ? "text-indigo-900" : "text-slate-700")}>
                Minimalist Persona
              </h3>
            </div>
            {selected === 'minimalist' && (
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                <CheckCircle size={12} />
              </div>
            )}
          </div>

          <div 
            onClick={() => onSelect('dark')}
            onMouseEnter={() => setHoveredId('dark')}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "group border-2 rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-300",
              selected === 'dark' ? 
              "border-slate-800 bg-slate-900 shadow-xl" : 
              "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
              selected === 'dark' ? "bg-slate-700 text-indigo-400" : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm"
            )}>
              <div className="w-6 h-6 border-2 border-current rounded-lg flex items-center justify-center font-black text-[8px]">AI</div>
            </div>
            <div className="flex-1">
              <h3 className={cn("text-sm font-bold", selected === 'dark' ? "text-white" : "text-slate-700")}>
                Dark Technical
              </h3>
            </div>
            {selected === 'dark' && (
              <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg">
                <CheckCircle size={12} />
              </div>
            )}
          </div>

          <div 
            onClick={() => onSelect('bento')}
            onMouseEnter={() => setHoveredId('bento')}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "group border-2 rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-300",
              selected === 'bento' ? 
              "border-purple-600 bg-purple-50/50 shadow-lg shadow-purple-100" : 
              "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all grid grid-cols-2 gap-1 p-2 flex-shrink-0",
              selected === 'bento' ? "bg-purple-600 text-white shadow-lg" : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm"
            )}>
              <div className="bg-current opacity-20 rounded-sm"></div>
              <div className="bg-current opacity-60 rounded-sm"></div>
              <div className="bg-current opacity-40 rounded-sm"></div>
              <div className="bg-current opacity-80 rounded-sm"></div>
            </div>
            <div className="flex-1">
              <h3 className={cn("text-sm font-bold", selected === 'bento' ? "text-purple-900" : "text-slate-700")}>
                Modern Bento
              </h3>
            </div>
            {selected === 'bento' && (
              <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                <CheckCircle size={12} />
              </div>
            )}
          </div>

          <div 
            onClick={() => onSelect('brutalist')}
            onMouseEnter={() => setHoveredId('brutalist')}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "group border-2 rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-300",
              selected === 'brutalist' ? 
              "border-black bg-[#FFDE03] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" : 
              "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all border-[2px] flex-shrink-0",
              selected === 'brutalist' ? "bg-white border-black text-black" : "bg-white border-slate-200 text-slate-400 group-hover:text-slate-600 shadow-sm"
            )}>
              <span className="font-black text-[10px]">BOLD</span>
            </div>
            <div className="flex-1">
              <h3 className={cn("text-sm font-bold", selected === 'brutalist' ? "text-black" : "text-slate-700")}>
                Neo-Brutalist
              </h3>
            </div>
            {selected === 'brutalist' && (
              <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center">
                <CheckCircle size={12} />
              </div>
            )}
          </div>

          <div 
            onClick={() => onSelect('terminal')}
            onMouseEnter={() => setHoveredId('terminal')}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "group border-2 rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-300",
              selected === 'terminal' ? 
              "border-[#32CD32] bg-[#0c0c0c] shadow-[0_0_20px_rgba(50,205,50,0.2)]" : 
              "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all border flex-shrink-0",
              selected === 'terminal' ? "bg-black border-[#32CD32] text-[#32CD32]" : "bg-white border-slate-200 text-slate-400 group-hover:text-slate-600 shadow-sm"
            )}>
              <Terminal size={20} />
            </div>
            <div className="flex-1">
              <h3 className={cn("text-sm font-bold", selected === 'terminal' ? "text-[#32CD32]" : "text-slate-700")}>
                Retro Terminal
              </h3>
            </div>
            {selected === 'terminal' && (
              <div className="w-5 h-5 rounded-full bg-[#32CD32] text-black flex items-center justify-center">
                <CheckCircle size={12} />
              </div>
            )}
          </div>

          <div 
            onClick={() => onSelect('serif')}
            onMouseEnter={() => setHoveredId('serif')}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "group border-2 rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-300",
              selected === 'serif' ? 
              "border-amber-900 bg-amber-50 shadow-xl" : 
              "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
              selected === 'serif' ? "bg-amber-900 text-white shadow-lg" : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm"
            )}>
              <span className="font-serif italic text-xl">Aa</span>
            </div>
            <div className="flex-1">
              <h3 className={cn("text-sm font-bold", selected === 'serif' ? "text-amber-900" : "text-slate-700")}>
                Professional Serif
              </h3>
            </div>
            {selected === 'serif' && (
              <div className="w-5 h-5 rounded-full bg-amber-900 text-white flex items-center justify-center shadow-lg">
                <CheckCircle size={12} />
              </div>
            )}
          </div>
        </div>

        {/* Hover Details Panel */}
        <div className="hidden md:block flex-1 min-h-[300px]">
          <AnimatePresence mode="wait">
            {hoveredId ? (
              <motion.div
                key={hoveredId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 h-full flex flex-col"
              >
                <div className="flex items-center gap-2 mb-4 text-indigo-600">
                  <Rocket size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Dizayn falsafasi</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-6 font-medium">
                  {TEMPLATE_DETAILS[hoveredId].philosophy}
                </p>
                <div className="h-px bg-slate-200 mb-6" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1 flex items-center gap-2">
                  <CheckCircle size={12} className="text-indigo-400" /> Asosiy xususiyatlar
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {TEMPLATE_DETAILS[hoveredId].features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/80 border border-white p-3 rounded-2xl shadow-sm text-[11px] font-bold text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/50 h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-200 mb-4 shadow-sm">
                  <Layout size={24} />
                </div>
                <p className="text-[11px] font-bold text-slate-400 italic">Har bir dizayn haqida batafsil ma'lumot olish uchun tanlovlardan biri ustiga olib boring.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <div className="mt-8 pt-8 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-normal text-slate-900">AI Shaxsiy Maslahatlar</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Portfoliongizni yanada yaxshilash uchun</p>
          </div>
        </div>

        {isGenerating ? (
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse">
            <Loader2 className="animate-spin text-indigo-400" size={16} />
            <span className="text-xs text-slate-400 font-medium">Maslahatlar tahlil qilinmoqda...</span>
          </div>
        ) : aiTips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiTips.slice(0, 3).map((tip, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 bg-white rounded-2xl border border-indigo-50 shadow-sm hover:border-indigo-100 hover:shadow-md transition-all flex gap-3"
              >
                <div className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb size={12} />
                </div>
                <p className="text-[11px] font-bold text-slate-700 leading-relaxed">
                  {tip}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-medium italic">Loyihalaringiz bo'yicha maslahatlar olish uchun GitHub integratsiyasini yakunlang.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PublishStep = ({
  user,
  projects,
  selectedTemplate,
  language,
  publishedUrl,
  linkCopyState,
  onOpenPreview,
  onOpenResume,
  onOpenAi,
  onCopyLink,
}: {
  user: User;
  projects: Project[];
  selectedTemplate: string;
  language: AppLanguage;
  publishedUrl: string | null;
  linkCopyState: 'idle' | 'copied';
  onOpenPreview: () => void;
  onOpenResume: () => void;
  onOpenAi: () => void;
  onCopyLink: () => void;
}) => {
  const publicProjects = projects.filter((project) => project.isPublic !== false).length;
  const readyUrl = publishedUrl || `devport.uz/${user.githubUsername || "username"}`;
  const shareUrl = readyUrl.startsWith("http") ? readyUrl : `https://${readyUrl}`;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const completionItems = [
    { label: "Profil", value: user.fullName ? "Tayyor" : "Kerak" },
    { label: "Bio", value: user.bio.length > 80 ? "Tayyor" : "Qisqa" },
    { label: "Loyihalar", value: `${publicProjects} ta` },
    { label: "Template", value: selectedTemplate },
    { label: "Til", value: language.toUpperCase() },
  ];

  useEffect(() => {
    let cancelled = false;

    import("qrcode")
      .then((module) => module.default.toDataURL(shareUrl, {
        margin: 1,
        width: 180,
        color: {
          dark: "#020617",
          light: "#ffffff",
        },
      }))
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [shareUrl]);

  const handleShare = async () => {
    if ("share" in navigator) {
      await navigator.share({
        title: `${user.fullName || "DevPort"} portfolio`,
        text: "Professional portfolio va CV paketi",
        url: shareUrl,
      });
      return;
    }

    onCopyLink();
  };

  return (
    <div className="space-y-6 py-2">
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
          <CheckCircle size={34} />
        </div>
        <h2 className="text-3xl font-black tracking-normal text-slate-950">Tayyor variant paketi</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-emerald-900/75">
          Ma'lumotlar asosida portfolio, ATS CV/PDF va AI CV matni tayyor. Quyidagi tugmalar orqali yakuniy variantlarni ko'rishingiz mumkin.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {completionItems.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 truncate text-sm font-black text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ReadyActionCard
          icon={Layout}
          title="Portfolio preview"
          description="Tanlangan premium shablonda tayyor portfolio sahifasini ko'ring."
          action="Ochish"
          onClick={onOpenPreview}
        />
        <ReadyActionCard
          icon={FileText}
          title="CV / PDF"
          description="Modern CV shablonini tanlang va PDF sifatida saqlang."
          action="CV ochish"
          onClick={onOpenResume}
        />
        <ReadyActionCard
          icon={Sparkles}
          title="AI CV matni"
          description="Structured ATS markdown matnni ko'ring yoki nusxalang."
          action="AI CV"
          onClick={onOpenAi}
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
        <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex justify-center">
            <div className="rounded-2xl border border-white/10 bg-white p-3 shadow-xl">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Portfolio QR code" className="h-36 w-36" />
              ) : (
                <div className="flex h-36 w-36 items-center justify-center text-slate-400">
                  <QrCode size={34} />
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Public link</p>
            <p className="mt-2 break-all text-sm font-bold text-slate-100">{shareUrl}</p>
            <p className="mt-3 text-xs leading-6 text-slate-400">
              "Tayyor variantni chiqarish" bosilgandan keyin ushbu link serverda saqlanadi. QR code, copy va native share orqali yuborish mumkin.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={onCopyLink}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-950 hover:bg-slate-100"
              >
                <Copy size={14} />
                {linkCopyState === 'copied' ? 'Nusxalandi' : 'Copy'}
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-white/15"
              >
                <Share2 size={14} />
                Share
              </button>
              {publishedUrl && (
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-white/15"
                >
                  <Globe size={14} />
                  Open
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReadyActionCard = ({
  icon: Icon,
  title,
  description,
  action,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex h-full flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/60"
  >
    <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white transition group-hover:bg-indigo-600">
      <Icon size={20} />
    </span>
    <span className="text-base font-black text-slate-950">{title}</span>
    <span className="mt-2 flex-1 text-xs font-medium leading-5 text-slate-500">{description}</span>
    <span className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600">
      {action}
      <ChevronRight size={14} />
    </span>
  </button>
);
