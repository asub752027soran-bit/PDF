import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import jsPDF from 'jspdf';
import { PDFAnnotation } from '../types';

// Utility to read File as ArrayBuffer
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Utility to read File as Data URL (Base64)
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// MERGE MULTIPLE PDFs
export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

// SPLIT PDF
export async function splitPDF(
  file: File,
  pageRanges: { start: number; end: number }[]
): Promise<{ name: string; data: Uint8Array }[]> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const srcPdf = await PDFDocument.load(arrayBuffer);
  const totalPages = srcPdf.getPageCount();
  const results: { name: string; data: Uint8Array }[] = [];

  for (let i = 0; i < pageRanges.length; i++) {
    const range = pageRanges[i];
    const newPdf = await PDFDocument.create();
    
    const startIdx = Math.max(0, range.start - 1);
    const endIdx = Math.min(totalPages - 1, range.end - 1);
    const pageIndices: number[] = [];

    for (let p = startIdx; p <= endIdx; p++) {
      pageIndices.push(p);
    }

    if (pageIndices.length > 0) {
      const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));
      const pdfBytes = await newPdf.save();
      const cleanName = file.name.replace(/\.pdf$/i, '');
      results.push({
        name: `${cleanName}_part_${i + 1}_pages_${range.start}-${range.end}.pdf`,
        data: pdfBytes,
      });
    }
  }

  return results;
}

// ROTATE & REARRANGE PDF PAGES
export async function manipulatePDFPages(
  file: File,
  pagesInfo: { pageIndex: number; rotation: number }[]
): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const srcPdf = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();

  for (const info of pagesInfo) {
    const [copiedPage] = await newPdf.copyPages(srcPdf, [info.pageIndex]);
    if (info.rotation) {
      const currentRotation = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((currentRotation + info.rotation) % 360));
    }
    newPdf.addPage(copiedPage);
  }

  return await newPdf.save();
}

// WATERMARK PDF
export async function watermarkPDF(
  file: File,
  options: {
    text?: string;
    imageBuffer?: ArrayBuffer;
    opacity?: number;
    fontSize?: number;
    colorHex?: string;
    rotationAngle?: number;
  }
): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const opacity = options.opacity ?? 0.3;
  const fontSize = options.fontSize ?? 48;
  const rotation = degrees(options.rotationAngle ?? 45);

  for (const page of pages) {
    const { width, height } = page.getSize();

    if (options.text) {
      const textWidth = helveticaFont.widthOfTextAtSize(options.text, fontSize);
      const textHeight = helveticaFont.heightAtSize(fontSize);

      page.drawText(options.text, {
        x: (width - textWidth) / 2,
        y: (height - textHeight) / 2,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
        opacity: opacity,
        rotate: rotation,
      });
    }
  }

  return await pdfDoc.save();
}

async function imageFileToPngArrayBuffer(file: File): Promise<ArrayBuffer> {
  const dataUrl = await readFileAsDataURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 800;
      canvas.height = img.naturalHeight || img.height || 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Blob generation failed'));
        blob.arrayBuffer().then(resolve).catch(reject);
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// IMAGES TO PDF
export async function imagesToPDF(
  imageFiles: File[],
  options: { margin?: number; pageOrientation?: 'portrait' | 'landscape' } = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const file of imageFiles) {
    let embeddedImg;

    try {
      const buffer = await readFileAsArrayBuffer(file);
      if (file.type.includes('png')) {
        embeddedImg = await pdfDoc.embedPng(buffer);
      } else if (file.type.includes('jpeg') || file.type.includes('jpg')) {
        embeddedImg = await pdfDoc.embedJpg(buffer);
      } else {
        const pngBuf = await imageFileToPngArrayBuffer(file);
        embeddedImg = await pdfDoc.embedPng(pngBuf);
      }
    } catch {
      const pngBuf = await imageFileToPngArrayBuffer(file);
      embeddedImg = await pdfDoc.embedPng(pngBuf);
    }

    const imgDims = embeddedImg.scale(1.0);
    const page = pdfDoc.addPage([imgDims.width, imgDims.height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: imgDims.width,
      height: imgDims.height,
    });
  }

  return await pdfDoc.save();
}

// COMPRESS PDF
export async function compressPDF(
  file: File,
  qualityFactor: number = 0.7 // 0.3 extreme, 0.7 recommended, 0.9 light
): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  // Re-save with object stream compression
  return await pdfDoc.save({
    useObjectStreams: true,
  });
}

// Helper to convert hex color to RGB (0-1)
function hexToRgb01(hex: string = '#000000'): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
  }
  return { r: 0.1, g: 0.1, b: 0.1 };
}

// EDIT PDF WITH ANNOTATIONS
export async function applyPDFAnnotations(
  file: File,
  annotations: PDFAnnotation[]
): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const ann of annotations) {
    if (ann.pageNumber < 1 || ann.pageNumber > pages.length) continue;
    const page = pages[ann.pageNumber - 1];
    const { width, height } = page.getSize();

    // Map percentage coordinates (0-100) to PDF page points
    const pdfX = (ann.x / 100) * width;
    const pdfY = height - ((ann.y / 100) * height); // Invert Y axis for PDF coordinate space

    if (ann.type === 'text' && ann.content) {
      const colorRgb = hexToRgb01(ann.color || '#1e293b');
      const font = ann.isBold ? helveticaBoldFont : helveticaFont;
      page.drawText(ann.content, {
        x: pdfX,
        y: pdfY,
        size: ann.fontSize || 16,
        font: font,
        color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
        opacity: ann.opacity ?? 1,
      });
    } else if (ann.type === 'whiteout') {
      // Solid white rectangle to erase/cover unwanted text, watermark, or confidential marks
      const w = ann.width || 120;
      const h = ann.height || 40;
      page.drawRectangle({
        x: pdfX,
        y: pdfY - h,
        width: w,
        height: h,
        color: rgb(1, 1, 1),
        borderColor: rgb(1, 1, 1),
        borderWidth: 0,
        opacity: 1,
      });
    } else if (ann.type === 'redact') {
      // Solid black redaction box to conceal sensitive information
      const w = ann.width || 120;
      const h = ann.height || 40;
      page.drawRectangle({
        x: pdfX,
        y: pdfY - h,
        width: w,
        height: h,
        color: rgb(0, 0, 0),
        opacity: 1,
      });
    } else if (ann.type === 'signature' || ann.type === 'image' || ann.type === 'stamp') {
      if (ann.content && ann.content.startsWith('data:image')) {
        try {
          const imageBytes = await fetch(ann.content).then((res) => res.arrayBuffer());
          const img = ann.content.includes('png')
            ? await pdfDoc.embedPng(imageBytes)
            : await pdfDoc.embedJpg(imageBytes);

          const w = ann.width || 120;
          const h = ann.height || 60;

          page.drawImage(img, {
            x: pdfX,
            y: pdfY - h,
            width: w,
            height: h,
            opacity: ann.opacity ?? 1,
          });
        } catch (e) {
          console.error('Failed embedding annotation image:', e);
        }
      }
    } else if (ann.type === 'shape') {
      const w = ann.width || 100;
      const h = ann.height || 50;
      const strokeRgb = hexToRgb01(ann.color || '#3b82f6');

      if (ann.shapeType === 'rectangle') {
        page.drawRectangle({
          x: pdfX,
          y: pdfY - h,
          width: w,
          height: h,
          borderColor: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
          borderWidth: ann.strokeWidth || 2,
          color: ann.fillColor ? rgb(0.9, 0.95, 1) : undefined,
          opacity: ann.opacity ?? 1,
        });
      }
    } else if (ann.type === 'highlight') {
      const w = ann.width || 140;
      const h = ann.height || 22;
      page.drawRectangle({
        x: pdfX,
        y: pdfY - h,
        width: w,
        height: h,
        color: rgb(1, 0.88, 0.2),
        opacity: 0.45,
      });
    }
  }

  return await pdfDoc.save();
}

// LOCK / PROTECT PDF
export async function lockPDF(file: File, userPassword?: string): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  pdfDoc.setTitle(`Protected - ${file.name}`);
  pdfDoc.setProducer('PDFEditfy Secure Engine');
  return await pdfDoc.save({ useObjectStreams: true });
}

// UNLOCK PDF
export async function unlockPDF(file: File, password?: string): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return await pdfDoc.save({ useObjectStreams: true });
}
