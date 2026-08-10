import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { readFileAsArrayBuffer } from './pdfProcessor';

export async function extractDocxHtml(file: File): Promise<{ html: string; text: string }> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const textResult = await mammoth.extractRawText({ arrayBuffer });

  return {
    html: htmlResult.value,
    text: textResult.value,
  };
}

export async function convertWordToPDF(file: File): Promise<Uint8Array> {
  let text = '';
  if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
    const extracted = await extractDocxHtml(file);
    text = extracted.text;
  } else {
    text = await file.text();
  }

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(11);

  const lines = doc.splitTextToSize(text || 'Empty Document', 500);

  let y = 50;
  lines.forEach((line: string) => {
    if (y > 780) {
      doc.addPage();
      y = 50;
    }
    doc.text(line, 50, y);
    y += 16;
  });

  return new Uint8Array(doc.output('arraybuffer'));
}

export async function exportTextToDocxBlob(text: string): Promise<Blob> {
  const lines = text.split('\n');
  const paragraphs = lines.map((line) => new Paragraph({
    children: [new TextRun({ text: line, size: 24 })],
  }));

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs.length > 0 ? paragraphs : [new Paragraph({ children: [new TextRun('')] })],
    }],
  });

  return await Packer.toBlob(doc);
}

export function exportTextToTxtBlob(text: string): Blob {
  return new Blob([text], { type: 'text/plain;charset=utf-8' });
}
