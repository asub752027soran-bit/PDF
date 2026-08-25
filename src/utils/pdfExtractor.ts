import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Initialize pdfjs worker safely
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfWorker || `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
}

export interface PDFPageText {
  pageNumber: number;
  text: string;
}

export interface PDFPageImage {
  pageNumber: number;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Extract plain text from each page of a PDF document with strict resource cleanup
 */
export async function extractTextFromPDF(file: File): Promise<PDFPageText[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  let pdf: any = null;

  try {
    pdf = await loadingTask.promise;
    const results: PDFPageText[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      let page: any = null;
      try {
        page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Group text items into lines based on Y coordinates
        const linesMap = new Map<number, string[]>();
        
        for (const item of textContent.items) {
          if ('str' in item && item.str.trim()) {
            const y = Math.round(item.transform[5]); // Y translation
            if (!linesMap.has(y)) {
              linesMap.set(y, []);
            }
            linesMap.get(y)!.push(item.str);
          }
        }

        // Sort lines from top to bottom (descending Y)
        const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);
        const pageText = sortedY.map((y) => linesMap.get(y)!.join(' ')).join('\n');

        results.push({
          pageNumber: i,
          text: pageText || `[Page ${i} - No extractable text]`,
        });
      } finally {
        if (page && typeof page.cleanup === 'function') {
          try {
            page.cleanup();
          } catch {
            // ignore
          }
        }
      }
    }

    return results;
  } catch (err: any) {
    console.error('Failed to extract text from PDF:', err);
    throw new Error(err?.message || 'Could not parse text from this PDF file.');
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

/**
 * Render PDF pages into high quality images (PNG or JPEG) with GPU memory freeing
 */
export async function renderPDFToImages(
  file: File,
  format: 'png' | 'jpeg' = 'png',
  scale: number = 2.0
): Promise<PDFPageImage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  let pdf: any = null;
  const images: PDFPageImage[] = [];

  try {
    pdf = await loadingTask.promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      let page: any = null;
      let canvas: HTMLCanvasElement | null = null;

      try {
        page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) continue;

        // Fill background white to avoid dark transparent PDF background issues
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const blob = await new Promise<Blob>((resolve) => {
          canvas!.toBlob((b) => resolve(b || new Blob()), mimeType, 0.92);
        });

        const dataUrl = canvas.toDataURL(mimeType, 0.92);

        images.push({
          pageNumber: i,
          blob,
          dataUrl,
          width: viewport.width,
          height: viewport.height,
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
        }
      }
    }

    return images;
  } catch (err: any) {
    console.error('Failed to render PDF to images:', err);
    throw new Error(err?.message || 'Failed to render PDF pages into images.');
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

/**
 * Extract tabular data from PDF into rows & columns for Excel export
 */
export async function extractTablesFromPDF(file: File): Promise<(string | number)[][][]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  let pdf: any = null;
  const pagesData: (string | number)[][][] = [];

  try {
    pdf = await loadingTask.promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      let page: any = null;
      try {
        page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Group text items by Y coordinate (rows)
        const rowsMap = new Map<number, { x: number; text: string }[]>();

        for (const item of textContent.items) {
          if ('str' in item) {
            const text = item.str.trim();
            if (!text) continue;

            const x = Math.round(item.transform[4]);
            const y = Math.round(item.transform[5]);

            // Find existing row within 4px Y tolerance
            let foundY = Array.from(rowsMap.keys()).find((existingY) => Math.abs(existingY - y) <= 4);
            if (foundY === undefined) {
              foundY = y;
              rowsMap.set(foundY, []);
            }

            rowsMap.get(foundY)!.push({ x, text });
          }
        }

        // Sort rows top-to-bottom and cells left-to-right
        const sortedY = Array.from(rowsMap.keys()).sort((a, b) => b - a);
        const pageRows: (string | number)[][] = [];

        for (const y of sortedY) {
          const rowItems = rowsMap.get(y)!.sort((a, b) => a.x - b.x);
          const rowCells = rowItems.map((item) => {
            // Try parsing numbers if applicable
            const clean = item.text.replace(/[\$,]/g, '');
            if (clean && !isNaN(Number(clean))) {
              return Number(clean);
            }
            return item.text;
          });
          if (rowCells.length > 0) {
            pageRows.push(rowCells);
          }
        }

        pagesData.push(pageRows.length > 0 ? pageRows : [['Page', i], ['No table data found']]);
      } finally {
        if (page && typeof page.cleanup === 'function') {
          try {
            page.cleanup();
          } catch {
            // ignore
          }
        }
      }
    }

    return pagesData;
  } catch (err: any) {
    console.error('Failed to extract tables from PDF:', err);
    throw new Error(err?.message || 'Could not parse tabular data from this PDF file.');
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
