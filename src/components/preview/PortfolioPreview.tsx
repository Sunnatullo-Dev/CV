import React from "react";
import { AppLanguage, User, Project } from "../../types";
import { Github, Globe, Mail, MapPin, ExternalLink, Linkedin, Twitter, MessageCircle, Rocket, ArrowRight, Terminal, Code2, Cpu, Zap, LayoutGrid, Monitor, Command, Hash, ChevronRight, CheckCircle2, FileText } from "lucide-react";
import { cn } from "../../lib/utils";
import { motion } from "motion/react";

interface PreviewProps {
  user: User;
  projects: Project[];
  templateId?: string;
  language?: AppLanguage;
}

export const PortfolioPreview = ({ user, projects, templateId = "minimalist", language = "uz" }: PreviewProps) => {
  const currentYear = new Date().getFullYear();
  const visibleProjects = projects.filter((project) => project.isPublic !== false);

  if (visibleProjects.length === 0) {
    return <EmptyPortfolioPreview user={user} templateId={templateId} currentYear={currentYear} language={language} />;
  }

  switch (templateId) {
    case "modern-minimalist":
      return <ModernMinimalistLayout user={user} projects={visibleProjects} currentYear={currentYear} />;
    case "modern-technical":
      return <ModernTechnicalLayout user={user} projects={visibleProjects} currentYear={currentYear} />;
    case "dark":
      return <DarkTechnicalLayout user={user} projects={visibleProjects} currentYear={currentYear} />;
    case "bento":
      return <ModernBentoLayout user={user} projects={visibleProjects} currentYear={currentYear} />;
    case "brutalist":
      return <NeoBrutalistLayout user={user} projects={visibleProjects} currentYear={currentYear} />;
    case "terminal":
      return <RetroTerminalLayout user={user} projects={visibleProjects} currentYear={currentYear} />;
    case "serif":
      return <ProfessionalSerifLayout user={user} projects={visibleProjects} currentYear={currentYear} />;
    case "minimalist":
    default:
      return <MinimalistLayout user={user} projects={visibleProjects} currentYear={currentYear} />;
  }
};

const TEMPLATE_LABELS: Record<string, string> = {
  "modern-minimalist": "Modern Minimalist",
  "modern-technical": "Modern Technical",
  minimalist: "Minimalist Persona",
  dark: "Dark Technical",
  bento: "Modern Bento",
  brutalist: "Neo-Brutalist",
  terminal: "Retro Terminal",
  serif: "Professional Serif",
};

const EmptyPortfolioPreview = ({ user, templateId, currentYear, language }: any) => (
  <div className="min-h-screen bg-white text-slate-950">
    <header className="border-b border-slate-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-end md:py-24">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700">
            <CheckCircle2 size={14} />
            {TEMPLATE_LABELS[templateId] || "Professional template"} / {String(language).toUpperCase()}
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-normal text-slate-950 md:text-6xl">
            {user.fullName || "Your Name"}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            {user.bio || "Kuchli professional summary kiritilganda, bu yer rekruter uchun asosiy positioning blokiga aylanadi."}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Portfolio holati</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Content review kerak</h2>
            </div>
            <FileText size={22} className="text-blue-700" />
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <EmptyChecklistItem done={Boolean(user.fullName)} label="Ism va headline kiritilgan" />
            <EmptyChecklistItem done={user.bio?.length > 80} label="Bio yetarlicha kuchli" />
            <EmptyChecklistItem done={Boolean(user.githubUsername)} label="GitHub ulangan" />
            <EmptyChecklistItem done={false} label="Kamida 3 ta loyiha tanlangan" />
          </div>
        </div>
      </div>
    </header>

    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-12 md:grid-cols-3">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Selected works</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">Loyihalar hali import qilinmagan</h2>
          </div>
          <Rocket size={22} className="text-blue-700" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {["Production app", "Automation system"].map((title, index) => (
            <div key={title} className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
              <div className="mb-5 aspect-[16/10] rounded-lg border border-slate-200 bg-white" />
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Case study {index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                GitHub importdan keyin bu joyda loyiha maqsadi, texnologiyalar va natija ko'rinadi.
              </p>
            </div>
          ))}
        </div>
      </section>

      <aside className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Contact signal</p>
        <div className="mt-5 space-y-3">
          {user.githubUsername && (
            <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10">
              <Github size={16} />
              GitHub
            </a>
          )}
          {user.socialLinks?.linkedin && (
            <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10">
              <Linkedin size={16} />
              LinkedIn
            </a>
          )}
          {user.socialLinks?.website && (
            <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10">
              <Globe size={16} />
              Website
            </a>
          )}
          {!user.githubUsername && !user.socialLinks?.linkedin && !user.socialLinks?.website && (
            <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
              Aloqa linklari qo'shilganda bu panel rekruter uchun tezkor ishonch nuqtasiga aylanadi.
            </p>
          )}
        </div>
      </aside>
    </main>

    <footer className="mx-auto max-w-6xl border-t border-slate-200 px-6 py-8 text-xs font-semibold uppercase tracking-widest text-slate-400">
      &copy; {currentYear} {user.fullName || "DevPort"}
    </footer>
  </div>
);

const EmptyChecklistItem = ({ done, label }: { done: boolean; label: string }) => (
  <div className="flex items-center justify-between gap-4">
    <span>{label}</span>
    <span className={done ? "font-semibold text-emerald-700" : "font-semibold text-slate-400"}>
      {done ? "Tayyor" : "Kerak"}
    </span>
  </div>
);

const ModernMinimalistLayout = ({ user, projects, currentYear }: any) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-[#FAF9F6] min-h-screen text-[#1A1A1A] font-sans selection:bg-indigo-100/50"
  >
    <header className="max-w-4xl mx-auto pt-32 pb-20 px-6 text-center">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="inline-block mb-10 overflow-hidden rounded-full p-1 bg-white border border-slate-100 shadow-xl shadow-slate-100"
      >
        <div className="w-20 h-20 bg-indigo-50 flex items-center justify-center text-indigo-600 text-2xl font-black">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            user.fullName?.charAt(0) || "M"
          )}
        </div>
      </motion.div>
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-5xl md:text-7xl font-light tracking-normal mb-8"
      >
        {user.fullName || "Your Name"}
      </motion.h1>
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-light"
      >
        {user.bio}
      </motion.p>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center gap-8 mt-16 pb-20 border-b border-slate-200/50"
      >
        {user.githubUsername && (
          <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">GitHub</a>
        )}
        {user.socialLinks?.linkedin && (
          <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm font-bold uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">LinkedIn</a>
        )}
        {user.socialLinks?.twitter && (
          <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-sm font-bold uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">Twitter</a>
        )}
        {user.socialLinks?.website && (
          <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">Website</a>
        )}
      </motion.div>
    </header>

    <main className="max-w-5xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-32">
        {projects.map((project: any, idx: number) => (
          <motion.div 
            key={project.id} 
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: idx * 0.1 }}
            className={cn(
              "group flex flex-col",
              idx % 2 === 1 ? "md:mt-24" : ""
            )}
          >
            <div className="aspect-[4/5] bg-white overflow-hidden mb-10 relative shadow-sm">
              {project.image ? (
                <img src={project.image} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 scale-[1.01] group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200">
                  <Rocket size={60} strokeWidth={1} />
                </div>
              )}
              <a 
                href={project.url || project.repoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 shadow-2xl">
                  <ExternalLink size={24} className="text-slate-900" />
                </div>
              </a>
            </div>
            <div className="max-w-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-500 mb-4 block">Project {idx + 1}</span>
              <h3 className="text-3xl font-light mb-4">{project.title}</h3>
              <p className="text-slate-500 leading-relaxed mb-6 font-light truncate-3-lines">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag: any) => (
                  <span key={tag} className="text-[10px] font-medium text-slate-400 border border-slate-200 px-2 py-1 rounded-full uppercase tracking-widest">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </main>

    <footer className="max-w-4xl mx-auto py-32 px-6 border-t border-slate-200/50 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.4em] text-slate-300">
        Design Thinking / {user.fullName} / {currentYear}
      </p>
    </footer>
  </motion.div>
);

const ModernTechnicalLayout = ({ user, projects, currentYear }: any) => (
  <div className="bg-[#0f1115] min-h-screen text-slate-300 font-sans selection:bg-indigo-500/30">
    <div className="max-w-6xl mx-auto px-6 py-20">
      <header className="mb-32 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-800 pb-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex items-center justify-center text-indigo-400">
                <Code2 size={24} />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">System.Developer.Profile</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-normal">
              {user.fullName || "Samandarov S."}
            </h1>
            <p className="text-xl leading-relaxed text-slate-400 font-medium max-w-xl">
              {user.bio}
            </p>
          </div>
          <div className="flex flex-col gap-6 items-start md:items-end">
            <div className="flex gap-4">
              {user.githubUsername && (
                <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all shadow-xl">
                  <Github size={20} />
                </a>
              )}
              {user.socialLinks?.linkedin && (
                <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all shadow-xl">
                  <Linkedin size={20} />
                </a>
              )}
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl backdrop-blur-md">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Technical Status</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Available for new projects</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-32">
        <div className="flex items-center justify-between mb-16">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-normal flex items-center gap-3">
              <span className="w-8 h-px bg-indigo-500" /> Featured Projects
            </h2>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{projects.length} Total Modules</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project: any, idx: number) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-slate-900/30 border border-slate-800/50 rounded-[2.5rem] overflow-hidden hover:border-indigo-500/30 hover:bg-slate-900/50 transition-all p-4"
            >
              <div className="aspect-[16/10] bg-slate-950 rounded-[2rem] overflow-hidden mb-6 relative border border-slate-800 group-hover:border-slate-700 transition-all">
                {project.image ? (
                  <img src={project.image} alt="" className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-100" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-800">
                    <Monitor size={60} strokeWidth={1} />
                  </div>
                )}
                <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-all" />
              </div>

              <div className="px-4 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-white mb-2 group-hover:text-indigo-400 transition-colors uppercase tracking-normal">
                      {project.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag: any) => (
                        <span key={tag} className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <a href={project.url || project.repoUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95">
                    <ExternalLink size={20} />
                  </a>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-3">
                  {project.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900/40 border border-slate-800/60 rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-normal uppercase">Ready to start a mission?</h2>
          <p className="text-slate-400 mb-12 max-w-xl mx-auto font-medium">Have a complex technical problem that needs a robust solution? I'm ready to contribute to your core stack.</p>
          <a href={`mailto:hello@devport.uz`} className="inline-flex items-center gap-4 bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/20 active:scale-95">
            Initialize Contact <ChevronRight size={20} />
          </a>
        </div>
      </section>

      <footer className="mt-32 pt-10 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">
          DevPort.OS / Version 4.0.1
        </p>
        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">
          © {currentYear} {user.fullName}
        </p>
      </footer>
    </div>
  </div>
);

const MinimalistLayout = ({ user, projects, currentYear }: any) => (
  <div className="bg-white min-h-screen text-slate-900 font-sans selection:bg-indigo-100">
    <header id="top" className="max-w-2xl mx-auto pt-16 pb-8 px-6">
      <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-8 shadow-xl shadow-indigo-100 flex items-center justify-center text-white text-3xl font-black">
        {user.fullName?.charAt(0) || "D"}
      </div>
      
      <h1 className="text-4xl md:text-5xl font-black tracking-normal mb-4 text-slate-900">
        {user.fullName || "Ismingiz"}
      </h1>
      <p className="text-lg text-slate-600 max-w-xl leading-relaxed font-medium">
        {user.bio}
      </p>
      
      <div className="flex flex-wrap gap-4 mt-10">
        <a href={user.githubUsername ? `https://github.com/${user.githubUsername}` : "#"} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95">
          <Github size={20} className="group-hover:rotate-12 transition-transform" /> 
          <span>{user.githubUsername || "GitHub"}</span>
        </a>
        {user.socialLinks?.linkedin && (
          <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-12 h-12 bg-white border border-slate-200 text-indigo-600 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm active:scale-95">
            <Linkedin size={20} />
          </a>
        )}
        <a href={`mailto:contact@devport.uz`} className="flex items-center justify-center w-12 h-12 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
          <Mail size={20} />
        </a>
      </div>
    </header>

    <div className="max-w-2xl mx-auto px-6 mb-12">
      <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <MapPin size={18} />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Loyiha soni</span>
            <a href="#projects" className="text-sm font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 group">
              {projects.length} ta loyiha
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <Globe size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Veb-sayt</span>
            <span className="text-sm font-bold text-slate-400 italic">Mavjud emas</span>
          </div>
        </div>
      </div>
    </div>

    <section id="projects" className="max-w-2xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black tracking-normal flex items-center gap-2">Loyihalar</h2>
      </div>
      <div className="space-y-20">
        {[...projects].sort((a: any, b: any) => a.order - b.order).map((project: any) => (
          <div key={project.id} className="group relative">
            <div className="aspect-[16/10] bg-slate-50 rounded-[2.5rem] overflow-hidden mb-8 border border-slate-100 transition-all duration-500 group-hover:border-indigo-200 group-hover:shadow-2xl group-hover:shadow-indigo-100/50 relative group-hover:-translate-y-1">
              {project.image ? (
                <div className="w-full h-full relative overflow-hidden">
                  <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110 will-change-transform" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 text-slate-200 relative overflow-hidden">
                  <div className="p-8 bg-white rounded-full shadow-lg border border-slate-50 relative z-10 transform transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12 will-change-transform">
                    <Rocket size={48} strokeWidth={1.5} className="text-indigo-400" />
                  </div>
                </div>
              )}
              <a href={project.url || project.repoUrl} target="_blank" rel="noopener noreferrer" className="absolute top-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-20">
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl text-indigo-600 hover:bg-indigo-600 hover:text-white hover:scale-110 transition-all flex items-center gap-2 active:scale-95">
                  <ExternalLink size={20} />
                </div>
              </a>
            </div>
            <div className="px-4">
              <h3 className="text-3xl font-black text-slate-900 mb-3">{project.title}</h3>
              <p className="text-lg text-slate-500 leading-relaxed max-w-xl mb-6 font-medium">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag: any) => (
                  <span key={tag} className="text-[11px] uppercase font-black tracking-widest text-indigo-600 bg-indigo-50/80 px-4 py-1.5 rounded-xl border border-indigo-100/50">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

    <footer className="max-w-2xl mx-auto py-24 px-6 border-t border-slate-100 mt-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
      © {currentYear} {user.fullName || "DevPort"}.
    </footer>
  </div>
);

const DarkTechnicalLayout = ({ user, projects, currentYear }: any) => (
  <div className="bg-[#0a0a0c] min-h-screen text-slate-400 font-mono selection:bg-indigo-500/30">
    <div className="max-w-3xl mx-auto px-6 py-20">
      <header className="mb-20">
        <div className="flex items-center gap-4 mb-6">
          <Terminal size={24} className="text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-600">User Identity Profile</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-normal">
          {user.fullName || "System Admin"}
        </h1>
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-sm relative overflow-hidden group mb-10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
            <Cpu size={48} />
          </div>
          <p className="text-sm leading-relaxed text-slate-300 relative z-10">
            {user.bio}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <a href="#" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400 hover:text-white transition-colors border-b border-indigo-400/30 pb-1">
            <Github size={16} /> GitHub
          </a>
          {user.socialLinks?.linkedin && (
            <a href={user.socialLinks.linkedin} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400 hover:text-white transition-colors border-b border-indigo-400/30 pb-1">
              <Linkedin size={16} /> LinkedIn
            </a>
          )}
        </div>
      </header>

      <section>
        <div className="flex items-center gap-4 mb-12">
          <Code2 size={24} className="text-indigo-500" />
          <h2 className="text-lg font-black text-white uppercase tracking-widest">Repository Archive</h2>
        </div>
        <div className="space-y-6">
          {projects.map((project: any) => (
            <div key={project.id} className="group border border-slate-800 bg-slate-900/20 hover:bg-indigo-500/5 hover:border-indigo-500/20 rounded-sm transition-all p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-normal">
                  {project.title}
                </h3>
                <a href={project.url || project.repoUrl} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-white">
                  <ExternalLink size={20} />
                </a>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 mb-6 font-sans">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {project.tags.map((tag: any) => (
                  <span key={tag} className="text-[10px] uppercase font-bold tracking-widest text-slate-600 border border-slate-800 px-2 py-1">
                    {tag}
                  </span>
                ))}
              </div>
              {project.image && (
                <div className="w-full aspect-video rounded-sm overflow-hidden border border-slate-800 grayscale hover:grayscale-0 transition-all duration-700">
                  <img src={project.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-20 pt-10 border-t border-slate-900 text-center">
        <p className="text-[10px] uppercase text-slate-700 tracking-[0.5em]">
          End of Transmission / {currentYear}
        </p>
      </footer>
    </div>
  </div>
);

const ModernBentoLayout = ({ user, projects, currentYear }: any) => (
  <div className="bg-[#f2f4f7] min-h-screen text-slate-900 font-sans p-4 md:p-8">
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Bio Card */}
      <div className="md:col-span-8 bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-200/60 relative overflow-hidden flex flex-col justify-end min-h-[300px]">
        <div className="absolute top-8 right-8 w-20 h-20 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center rotate-12">
          <Zap size={32} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-normal mb-4">{user.fullName || "Tanishamiz"}</h1>
        <p className="text-lg text-slate-500 max-w-xl leading-relaxed">{user.bio}</p>
      </div>

      {/* Social Card */}
      <div className="md:col-span-4 bg-indigo-600 rounded-[2rem] p-8 text-white shadow-lg shadow-indigo-100 flex flex-col justify-between overflow-hidden relative group">
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        <div className="flex items-center gap-2 font-black uppercase tracking-widest text-xs opacity-70">
          <Globe size={14} /> Connect
        </div>
        <div className="space-y-4 relative z-10">
          <a href="#" className="flex items-center justify-between group/link">
            <span className="text-xl font-bold">GitHub</span>
            <ArrowRight size={24} className="group-hover/link:translate-x-2 transition-transform" />
          </a>
          <a href="#" className="flex items-center justify-between group/link">
            <span className="text-xl font-bold">LinkedIn</span>
            <ArrowRight size={24} className="group-hover/link:translate-x-2 transition-transform" />
          </a>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3 flex items-center gap-4 py-8">
          <h2 className="text-2xl font-black tracking-normal">Tanlangan Ishlar</h2>
          <div className="h-px flex-1 bg-slate-200" />
          <LayoutGrid size={24} className="text-slate-400" />
        </div>
        
        {projects.map((project: any, idx: number) => (
          <div 
            key={project.id} 
            className={cn(
              "bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/60 transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden flex flex-col",
              idx === 0 ? "md:col-span-2" : "md:col-span-1"
            )}
          >
            {project.image ? (
              <div className="w-full aspect-video rounded-2xl overflow-hidden mb-6">
                <img src={project.image} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full aspect-video rounded-2xl bg-slate-50 flex items-center justify-center mb-6 text-slate-200">
                <Rocket size={40} />
              </div>
            )}
            <h3 className="text-xl font-black mb-2">{project.title}</h3>
            <p className="text-sm text-slate-500 mb-6 flex-1 line-clamp-2">{project.description}</p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex gap-2">
                {project.tags.slice(0, 2).map((tag: any) => (
                  <span key={tag} className="text-[10px] font-bold uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
              <a href={project.url || project.repoUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-colors">
                <ExternalLink size={20} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="md:col-span-12 text-center py-20 text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">
        DevPort © {currentYear}
      </div>
    </div>
  </div>
);

const NeoBrutalistLayout = ({ user, projects, currentYear }: any) => (
  <div className="bg-[#FFDE03] min-h-screen text-black font-black p-4 md:p-12 selection:bg-black selection:text-white">
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="border-[4px] border-black bg-white p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
        <h1 className="text-5xl md:text-8xl mb-6 tracking-normal uppercase leading-none">{user.fullName || "SUNNATULLA"}</h1>
        <div className="bg-black text-[#FFDE03] inline-block px-4 py-2 mb-8 text-xl">
          FULL-STACK DEVELOPER
        </div>
        <p className="text-2xl leading-tight border-t-[4px] border-black pt-8">
          {user.bio}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border-[4px] border-black bg-[#FF5252] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white">
          <h2 className="text-3xl mb-4 italic uppercase">Connect</h2>
          <div className="space-y-4">
            <a href="#" className="block text-2xl hover:underline underline-offset-8 decoration-[4px]">GITHUB ↗</a>
            <a href="#" className="block text-2xl hover:underline underline-offset-8 decoration-[4px]">LINKEDIN ↗</a>
          </div>
        </div>
        <div className="border-[4px] border-black bg-[#448AFF] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white">
          <h2 className="text-3xl mb-4 italic uppercase">Contact</h2>
          <p className="text-2xl break-all">HELLO@DEVPORT.UZ</p>
        </div>
      </div>

      <section className="space-y-8">
        <div className="bg-white border-[4px] border-black p-4 inline-block text-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          PROJECTS_ARCHIVE
        </div>
        <div className="grid grid-cols-1 gap-12">
          {projects.map((project: any) => (
            <div key={project.id} className="border-[4px] border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex flex-col md:flex-row">
              {project.image && (
                <div className="md:w-1/2 border-b-[4px] md:border-b-0 md:border-r-[4px] border-black">
                  <img src={project.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-8 flex-1">
                <h3 className="text-4xl mb-4 uppercase">{project.title}</h3>
                <p className="text-xl mb-6 font-bold">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {project.tags.map((tag: any) => (
                    <span key={tag} className="border-[2px] border-black px-3 py-1 bg-[#FFDE03] text-sm uppercase">#{tag}</span>
                  ))}
                </div>
                <a href={project.url || project.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 text-xl hover:bg-white hover:text-black transition-colors border-[4px] border-black">
                  VIEW_LIVE <ExternalLink size={24} strokeWidth={3} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-20 text-center text-4xl border-t-[8px] border-black uppercase italic">
        Peace Out {currentYear}
      </footer>
    </div>
  </div>
);

const RetroTerminalLayout = ({ user, projects, currentYear }: any) => (
  <div className="bg-[#0c0c0c] min-h-screen text-[#32CD32] font-mono p-4 md:p-12 selection:bg-[#32CD32] selection:text-black">
    <div className="max-w-4xl mx-auto border-[1px] border-[#32CD32] p-4 md:p-10 shadow-[0_0_50px_rgba(50,205,50,0.1)] relative">
      <div className="absolute top-0 right-0 p-4 animate-pulse">
        <Monitor size={24} />
      </div>
      
      <header className="mb-16 border-b-[1px] border-[#32CD32]/30 pb-10">
        <div className="flex items-center gap-2 mb-4 text-[#32CD32]/50 text-xs">
          <Command size={14} /> <span>LAST_LOGIN: {new Date().toLocaleDateString()}</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-4 flex items-center gap-4">
          <span className="opacity-50">#</span> {user.fullName || "ROOT"}
        </h1>
        <div className="flex items-center gap-2 mb-8 bg-[#32CD32]/10 p-2 inline-flex">
          <span className="animate-bounce">_</span>
          <span className="text-sm">STATUS: OPERATIONAL</span>
        </div>
        <p className="max-w-2xl text-lg leading-relaxed opacity-80">
          {user.bio}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 bg-[#32CD32] text-black px-2 py-1 inline-block">
            <Hash size={18} /> SOCIAL_LINKS
          </h2>
          <div className="space-y-2 text-sm">
            <a href="#" className="block hover:translate-x-2 transition-transform">&gt; GITHUB_REPOS</a>
            <a href="#" className="block hover:translate-x-2 transition-transform">&gt; LINKEDIN_PROFILE</a>
            <a href="#" className="block hover:translate-x-2 transition-transform">&gt; EMAIL_CLIENT</a>
          </div>
        </section>
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 bg-[#32CD32] text-black px-2 py-1 inline-block">
            <Cpu size={18} /> TECH_STACK
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {["React", "Node.js", "Firebase", "TypeScript", "Vite"].map(skill => (
              <span key={skill} className="border border-[#32CD32] px-2 py-1">{skill}</span>
            ))}
          </div>
        </section>
      </div>

      <section className="space-y-12">
        <div className="text-2xl font-bold flex items-center gap-2">
          <ChevronRight size={24} className="text-[#32CD32] animate-pulse" />
          <span>LS ./PROJECTS</span>
        </div>
        <div className="grid grid-cols-1 gap-8">
          {projects.map((project: any) => (
            <div key={project.id} className="border border-[#32CD32]/30 p-6 hover:bg-[#32CD32]/5 transition-all group">
              <div className="flex flex-col md:flex-row gap-6">
                {project.image && (
                  <div className="md:w-1/3 aspect-video bg-black overflow-hidden border border-[#32CD32]/20">
                    <img src={project.image} alt="" className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">&gt; {project.title}</h3>
                  <p className="text-sm opacity-60 mb-6 leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      {project.tags.map((tag: any) => (
                        <span key={tag} className="text-[10px] opacity-40">[{tag}]</span>
                      ))}
                    </div>
                    <a href={project.url || project.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs border border-[#32CD32] px-4 py-2 hover:bg-[#32CD32] hover:text-black transition-all">
                      EXECUTE_LIVE <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-32 pt-8 border-t border-[#32CD32]/20 text-center text-[10px] tracking-[5px] opacity-30">
        SYS_LOG_COMPLETE_{currentYear}
      </footer>
    </div>
  </div>
);

const ProfessionalSerifLayout = ({ user, projects, currentYear }: any) => (
  <div className="bg-[#fcfbf7] min-h-screen text-[#1a1a1a] font-serif selection:bg-amber-100 selection:text-amber-900">
    <div className="max-w-4xl mx-auto px-6 py-24">
      <header className="mb-24 text-center border-b-[0.5px] border-amber-900/10 pb-20">
        <div className="text-xs font-bold uppercase tracking-[0.4em] text-amber-800/60 mb-8 italic">Curriculum Vitae / Portfolio</div>
        <h1 className="text-6xl md:text-8xl font-normal mb-8 leading-none italic">
          {user.fullName || "Your Name"}
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed border-t border-amber-900/5 pt-12">
          {user.bio}
        </p>
        <div className="flex justify-center gap-10 mt-16 text-sm font-bold uppercase tracking-[0.2em] text-amber-900/60 font-sans">
          {user.githubUsername && (
            <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noopener noreferrer" className="hover:text-amber-900 transition-colors">GitHub</a>
          )}
          {user.socialLinks?.linkedin && (
            <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-amber-900 transition-colors">LinkedIn</a>
          )}
          <a href="mailto:hello@devport.uz" className="hover:text-amber-900 transition-colors">Contact</a>
        </div>
      </header>

      <section>
        <div className="flex items-center gap-6 mb-20">
          <div className="h-[0.5px] flex-1 bg-amber-900/20" />
          <h2 className="text-xs font-bold uppercase tracking-[0.5em] text-amber-800/40 font-sans">Selected Works</h2>
          <div className="h-[0.5px] flex-1 bg-amber-900/20" />
        </div>

        <div className="space-y-40">
          {projects.map((project: any, idx: number) => (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-start gap-12 group"
            >
              <div className="md:w-1/3 text-xs font-bold font-sans text-amber-800/40 mt-1">
                EXHIBIT {idx + 1} / {currentYear}
              </div>
              <div className="flex-1">
                <h3 className="text-4xl md:text-5xl font-normal mb-6 italic leading-tight group-hover:text-amber-900 transition-colors uppercase tracking-normal">{project.title}</h3>
                <div className="aspect-[16/9] bg-white overflow-hidden mb-10 border border-amber-900/5 shadow-2xl shadow-amber-900/5 group-hover:shadow-amber-900/10 transition-all duration-700">
                  {project.image ? (
                    <img src={project.image} alt="" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000" />
                  ) : (
                    <div className="w-full h-full bg-[#fdfdfd] flex items-center justify-center text-amber-900/10">
                      <Rocket size={100} strokeWidth={0.5} />
                    </div>
                  )}
                </div>
                <div className="max-w-2xl">
                  <p className="text-lg leading-relaxed text-slate-700 mb-8 font-sans font-light">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-3 mb-8 text-xs font-bold font-sans text-amber-900/60 uppercase">
                    {project.tags.map((tag: any) => (
                      <span key={tag} className="border-b border-amber-900/20 pb-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a href={project.url || project.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] border border-amber-900/20 px-8 py-4 hover:bg-amber-900 hover:text-white transition-all font-sans">
                    View Project <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="mt-60 pt-20 border-t border-amber-900/10 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-bold uppercase tracking-[0.4em] text-amber-800/40 font-sans">
        <div>Portfolio / {user.fullName} / Uzbekistan</div>
        <div>All rights reserved &copy; {currentYear}</div>
      </footer>
    </div>
  </div>
);
