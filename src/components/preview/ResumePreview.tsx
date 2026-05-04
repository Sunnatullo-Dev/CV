import { Download, ExternalLink, Printer } from 'lucide-react';
import { AppLanguage, Project, User } from '../../types';
import { buildResumeData, LANGUAGE_NAMES } from '../../lib/resume';
import { Button } from '../shared/Button';

interface ResumePreviewProps {
  user: User;
  projects: Project[];
  language: AppLanguage;
}

const COPY = {
  uz: {
    title: 'ATS CV preview',
    subtitle: 'Rekruter va ATS tizimlari oson o‘qiydigan CV.',
    print: 'PDF / Chop etish',
    summary: 'Professional xulosa',
    skills: 'Ko‘nikmalar',
    experience: 'Tajriba',
    projects: 'Loyihalar',
    education: 'Ta’lim',
    languages: 'Tillar',
    certifications: 'Sertifikatlar',
    empty: 'Loyihalar import qilingandan keyin bu bo‘lim to‘ldiriladi.',
  },
  en: {
    title: 'ATS CV preview',
    subtitle: 'A recruiter-friendly resume designed for ATS readability.',
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
    title: 'ATS CV preview',
    subtitle: 'A recruiter-friendly resume designed for ATS readability.',
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

export const ResumePreview = ({ user, projects, language }: ResumePreviewProps) => {
  const visibleProjects = projects.filter((project) => project.isPublic !== false);
  const resume = buildResumeData(user, visibleProjects, language);
  const copy = COPY[language];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 md:px-6 md:py-8">
      <div className="no-print mx-auto mb-5 flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950">{copy.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{copy.subtitle}</p>
        </div>
        <Button onClick={() => window.print()} className="h-11 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
          <Printer className="mr-2" size={16} />
          {copy.print}
        </Button>
      </div>

      <article className="ats-page mx-auto max-w-5xl bg-white p-8 shadow-sm md:p-12">
        <header className="border-b border-slate-300 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-4xl font-bold tracking-normal text-slate-950">{user.fullName || 'Professional Developer'}</h2>
              <p className="mt-2 text-lg font-semibold text-slate-700">{resume.headline}</p>
              <p className="mt-1 text-sm text-slate-500">{LANGUAGE_NAMES[language]} CV</p>
            </div>
            <div className="space-y-1 text-left text-sm font-medium text-slate-600 md:text-right">
              {resume.contactLinks.length > 0 ? resume.contactLinks.map((link) => (
                <a key={link} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-slate-950 md:justify-end">
                  <ExternalLink size={12} />
                  {link.replace(/^https?:\/\//, '')}
                </a>
              )) : (
                <span>GitHub / LinkedIn / Website</span>
              )}
            </div>
          </div>
        </header>

        <ResumeSection title={copy.summary}>
          <p className="text-sm leading-7 text-slate-700">{resume.summary}</p>
        </ResumeSection>

        <ResumeSection title={copy.skills}>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <span key={skill} className="rounded border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {skill}
              </span>
            ))}
          </div>
        </ResumeSection>

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

        <ResumeSection title={copy.projects}>
          {resume.projects.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {resume.projects.slice(0, 6).map((project) => (
                <div key={project.title} className="break-inside-avoid rounded border border-slate-300 p-4">
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

        <div className="grid gap-8 md:grid-cols-2">
          <ResumeSection title={copy.education}>
            {resume.education.map((item) => (
              <div key={`${item.institution}-${item.gradYear}`}>
                <h4 className="text-sm font-bold text-slate-950">{item.degree}</h4>
                <p className="mt-1 text-sm text-slate-700">{item.institution}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">{item.gradYear}</p>
              </div>
            ))}
          </ResumeSection>

          <ResumeSection title={copy.languages}>
            <p className="text-sm leading-7 text-slate-700">{resume.languages.join(', ')}</p>
          </ResumeSection>
        </div>

        {resume.certifications.length > 0 && (
          <ResumeSection title={copy.certifications}>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-7 text-slate-700">
              {resume.certifications.map((certification) => (
                <li key={certification}>{certification}</li>
              ))}
            </ul>
          </ResumeSection>
        )}
      </article>

      <div className="no-print mx-auto mt-5 max-w-5xl rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <Download className="mr-2 inline" size={16} />
        PDF olish uchun tugmani bosing va browser oynasida “Save as PDF” ni tanlang.
      </div>
    </div>
  );
};

const ResumeSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="break-inside-avoid border-b border-slate-200 py-6 last:border-b-0">
    <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{title}</h3>
    {children}
  </section>
);
