import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { extractDocxHtml } from './docProcessor';

// Configure pdfjs worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
}

export interface PreviewMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  extension: string;
  lastModified?: number;
  // Dimensions or pages
  width?: number;
  height?: number;
  aspectRatio?: number;
  pageCount?: number;
  currentPage?: number;
  // Visual URL
  thumbnailUrl?: string;
  previewType: 'image' | 'pdf' | 'docx' | 'text' | 'generic';
  htmlPreview?: string;
  textSnippet?: string;
  error?: string;
}

// In-memory preview cache to avoid redundant expensive canvas operations
const previewCache = new Map<string, PreviewMetadata>();

/**
 * Generates visual metadata and thumbnail for any uploaded file (Image, PDF, Docx, Text, etc.)
 */
export async function generateFilePreview(
  file: File,
  pageNumber: number = 1
): Promise<PreviewMetadata> {
  const cacheKey = `${file.name}_${file.size}_${file.lastModified}_${pageNumber}`;
  if (previewCache.has(cacheKey)) {
    return previewCache.get(cacheKey)!;
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext);
  const isPdf = file.type === 'application/pdf' || ext === 'pdf';
  const isDocx = ext === 'docx' || ext === 'doc' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isText = file.type.startsWith('text/') || ['txt', 'csv', 'json', 'md', 'xml'].includes(ext);

  const baseMeta: PreviewMetadata = {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || `application/${ext}`,
    extension: ext.toUpperCase(),
    lastModified: file.lastModified,
    previewType: isImage ? 'image' : isPdf ? 'pdf' : isDocx ? 'docx' : isText ? 'text' : 'generic',
    currentPage: 1,
    pageCount: 1,
  };

  try {
    if (isImage) {
      // 1. IMAGE PREVIEW
      const objectUrl = URL.createObjectURL(file);
      const imgDims = await getImageDimensionsFromUrl(objectUrl);
      
      const result: PreviewMetadata = {
        ...baseMeta,
        thumbnailUrl: objectUrl,
        width: imgDims.width,
        height: imgDims.height,
        aspectRatio: imgDims.width && imgDims.height ? imgDims.width / imgDims.height : 1,
      };

      previewCache.set(cacheKey, result);
      return result;
    } else if (isPdf) {
      // 2. PDF PREVIEW
      const pdfMeta = await renderPdfPagePreview(file, pageNumber);
      const result: PreviewMetadata = {
        ...baseMeta,
        thumbnailUrl: pdfMeta.dataUrl,
        pageCount: pdfMeta.totalPages,
        currentPage: pageNumber,
        width: pdfMeta.width,
        height: pdfMeta.height,
        aspectRatio: pdfMeta.width && pdfMeta.height ? pdfMeta.width / pdfMeta.height : 1,
      };

      previewCache.set(cacheKey, result);
      return result;
    } else if (isDocx) {
      // 3. DOCX PREVIEW
      try {
        const docxResult = await extractDocxHtml(file);
        const snippet = docxResult.text.slice(0, 300);
        const result: PreviewMetadata = {
          ...baseMeta,
          htmlPreview: docxResult.html,
          textSnippet: snippet,
        };
        previewCache.set(cacheKey, result);
        return result;
      } catch (docErr) {
        return {
          ...baseMeta,
          error: 'DOCX preview limited',
        };
      }
    } else if (isText) {
      // 4. TEXT PREVIEW
      const textContent = await file.text();
      const result: PreviewMetadata = {
        ...baseMeta,
        textSnippet: textContent.slice(0, 500),
      };
      previewCache.set(cacheKey, result);
      return result;
    }

    return baseMeta;
  } catch (err: any) {
    console.warn('Preview generation warning:', err);
    return {
      ...baseMeta,
      error: err?.message || 'Could not generate visual preview',
    };
  }
}

/**
 * Loads image dimensions from an Object URL
 */
function getImageDimensionsFromUrl(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}

/**
 * Renders a specific PDF page to a canvas and returns image DataURL, total page count, and dimensions
 */
export async function renderPdfPagePreview(
  file: File,
  pageNumber: number = 1,
  targetScale: number = 1.2
): Promise<{ dataUrl: string; totalPages: number; width: number; height: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Fallback page count using pdf-lib if pdfjs encounters worker limitations
    let totalPages = 1;
    try {
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      totalPages = pdfDoc.getPageCount();
    } catch {
      // Ignore fallback error
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    totalPages = pdf.numPages || totalPages;

    const clampedPage = Math.min(Math.max(1, pageNumber), totalPages);
    const page = await pdf.getPage(clampedPage);
    const viewport = page.getViewport({ scale: targetScale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    // Fill white background for PDF page rendering
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    return {
      dataUrl,
      totalPages,
      width: viewport.width,
      height: viewport.height,
    };
  } catch (pdfErr) {
    console.error('PDF rendering failed in pdfjs-dist:', pdfErr);
    throw pdfErr;
  }
}

/**
 * Formats file size in readable units (KB, MB, GB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
