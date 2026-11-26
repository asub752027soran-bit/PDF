import { PDFDocument, PDFName, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import jsPDF from 'jspdf';
import { PDFAnnotation, EditablePdfText } from '../types';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfWorker || `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
}

// Utility to read File as ArrayBuffer safely
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));
    if (typeof file.arrayBuffer === 'function') {
      file.arrayBuffer().then(resolve).catch(reject);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader encountered an error'));
    reader.onabort = () => reject(new Error('File reading was aborted'));
    reader.readAsArrayBuffer(file);
  });
}

// Utility to read File as Data URL (Base64) safely
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as DataURL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader encountered an error'));
    reader.onabort = () => reject(new Error('File reading was aborted'));
    reader.readAsDataURL(file);
  });
}

// MERGE MULTIPLE PDFs
export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  if (!files || files.length === 0) {
    throw new Error('At least one PDF file is required to merge.');
  }

  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (err: any) {
      console.error(`Failed to merge file "${file.name}":`, err);
      throw new Error(`Failed to load "${file.name}": ${err?.message || 'Invalid or protected PDF'}`);
    }
  }

  return await mergedPdf.save({ useObjectStreams: true });
}

// SPLIT PDF
export async function splitPDF(
  file: File,
  pageRanges: { start: number; end: number }[]
): Promise<{ name: string; data: Uint8Array }[]> {
  if (!file) throw new Error('No PDF file provided for splitting.');
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
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
      const pdfBytes = await newPdf.save({ useObjectStreams: true });
      const cleanName = file.name.replace(/\.pdf$/i, '');
      results.push({
        name: `${cleanName}_part_${i + 1}_pages_${range.start}-${range.end}.pdf`,
        data: pdfBytes,
      });
    }
  }

  if (results.length === 0) {
    throw new Error('No valid pages found in specified ranges.');
  }

  return results;
}

// ROTATE & REARRANGE PDF PAGES
export async function manipulatePDFPages(
  file: File,
  pagesInfo: { pageIndex: number; rotation: number }[]
): Promise<Uint8Array> {
  if (!file) throw new Error('No PDF file provided.');
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();

  for (const info of pagesInfo) {
    if (info.pageIndex < 0 || info.pageIndex >= srcPdf.getPageCount()) continue;
    const [copiedPage] = await newPdf.copyPages(srcPdf, [info.pageIndex]);
    if (info.rotation) {
      const currentRotation = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((currentRotation + info.rotation) % 360));
    }
    newPdf.addPage(copiedPage);
  }

  return await newPdf.save({ useObjectStreams: true });
}

// WATERMARK PDF
export interface WatermarkOptions {
  type?: 'text' | 'image';
  text?: string;
  imageBuffer?: ArrayBuffer;
  imageDataUrl?: string;
  opacity?: number;
  fontSize?: number;
  imageScale?: number;
  colorHex?: string;
  rotationAngle?: number;
  layout?: 'center' | 'grid';
  fontFamily?: 'Helvetica' | 'Times' | 'Courier';
  isBold?: boolean;
  targetPages?: 'all' | 'first' | 'custom';
  customPages?: number[];
}

export async function watermarkPDF(
  file: File,
  options: WatermarkOptions
): Promise<Uint8Array> {
  if (!file) throw new Error('No PDF file provided.');
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  const isImageWatermark = options.type === 'image' || (!options.text && (options.imageDataUrl || options.imageBuffer));
  const opacity = Math.min(Math.max(options.opacity ?? 0.3, 0.05), 1.0);
  const rotationDeg = options.rotationAngle ?? 45;
  const rotation = degrees(rotationDeg);
  const rad = (rotationDeg * Math.PI) / 180;
  const layout = options.layout ?? 'center';

  // Determine pages to stamp
  const pageIndicesToStamp: number[] = [];
  if (options.targetPages === 'first') {
    pageIndicesToStamp.push(0);
  } else if (options.targetPages === 'custom' && options.customPages && options.customPages.length > 0) {
    for (const p of options.customPages) {
      if (p >= 1 && p <= totalPages) {
        pageIndicesToStamp.push(p - 1);
      }
    }
  } else {
    for (let i = 0; i < totalPages; i++) {
      pageIndicesToStamp.push(i);
    }
  }

  if (isImageWatermark && (options.imageDataUrl || options.imageBuffer)) {
    // --- 1. IMAGE WATERMARK ---
    let imageBytes: ArrayBuffer;
    let isPng = true;

    if (options.imageDataUrl) {
      isPng = options.imageDataUrl.includes('image/png') || options.imageDataUrl.startsWith('data:image/png');
      const res = await fetch(options.imageDataUrl);
      imageBytes = await res.arrayBuffer();
    } else {
      imageBytes = options.imageBuffer!;
    }

    let embeddedImg: any;
    try {
      if (isPng) {
        embeddedImg = await pdfDoc.embedPng(imageBytes);
      } else {
        embeddedImg = await pdfDoc.embedJpg(imageBytes);
      }
    } catch {
      try {
        embeddedImg = await pdfDoc.embedPng(imageBytes);
      } catch {
        embeddedImg = await pdfDoc.embedJpg(imageBytes);
      }
    }

    const naturalDims = embeddedImg.scale(1.0);
    const userScale = options.imageScale ?? 1.0;

    for (const pageIdx of pageIndicesToStamp) {
      const page = pages[pageIdx];
      const { width, height } = page.getSize();

      // Scaled dimensions proportional to page width
      const baseMaxDim = Math.min(width * 0.45, 280);
      const aspect = naturalDims.width / naturalDims.height;
      let imgWidth = baseMaxDim * userScale;
      let imgHeight = imgWidth / aspect;

      const stampImageAt = (cx: number, cy: number) => {
        // Calculate offset so (cx, cy) is the exact center of the rotated image
        const dx = (imgWidth / 2) * Math.cos(rad) - (imgHeight / 2) * Math.sin(rad);
        const dy = (imgWidth / 2) * Math.sin(rad) + (imgHeight / 2) * Math.cos(rad);

        page.drawImage(embeddedImg, {
          x: cx - dx,
          y: cy - dy,
          width: imgWidth,
          height: imgHeight,
          opacity: opacity,
          rotate: rotation,
        });
      };

      if (layout === 'center') {
        stampImageAt(width / 2, height / 2);
      } else {
        // 2x3 Grid tiling across page
        const stepX = width / 2;
        const stepY = height / 3;
        for (let col = 0; col < 2; col++) {
          for (let row = 0; row < 3; row++) {
            stampImageAt((col + 0.5) * stepX, (row + 0.5) * stepY);
          }
        }
      }
    }
  } else {
    // --- 2. TEXT WATERMARK ---
    const textToStamp = (options.text || 'CONFIDENTIAL').trim();
    if (!textToStamp) {
      return await pdfDoc.save({ useObjectStreams: true });
    }

    const fontSize = options.fontSize ?? 48;
    const colorRgb = hexToRgb01(options.colorHex || '#dc2626');

    // Font selection
    let selectedFont: any;
    if (options.fontFamily === 'Times') {
      selectedFont = await pdfDoc.embedFont(options.isBold !== false ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman);
    } else if (options.fontFamily === 'Courier') {
      selectedFont = await pdfDoc.embedFont(options.isBold !== false ? StandardFonts.CourierBold : StandardFonts.Courier);
    } else {
      selectedFont = await pdfDoc.embedFont(options.isBold !== false ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);
    }

    const textWidth = selectedFont.widthOfTextAtSize(textToStamp, fontSize);
    const textHeight = selectedFont.heightAtSize(fontSize) * 0.75; // Optical cap height for precise visual centering

    for (const pageIdx of pageIndicesToStamp) {
      const page = pages[pageIdx];
      const { width, height } = page.getSize();

      const stampTextAt = (cx: number, cy: number) => {
        // Rotate around text box center
        const dx = (textWidth / 2) * Math.cos(rad) - (textHeight / 2) * Math.sin(rad);
        const dy = (textWidth / 2) * Math.sin(rad) + (textHeight / 2) * Math.cos(rad);

        page.drawText(textToStamp, {
          x: cx - dx,
          y: cy - dy,
          size: fontSize,
          font: selectedFont,
          color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
          opacity: opacity,
          rotate: rotation,
        });
      };

      if (layout === 'center') {
        stampTextAt(width / 2, height / 2);
      } else {
        // 2x3 Grid tiling across page
        const stepX = width / 2;
        const stepY = height / 3;
        for (let col = 0; col < 2; col++) {
          for (let row = 0; row < 3; row++) {
            stampTextAt((col + 0.5) * stepX, (row + 0.5) * stepY);
          }
        }
      }
    }
  }

  return await pdfDoc.save({ useObjectStreams: true });
}

async function imageFileToPngArrayBuffer(file: File): Promise<ArrayBuffer> {
  const dataUrl = await readFileAsDataURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let canvas: HTMLCanvasElement | null = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 800;
      canvas.height = img.naturalHeight || img.height || 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        canvas = null;
        return reject(new Error('Canvas context unavailable'));
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
          canvas = null;
        }
        if (!blob) return reject(new Error('Blob generation failed'));
        blob.arrayBuffer().then(resolve).catch(reject);
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('Failed to load image for conversion'));
    img.src = dataUrl;
  });
}

// IMAGES TO PDF
export async function imagesToPDF(
  imageFiles: File[],
  options: { margin?: number; pageOrientation?: 'portrait' | 'landscape' } = {}
): Promise<Uint8Array> {
  if (!imageFiles || imageFiles.length === 0) {
    throw new Error('Please select at least one image to convert to PDF.');
  }

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

  return await pdfDoc.save({ useObjectStreams: true });
}

export type CompressionLevel = 'extreme' | 'recommended' | 'light';

export interface CompressPDFOptions {
  level?: CompressionLevel;
  preserveTextOnly?: boolean;
  onProgress?: (percent: number, status: string, stage: string) => void;
}

export interface CompressPDFResult {
  data: Uint8Array;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  method: 'structural' | 'rasterized' | 'original';
  pageCount: number;
}

function canvasToJpegBuffer(canvas: HTMLCanvasElement, quality: number): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to encode compressed page image'));
          return;
        }
        blob.arrayBuffer().then(resolve).catch(reject);
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Strips metadata, orphan objects, thumbnails, and incremental updates into a clean object-stream PDF.
 */
async function compressPDFStructural(rawBytes: Uint8Array): Promise<{ data: Uint8Array; pageCount: number }> {
  const srcPdf = await PDFDocument.load(rawBytes.slice(0), {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  if (srcPdf.isEncrypted) {
    throw new Error('This PDF is password-protected. Please unlock it first using the Unlock PDF tool.');
  }

  const cleanPdf = await PDFDocument.create();
  const pageIndices = srcPdf.getPageIndices();
  if (pageIndices.length > 0) {
    const copiedPages = await cleanPdf.copyPages(srcPdf, pageIndices);
    for (const page of copiedPages) {
      // Remove optional thumbnail/piece info dictionaries to save space
      try {
        page.node.delete(PDFName.of('Thumb'));
        page.node.delete(PDFName.of('PieceInfo'));
      } catch {
        // Ignore if not present
      }
      cleanPdf.addPage(page);
    }
  }

  // Strip heavy XMP metadata and info dictionary bloat
  try {
    cleanPdf.catalog.delete(PDFName.of('Metadata'));
    cleanPdf.catalog.delete(PDFName.of('PieceInfo'));
  } catch {
    // Ignore
  }
  cleanPdf.setTitle('');
  cleanPdf.setAuthor('');
  cleanPdf.setSubject('');
  cleanPdf.setKeywords([]);
  cleanPdf.setProducer('PDF Editfy');
  cleanPdf.setCreator('PDF Editfy');

  const saved = await cleanPdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });

  return { data: saved, pageCount: pageIndices.length };
}

/**
 * Renders PDF pages at controlled DPI and JPEG quality, preserving exact PDF page dimensions in points.
 */
async function compressPDFRasterized(
  rawBytes: Uint8Array,
  level: CompressionLevel,
  onProgress?: (percent: number, status: string, stage: string) => void
): Promise<{ data: Uint8Array; pageCount: number }> {
  const preset =
    level === 'extreme'
      ? { targetScale: 1.05, maxDim: 1150, jpegQuality: 0.45 }
      : level === 'light'
      ? { targetScale: 1.8, maxDim: 2100, jpegQuality: 0.85 }
      : { targetScale: 1.4, maxDim: 1600, jpegQuality: 0.7 };

  const loadingTask = pdfjsLib.getDocument({ data: rawBytes.slice(0) });
  let pdf: any = null;

  try {
    pdf = await loadingTask.promise;
    const totalPages = pdf.numPages || 0;
    if (totalPages === 0) {
      throw new Error('The PDF contains no pages.');
    }

    const outPdf = await PDFDocument.create();
    outPdf.setProducer('PDF Editfy');
    outPdf.setCreator('PDF Editfy');

    for (let i = 1; i <= totalPages; i++) {
      let page: any = null;
      let canvas: HTMLCanvasElement | null = null;

      try {
        const pct = 30 + Math.round(((i - 1) / totalPages) * 60);
        onProgress?.(pct, `Compressing page ${i} of ${totalPages}...`, 'Optimizing Page Streams');

        page = await pdf.getPage(i);
        const baseViewport = page.getViewport({ scale: 1.0 });

        // Clamp render scale so oversized PDF pages do not exhaust memory
        const maxBaseDim = Math.max(baseViewport.width, baseViewport.height, 1);
        const clampedScale = Math.min(preset.targetScale, preset.maxDim / maxBaseDim);
        const renderScale = Math.max(0.4, clampedScale);
        const viewport = page.getViewport({ scale: renderScale });

        canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          throw new Error('Browser canvas 2D context is unavailable.');
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        } as any).promise;

        const jpgBuffer = await canvasToJpegBuffer(canvas, preset.jpegQuality);
        const jpgImage = await outPdf.embedJpg(jpgBuffer);

        // Preserve exact original physical PDF page size in points
        const outPage = outPdf.addPage([baseViewport.width, baseViewport.height]);
        outPage.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: baseViewport.width,
          height: baseViewport.height,
        });
      } finally {
        if (page && typeof page.cleanup === 'function') {
          try {
            page.cleanup();
          } catch {
            // ignore
          }
        }
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
          canvas = null;
        }
      }
    }

    onProgress?.(92, 'Rebuilding compressed PDF object streams...', 'Finalizing PDF');
    const saved = await outPdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      updateFieldAppearances: false,
    });

    return { data: saved, pageCount: totalPages };
  } catch (err: any) {
    if (err?.name === 'PasswordException') {
      throw new Error('This PDF is password-protected. Please unlock it first using the Unlock PDF tool.');
    }
    throw err;
  } finally {
    if (pdf && typeof pdf.destroy === 'function') {
      try {
        await pdf.destroy();
      } catch {
        // ignore
      }
    }
    if (loadingTask && typeof loadingTask.destroy === 'function') {
      try {
        await loadingTask.destroy();
      } catch {
        // ignore
      }
    }
  }
}

// COMPRESS PDF (Detailed hybrid optimization returning best smallest valid result)
export async function compressPDFDetailed(
  file: File,
  options: CompressPDFOptions = {}
): Promise<CompressPDFResult> {
  if (!file) throw new Error('No PDF file provided for compression.');

  const level: CompressionLevel = options.level || 'recommended';
  const preserveTextOnly = options.preserveTextOnly ?? false;
  const onProgress = options.onProgress;

  onProgress?.(10, `Reading "${file.name}"...`, 'Loading Document');
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const originalBytes = new Uint8Array(arrayBuffer);
  const originalSize = originalBytes.byteLength;

  if (originalSize === 0) {
    throw new Error('The selected PDF file is empty.');
  }

  // Stage 1: Structural & Object Stream Cleanup (always preserves vector text)
  onProgress?.(20, 'Stripping unused objects, metadata & compressing streams...', 'Structural Optimization');
  let structuralData: Uint8Array | null = null;
  let pageCount = 1;

  try {
    const structRes = await compressPDFStructural(originalBytes);
    structuralData = structRes.data;
    pageCount = structRes.pageCount || 1;
  } catch (structErr: any) {
    if (structErr?.message?.includes('password-protected')) {
      throw structErr;
    }
    console.warn('Structural PDF pass warning:', structErr);
  }

  // If user requested lossless text-only preservation, return smallest between structural & original
  if (preserveTextOnly) {
    onProgress?.(95, 'Finalizing lossless structural optimization...', 'Finalizing PDF');
    if (structuralData && structuralData.byteLength < originalSize) {
      const compressedSize = structuralData.byteLength;
      return {
        data: structuralData,
        originalSize,
        compressedSize,
        savedPercent: Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100)),
        method: 'structural',
        pageCount,
      };
    }
    return {
      data: originalBytes,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
      method: 'original',
      pageCount,
    };
  }

  // Stage 2: Page & Embedded Image Recompression via pdfjs-dist + JPEG optimization
  let rasterizedData: Uint8Array | null = null;
  try {
    const rasterRes = await compressPDFRasterized(originalBytes, level, onProgress);
    rasterizedData = rasterRes.data;
    pageCount = rasterRes.pageCount || pageCount;
  } catch (rasterErr: any) {
    // Re-throw explicit password protection errors; otherwise fallback to structural if available
    if (rasterErr?.message?.includes('password-protected')) {
      throw rasterErr;
    }
    console.warn('Rasterized compression fallback notice:', rasterErr);
    if (!structuralData) {
      throw new Error(rasterErr?.message || 'Unable to parse or compress this PDF file.');
    }
  }

  // Pick the strictly smallest valid PDF output
  let bestData: Uint8Array = originalBytes;
  let method: 'structural' | 'rasterized' | 'original' = 'original';

  if (structuralData && structuralData.byteLength < bestData.byteLength) {
    bestData = structuralData;
    method = 'structural';
  }

  if (rasterizedData) {
    // In 'light' mode, prefer lossless vector structural output unless rasterization gives meaningful (>=10%) extra savings
    const rasterThreshold = level === 'light' ? bestData.byteLength * 0.9 : bestData.byteLength;
    if (rasterizedData.byteLength < rasterThreshold) {
      bestData = rasterizedData;
      method = 'rasterized';
    }
  }

  const compressedSize = bestData.byteLength;
  const savedPercent = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

  onProgress?.(100, 'Compression complete!', 'Completed');

  return {
    data: bestData,
    originalSize,
    compressedSize,
    savedPercent,
    method,
    pageCount,
  };
}

// COMPRESS PDF (Backward-compatible wrapper)
export async function compressPDF(
  file: File,
  qualityFactor: number = 0.7 // 0.3 extreme, 0.7 recommended, 0.9 light
): Promise<Uint8Array> {
  const level: CompressionLevel =
    qualityFactor <= 0.45 ? 'extreme' : qualityFactor >= 0.85 ? 'light' : 'recommended';
  const result = await compressPDFDetailed(file, { level });
  return result.data;
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

// EDIT PDF WITH ANNOTATIONS & DIRECT TEXT EDITS
export async function applyPDFAnnotations(
  file: File,
  annotations: PDFAnnotation[],
  editedTexts: EditablePdfText[] = []
): Promise<Uint8Array> {
  if (!file) throw new Error('No PDF file provided.');
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  // Embed standard PDF font families safely
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const helveticaBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const timesBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

  const courier = await pdfDoc.embedFont(StandardFonts.Courier);
  const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);
  const courierOblique = await pdfDoc.embedFont(StandardFonts.CourierOblique);
  const courierBoldOblique = await pdfDoc.embedFont(StandardFonts.CourierBoldOblique);

  const getExactFont = (
    fontFamilyStr?: string,
    pdfFontTypeStr?: string,
    fontNameStr?: string,
    isBold?: boolean,
    isItalic?: boolean
  ) => {
    const combined = `${fontFamilyStr || ''} ${pdfFontTypeStr || ''} ${fontNameStr || ''}`.toLowerCase();
    const isSerif =
      combined.includes('times') ||
      combined.includes('serif') ||
      combined.includes('roman') ||
      combined.includes('georgia') ||
      combined.includes('garamond') ||
      combined.includes('cambria') ||
      combined.includes('palatino') ||
      combined.includes('baskerville') ||
      combined.includes('minion') ||
      combined.includes('charter') ||
      combined.includes('century') ||
      combined.includes('bookman') ||
      combined.includes('bookantiqua') ||
      combined.includes('didot') ||
      combined.includes('bodoni') ||
      combined.includes('liberationserif') ||
      combined.includes('nimbusrom') ||
      combined.includes('nimbusroman') ||
      combined.includes('dejavuserif') ||
      combined.includes('pt serif') ||
      combined.includes('lora') ||
      combined.includes('merriweather') ||
      combined.includes('tnr') ||
      combined.includes('stsong') ||
      combined.includes('mincho') ||
      combined.includes('batang');

    const isMono =
      combined.includes('courier') ||
      combined.includes('mono') ||
      combined.includes('code') ||
      combined.includes('consolas') ||
      combined.includes('menlo') ||
      combined.includes('typewriter') ||
      combined.includes('sourcecodepro') ||
      combined.includes('firacode') ||
      combined.includes('cascadia') ||
      combined.includes('liberationmono') ||
      combined.includes('dejavusansmono');

    const checkBold =
      isBold ||
      combined.includes('bold') ||
      combined.includes('black') ||
      combined.includes('heavy') ||
      combined.includes('semibold') ||
      combined.includes('demi') ||
      combined.includes('-b') ||
      combined.endsWith('b') ||
      combined.includes('700') ||
      combined.includes('800') ||
      combined.includes('900');

    const checkItalic =
      isItalic ||
      combined.includes('italic') ||
      combined.includes('oblique') ||
      combined.includes('slanted') ||
      combined.includes('-i') ||
      combined.endsWith('i');

    if (isSerif) {
      if (checkBold && checkItalic) return timesBoldItalic;
      if (checkBold) return timesBold;
      if (checkItalic) return timesItalic;
      return timesRoman;
    }

    if (isMono) {
      if (checkBold && checkItalic) return courierBoldOblique;
      if (checkBold) return courierBold;
      if (checkItalic) return courierOblique;
      return courier;
    }

    // Default Sans-Serif (Helvetica / Arial / Calibri / etc.)
    if (checkBold && checkItalic) return helveticaBoldOblique;
    if (checkBold) return helveticaBold;
    if (checkItalic) return helveticaOblique;
    return helvetica;
  };

  const pages = pdfDoc.getPages();

  // 1. First process all in-place edited words and text lines
  for (const item of editedTexts) {
    if (!item.isModified && !item.isDeleted) continue;
    if (item.pageNumber < 1 || item.pageNumber > pages.length) continue;

    const page = pages[item.pageNumber - 1];
    const { width, height } = page.getSize();

    const pdfX = (item.x / 100) * width;
    const pdfY = height - ((item.y / 100) * height);
    const boxW = Math.max((item.width / 100) * width, 8);
    const boxH = Math.max((item.height / 100) * height, (item.fontSize || 12) * 1.2);

    // Erase original underlying text with a clean solid white rectangle
    page.drawRectangle({
      x: pdfX - 1.5,
      y: pdfY - boxH + 2,
      width: boxW + 4,
      height: boxH + 3,
      color: rgb(1, 1, 1),
      opacity: 1,
    });

    // If text was not deleted and has content, write the new updated text using the exact matched original font
    if (!item.isDeleted && item.currentText && item.currentText.trim().length > 0) {
      const selectedFont = getExactFont(item.fontFamily, item.pdfFontType, item.fontName, item.isBold, item.isItalic);
      const fSize = Math.max(item.fontSize || 12, 6);
      const colorRgb = hexToRgb01(item.color || '#111827');

      page.drawText(item.currentText, {
        x: pdfX,
        y: pdfY - fSize * 0.85,
        size: fSize,
        font: selectedFont,
        color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
        opacity: 1,
      });
    }
  }

  // 2. Process all overlays & annotations
  for (const ann of annotations) {
    if (ann.pageNumber < 1 || ann.pageNumber > pages.length) continue;
    const page = pages[ann.pageNumber - 1];
    const { width, height } = page.getSize();

    const pdfX = (ann.x / 100) * width;
    const pdfY = height - ((ann.y / 100) * height);

    if (ann.type === 'text' && ann.content) {
      let selectedFont = helvetica;
      const fam = (ann.fontFamily || 'Helvetica').toLowerCase();

      if (fam.includes('times') || fam.includes('serif')) {
        selectedFont = ann.isBold ? timesBold : timesRoman;
      } else if (fam.includes('courier') || fam.includes('mono')) {
        selectedFont = ann.isBold ? courierBold : courier;
      } else {
        if (ann.isBold && ann.isItalic) {
          selectedFont = helveticaBoldOblique;
        } else if (ann.isBold) {
          selectedFont = helveticaBold;
        } else if (ann.isItalic) {
          selectedFont = helveticaOblique;
        } else {
          selectedFont = helvetica;
        }
      }

      const fSize = ann.fontSize || 16;
      const textWidth = selectedFont.widthOfTextAtSize(ann.content, fSize);
      const textHeight = selectedFont.heightAtSize(fSize);

      if (ann.hasWhiteoutBg) {
        page.drawRectangle({
          x: pdfX - 4,
          y: pdfY - 3,
          width: textWidth + 8,
          height: textHeight + 6,
          color: rgb(1, 1, 1),
          opacity: 1,
        });
      }

      const colorRgb = hexToRgb01(ann.color || '#1e293b');
      page.drawText(ann.content, {
        x: pdfX,
        y: pdfY,
        size: fSize,
        font: selectedFont,
        color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
        opacity: ann.opacity ?? 1,
      });
    } else if (ann.type === 'whiteout') {
      const w = ann.width ? (ann.width / 100) * width : 120;
      const h = ann.height ? (ann.height / 100) * height : 36;
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
      const w = ann.width ? (ann.width / 100) * width : 120;
      const h = ann.height ? (ann.height / 100) * height : 28;
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

          const w = ann.width ? (ann.width / 100) * width : 140;
          const h = ann.height ? (ann.height / 100) * height : 70;

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
      const w = ann.width ? (ann.width / 100) * width : 100;
      const h = ann.height ? (ann.height / 100) * height : 50;
      const strokeRgb = hexToRgb01(ann.color || '#3b82f6');
      const fillRgb = ann.fillColor ? hexToRgb01(ann.fillColor) : undefined;

      if (ann.shapeType === 'circle') {
        const radius = Math.min(w, h) / 2;
        page.drawEllipse({
          x: pdfX + radius,
          y: pdfY - radius,
          xScale: radius,
          yScale: radius,
          borderColor: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
          borderWidth: ann.strokeWidth || 2,
          color: fillRgb ? rgb(fillRgb.r, fillRgb.g, fillRgb.b) : undefined,
          opacity: ann.opacity ?? 1,
        });
      } else if (ann.shapeType === 'line' || ann.shapeType === 'arrow') {
        page.drawLine({
          start: { x: pdfX, y: pdfY },
          end: { x: pdfX + w, y: pdfY - h },
          thickness: ann.strokeWidth || 2,
          color: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
          opacity: ann.opacity ?? 1,
        });
      } else {
        // Rectangle
        page.drawRectangle({
          x: pdfX,
          y: pdfY - h,
          width: w,
          height: h,
          borderColor: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
          borderWidth: ann.strokeWidth || 2,
          color: fillRgb ? rgb(fillRgb.r, fillRgb.g, fillRgb.b) : undefined,
          opacity: ann.opacity ?? 1,
        });
      }
    } else if (ann.type === 'highlight') {
      const w = ann.width ? (ann.width / 100) * width : 140;
      const h = ann.height ? (ann.height / 100) * height : 22;
      const hlRgb = hexToRgb01(ann.color || '#FFE500');
      page.drawRectangle({
        x: pdfX,
        y: pdfY - h,
        width: w,
        height: h,
        color: rgb(hlRgb.r, hlRgb.g, hlRgb.b),
        opacity: ann.opacity ?? 0.45,
      });
    } else if (ann.type === 'draw' && ann.points && ann.points.length > 1) {
      const strokeRgb = hexToRgb01(ann.color || '#1e293b');
      const thickness = ann.strokeWidth || 2;
      for (let i = 0; i < ann.points.length - 1; i++) {
        const p1 = ann.points[i];
        const p2 = ann.points[i + 1];
        page.drawLine({
          start: { x: (p1.x / 100) * width, y: height - (p1.y / 100) * height },
          end: { x: (p2.x / 100) * width, y: height - (p2.y / 100) * height },
          thickness,
          color: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
          opacity: ann.opacity ?? 1,
        });
      }
    }
  }

  return await pdfDoc.save({ useObjectStreams: true });
}

// LOCK / PROTECT PDF (Genuine RC4-128 password encryption via jsPDF)
export async function lockPDF(file: File, userPassword?: string): Promise<Uint8Array> {
  if (!file) throw new Error('No PDF file provided.');
  const trimmedPassword = (userPassword || '').trim();
  if (!trimmedPassword) {
    throw new Error('Please enter a password to encrypt and lock this PDF.');
  }

  const arrayBuffer = await readFileAsArrayBuffer(file);
  const rawBytes = new Uint8Array(arrayBuffer);
  const loadingTask = pdfjsLib.getDocument({ data: rawBytes.slice(0) });
  let pdf: any = null;

  try {
    pdf = await loadingTask.promise;
    const totalPages = pdf.numPages || 0;
    if (totalPages === 0) {
      throw new Error('The PDF contains no pages.');
    }

    let doc: jsPDF | null = null;

    for (let i = 1; i <= totalPages; i++) {
      let page: any = null;
      let canvas: HTMLCanvasElement | null = null;

      try {
        page = await pdf.getPage(i);
        const baseViewport = page.getViewport({ scale: 1.0 });
        const maxBaseDim = Math.max(baseViewport.width, baseViewport.height, 1);
        const renderScale = Math.max(0.75, Math.min(2.0, 2200 / maxBaseDim));
        const viewport = page.getViewport({ scale: renderScale });

        canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Browser canvas 2D context is unavailable.');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        const imgDataUrl = canvas.toDataURL('image/jpeg', 0.92);

        const orientation = baseViewport.width > baseViewport.height ? 'l' : 'p';
        const format: [number, number] = [baseViewport.width, baseViewport.height];

        if (!doc) {
          doc = new jsPDF({
            unit: 'pt',
            format,
            orientation,
            compress: true,
            encryption: {
              userPassword: trimmedPassword,
              ownerPassword: trimmedPassword,
              userPermissions: ['print'],
            },
          });
        } else {
          doc.addPage(format, orientation);
        }

        doc.addImage(imgDataUrl, 'JPEG', 0, 0, baseViewport.width, baseViewport.height);
      } finally {
        if (page && typeof page.cleanup === 'function') {
          try {
            page.cleanup();
          } catch {
            // ignore
          }
        }
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
          canvas = null;
        }
      }
    }

    if (!doc) {
      throw new Error('Failed to create encrypted PDF document.');
    }

    return new Uint8Array(doc.output('arraybuffer'));
  } catch (err: any) {
    if (err?.name === 'PasswordException') {
      throw new Error('This PDF is already password-protected. Please unlock it first before setting a new password.');
    }
    throw new Error(err?.message || 'Failed to password-protect PDF.');
  } finally {
    if (pdf && typeof pdf.destroy === 'function') {
      try {
        await pdf.destroy();
      } catch {
        // ignore
      }
    }
    if (loadingTask && typeof loadingTask.destroy === 'function') {
      try {
        await loadingTask.destroy();
      } catch {
        // ignore
      }
    }
  }
}

// UNLOCK PDF (Genuine password decryption & restriction removal)
export async function unlockPDF(file: File, password?: string): Promise<Uint8Array> {
  if (!file) throw new Error('No PDF file provided.');
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const rawBytes = new Uint8Array(arrayBuffer);

  // First check if file is not user-password protected (either unencrypted or owner-permission only)
  try {
    const checkDoc = await PDFDocument.load(rawBytes.slice(0), { updateMetadata: false });
    if (!checkDoc.isEncrypted) {
      return await checkDoc.save({ useObjectStreams: true });
    }
  } catch {
    // Document is encrypted — decrypt properly using pdfjs-dist with supplied password
  }

  const loadingTask = pdfjsLib.getDocument({
    data: rawBytes.slice(0),
    password: password || undefined,
  });

  let pdf: any = null;
  try {
    pdf = await loadingTask.promise;
    const totalPages = pdf.numPages || 0;
    if (totalPages === 0) {
      throw new Error('The PDF contains no pages.');
    }

    const outPdf = await PDFDocument.create();
    outPdf.setProducer('PDF Editfy');

    for (let i = 1; i <= totalPages; i++) {
      let page: any = null;
      let canvas: HTMLCanvasElement | null = null;

      try {
        page = await pdf.getPage(i);
        const baseViewport = page.getViewport({ scale: 1.0 });
        const maxBaseDim = Math.max(baseViewport.width, baseViewport.height, 1);
        const renderScale = Math.max(0.75, Math.min(2.0, 2200 / maxBaseDim));
        const viewport = page.getViewport({ scale: renderScale });

        canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Browser canvas 2D context is unavailable.');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        const jpgBuffer = await canvasToJpegBuffer(canvas, 0.94);
        const jpgImage = await outPdf.embedJpg(jpgBuffer);

        const outPage = outPdf.addPage([baseViewport.width, baseViewport.height]);
        outPage.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: baseViewport.width,
          height: baseViewport.height,
        });
      } finally {
        if (page && typeof page.cleanup === 'function') {
          try {
            page.cleanup();
          } catch {
            // ignore
          }
        }
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
          canvas = null;
        }
      }
    }

    return await outPdf.save({ useObjectStreams: true });
  } catch (err: any) {
    if (err?.name === 'PasswordException') {
      if (!password) {
        throw new Error('This PDF requires a password to decrypt. Please enter the document password.');
      }
      throw new Error('Incorrect password. Please verify the password and try again.');
    }
    throw new Error(err?.message || 'Unable to decrypt this PDF file.');
  } finally {
    if (pdf && typeof pdf.destroy === 'function') {
      try {
        await pdf.destroy();
      } catch {
        // ignore
      }
    }
    if (loadingTask && typeof loadingTask.destroy === 'function') {
      try {
        await loadingTask.destroy();
      } catch {
        // ignore
      }
    }
  }
}
