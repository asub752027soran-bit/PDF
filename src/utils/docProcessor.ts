import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from 'docx';
import { readFileAsArrayBuffer } from './pdfProcessor';

export interface DocxExtractionResult {
  html: string;
  text: string;
  messages?: string[];
}

/**
 * Fallback readable text extractor for legacy binary .doc OLE2 files
 */
function extractReadableTextFromLegacyBinary(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  let current = '';

  // Scan UTF-8/ASCII printable runs
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9) {
      current += String.fromCharCode(b);
    } else {
      if (current.trim().length >= 5) {
        chunks.push(current.trim());
      }
      current = '';
    }
  }
  if (current.trim().length >= 5) chunks.push(current.trim());

  const filtered = chunks.filter(
    (c) =>
      /[a-zA-Z]{2,}/.test(c) &&
      !c.includes('Microsoft Word') &&
      !c.includes('Root Entry') &&
      !c.includes('WordDocument') &&
      !c.includes('SummaryInformation')
  );

  return filtered.join('\n').trim();
}

/**
 * Extracts slide text from PPTX or ODP presentations using JSZip + XML parser
 */
export async function extractPptxSlides(file: File): Promise<string> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const lower = file.name.toLowerCase();

  if (lower.endsWith('.ppt') && !lower.endsWith('.pptx')) {
    const fallback = extractReadableTextFromLegacyBinary(arrayBuffer);
    if (!fallback) {
      throw new Error('Legacy binary .ppt files contain minimal plain text. Please save as .pptx or edit text manually below.');
    }
    return `# Presentation: ${file.name.replace(/\.[^/.]+$/, '')}\n\n${fallback}`;
  }

  const zip = await JSZip.loadAsync(arrayBuffer);
  const parser = new DOMParser();

  if (lower.endsWith('.odp')) {
    const contentFile = zip.file('content.xml');
    if (!contentFile) throw new Error('Could not find slides inside ODP archive.');
    const xmlStr = await contentFile.async('string');
    const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
    const pages = Array.from(xmlDoc.getElementsByTagNameNS('*', 'page'));
    if (pages.length === 0) {
      const allText = Array.from(xmlDoc.getElementsByTagNameNS('*', 'p'))
        .map((el) => el.textContent?.trim() || '')
        .filter(Boolean)
        .join('\n');
      return `# Slide 1\n\n${allText || '(No text content on slide)'}`;
    }
    return pages
      .map((page, idx) => {
        const lines = Array.from(page.getElementsByTagNameNS('*', 'p'))
          .map((p) => p.textContent?.trim() || '')
          .filter(Boolean);
        return `# Slide ${idx + 1}\n\n${lines.join('\n\n') || '(Visual / Image Slide)'}`;
      })
      .join('\n\n--- PAGE BREAK ---\n\n');
  }

  // Standard .pptx: find ppt/slides/slide1.xml, slide2.xml, ...
  const slideEntries = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      return numA - numB;
    });

  if (slideEntries.length === 0) {
    throw new Error('No slides found inside this PowerPoint file. Ensure it is a valid .pptx file.');
  }

  const slidesOutput: string[] = [];

  for (let i = 0; i < slideEntries.length; i++) {
    const slidePath = slideEntries[i];
    const slideNum = slidePath.match(/slide(\d+)\.xml/i)?.[1] || String(i + 1);
    const xmlStr = await zip.files[slidePath].async('string');
    const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');

    // Group text runs by paragraph (<a:p>)
    const paragraphs = Array.from(xmlDoc.getElementsByTagNameNS('*', 'p'));
    const slideLines: string[] = [];

    for (const p of paragraphs) {
      const runs = Array.from(p.getElementsByTagNameNS('*', 't'));
      const lineText = runs.map((t) => t.textContent || '').join('').trim();
      if (lineText) {
        slideLines.push(lineText);
      }
    }

    // Check optional speaker notes
    const notePath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
    let notesText = '';
    if (zip.files[notePath]) {
      try {
        const notesXml = await zip.files[notePath].async('string');
        const notesDoc = parser.parseFromString(notesXml, 'application/xml');
        const noteParas = Array.from(notesDoc.getElementsByTagNameNS('*', 'p'))
          .map((p) =>
            Array.from(p.getElementsByTagNameNS('*', 't'))
              .map((t) => t.textContent || '')
              .join('')
              .trim()
          )
          .filter((t) => t && !/^\d+$/.test(t));
        if (noteParas.length > 0) {
          notesText = `\n\n### Speaker Notes\n${noteParas.join('\n')}`;
        }
      } catch {
        // Ignore malformed notes
      }
    }

    const titleLine = slideLines[0] ? `# Slide ${slideNum}: ${slideLines[0]}` : `# Slide ${slideNum}`;
    const bodyLines = slideLines.slice(1).map((l) => `- ${l}`).join('\n');
    slidesOutput.push(`${titleLine}${bodyLines ? `\n\n${bodyLines}` : '\n\n(Slide image / visual layout)'}${notesText}`);
  }

  return slidesOutput.join('\n\n--- PAGE BREAK ---\n\n');
}

/**
 * Extracts HTML and structured text from DOCX (and legacy DOC fallback) files
 */
export async function extractDocxHtml(file: File): Promise<DocxExtractionResult> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  try {
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer.slice(0) });
    const textResult = await mammoth.extractRawText({ arrayBuffer: arrayBuffer.slice(0) });

    return {
      html: htmlResult.value || '',
      text: textResult.value || '',
      messages: htmlResult.messages.map((m) => m.message),
    };
  } catch (err: any) {
    // Check if legacy binary .doc or plain/rtf text
    const fallbackText = extractReadableTextFromLegacyBinary(arrayBuffer);
    if (fallbackText && fallbackText.length > 10) {
      return {
        html: `<p>${fallbackText.replace(/\n/g, '</p><p>')}</p>`,
        text: fallbackText,
        messages: ['Extracted readable text using legacy DOC compatibility mode.'],
      };
    }
    throw new Error(err?.message || 'Unable to parse Word file. Please use .DOCX format.');
  }
}

/**
 * Converts Word/Doc/Text content to a professional multi-page PDF with exact ordering,
 * margins, page numbers, and typography hierarchy.
 */
export async function convertWordToPDF(
  fileOrText: File | string,
  options: {
    title?: string;
    author?: string;
    fontSize?: number;
    showPageNumbers?: boolean;
    headerText?: string;
  } = {}
): Promise<Uint8Array> {
  let text = '';
  let docTitle = options.title || 'Document';

  if (typeof fileOrText === 'string') {
    text = fileOrText;
  } else {
    docTitle = fileOrText.name.replace(/\.[^/.]+$/, '');
    const lower = fileOrText.name.toLowerCase();
    if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
      const extracted = await extractDocxHtml(fileOrText);
      text = extracted.text;
    } else if (lower.endsWith('.pptx') || lower.endsWith('.ppt') || lower.endsWith('.odp')) {
      text = await extractPptxSlides(fileOrText);
    } else {
      text = await fileOrText.text();
    }
  }

  // Set up A4 PDF Document (595.28 x 841.89 points)
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
    orientation: 'portrait',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 54;
  const marginRight = 54;
  const marginTop = 54;
  const marginBottom = 54;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const showPageNumbers = options.showPageNumbers ?? true;
  const headerText = options.headerText || docTitle;

  // Split content by explicit page breaks or raw lines
  const rawSections = text.split(/(?:--- PAGE \d+ ---|--- PAGE BREAK ---|\f)/gi);

  let currentY = marginTop;
  let pageIndex = 1;

  const addHeaderAndFooter = (pgNum: number) => {
    // Header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 145, 155);
    doc.text(headerText, marginLeft, 34);
    doc.setDrawColor(230, 235, 240);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, 40, pageWidth - marginRight, 40);

    // Footer
    if (showPageNumbers) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(140, 145, 155);
      doc.line(marginLeft, pageHeight - 38, pageWidth - marginRight, pageHeight - 38);
      const pageStr = `Page ${pgNum}`;
      doc.text(pageStr, pageWidth - marginRight - doc.getTextWidth(pageStr), pageHeight - 24);
    }
  };

  addHeaderAndFooter(pageIndex);

  rawSections.forEach((section, secIdx) => {
    if (secIdx > 0) {
      doc.addPage();
      pageIndex++;
      addHeaderAndFooter(pageIndex);
      currentY = marginTop;
    }

    const lines = section.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimEnd();

      // Check if line is empty
      if (!line.trim()) {
        currentY += 12;
        if (currentY > pageHeight - marginBottom) {
          doc.addPage();
          pageIndex++;
          addHeaderAndFooter(pageIndex);
          currentY = marginTop;
        }
        continue;
      }

      // Check heading levels
      if (line.startsWith('# ')) {
        const hText = line.replace(/^#\s+/, '');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(20, 30, 50);

        if (currentY + 30 > pageHeight - marginBottom) {
          doc.addPage();
          pageIndex++;
          addHeaderAndFooter(pageIndex);
          currentY = marginTop;
        }

        const splitHeading = doc.splitTextToSize(hText, contentWidth);
        splitHeading.forEach((hl: string) => {
          doc.text(hl, marginLeft, currentY);
          currentY += 22;
        });
        currentY += 6;
      } else if (line.startsWith('## ')) {
        const hText = line.replace(/^##\s+/, '');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(40, 50, 70);

        if (currentY + 24 > pageHeight - marginBottom) {
          doc.addPage();
          pageIndex++;
          addHeaderAndFooter(pageIndex);
          currentY = marginTop;
        }

        const splitHeading = doc.splitTextToSize(hText, contentWidth);
        splitHeading.forEach((hl: string) => {
          doc.text(hl, marginLeft, currentY);
          currentY += 18;
        });
        currentY += 4;
      } else if (line.startsWith('### ')) {
        const hText = line.replace(/^###\s+/, '');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(60, 70, 90);

        if (currentY + 20 > pageHeight - marginBottom) {
          doc.addPage();
          pageIndex++;
          addHeaderAndFooter(pageIndex);
          currentY = marginTop;
        }

        const splitHeading = doc.splitTextToSize(hText, contentWidth);
        splitHeading.forEach((hl: string) => {
          doc.text(hl, marginLeft, currentY);
          currentY += 16;
        });
        currentY += 3;
      } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
        // Bullet list item
        const bulletText = line.replace(/^[-*•]\s+/, '');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.setTextColor(30, 41, 59);

        const wrapped = doc.splitTextToSize(bulletText, contentWidth - 16);

        if (currentY + wrapped.length * 14 > pageHeight - marginBottom) {
          doc.addPage();
          pageIndex++;
          addHeaderAndFooter(pageIndex);
          currentY = marginTop;
        }

        // Draw bullet dot
        doc.circle(marginLeft + 4, currentY - 3.5, 2, 'F');
        wrapped.forEach((wl: string, wIdx: number) => {
          doc.text(wl, marginLeft + 16, currentY);
          currentY += 14;
        });
      } else {
        // Normal paragraph text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.setTextColor(30, 41, 59);

        const wrapped = doc.splitTextToSize(line, contentWidth);

        wrapped.forEach((wl: string) => {
          if (currentY + 15 > pageHeight - marginBottom) {
            doc.addPage();
            pageIndex++;
            addHeaderAndFooter(pageIndex);
            currentY = marginTop;
          }
          doc.text(wl, marginLeft, currentY);
          currentY += 14.5;
        });
      }
    }
  });

  return new Uint8Array(doc.output('arraybuffer'));
}

/**
 * Creates a professional, styled DOCX document maintaining exact structure,
 * headings, bullet points, formatting and paragraph sequences.
 */
export async function exportTextToDocxBlob(
  text: string,
  options: {
    title?: string;
    subject?: string;
  } = {}
): Promise<Blob> {
  const lines = text.split('\n');
  const docxParagraphs: Paragraph[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      docxParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: '', size: 22 })],
          spacing: { after: 120 },
        })
      );
      continue;
    }

    // Heading 1
    if (trimmed.startsWith('# ')) {
      docxParagraphs.push(
        new Paragraph({
          text: trimmed.replace(/^#\s+/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 140 },
        })
      );
    }
    // Heading 2
    else if (trimmed.startsWith('## ')) {
      docxParagraphs.push(
        new Paragraph({
          text: trimmed.replace(/^##\s+/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 100 },
        })
      );
    }
    // Heading 3
    else if (trimmed.startsWith('### ')) {
      docxParagraphs.push(
        new Paragraph({
          text: trimmed.replace(/^###\s+/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 140, after: 80 },
        })
      );
    }
    // Bullet item
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      docxParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace(/^[-*•]\s+/, ''),
              size: 22,
              font: 'Calibri',
            }),
          ],
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      );
    }
    // Numbered item
    else if (/^\d+\.\s+/.test(trimmed)) {
      const numText = trimmed.replace(/^\d+\.\s+/, '');
      docxParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: numText,
              size: 22,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 80 },
        })
      );
    }
    // Normal text paragraph with inline bold / italic parsing
    else {
      const runs = parseInlineMarkdownToRuns(rawLine);
      docxParagraphs.push(
        new Paragraph({
          children: runs,
          spacing: { after: 120, line: 276 },
        })
      );
    }
  }

  const doc = new Document({
    title: options.title || 'Document',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children:
          docxParagraphs.length > 0
            ? docxParagraphs
            : [new Paragraph({ children: [new TextRun({ text: '', size: 22 })] })],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Helper to parse bold (**text**) and italic (*text*) inside a string into docx TextRuns
 */
function parseInlineMarkdownToRuns(line: string): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|[^*]+)/g;
  let match;

  while ((match = regex.exec(line)) !== null) {
    const chunk = match[0];
    if (chunk.startsWith('**') && chunk.endsWith('**') && chunk.length > 4) {
      runs.push(
        new TextRun({
          text: chunk.slice(2, -2),
          bold: true,
          size: 22,
          font: 'Calibri',
          color: '1E293B',
        })
      );
    } else if (chunk.startsWith('*') && chunk.endsWith('*') && chunk.length > 2) {
      runs.push(
        new TextRun({
          text: chunk.slice(1, -1),
          italics: true,
          size: 22,
          font: 'Calibri',
          color: '1E293B',
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: chunk,
          size: 22,
          font: 'Calibri',
          color: '1E293B',
        })
      );
    }
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text: line, size: 22, font: 'Calibri', color: '1E293B' }));
  }

  return runs;
}

export function exportTextToTxtBlob(text: string): Blob {
  return new Blob([text], { type: 'text/plain;charset=utf-8' });
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function exportTextToHtmlBlob(text: string, title = 'Document'): Blob {
  const safeTitle = escapeHtml(title);
  const bodyHtml = text
    .split('\n')
    .map((l) => {
      const trimmed = l.trim();
      if (!trimmed) return '<br/>';
      if (trimmed.startsWith('### ')) return `<h3>${escapeHtml(trimmed.slice(4))}</h3>`;
      if (trimmed.startsWith('## ')) return `<h2>${escapeHtml(trimmed.slice(3))}</h2>`;
      if (trimmed.startsWith('# ')) return `<h1>${escapeHtml(trimmed.slice(2))}</h1>`;
      return `<p>${escapeHtml(l)}</p>`;
    })
    .join('\n');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      color: #1e293b;
      line-height: 1.6;
    }
    h1, h2, h3 { color: #0f172a; margin-top: 1.5em; margin-bottom: 0.5em; }
    p { margin: 0.8em 0; }
    ul, ol { padding-left: 24px; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
  return new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
}
