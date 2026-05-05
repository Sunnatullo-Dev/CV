import React, { useState } from 'react';
import {
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileDown,
  FileJson,
  FileText,
  Gauge,
  Layers3,
  Loader2,
  Printer,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AppLanguage, Project, ResumeData, User } from '../../types';
import { buildResumeData, LANGUAGE_NAMES } from '../../lib/resume';
import { cn } from '../../lib/utils';
import { Button } from '../shared/Button';
import { analyzeResume } from '../../lib/ats';
import { buildResumeMarkdown, downloadBlob, downloadResumeDocx, downloadResumePdf, getResumeFileBaseName } from '../../lib/export';

type CvTemplateId =
  | 'ats-classic'
  | 'modern-sidebar'
  | 'classic-sidebar'
  | 'recruiter-pro'
  | 'europass-international'
  | 'tech-compact'
  | 'timeline-pro'
  | 'executive-compact'
  | 'ats-clean'
  | 'one-page-premium'
  | 'software-engineer';

interface ResumePreviewProps {
  user: User;
  projects: Project[];
  language: AppLanguage;
}

const COPY = {
  uz: {
    title: 'Modern CV shablonlari',
    subtitle: "Rekruter, ATS va professional taqdimot uchun tayyor CV ko'rinishlari.",
    print: 'PDF / Chop etish',
    pdf: 'PDF yuklash',
    docx: 'DOCX yuklash',
    markdown: 'Markdown',
    json: 'JSON',
    copyCv: 'CV nusxalash',
    copied: 'Nusxalandi',
    atsTitle: 'ATS tayyorlik',
    atsSubtitle: "CV rekruter va ATS ko'zi bilan tekshirildi.",
    summary: 'Professional xulosa',
    skills: "Ko'nikmalar",
    experience: 'Tajriba',
    projects: 'Loyihalar',
    education: "Ta'lim",
    languages: 'Tillar',
    certifications: 'Sertifikatlar',
    empty: "Loyihalar import qilingandan keyin bu bo'lim to'ldiriladi.",
    contact: 'Aloqa',
    fallbackName: 'Professional Developer',
    linksFallback: 'GitHub / LinkedIn / Website',
    timelineCv: 'Timeline CV',
    executiveCv: 'Executive CV',
    classicSidebarCv: 'Classic Sidebar Resume',
    recruiterProCv: 'Recruiter Pro CV',
    europassCv: 'International Formal CV',
    techCompactCv: 'Tech Compact Resume',
    atsCleanCv: 'ATS Clean CV',
    onePageCv: 'One Page Premium',
    softwareEngineerCv: 'Software Engineer Resume',
    coreStack: 'Core stack',
    impactHighlights: 'Impact highlights',
  },
  en: {
    title: 'Modern CV templates',
    subtitle: 'Resume layouts prepared for recruiters, ATS, and polished presentation.',
    print: 'PDF / Print',
    pdf: 'Download PDF',
    docx: 'Download DOCX',
    markdown: 'Markdown',
    json: 'JSON',
    copyCv: 'Copy CV',
    copied: 'Copied',
    atsTitle: 'ATS readiness',
    atsSubtitle: 'Resume checked for recruiter and ATS readability.',
    summary: 'Professional Summary',
    skills: 'Skills',
    experience: 'Experience',
    projects: 'Projects',
    education: 'Education',
    languages: 'Languages',
    certifications: 'Certifications',
    empty: 'This section will be filled after importing projects.',
    contact: 'Contact',
    fallbackName: 'Professional Developer',
    linksFallback: 'GitHub / LinkedIn / Website',
    timelineCv: 'Timeline CV',
    executiveCv: 'Executive CV',
    classicSidebarCv: 'Classic Sidebar Resume',
    recruiterProCv: 'Recruiter Pro CV',
    europassCv: 'International Formal CV',
    techCompactCv: 'Tech Compact Resume',
    atsCleanCv: 'ATS Clean CV',
    onePageCv: 'One Page Premium',
    softwareEngineerCv: 'Software Engineer Resume',
    coreStack: 'Core stack',
    impactHighlights: 'Impact highlights',
  },
  ru: {
    title: 'Современные CV-шаблоны',
    subtitle: 'Макеты CV, подготовленные для рекрутеров, ATS и профессиональной презентации.',
    print: 'PDF / Печать',
    pdf: 'Скачать PDF',
    docx: 'Скачать DOCX',
    markdown: 'Markdown',
    json: 'JSON',
    copyCv: 'Копировать CV',
    copied: 'Скопировано',
    atsTitle: 'Готовность к ATS',
    atsSubtitle: 'CV проверено на читаемость для рекрутера и ATS.',
    summary: 'Профессиональное summary',
    skills: 'Навыки',
    experience: 'Опыт',
    projects: 'Проекты',
    education: 'Образование',
    languages: 'Языки',
    certifications: 'Сертификаты',
    empty: 'Этот раздел заполнится после импорта проектов.',
    contact: 'Контакты',
    fallbackName: 'Профессиональный разработчик',
    linksFallback: 'GitHub / LinkedIn / Website',
    timelineCv: 'Timeline CV',
    executiveCv: 'Executive CV',
    classicSidebarCv: 'Classic Sidebar Resume',
    recruiterProCv: 'Recruiter Pro CV',
    europassCv: 'International Formal CV',
    techCompactCv: 'Tech Compact Resume',
    atsCleanCv: 'ATS Clean CV',
    onePageCv: 'One Page Premium',
    softwareEngineerCv: 'Software Engineer Resume',
    coreStack: 'Core stack',
    impactHighlights: 'Impact highlights',
  },
};

const CV_TEMPLATES: Array<{
  id: CvTemplateId;
  icon: React.ElementType;
}> = [
  {
    id: 'modern-sidebar',
    icon: Layers3,
  },
  {
    id: 'classic-sidebar',
    icon: Layers3,
  },
  {
    id: 'recruiter-pro',
    icon: ShieldCheck,
  },
  {
    id: 'europass-international',
    icon: FileText,
  },
  {
    id: 'tech-compact',
    icon: BriefcaseBusiness,
  },
  {
    id: 'timeline-pro',
    icon: BriefcaseBusiness,
  },
  {
    id: 'ats-clean',
    icon: ShieldCheck,
  },
  {
    id: 'one-page-premium',
    icon: FileText,
  },
  {
    id: 'software-engineer',
    icon: BriefcaseBusiness,
  },
  {
    id: 'executive-compact',
    icon: Sparkles,
  },
  {
    id: 'ats-classic',
    icon: FileText,
  },
];

const TEMPLATE_COPY: Record<AppLanguage, Record<CvTemplateId, { name: string; audience: string }>> = {
  uz: {
    'modern-sidebar': { name: 'Modern Sidebar', audience: 'Tech CV / portfolio PDF' },
    'classic-sidebar': { name: 'Classic Sidebar', audience: 'Rasmli chap panel va timeline' },
    'recruiter-pro': { name: 'Recruiter Pro', audience: "HR tez ko'radigan professional CV" },
    'europass-international': { name: 'International Formal', audience: 'Chet el va formal arizalar' },
    'tech-compact': { name: 'Tech Compact', audience: 'Developerlar uchun zich resume' },
    'timeline-pro': { name: 'Timeline Pro', audience: "Tajribaga yo'naltirilgan resume" },
    'ats-clean': { name: 'ATS Clean CV', audience: "Ishga topshirish uchun toza format" },
    'one-page-premium': { name: 'One Page Premium', audience: '1 sahifalik premium CV' },
    'software-engineer': { name: 'Software Engineer Resume', audience: 'Stack, impact va loyihalar' },
    'executive-compact': { name: 'Executive Compact', audience: 'Senior / architect profil' },
    'ats-classic': { name: 'ATS Classic', audience: "Maksimal ATS o'qilishi" },
  },
  en: {
    'modern-sidebar': { name: 'Modern Sidebar', audience: 'Tech CV / portfolio PDF' },
    'classic-sidebar': { name: 'Classic Sidebar', audience: 'Photo sidebar and timeline resume' },
    'recruiter-pro': { name: 'Recruiter Pro', audience: 'Fast-scannable CV for HR' },
    'europass-international': { name: 'International Formal', audience: 'Global and formal applications' },
    'tech-compact': { name: 'Tech Compact', audience: 'Dense resume for developers' },
    'timeline-pro': { name: 'Timeline Pro', audience: 'Experience-focused resume' },
    'ats-clean': { name: 'ATS Clean CV', audience: 'Clean job application format' },
    'one-page-premium': { name: 'One Page Premium', audience: 'Premium one-page CV' },
    'software-engineer': { name: 'Software Engineer Resume', audience: 'Stack, impact, and projects' },
    'executive-compact': { name: 'Executive Compact', audience: 'Senior / architect profile' },
    'ats-classic': { name: 'ATS Classic', audience: 'Maximum ATS readability' },
  },
  ru: {
    'modern-sidebar': { name: 'Modern Sidebar', audience: 'Tech CV / portfolio PDF' },
    'recruiter-pro': { name: 'Recruiter Pro', audience: 'CV для быстрого просмотра HR' },
    'europass-international': { name: 'International Formal', audience: 'Для международных и формальных откликов' },
    'tech-compact': { name: 'Tech Compact', audience: 'Компактное resume для разработчиков' },
    'classic-sidebar': { name: 'Classic Sidebar', audience: 'Фото в боковой панели и timeline' },
    'timeline-pro': { name: 'Timeline Pro', audience: 'CV с акцентом на опыт' },
    'ats-clean': { name: 'ATS Clean CV', audience: 'Чистый формат для отклика' },
    'one-page-premium': { name: 'One Page Premium', audience: 'Премиум CV на одну страницу' },
    'software-engineer': { name: 'Software Engineer Resume', audience: 'Stack, impact и проекты' },
    'executive-compact': { name: 'Executive Compact', audience: 'Senior / architect профиль' },
    'ats-classic': { name: 'ATS Classic', audience: 'Максимальная читаемость ATS' },
  },
};

export const ResumePreview = ({ user, projects, language }: ResumePreviewProps) => {
  const [templateId, setTemplateId] = useState<CvTemplateId>('modern-sidebar');
  const [exportState, setExportState] = useState<'idle' | 'pdf' | 'docx' | 'copied'>('idle');
  const visibleProjects = projects.filter((project) => project.isPublic !== false);
  const resume = buildResumeData(user, visibleProjects, language);
  const copy = COPY[language];
  const selectedTemplate = CV_TEMPLATES.find((template) => template.id === templateId) || CV_TEMPLATES[0];
  const selectedTemplateCopy = TEMPLATE_COPY[language][selectedTemplate.id];
  const SelectedIcon = selectedTemplate.icon;
  const markdown = buildResumeMarkdown(user, resume, language);
  const ats = analyzeResume(resume, user, visibleProjects, language);
  const fileBaseName = getResumeFileBaseName(user);

  const handleDownloadPdf = async () => {
    setExportState('pdf');
    try {
      await downloadResumePdf(user, resume, language);
    } finally {
      setExportState('idle');
    }
  };

  const handleDownloadMarkdown = () => {
    downloadBlob(markdown, `${fileBaseName}.md`, 'text/markdown;charset=utf-8');
  };

  const handleDownloadDocx = () => {
    setExportState('docx');
    try {
      downloadResumeDocx(user, resume, language);
    } finally {
      window.setTimeout(() => setExportState('idle'), 300);
    }
  };

  const handleDownloadJson = () => {
    downloadBlob(JSON.stringify(resume, null, 2), `${fileBaseName}.json`, 'application/json;charset=utf-8');
  };

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
    setExportState('copied');
    window.setTimeout(() => setExportState('idle'), 1800);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 md:px-6 md:py-8">
      <div className="no-print mx-auto mb-5 max-w-6xl">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950">{copy.title}</h1>
            <p className="mt-1 text-sm text-slate-600">{copy.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <Button onClick={handleDownloadPdf} disabled={exportState === 'pdf'} className="h-11 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 sm:px-4 sm:text-sm">
              {exportState === 'pdf' ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Download className="mr-2" size={16} />}
              {copy.pdf}
            </Button>
            <Button variant="outline" onClick={handleDownloadDocx} disabled={exportState === 'docx'} className="h-11 rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-white sm:px-4 sm:text-sm">
              {exportState === 'docx' ? <Loader2 className="mr-2 animate-spin" size={15} /> : <FileDown className="mr-2" size={15} />}
              {copy.docx}
            </Button>
            <Button variant="outline" onClick={handleDownloadMarkdown} className="h-11 rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-white sm:px-4 sm:text-sm">
              <FileText className="mr-2" size={15} />
              {copy.markdown}
            </Button>
            <Button variant="outline" onClick={handleDownloadJson} className="h-11 rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-white sm:px-4 sm:text-sm">
              <FileJson className="mr-2" size={15} />
              {copy.json}
            </Button>
            <Button variant="outline" onClick={handleCopyMarkdown} className="h-11 rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-white sm:px-4 sm:text-sm">
              <ClipboardCheck className="mr-2" size={15} />
              {exportState === 'copied' ? copy.copied : copy.copyCv}
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="h-11 rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-white sm:px-4 sm:text-sm">
              <Printer className="mr-2" size={15} />
              {copy.print}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          {CV_TEMPLATES.map((template) => {
            const Icon = template.icon;
            const isSelected = template.id === templateId;

            return (
              <button
                key={template.id}
                onClick={() => setTemplateId(template.id)}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 text-left transition',
                  isSelected
                    ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white',
                )}
              >
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md border', isSelected ? 'border-white/15 bg-white/10' : 'border-slate-200 bg-white')}>
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{TEMPLATE_COPY[language][template.id].name}</span>
                  <span className={cn('mt-1 block text-xs leading-5', isSelected ? 'text-slate-300' : 'text-slate-500')}>{TEMPLATE_COPY[language][template.id].audience}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
          <SelectedIcon size={15} />
          {selectedTemplateCopy.name}
        </div>

        <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[0.36fr_0.64fr]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{copy.atsTitle}</p>
                <p className="mt-1 text-sm text-slate-600">{copy.atsSubtitle}</p>
              </div>
              <Gauge size={22} className={ats.level === 'excellent' ? 'text-emerald-700' : ats.level === 'good' ? 'text-blue-700' : 'text-amber-700'} />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-semibold tracking-normal text-slate-950">{ats.score}</span>
              <span className="pb-1 text-sm font-bold text-slate-500">/100</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={cn('h-full rounded-full transition-all', ats.level === 'excellent' ? 'bg-emerald-500' : ats.level === 'good' ? 'bg-blue-500' : 'bg-amber-500')}
                style={{ width: `${ats.score}%` }}
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {ats.checks.map((item) => (
              <div key={item.label} className={cn('rounded-lg border p-3', item.done ? 'border-emerald-100 bg-emerald-50' : 'border-slate-200 bg-slate-50')}>
                <div className="flex items-center gap-2">
                  {item.done ? <ShieldCheck size={15} className="text-emerald-700" /> : <Sparkles size={15} className="text-amber-700" />}
                  <p className={cn('text-xs font-bold uppercase tracking-widest', item.done ? 'text-emerald-800' : 'text-slate-600')}>{item.label}</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{item.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {templateId === 'ats-classic' && <AtsClassicTemplate user={user} resume={resume} copy={copy} language={language} />}
      {templateId === 'modern-sidebar' && <ModernSidebarTemplate user={user} resume={resume} copy={copy} language={language} />}
      {templateId === 'classic-sidebar' && <ClassicSidebarTemplate user={user} resume={resume} copy={copy} language={language} />}
      {templateId === 'recruiter-pro' && <RecruiterProTemplate user={user} resume={resume} copy={copy} language={language} />}
      {templateId === 'europass-international' && <EuropassInternationalTemplate user={user} resume={resume} copy={copy} language={language} />}
      {templateId === 'tech-compact' && <TechCompactTemplate user={user} resume={resume} copy={copy} language={language} />}
      {templateId === 'timeline-pro' && <TimelineProTemplate user={user} resume={resume} copy={copy} language={language} />}
      {templateId === 'ats-clean' && <AtsCleanTemplate user={user} resume={resume} copy={copy} language={language} />}
      {templateId === 'one-page-premium' && <OnePagePremiumTemplate user={user} resume={resume} copy={copy} language={language} />}
      {templateId === 'software-engineer' && <SoftwareEngineerTemplate user={user} resume={resume} copy={copy} language={language} />}
      {templateId === 'executive-compact' && <ExecutiveCompactTemplate user={user} resume={resume} copy={copy} language={language} />}

      <div className="no-print mx-auto mt-5 max-w-6xl rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <Download className="mr-2 inline" size={16} />
        {selectedTemplateCopy.name} / {LANGUAGE_NAMES[language]}
      </div>
    </div>
  );
};

const AtsClassicTemplate = ({ user, resume, copy, language }: TemplateProps) => (
  <article className="resume-page mx-auto max-w-5xl bg-white p-8 shadow-sm md:p-12">
    <header className="border-b border-slate-300 pb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-4xl font-bold tracking-normal text-slate-950">{user.fullName || copy.fallbackName}</h2>
          <p className="mt-2 text-lg font-semibold text-slate-700">{resume.headline}</p>
          <p className="mt-1 text-sm text-slate-500">{LANGUAGE_NAMES[language]} CV</p>
        </div>
        <ContactLinks links={resume.contactLinks} align="right" copy={copy} />
      </div>
    </header>

    <ResumeSection title={copy.summary}>
      <p className="text-sm leading-7 text-slate-700">{resume.summary}</p>
    </ResumeSection>

    <SkillsBlock resume={resume} copy={copy} />
    <ExperienceBlock resume={resume} copy={copy} />
    <ProjectsBlock resume={resume} copy={copy} cardStyle="classic" />
    <EducationLanguagesBlock resume={resume} copy={copy} />
  </article>
);

const ModernSidebarTemplate = ({ user, resume, copy, language }: TemplateProps) => (
  <article className="resume-page mx-auto grid max-w-6xl overflow-hidden bg-white shadow-sm md:grid-cols-[0.34fr_0.66fr]">
    <aside className="bg-slate-950 p-8 text-white md:p-10">
      <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-xl bg-white text-2xl font-bold text-slate-950">
        {(user.fullName || 'D').charAt(0)}
      </div>
      <h2 className="text-3xl font-semibold leading-tight tracking-normal">{user.fullName || copy.fallbackName}</h2>
      <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-blue-300">{resume.headline}</p>
      <p className="mt-2 text-xs font-medium text-slate-400">{LANGUAGE_NAMES[language]} CV</p>

      <div className="mt-10">
        <SidebarTitle>{copy.contact}</SidebarTitle>
        <ContactLinks links={resume.contactLinks} variant="dark" copy={copy} />
      </div>

      <div className="mt-10">
        <SidebarTitle>{copy.skills}</SidebarTitle>
        <div className="flex flex-wrap gap-2">
          {resume.skills.map((skill) => (
            <span key={skill} className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <SidebarTitle>{copy.languages}</SidebarTitle>
        <p className="text-sm leading-7 text-slate-300">{resume.languages.join(', ')}</p>
      </div>
    </aside>

    <main className="p-8 md:p-10">
      <ResumeSection title={copy.summary} compact>
        <p className="text-sm leading-7 text-slate-700">{resume.summary}</p>
      </ResumeSection>
      <ExperienceBlock resume={resume} copy={copy} />
      <ProjectsBlock resume={resume} copy={copy} cardStyle="modern" />
      <EducationBlock resume={resume} copy={copy} />
    </main>
  </article>
);

const ClassicSidebarTemplate = ({ user, resume, copy, language }: TemplateProps) => {
  const displayName = user.fullName || copy.fallbackName;
  const [firstName, ...restNameParts] = displayName.split(' ');
  const lastName = restNameParts.join(' ');

  return (
    <article className="resume-page mx-auto max-w-5xl overflow-hidden bg-white shadow-sm md:grid md:grid-cols-[0.34fr_0.66fr]">
      <aside className="bg-[#333b4c] px-6 py-8 text-white md:min-h-[1120px] md:px-8">
        <div className="mx-auto mb-10 flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-white/15 bg-white/10 text-5xl font-semibold text-white">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            displayName.charAt(0)
          )}
        </div>

        <ClassicSidebarSection title={copy.contact}>
          {resume.contactLinks.length ? (
            <div className="space-y-3">
              {resume.contactLinks.map((link) => (
                <a key={link} href={link} target="_blank" rel="noopener noreferrer" className="block break-all text-sm font-medium leading-6 text-slate-100 hover:text-white hover:underline">
                  {link.replace(/^https?:\/\//, '')}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-200">{copy.linksFallback}</p>
          )}
        </ClassicSidebarSection>

        <ClassicSidebarSection title={copy.skills}>
          <ul className="space-y-3">
            {resume.skills.slice(0, 10).map((skill) => (
              <li key={skill} className="flex gap-3 text-sm leading-6 text-slate-100">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                <span>{skill}</span>
              </li>
            ))}
          </ul>
        </ClassicSidebarSection>

        <ClassicSidebarSection title={copy.languages}>
          <ul className="space-y-3">
            {resume.languages.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-slate-100">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </ClassicSidebarSection>
      </aside>

      <main className="p-6 text-slate-900 md:p-10">
        <header className="pb-7">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-slate-500">{copy.classicSidebarCv}</p>
          <h2 className="text-5xl font-light leading-tight tracking-normal text-slate-900 md:text-6xl">
            <span className="font-semibold">{firstName}</span>{lastName ? ` ${lastName}` : ''}
          </h2>
          <p className="mt-2 text-2xl font-light tracking-[0.18em] text-slate-700">{resume.headline}</p>
          <p className="mt-1 text-base font-semibold text-slate-800">{LANGUAGE_NAMES[language]} CV</p>
          <p className="mt-5 text-sm leading-7 text-slate-700">{resume.summary}</p>
        </header>

        <ClassicTimelineSection title={copy.experience}>
          {resume.experience.length ? resume.experience.slice(0, 5).map((item) => (
            <ClassicTimelineItem
              key={`${item.company}-${item.role}`}
              date={`${item.startDate} - ${item.endDate || 'Present'}`}
              subtitle={item.company}
              title={item.role}
            >
              {item.description}
            </ClassicTimelineItem>
          )) : <p className="text-sm text-slate-500">{copy.empty}</p>}
        </ClassicTimelineSection>

        {resume.projects.length > 0 && (
          <ClassicTimelineSection title={copy.projects}>
            {resume.projects.slice(0, 3).map((project) => (
              <ClassicTimelineItem
                key={project.title}
                date={project.tags.slice(0, 3).join(' / ') || copy.projects}
                subtitle={project.role || copy.projects}
                title={project.title}
              >
                {[project.description, project.impact].filter(Boolean).join(' ')}
              </ClassicTimelineItem>
            ))}
          </ClassicTimelineSection>
        )}

        <ClassicTimelineSection title={copy.education}>
          {resume.education.map((item) => (
            <ClassicTimelineItem
              key={`${item.institution}-${item.gradYear}`}
              date={item.gradYear}
              subtitle={item.institution}
              title={item.degree}
            >
              {item.institution}
            </ClassicTimelineItem>
          ))}
        </ClassicTimelineSection>
      </main>
    </article>
  );
};

const RecruiterProTemplate = ({ user, resume, copy, language }: TemplateProps) => (
  <article className="resume-page mx-auto max-w-6xl overflow-hidden bg-white shadow-sm">
    <header className="grid gap-6 bg-[#f8fbff] p-7 md:grid-cols-[1fr_0.34fr] md:p-10">
      <div>
        <p className="mb-3 inline-flex rounded-md bg-blue-700 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">{copy.recruiterProCv}</p>
        <h2 className="text-4xl font-semibold leading-tight tracking-normal text-slate-950 md:text-5xl">{user.fullName || copy.fallbackName}</h2>
        <p className="mt-3 text-xl font-semibold text-blue-800">{resume.headline}</p>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-700">{resume.summary}</p>
      </div>

      <aside className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">{copy.atsTitle}</p>
        <div className="mt-4 grid gap-3">
          <RecruiterSignal label={copy.skills} value={`${resume.skills.length}+`} />
          <RecruiterSignal label={copy.projects} value={String(resume.projects.length)} />
          <RecruiterSignal label={copy.languages} value={LANGUAGE_NAMES[language]} />
        </div>
        <div className="mt-5 border-t border-slate-200 pt-4">
          <ContactLinks links={resume.contactLinks} copy={copy} />
        </div>
      </aside>
    </header>

    <main className="grid gap-8 p-7 md:grid-cols-[0.62fr_0.38fr] md:p-10">
      <section>
        <ResumeSection title={copy.experience} compact>
          <div className="space-y-5">
            {resume.experience.slice(0, 4).map((item) => (
              <div key={`${item.company}-${item.role}`} className="break-inside-avoid rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                  <h3 className="text-base font-bold text-slate-950">{item.role}</h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{item.startDate} - {item.endDate}</p>
                </div>
                <p className="mt-1 text-sm font-semibold text-blue-800">{item.company}</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.description}</p>
              </div>
            ))}
          </div>
        </ResumeSection>
        <CompactProjectsBlock resume={resume} copy={copy} />
      </section>

      <aside className="space-y-6">
        <SkillsPanel resume={resume} copy={copy} />
        <ResumeSection title={copy.impactHighlights} compact>
          <div className="space-y-3">
            {resume.projects.slice(0, 4).map((project) => (
              <p key={project.title} className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 text-sm font-semibold leading-6 text-slate-800">
                {project.impact || project.description}
              </p>
            ))}
          </div>
        </ResumeSection>
        <EducationBlock resume={resume} copy={copy} compact />
      </aside>
    </main>
  </article>
);

const EuropassInternationalTemplate = ({ user, resume, copy, language }: TemplateProps) => (
  <article className="resume-page mx-auto max-w-6xl bg-white shadow-sm">
    <header className="border-b-4 border-[#1f5fbf] p-7 md:p-10">
      <div className="grid gap-6 md:grid-cols-[0.28fr_0.72fr] md:items-center">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-md border border-blue-100 bg-blue-50 text-4xl font-semibold text-blue-800">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName || copy.fallbackName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            (user.fullName || copy.fallbackName).charAt(0)
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-blue-700">{copy.europassCv}</p>
          <h2 className="text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl">{user.fullName || copy.fallbackName}</h2>
          <p className="mt-2 text-lg font-semibold text-slate-700">{resume.headline}</p>
        </div>
      </div>
    </header>

    <div className="grid gap-0 md:grid-cols-[0.32fr_0.68fr]">
      <aside className="border-r border-blue-100 bg-[#f3f7ff] p-7 md:p-8">
        <FormalCvSection title={copy.contact}>
          <ContactLinks links={resume.contactLinks} copy={copy} />
        </FormalCvSection>
        <FormalCvSection title={copy.skills}>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <span key={skill} className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">{skill}</span>
            ))}
          </div>
        </FormalCvSection>
        <FormalCvSection title={copy.languages}>
          <p className="text-sm leading-7 text-slate-700">{resume.languages.join(', ')}</p>
        </FormalCvSection>
        <FormalCvSection title={copy.education}>
          {resume.education.map((item) => (
            <div key={`${item.institution}-${item.gradYear}`} className="mb-4 last:mb-0">
              <p className="text-sm font-bold text-slate-950">{item.degree}</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{item.institution}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-blue-700">{item.gradYear}</p>
            </div>
          ))}
        </FormalCvSection>
      </aside>

      <main className="p-7 md:p-10">
        <FormalCvSection title={copy.summary}>
          <p className="text-sm leading-7 text-slate-700">{resume.summary}</p>
        </FormalCvSection>
        <FormalCvSection title={copy.experience}>
          <div className="space-y-5">
            {resume.experience.map((item) => (
              <div key={`${item.company}-${item.role}`} className="break-inside-avoid border-l-4 border-blue-200 pl-4">
                <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                  <h3 className="text-base font-bold text-slate-950">{item.role}</h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{item.startDate} - {item.endDate}</p>
                </div>
                <p className="mt-1 text-sm font-semibold text-blue-800">{item.company}</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.description}</p>
              </div>
            ))}
          </div>
        </FormalCvSection>
        <FormalCvSection title={copy.projects}>
          <div className="grid gap-4 md:grid-cols-2">
            {resume.projects.slice(0, 6).map((project) => (
              <div key={project.title} className="break-inside-avoid rounded-lg border border-blue-100 bg-blue-50/40 p-4">
                <h3 className="text-sm font-bold text-slate-950">{project.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{project.description}</p>
                <p className="mt-3 text-xs font-semibold text-blue-800">{project.tags.join(' / ')}</p>
              </div>
            ))}
          </div>
        </FormalCvSection>
      </main>
    </div>
  </article>
);

const TechCompactTemplate = ({ user, resume, copy, language }: TemplateProps) => (
  <article className="resume-page mx-auto max-w-6xl overflow-hidden bg-[#0f172a] shadow-sm">
    <header className="grid gap-6 p-7 text-white md:grid-cols-[1fr_0.34fr] md:p-10">
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">{copy.techCompactCv}</p>
        <h2 className="text-4xl font-black leading-tight tracking-normal md:text-5xl">{user.fullName || copy.fallbackName}</h2>
        <p className="mt-3 text-lg font-semibold text-slate-200">{resume.headline}</p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{resume.summary}</p>
      </div>
      <aside className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{copy.coreStack}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {resume.skills.slice(0, 10).map((skill) => (
            <span key={skill} className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-bold text-cyan-100">{skill}</span>
          ))}
        </div>
      </aside>
    </header>

    <main className="grid gap-5 bg-white p-5 md:grid-cols-[0.58fr_0.42fr] md:p-7">
      <section className="space-y-5">
        <CompactDarkSection title={copy.experience}>
          {resume.experience.slice(0, 4).map((item) => (
            <div key={`${item.company}-${item.role}`} className="break-inside-avoid rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                <h3 className="text-base font-bold text-slate-950">{item.role}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{item.startDate} - {item.endDate}</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-cyan-800">{item.company}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p>
            </div>
          ))}
        </CompactDarkSection>
      </section>

      <aside className="space-y-5">
        <CompactDarkSection title={copy.projects}>
          {resume.projects.slice(0, 5).map((project) => (
            <div key={project.title} className="break-inside-avoid border-b border-slate-200 pb-4 last:border-b-0 last:pb-0">
              <h3 className="text-sm font-bold text-slate-950">{project.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{project.description}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">{project.tags.slice(0, 4).join(' / ')}</p>
            </div>
          ))}
        </CompactDarkSection>
        <CompactDarkSection title={copy.contact}>
          <ContactLinks links={resume.contactLinks} copy={copy} />
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">{LANGUAGE_NAMES[language]} CV</p>
        </CompactDarkSection>
      </aside>
    </main>
  </article>
);

const TimelineProTemplate = ({ user, resume, copy, language }: TemplateProps) => (
  <article className="resume-page mx-auto max-w-6xl bg-white p-8 shadow-sm md:p-12">
    <header className="grid gap-8 border-b border-emerald-200 pb-8 md:grid-cols-[1fr_auto] md:items-end">
      <div>
        <p className="mb-4 inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
          <CheckCircle2 size={14} />
          {copy.timelineCv}
        </p>
        <h2 className="text-5xl font-semibold leading-tight tracking-normal text-slate-950">{user.fullName || copy.fallbackName}</h2>
        <p className="mt-3 text-lg font-semibold text-slate-700">{resume.headline}</p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{resume.summary}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">{LANGUAGE_NAMES[language]} CV</p>
        <ContactLinks links={resume.contactLinks} copy={copy} />
      </div>
    </header>

    <div className="grid gap-10 py-8 md:grid-cols-[0.68fr_0.32fr]">
      <section>
        <SectionHeading>{copy.experience}</SectionHeading>
        <div className="relative mt-5 space-y-7 border-l-2 border-emerald-200 pl-6">
          {resume.experience.length ? resume.experience.map((item) => (
            <div key={`${item.company}-${item.role}`} className="break-inside-avoid">
              <span className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-emerald-500" />
              <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                <h4 className="text-lg font-bold text-slate-950">{item.role}</h4>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{item.startDate} - {item.endDate}</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-emerald-700">{item.company}</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">{item.description}</p>
            </div>
          )) : <p className="text-sm text-slate-500">{copy.empty}</p>}
        </div>
      </section>

      <aside className="space-y-8">
        <SkillsPanel resume={resume} copy={copy} />
        <EducationBlock resume={resume} copy={copy} compact />
      </aside>
    </div>

    <ProjectsBlock resume={resume} copy={copy} cardStyle="timeline" />
  </article>
);

const ExecutiveCompactTemplate = ({ user, resume, copy, language }: TemplateProps) => (
  <article className="resume-page mx-auto max-w-6xl bg-white p-8 shadow-sm md:p-12">
    <header className="border-b-4 border-slate-950 pb-8">
      <div className="grid gap-6 md:grid-cols-[1fr_0.38fr] md:items-start">
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-amber-700">{copy.executiveCv}</p>
          <h2 className="text-5xl font-semibold leading-tight tracking-normal text-slate-950">{user.fullName || copy.fallbackName}</h2>
          <p className="mt-3 text-xl font-semibold text-slate-700">{resume.headline}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">{LANGUAGE_NAMES[language]}</p>
          <ContactLinks links={resume.contactLinks} copy={copy} />
        </div>
      </div>
      <p className="mt-7 max-w-4xl text-base leading-8 text-slate-700">{resume.summary}</p>
    </header>

    <div className="grid gap-10 py-8 md:grid-cols-[0.38fr_0.62fr]">
      <aside className="space-y-8">
        <SkillsPanel resume={resume} copy={copy} />
        <EducationBlock resume={resume} copy={copy} compact />
      </aside>
      <main>
        <ExperienceBlock resume={resume} copy={copy} />
      </main>
    </div>

    <ProjectsBlock resume={resume} copy={copy} cardStyle="executive" />
  </article>
);

const AtsCleanTemplate = ({ user, resume, copy, language }: TemplateProps) => (
  <article className="resume-page mx-auto max-w-5xl bg-white p-8 shadow-sm md:p-12">
    <header className="border-b-2 border-slate-900 pb-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{copy.atsCleanCv}</p>
          <h2 className="text-4xl font-bold tracking-normal text-slate-950">{user.fullName || copy.fallbackName}</h2>
          <p className="mt-2 text-base font-semibold text-slate-700">{resume.headline}</p>
          <p className="mt-1 text-sm text-slate-500">{LANGUAGE_NAMES[language]} CV</p>
        </div>
        <ContactLinks links={resume.contactLinks} align="right" copy={copy} />
      </div>
    </header>

    <ResumeSection title={copy.summary}>
      <p className="text-sm leading-7 text-slate-700">{resume.summary}</p>
    </ResumeSection>

    <ResumeSection title={copy.coreStack}>
      <p className="text-sm leading-7 text-slate-700">{resume.skills.join(' / ')}</p>
    </ResumeSection>

    <ExperienceBlock resume={resume} copy={copy} />
    <ProjectsBlock resume={resume} copy={copy} cardStyle="classic" />
    <EducationLanguagesBlock resume={resume} copy={copy} />
  </article>
);

const OnePagePremiumTemplate = ({ user, resume, copy, language }: TemplateProps) => (
  <article className="resume-page mx-auto max-w-6xl bg-white p-6 shadow-sm md:p-10">
    <header className="grid gap-6 border-b border-blue-200 pb-7 md:grid-cols-[1fr_0.34fr] md:items-start">
      <div>
        <p className="mb-3 inline-flex rounded-md bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-700">{copy.onePageCv}</p>
        <h2 className="text-4xl font-semibold leading-tight tracking-normal text-slate-950 md:text-5xl">{user.fullName || copy.fallbackName}</h2>
        <p className="mt-3 text-lg font-semibold text-slate-700">{resume.headline}</p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{resume.summary}</p>
      </div>
      <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">{LANGUAGE_NAMES[language]}</p>
        <ContactLinks links={resume.contactLinks} copy={copy} />
      </aside>
    </header>

    <div className="grid gap-8 py-7 md:grid-cols-[0.62fr_0.38fr]">
      <main>
        <ExperienceBlock resume={resume} copy={copy} />
        <CompactProjectsBlock resume={resume} copy={copy} />
      </main>

      <aside className="space-y-6">
        <SkillsPanel resume={resume} copy={copy} />
        <ResumeSection title={copy.impactHighlights} compact>
          <div className="space-y-3">
            {resume.projects.slice(0, 3).map((project) => (
              <p key={project.title} className="text-sm font-semibold leading-6 text-slate-700">
                {project.impact || project.description}
              </p>
            ))}
          </div>
        </ResumeSection>
        <EducationBlock resume={resume} copy={copy} compact />
      </aside>
    </div>
  </article>
);

const SoftwareEngineerTemplate = ({ user, resume, copy, language }: TemplateProps) => (
  <article className="resume-page mx-auto max-w-6xl bg-white shadow-sm">
    <header className="bg-slate-950 p-8 text-white md:p-10">
      <div className="grid gap-6 md:grid-cols-[1fr_0.34fr] md:items-end">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">{copy.softwareEngineerCv}</p>
          <h2 className="text-4xl font-black leading-tight tracking-normal md:text-5xl">{user.fullName || copy.fallbackName}</h2>
          <p className="mt-3 text-lg font-semibold text-slate-200">{resume.headline}</p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{resume.summary}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">{copy.contact}</p>
          <ContactLinks links={resume.contactLinks} variant="dark" copy={copy} />
        </div>
      </div>
    </header>

    <div className="grid gap-8 p-8 md:grid-cols-[0.34fr_0.66fr] md:p-10">
      <aside className="space-y-7">
        <section className="break-inside-avoid rounded-xl border border-cyan-100 bg-cyan-50/50 p-5">
          <SectionHeading>{copy.coreStack}</SectionHeading>
          <div className="mt-4 flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <span key={skill} className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">{skill}</span>
            ))}
          </div>
        </section>
        <EducationBlock resume={resume} copy={copy} compact />
        <ResumeSection title={copy.languages} compact>
          <p className="text-sm leading-7 text-slate-700">{resume.languages.join(', ')}</p>
        </ResumeSection>
      </aside>

      <main>
        <ExperienceBlock resume={resume} copy={copy} />
        <ProjectsBlock resume={resume} copy={copy} cardStyle="modern" />
      </main>
    </div>
  </article>
);

const ClassicSidebarSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8 break-inside-avoid">
    <h3 className="mb-5 border-b border-white/70 pb-2 text-2xl font-semibold tracking-normal text-white">{title}</h3>
    {children}
  </section>
);

const ClassicTimelineSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="break-inside-avoid py-5">
    <h3 className="border-b-2 border-slate-900 pb-2 text-3xl font-semibold tracking-normal text-slate-900">{title}</h3>
    <div className="mt-5 space-y-6">{children}</div>
  </section>
);

const ClassicTimelineItem = ({
  date,
  subtitle,
  title,
  children,
}: {
  date: string;
  subtitle: string;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="relative border-l-2 border-slate-300 pl-5">
    <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-slate-700 bg-white" />
    <p className="text-base font-bold tracking-normal text-slate-800">{date}</p>
    <p className="mt-1 text-base text-slate-700">{subtitle}</p>
    <h4 className="mt-1 text-xl font-semibold tracking-normal text-slate-900">{title}</h4>
    <p className="mt-2 text-sm leading-7 text-slate-700">{children}</p>
  </div>
);

const RecruiterSignal = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
    <p className="mt-1 text-xl font-semibold tracking-normal text-slate-950">{value}</p>
  </div>
);

const FormalCvSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="break-inside-avoid border-b border-blue-100 py-5 last:border-b-0">
    <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-blue-800">{title}</h3>
    {children}
  </section>
);

const CompactDarkSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="break-inside-avoid rounded-xl border border-slate-200 bg-white p-5">
    <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{title}</h3>
    <div className="space-y-4">{children}</div>
  </section>
);

interface TemplateProps {
  user: User;
  resume: ResumeData;
  copy: typeof COPY['uz'];
  language: AppLanguage;
}

const ContactLinks = ({
  links,
  align = 'left',
  variant = 'light',
  copy,
}: {
  links: string[];
  align?: 'left' | 'right';
  variant?: 'light' | 'dark';
  copy: typeof COPY['uz'];
}) => (
  <div className={cn('space-y-1 text-sm font-medium', align === 'right' && 'md:text-right', variant === 'dark' ? 'text-slate-300' : 'text-slate-600')}>
    {links.length > 0 ? links.map((link) => (
      <a
        key={link}
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('flex items-center gap-1.5 hover:underline', align === 'right' && 'md:justify-end')}
      >
        <ExternalLink size={12} />
        {link.replace(/^https?:\/\//, '')}
      </a>
    )) : (
      <span>{copy.linksFallback}</span>
    )}
  </div>
);

const ResumeSection = ({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) => (
  <section className={cn('break-inside-avoid border-b border-slate-200 last:border-b-0', compact ? 'py-5' : 'py-6')}>
    <SectionHeading>{title}</SectionHeading>
    <div className="mt-4">{children}</div>
  </section>
);

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{children}</h3>
);

const SidebarTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{children}</h3>
);

const SkillsBlock = ({ resume, copy }: { resume: ResumeData; copy: typeof COPY['uz'] }) => (
  <ResumeSection title={copy.skills}>
    <div className="flex flex-wrap gap-2">
      {resume.skills.map((skill) => (
        <span key={skill} className="rounded border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {skill}
        </span>
      ))}
    </div>
  </ResumeSection>
);

const SkillsPanel = ({ resume, copy }: { resume: ResumeData; copy: typeof COPY['uz'] }) => (
  <section className="break-inside-avoid rounded-xl border border-slate-200 bg-slate-50 p-5">
    <SectionHeading>{copy.skills}</SectionHeading>
    <div className="mt-4 flex flex-wrap gap-2">
      {resume.skills.map((skill) => (
        <span key={skill} className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          {skill}
        </span>
      ))}
    </div>
  </section>
);

const ExperienceBlock = ({ resume, copy }: { resume: ResumeData; copy: typeof COPY['uz'] }) => (
  <ResumeSection title={copy.experience}>
    {resume.experience.length ? (
      <div className="space-y-5">
        {resume.experience.map((item) => (
          <div key={`${item.company}-${item.role}`} className="break-inside-avoid">
            <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
              <h4 className="text-base font-bold text-slate-950">{item.role}</h4>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{item.startDate} - {item.endDate}</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-700">{item.company}</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">{item.description}</p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-slate-500">{copy.empty}</p>
    )}
  </ResumeSection>
);

const ProjectsBlock = ({
  resume,
  copy,
  cardStyle,
}: {
  resume: ResumeData;
  copy: typeof COPY['uz'];
  cardStyle: 'classic' | 'modern' | 'timeline' | 'executive';
}) => (
  <ResumeSection title={copy.projects}>
    {resume.projects.length ? (
      <div className={cn('grid gap-4', cardStyle === 'classic' ? 'md:grid-cols-2' : 'md:grid-cols-2')}>
        {resume.projects.slice(0, 6).map((project) => (
          <div
            key={project.title}
            className={cn(
              'break-inside-avoid rounded-xl p-4',
              cardStyle === 'classic' && 'rounded border border-slate-300',
              cardStyle === 'modern' && 'border border-blue-100 bg-blue-50/50',
              cardStyle === 'timeline' && 'border border-emerald-100 bg-emerald-50/40',
              cardStyle === 'executive' && 'border border-slate-200 bg-slate-50',
            )}
          >
            <h4 className="text-sm font-bold text-slate-950">{project.title}</h4>
            {project.role && <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">{project.role}</p>}
            <p className="mt-2 text-sm leading-6 text-slate-700">{project.description}</p>
            {project.impact && <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{project.impact}</p>}
            <p className="mt-3 text-xs font-semibold text-slate-500">{project.tags.join(' / ')}</p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-slate-500">{copy.empty}</p>
    )}
  </ResumeSection>
);

const CompactProjectsBlock = ({ resume, copy }: { resume: ResumeData; copy: typeof COPY['uz'] }) => (
  <ResumeSection title={copy.projects} compact>
    {resume.projects.length ? (
      <div className="space-y-4">
        {resume.projects.slice(0, 4).map((project) => (
          <div key={project.title} className="break-inside-avoid border-l-2 border-blue-200 pl-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
              <h4 className="text-sm font-bold text-slate-950">{project.title}</h4>
              {project.role && <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{project.role}</p>}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{project.description}</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">{project.tags.slice(0, 4).join(' / ')}</p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-slate-500">{copy.empty}</p>
    )}
  </ResumeSection>
);

const EducationLanguagesBlock = ({ resume, copy }: { resume: ResumeData; copy: typeof COPY['uz'] }) => (
  <div className="grid gap-8 md:grid-cols-2">
    <EducationBlock resume={resume} copy={copy} />
    <ResumeSection title={copy.languages}>
      <p className="text-sm leading-7 text-slate-700">{resume.languages.join(', ')}</p>
    </ResumeSection>
  </div>
);

const EducationBlock = ({
  resume,
  copy,
  compact = false,
}: {
  resume: ResumeData;
  copy: typeof COPY['uz'];
  compact?: boolean;
}) => (
  <ResumeSection title={copy.education} compact={compact}>
    {resume.education.map((item) => (
      <div key={`${item.institution}-${item.gradYear}`}>
        <h4 className="text-sm font-bold text-slate-950">{item.degree}</h4>
        <p className="mt-1 text-sm text-slate-700">{item.institution}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">{item.gradYear}</p>
      </div>
    ))}
  </ResumeSection>
);
