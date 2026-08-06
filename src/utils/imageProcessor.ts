import { readFileAsDataURL } from './pdfProcessor';

export interface ImageResizeOptions {
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number; // 0.1 to 1.0
  rotationAngle?: number; // 0, 90, 180, 270
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function processImage(
  file: File,
  options: ImageResizeOptions
): Promise<{ blob: Blob; width: number; height: number; url: string }> {
  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);

  let origWidth = img.naturalWidth || img.width;
  let origHeight = img.naturalHeight || img.height;

  let targetWidth = options.width || origWidth;
  let targetHeight = options.height || origHeight;

  if (options.maintainAspectRatio && options.width && !options.height) {
    targetHeight = Math.round((options.width / origWidth) * origHeight);
  } else if (options.maintainAspectRatio && options.height && !options.width) {
    targetWidth = Math.round((options.height / origHeight) * origWidth);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const rotation = options.rotationAngle || 0;
  if (rotation === 90 || rotation === 270) {
    canvas.width = targetHeight;
    canvas.height = targetWidth;
  } else {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  ctx.save();
  if (rotation === 90) {
    ctx.translate(canvas.width, 0);
    ctx.rotate((90 * Math.PI) / 180);
  } else if (rotation === 180) {
    ctx.translate(canvas.width, canvas.height);
    ctx.rotate((180 * Math.PI) / 180);
  } else if (rotation === 270) {
    ctx.translate(0, canvas.height);
    ctx.rotate((270 * Math.PI) / 180);
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  ctx.restore();

  const format = options.format || 'jpeg';
  const mimeType = `image/${format}`;
  const quality = options.quality ?? 0.85;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas blob generation failed'));
        const url = URL.createObjectURL(blob);
        resolve({
          blob,
          width: canvas.width,
          height: canvas.height,
          url,
        });
      },
      mimeType,
      quality
    );
  });
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
