import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import { readFileAsArrayBuffer } from './pdfProcessor';

export interface DocxExtractionResult {
  html: string;
  text: string;
  messages?: string[];
}

/**
 * Extracts HTML and structured text from DOCX files
 */
export async function extractDocxHtml(file: File): Promise<DocxExtractionResult> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const textResult = await mammoth.extractRawText({ arrayBuffer });

  return {
    html: htmlResult.value || '',
    text: textResult.value || '',
    messages: htmlResult.messages.map((m) => m.message),
  };
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
    if (
      fileOrText.name.toLowerCase().endsWith('.docx') ||
      fileOrText.name.toLowerCase().endsWith('.doc')
    ) {
      const extracted = await extractDocxHtml(fileOrText);
      text = extracted.text;
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

export function exportTextToHtmlBlob(text: string, title = 'Document'): Blob {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
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
${text
  .split('\n')
  .map((l) => (l.trim() ? `<p>${l}</p>` : '<br/>'))
  .join('\n')}
</body>
</html>`;
  return new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
}
