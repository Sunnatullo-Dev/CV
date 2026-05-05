import { ResumeData, User } from '../types';

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

export const buildResumeMarkdown = (user: User, resume: ResumeData) => {
  const lines = [
    `# ${user.fullName || 'Professional Developer'}`,
    resume.headline,
    '',
    resume.contactLinks.join(' | '),
    '',
    '## Professional Summary',
    resume.summary,
    '',
    '## Core Skills',
    ...resume.skills.map((skill) => `- ${skill}`),
    '',
    '## Professional Experience',
    ...(resume.experience.length
      ? resume.experience.flatMap((item) => [
        `### ${item.role} - ${item.company}`,
        `${item.startDate}${item.endDate ? ` - ${item.endDate}` : ''}`,
        `- ${item.description}`,
        '',
      ])
      : ['- Experience details will be added after importing projects.', '']),
    '## Selected Projects',
    ...(resume.projects.length
      ? resume.projects.flatMap((project) => [
        `### ${project.title}`,
        project.role ? `_${project.role}_` : '',
        `- ${project.description}`,
        project.impact ? `- Impact: ${project.impact}` : '',
        project.tags.length ? `- Stack: ${project.tags.join(', ')}` : '',
        project.url || project.repoUrl ? `- Link: ${project.url || project.repoUrl}` : '',
        '',
      ].filter(Boolean))
      : ['- Project case studies will be added after importing GitHub repos.', '']),
    '## Education',
    ...resume.education.map((item) => `- ${item.degree}, ${item.institution} (${item.gradYear})`),
    '',
    '## Languages',
    ...resume.languages.map((item) => `- ${item}`),
  ];

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

export const downloadResumePdf = async (user: User, resume: ResumeData) => {
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

  addText(user.fullName || 'Professional Developer', 24, 'bold', 8);
  addText(resume.headline, 12, 'bold', 8);
  addText(resume.contactLinks.join('  |  ') || 'GitHub / LinkedIn / Website', 9, 'normal', 12);

  addSection('Professional Summary');
  addText(resume.summary, 10, 'normal', 10);

  addSection('Core Skills');
  addText(resume.skills.join(' / '), 10, 'normal', 10);

  addSection('Professional Experience');
  if (resume.experience.length) {
    resume.experience.forEach((item) => {
      addText(`${item.role} - ${item.company}`, 11, 'bold', 4);
      addText(`${item.startDate}${item.endDate ? ` - ${item.endDate}` : ''}`, 8, 'normal', 4);
      addText(item.description, 9, 'normal', 10);
    });
  } else {
    addText('Experience details will be added after importing projects.', 9, 'normal', 10);
  }

  addSection('Selected Projects');
  if (resume.projects.length) {
    resume.projects.slice(0, 8).forEach((project) => {
      addText(project.title, 11, 'bold', 4);
      addText([project.description, project.impact].filter(Boolean).join(' '), 9, 'normal', 4);
      addText(project.tags.join(' / '), 8, 'normal', 10);
    });
  } else {
    addText('Project case studies will be added after importing GitHub repos.', 9, 'normal', 10);
  }

  addSection('Education');
  resume.education.forEach((item) => addText(`${item.degree}, ${item.institution} (${item.gradYear})`, 9, 'normal', 6));

  addSection('Languages');
  addText(resume.languages.join(', '), 9, 'normal', 6);

  doc.save(`${getResumeFileBaseName(user)}.pdf`);
};
