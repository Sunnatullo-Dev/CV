import React, { useState } from 'react';
import {
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Layers3,
  Printer,
  Sparkles,
} from 'lucide-react';
import { AppLanguage, Project, ResumeData, User } from '../../types';
import { buildResumeData, LANGUAGE_NAMES } from '../../lib/resume';
import { cn } from '../../lib/utils';
import { Button } from '../shared/Button';

type CvTemplateId = 'ats-classic' | 'modern-sidebar' | 'timeline-pro' | 'executive-compact';

interface ResumePreviewProps {
  user: User;
  projects: Project[];
  language: AppLanguage;
}

const COPY = {
  uz: {
    title: 'Modern CV templates',
    subtitle: "Rekruter, ATS va professional taqdimot uchun tayyor CV ko'rinishlari.",
    print: 'PDF / Chop etish',
    summary: 'Professional xulosa',
    skills: "Ko'nikmalar",
    experience: 'Tajriba',
    projects: 'Loyihalar',
    education: "Ta'lim",
    languages: 'Tillar',
    certifications: 'Sertifikatlar',
    empty: "Loyihalar import qilingandan keyin bu bo'lim to'ldiriladi.",
  },
  en: {
    title: 'Modern CV templates',
    subtitle: 'Resume layouts prepared for recruiters, ATS, and polished presentation.',
    print: 'PDF / Print',
    summary: 'Professional Summary',
    skills: 'Skills',
    experience: 'Experience',
    projects: 'Projects',
    education: 'Education',
    languages: 'Languages',
    certifications: 'Certifications',
    empty: 'This section will be filled after importing projects.',
  },
  ru: {
    title: 'Modern CV templates',
    subtitle: 'Resume layouts prepared for recruiters, ATS, and polished presentation.',
    print: 'PDF / Print',
    summary: 'Professional Summary',
    skills: 'Skills',
    experience: 'Experience',
    projects: 'Projects',
    education: 'Education',
    languages: 'Languages',
    certifications: 'Certifications',
    empty: 'This section will be filled after importing projects.',
  },
};

const CV_TEMPLATES: Array<{
  id: CvTemplateId;
  name: string;
  audience: string;
  icon: React.ElementType;
}> = [
  {
    id: 'modern-sidebar',
    name: 'Modern Sidebar',
    audience: 'Tech CV / portfolio PDF',
    icon: Layers3,
  },
  {
    id: 'timeline-pro',
    name: 'Timeline Pro',
    audience: 'Experience-focused resume',
    icon: BriefcaseBusiness,
  },
  {
    id: 'executive-compact',
    name: 'Executive Compact',
    audience: 'Senior / architect profile',
    icon: Sparkles,
  },
  {
    id: 'ats-classic',
    name: 'ATS Classic',
    audience: 'Maximum ATS readability',
    icon: FileText,
  },
];

export const ResumePreview = ({ user, projects, language }: ResumePreviewProps) => {
  const [templateId, setTemplateId] = useState<CvTemplateId>('modern-sidebar');
  const visibleProjects = projects.filter((project) => project.isPublic !== false);
  const resume = buildResumeData(user, visibleProjects, language);
  const copy = COPY[language];
  const selectedTemplate = CV_TEMPLATES.find((template) => template.id === templateId) || CV_TEMPLATES[0];
  const SelectedIcon = selectedTemplate.icon;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 md:px-6 md:py-8">
      <div className="no-print mx-auto mb-5 max-w-6xl">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950">{copy.title}</h1>
            <p className="mt-1 text-sm text-slate-600">{copy.subtitle}</p>
          </div>
          <Button onClick={() => window.print()} className="h-11 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
            <Printer className="mr-2" size={16} />
            {copy.print}
          </Button>
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
                  <span className="block text-sm font-bold">{template.name}</span>
                  <span className={cn('mt-1 block text-xs leading-5', isSelected ? 'text-slate-300' : 'text-slate-500')}>{template.audience}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
          <SelectedIcon size={15} />
          {selectedTemplate.name}
        </div>
      </div>

      {templateId === 'ats-classic' && <AtsClassicTemplate user={user} resume={resume} copy={copy} language={language} />}
      {templateId === 'modern-sidebar' && <ModernSidebarTemplate user={user} resume={resume} copy={copy} language={language} />}
      {templateId === 'timeline-pro' && <TimelineProTemplate user={user} resume={resume} copy={copy} language={language} />}
      {templateId === 'executive-compact' && <ExecutiveCompactTemplate user={user} resume={resume} copy={copy} language={language} />}

      <div className="no-print mx-auto mt-5 max-w-6xl rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <Download className="mr-2 inline" size={16} />
        {selectedTemplate.name} / {LANGUAGE_NAMES[language]}
      </div>
    </div>
  );
};

const AtsClassicTemplate = ({ user, resume, copy, language }: TemplateProps) => (
  <article className="resume-page mx-auto max-w-5xl bg-white p-8 shadow-sm md:p-12">
    <header className="border-b border-slate-300 pb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-4xl font-bold tracking-normal text-slate-950">{user.fullName || 'Professional Developer'}</h2>
          <p className="mt-2 text-lg font-semibold text-slate-700">{resume.headline}</p>
          <p className="mt-1 text-sm text-slate-500">{LANGUAGE_NAMES[language]} CV</p>
        </div>
        <ContactLinks links={resume.contactLinks} align="right" />
      </div>
    </header>

    <ResumeSection title={copy.summary}>
      <p className="text-sm leading-7 text-slate-700">{resume.summary}</p>
    </ResumeSection>

    <SkillsBlock resume={resume} />
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
      <h2 className="text-3xl font-semibold leading-tight tracking-normal">{user.fullName || 'Professional Developer'}</h2>
      <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-blue-300">{resume.headline}</p>
      <p className="mt-2 text-xs font-medium text-slate-400">{LANGUAGE_NAMES[language]} CV</p>

      <div className="mt-10">
        <SidebarTitle>Contact</SidebarTitle>
        <ContactLinks links={resume.contactLinks} variant="dark" />
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

const TimelineProTemplate = ({ user, resume, copy, language }: TemplateProps) => (
  <article className="resume-page mx-auto max-w-6xl bg-white p-8 shadow-sm md:p-12">
    <header className="grid gap-8 border-b border-emerald-200 pb-8 md:grid-cols-[1fr_auto] md:items-end">
      <div>
        <p className="mb-4 inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
          <CheckCircle2 size={14} />
          Timeline CV
        </p>
        <h2 className="text-5xl font-semibold leading-tight tracking-normal text-slate-950">{user.fullName || 'Professional Developer'}</h2>
        <p className="mt-3 text-lg font-semibold text-slate-700">{resume.headline}</p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{resume.summary}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">{LANGUAGE_NAMES[language]} CV</p>
        <ContactLinks links={resume.contactLinks} />
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
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Executive CV</p>
          <h2 className="text-5xl font-semibold leading-tight tracking-normal text-slate-950">{user.fullName || 'Professional Developer'}</h2>
          <p className="mt-3 text-xl font-semibold text-slate-700">{resume.headline}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">{LANGUAGE_NAMES[language]}</p>
          <ContactLinks links={resume.contactLinks} />
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
}: {
  links: string[];
  align?: 'left' | 'right';
  variant?: 'light' | 'dark';
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
      <span>GitHub / LinkedIn / Website</span>
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

const SkillsBlock = ({ resume }: { resume: ResumeData }) => (
  <ResumeSection title="Skills">
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
