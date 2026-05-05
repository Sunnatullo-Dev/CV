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

const xmlEscape = (value: string) => (
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
);

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const uint16 = (value: number) => {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
};

const uint32 = (value: number) => {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
};

const concatBytes = (parts: Uint8Array[]) => {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
};

const createStoredZip = (files: Array<{ path: string; content: string }>) => {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const localHeader = concatBytes([
      uint32(0x04034b50),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(crc),
      uint32(data.length),
      uint32(data.length),
      uint16(nameBytes.length),
      uint16(0),
      nameBytes,
    ]);

    localParts.push(localHeader, data);

    const centralHeader = concatBytes([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(crc),
      uint32(data.length),
      uint32(data.length),
      uint16(nameBytes.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      nameBytes,
    ]);

    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralDirectory = concatBytes(centralParts);
  const localFiles = concatBytes(localParts);
  const endRecord = concatBytes([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(files.length),
    uint16(files.length),
    uint32(centralDirectory.length),
    uint32(localFiles.length),
    uint16(0),
  ]);

  return concatBytes([localFiles, centralDirectory, endRecord]);
};

const docxParagraph = (text: string, style?: 'Title' | 'Heading1') => `
  <w:p>
    ${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}
    <w:r><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>
  </w:p>
`;

const docxBullet = (text: string) => docxParagraph(`- ${text}`);

export const downloadResumeDocx = (user: User, resume: ResumeData, language: AppLanguage = 'uz') => {
  const copy = EXPORT_COPY[language] || EXPORT_COPY.uz;
  const paragraphs = [
    docxParagraph(user.fullName || copy.fallbackName, 'Title'),
    docxParagraph(resume.headline),
    docxParagraph(resume.contactLinks.join(' | ') || copy.links),
    docxParagraph(copy.summary, 'Heading1'),
    docxParagraph(resume.summary),
    docxParagraph(copy.skills, 'Heading1'),
    docxParagraph(resume.skills.join(' / ')),
    docxParagraph(copy.experience, 'Heading1'),
    ...(resume.experience.length
      ? resume.experience.flatMap((item) => [
        docxParagraph(`${item.role} - ${item.company}`),
        docxParagraph(`${item.startDate}${item.endDate ? ` - ${item.endDate}` : ''}`),
        docxBullet(item.description),
      ])
      : [docxBullet(copy.emptyExperience)]),
    docxParagraph(copy.projects, 'Heading1'),
    ...(resume.projects.length
      ? resume.projects.slice(0, 8).flatMap((project) => [
        docxParagraph(project.title),
        project.role ? docxParagraph(project.role) : '',
        docxBullet(project.description),
        project.impact ? docxBullet(`${copy.impact}: ${project.impact}`) : '',
        project.tags.length ? docxBullet(`${copy.stack}: ${project.tags.join(', ')}`) : '',
      ].filter(Boolean))
      : [docxBullet(copy.emptyProjects)]),
    docxParagraph(copy.education, 'Heading1'),
    ...resume.education.map((item) => docxBullet(`${item.degree}, ${item.institution} (${item.gradYear})`)),
    docxParagraph(copy.languages, 'Heading1'),
    docxParagraph(resume.languages.join(', ')),
  ];

  const files = [
    {
      path: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
          <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
          <Default Extension="xml" ContentType="application/xml"/>
          <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
          <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
        </Types>`,
    },
    {
      path: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
        </Relationships>`,
    },
    {
      path: 'word/_rels/document.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
        </Relationships>`,
    },
    {
      path: 'word/styles.xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
        <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
            <w:name w:val="Normal"/>
            <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr>
          </w:style>
          <w:style w:type="paragraph" w:styleId="Title">
            <w:name w:val="Title"/>
            <w:rPr><w:b/><w:sz w:val="36"/></w:rPr>
          </w:style>
          <w:style w:type="paragraph" w:styleId="Heading1">
            <w:name w:val="heading 1"/>
            <w:rPr><w:b/><w:sz w:val="26"/></w:rPr>
          </w:style>
        </w:styles>`,
    },
    {
      path: 'word/document.xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            ${paragraphs.join('\n')}
            <w:sectPr>
              <w:pgSz w:w="11906" w:h="16838"/>
              <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>
            </w:sectPr>
          </w:body>
        </w:document>`,
    },
  ];

  const zipBytes = createStoredZip(files);
  downloadBlob(
    new Blob([zipBytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    `${getResumeFileBaseName(user)}.docx`,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  );
};
