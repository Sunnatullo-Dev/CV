import { AppLanguage, ResumeData, User } from '../types';

const EXPORT_COPY: Record<AppLanguage, {
  fallbackName: string;
  links: string;
  summary: string;
  skills: string;
  experience: string;
  projects: string;
  education: string;
  languages: string;
  emptyExperience: string;
  emptyProjects: string;
  impact: string;
  stack: string;
  link: string;
}> = {
  uz: {
    fallbackName: 'Professional Developer',
    links: 'GitHub / LinkedIn / Website',
    summary: 'Professional xulosa',
    skills: "Ko'nikmalar",
    experience: 'Professional tajriba',
    projects: 'Tanlangan loyihalar',
    education: "Ta'lim",
    languages: 'Tillar',
    emptyExperience: "Tajriba loyihalar import qilingandan keyin to'ldiriladi.",
    emptyProjects: "Project case studylar GitHub repo import qilingandan keyin qo'shiladi.",
    impact: 'Natija',
    stack: 'Stack',
    link: 'Link',
  },
  en: {
    fallbackName: 'Professional Developer',
    links: 'GitHub / LinkedIn / Website',
    summary: 'Professional Summary',
    skills: 'Core Skills',
    experience: 'Professional Experience',
    projects: 'Selected Projects',
    education: 'Education',
    languages: 'Languages',
    emptyExperience: 'Experience details will be added after importing projects.',
    emptyProjects: 'Project case studies will be added after importing GitHub repos.',
    impact: 'Impact',
    stack: 'Stack',
    link: 'Link',
  },
  ru: {
    fallbackName: 'Профессиональный разработчик',
    links: 'GitHub / LinkedIn / Website',
    summary: 'Профессиональное summary',
    skills: 'Ключевые навыки',
    experience: 'Профессиональный опыт',
    projects: 'Избранные проекты',
    education: 'Образование',
    languages: 'Языки',
    emptyExperience: 'Опыт будет заполнен после импорта проектов.',
    emptyProjects: 'Project case studies будут добавлены после импорта GitHub repos.',
    impact: 'Результат',
    stack: 'Stack',
    link: 'Ссылка',
  },
};

const cleanFilePart = (value: string) => (
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'devport-cv'
);

export const getResumeFileBaseName = (user: User) => `${cleanFilePart(user.fullName || 'developer')}-cv`;

export const downloadBlob = (content: BlobPart, fileName: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const buildResumeMarkdown = (user: User, resume: ResumeData, language: AppLanguage = 'uz') => {
  const copy = EXPORT_COPY[language] || EXPORT_COPY.uz;
  const lines = [
    `# ${user.fullName || copy.fallbackName}`,
    resume.headline,
    '',
    resume.contactLinks.join(' | '),
    '',
    `## ${copy.summary}`,
    resume.summary,
    '',
    `## ${copy.skills}`,
    ...resume.skills.map((skill) => `- ${skill}`),
    '',
    `## ${copy.experience}`,
    ...(resume.experience.length
      ? resume.experience.flatMap((item) => [
        `### ${item.role} - ${item.company}`,
        `${item.startDate}${item.endDate ? ` - ${item.endDate}` : ''}`,
        `- ${item.description}`,
        '',
      ])
      : [`- ${copy.emptyExperience}`, '']),
    `## ${copy.projects}`,
    ...(resume.projects.length
      ? resume.projects.flatMap((project) => [
        `### ${project.title}`,
        project.role ? `_${project.role}_` : '',
        `- ${project.description}`,
        project.impact ? `- ${copy.impact}: ${project.impact}` : '',
        project.tags.length ? `- ${copy.stack}: ${project.tags.join(', ')}` : '',
        project.url || project.repoUrl ? `- ${copy.link}: ${project.url || project.repoUrl}` : '',
        '',
      ].filter(Boolean))
      : [`- ${copy.emptyProjects}`, '']),
    `## ${copy.education}`,
    ...resume.education.map((item) => `- ${item.degree}, ${item.institution} (${item.gradYear})`),
    '',
    `## ${copy.languages}`,
    ...resume.languages.map((item) => `- ${item}`),
  ];

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

export const downloadResumePdf = async (user: User, resume: ResumeData, language: AppLanguage = 'uz') => {
  const copy = EXPORT_COPY[language] || EXPORT_COPY.uz;
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (height = 24) => {
    if (y + height <= pageHeight - margin) return;
    doc.addPage();
    y = margin;
  };

  const addText = (text: string, size = 10, style: 'normal' | 'bold' = 'normal', gap = 14) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    const wrapped = doc.splitTextToSize(text || '', maxWidth) as string[];
    const lineHeight = size + 4;
    ensureSpace(wrapped.length * lineHeight + gap);
    doc.text(wrapped, margin, y);
    y += wrapped.length * lineHeight + gap;
  };

  const addSection = (title: string) => {
    ensureSpace(30);
    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;
    addText(title.toUpperCase(), 9, 'bold', 10);
  };

  addText(user.fullName || copy.fallbackName, 24, 'bold', 8);
  addText(resume.headline, 12, 'bold', 8);
  addText(resume.contactLinks.join('  |  ') || copy.links, 9, 'normal', 12);

  addSection(copy.summary);
  addText(resume.summary, 10, 'normal', 10);

  addSection(copy.skills);
  addText(resume.skills.join(' / '), 10, 'normal', 10);

  addSection(copy.experience);
  if (resume.experience.length) {
    resume.experience.forEach((item) => {
      addText(`${item.role} - ${item.company}`, 11, 'bold', 4);
      addText(`${item.startDate}${item.endDate ? ` - ${item.endDate}` : ''}`, 8, 'normal', 4);
      addText(item.description, 9, 'normal', 10);
    });
  } else {
    addText(copy.emptyExperience, 9, 'normal', 10);
  }

  addSection(copy.projects);
  if (resume.projects.length) {
    resume.projects.slice(0, 8).forEach((project) => {
      addText(project.title, 11, 'bold', 4);
      addText([project.description, project.impact].filter(Boolean).join(' '), 9, 'normal', 4);
      addText(project.tags.join(' / '), 8, 'normal', 10);
    });
  } else {
    addText(copy.emptyProjects, 9, 'normal', 10);
  }

  addSection(copy.education);
  resume.education.forEach((item) => addText(`${item.degree}, ${item.institution} (${item.gradYear})`, 9, 'normal', 6));

  addSection(copy.languages);
  addText(resume.languages.join(', '), 9, 'normal', 6);

  doc.save(`${getResumeFileBaseName(user)}.pdf`);
};
