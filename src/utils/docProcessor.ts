import mammoth from 'mammoth';
import jsPDF from 'jspdf';
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
  const { text } = await extractDocxHtml(file);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  doc.setFontSize(12);
  const lines = doc.splitTextToSize(text || 'Empty Document', 500);

  let y = 50;
  lines.forEach((line: string) => {
    if (y > 780) {
      doc.addPage();
      y = 50;
    }
    doc.text(line, 50, y);
    y += 18;
  });

  return new Uint8Array(doc.output('arraybuffer'));
}

export function exportTextToTxtBlob(text: string): Blob {
  return new Blob([text], { type: 'text/plain;charset=utf-8' });
}
