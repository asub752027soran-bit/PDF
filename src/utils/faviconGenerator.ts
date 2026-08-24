import JSZip from 'jszip';

export interface FaviconOptions {
  padding: number; // 0 - 30 percentage
  backgroundColor: string; // 'transparent' or hex
  shape: 'square' | 'rounded' | 'circle' | 'squircle';
  siteName: string;
  themeColor: string;
}

export interface GeneratedFaviconAsset {
  fileName: string;
  size: number;
  width: number;
  height: number;
  format: 'png' | 'ico' | 'svg' | 'json' | 'xml';
  label: string;
  purpose: string;
  dataUrl: string;
  blob: Blob;
}

export interface GenerationResult {
  assets: GeneratedFaviconAsset[];
  icoBlob: Blob;
  icoDataUrl: string;
  svgContent: string;
  manifestContent: string;
  browserconfigContent: string;
  htmlSnippet: string;
  zipBlob: Blob;
}

/**
 * Creates an ICO binary file from an array of PNG blobs (e.g. 16x16, 32x32, 48x48)
 */
export async function createIcoFromPngs(pngBlobs: { width: number; height: number; blob: Blob }[]): Promise<Blob> {
  const pngBuffers: { width: number; height: number; buffer: ArrayBuffer }[] = [];
  for (const item of pngBlobs) {
    const buffer = await item.blob.arrayBuffer();
    pngBuffers.push({
      width: item.width,
      height: item.height,
      buffer
    });
  }

  const count = pngBuffers.length;
  // Header: 6 bytes
  // Directory entries: 16 bytes * count
  const dirOffset = 6;
  const headerSize = 6 + 16 * count;

  let totalImageBytes = 0;
  for (const item of pngBuffers) {
    totalImageBytes += item.buffer.byteLength;
  }

  const totalFileSize = headerSize + totalImageBytes;
  const icoBuffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(icoBuffer);

  // ICONHEADER
  view.setUint16(0, 0, true); // Reserved must be 0
  view.setUint16(2, 1, true); // Image type: 1 = ICO
  view.setUint16(4, count, true); // Number of images

  let currentImageOffset = headerSize;

  for (let i = 0; i < count; i++) {
    const item = pngBuffers[i];
    const entryOffset = dirOffset + i * 16;
    const widthByte = item.width >= 256 ? 0 : item.width;
    const heightByte = item.height >= 256 ? 0 : item.height;
    const imageSize = item.buffer.byteLength;

    view.setUint8(entryOffset + 0, widthByte); // Width
    view.setUint8(entryOffset + 1, heightByte); // Height
    view.setUint8(entryOffset + 2, 0); // Color Count (0 for >= 8bpp)
    view.setUint8(entryOffset + 3, 0); // Reserved
    view.setUint16(entryOffset + 4, 1, true); // Color planes
    view.setUint16(entryOffset + 6, 32, true); // Bits per pixel (32bpp RGBA)
    view.setUint32(entryOffset + 8, imageSize, true); // Image size in bytes
    view.setUint32(entryOffset + 12, currentImageOffset, true); // Image offset in file

    // Copy PNG bytes into ICO file
    const targetArray = new Uint8Array(icoBuffer, currentImageOffset, imageSize);
    targetArray.set(new Uint8Array(item.buffer));

    currentImageOffset += imageSize;
  }

  return new Blob([icoBuffer], { type: 'image/x-icon' });
}

/**
 * Renders a source image onto a square canvas with requested dimensions, padding, background, and shape
 */
export function renderIconToCanvas(
  source: CanvasImageSource,
  targetSize: number,
  options: FaviconOptions
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw shaped background if specified
  const { shape, backgroundColor, padding } = options;
  const radiusMap: Record<string, number> = {
    square: 0,
    rounded: targetSize * 0.22,
    squircle: targetSize * 0.35,
    circle: targetSize * 0.5
  };
  const radius = radiusMap[shape] ?? 0;

  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.save();
    ctx.fillStyle = backgroundColor;
    if (radius > 0) {
      ctx.beginPath();
      ctx.roundRect(0, 0, targetSize, targetSize, radius);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, targetSize, targetSize);
    }
    ctx.restore();
  }

  // 2. Apply clip mask if rounded and transparent/clipped
  if (shape !== 'square' && radius > 0) {
    ctx.beginPath();
    ctx.roundRect(0, 0, targetSize, targetSize, radius);
    ctx.clip();
  }

  // 3. Draw source image scaled with padding
  const padPercent = Math.max(0, Math.min(40, padding)) / 100;
  const padPx = targetSize * padPercent;
  const drawSize = targetSize - padPx * 2;

  let sw = 0;
  let sh = 0;
  if ('videoWidth' in source) {
    sw = source.videoWidth;
    sh = source.videoHeight;
  } else if ('naturalWidth' in source) {
    sw = (source as HTMLImageElement).naturalWidth;
    sh = (source as HTMLImageElement).naturalHeight;
  } else if ('width' in source) {
    sw = typeof source.width === 'number' ? source.width : (source.width as SVGAnimatedLength).baseVal.value;
    sh = typeof source.height === 'number' ? source.height : (source.height as SVGAnimatedLength).baseVal.value;
  }

  if (sw <= 0) sw = targetSize;
  if (sh <= 0) sh = targetSize;

  // Center source preserving aspect ratio inside the padded bounds
  const scale = Math.min(drawSize / sw, drawSize / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = padPx + (drawSize - dw) / 2;
  const dy = padPx + (drawSize - dh) / 2;

  ctx.drawImage(source, dx, dy, dw, dh);

  return canvas;
}

/**
 * Creates SVG favicon code with dark/light mode adaptability
 */
export function generateSvgFavicon(
  sourceCanvas: HTMLCanvasElement,
  options: FaviconOptions
): string {
  const dataUrl = sourceCanvas.toDataURL('image/png');
  const bg = options.backgroundColor && options.backgroundColor !== 'transparent' ? options.backgroundColor : 'none';
  const radius = options.shape === 'circle' ? '50%' : options.shape === 'rounded' ? '22%' : '0';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <style>
      :root { color-scheme: light dark; }
      .bg { fill: ${bg}; rx: ${radius}; }
    </style>
  </defs>
  ${bg !== 'none' ? `<rect width="512" height="512" class="bg" />` : ''}
  <image href="${dataUrl}" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>`;
}

/**
 * Generates all multi-size PNGs, ICO binary, SVG, manifests, HTML tags, and ZIP package
 */
export async function generateFaviconPackage(
  sourceImage: CanvasImageSource,
  options: FaviconOptions
): Promise<GenerationResult> {
  const standardSizes = [
    { size: 16, name: 'favicon-16x16.png', label: '16x16 PNG', purpose: 'Standard Desktop Browser Tab' },
    { size: 32, name: 'favicon-32x32.png', label: '32x32 PNG', purpose: 'Retina Browser Tab & Bookmarks' },
    { size: 48, name: 'favicon-48x48.png', label: '48x48 PNG (Google Search Standard)', purpose: 'Google Search Result SERP Favicon' },
    { size: 96, name: 'favicon-96x96.png', label: '96x96 PNG', purpose: 'High-DPI Displays & Desktop Shortcuts' },
    { size: 144, name: 'favicon-144x144.png', label: '144x144 PNG', purpose: 'Windows Tiles & High Density SERP' },
    { size: 180, name: 'apple-touch-icon.png', label: '180x180 Apple Touch Icon', purpose: 'iOS Safari Home Screen & iPad' },
    { size: 192, name: 'icon-192x192.png', label: '192x192 Android PWA Icon', purpose: 'Android Chrome PWA Home Screen' },
    { size: 512, name: 'icon-512x512.png', label: '512x512 High-Res Icon', purpose: 'PWA Splash Screen & Google Knowledge Panel' }
  ];

  const assets: GeneratedFaviconAsset[] = [];
  const icoPngBlobs: { width: number; height: number; blob: Blob }[] = [];

  let canvas512: HTMLCanvasElement | null = null;

  for (const item of standardSizes) {
    const canvas = renderIconToCanvas(sourceImage, item.size, options);
    if (item.size === 512) {
      canvas512 = canvas;
    }

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
    });

    const dataUrl = canvas.toDataURL('image/png');

    assets.push({
      fileName: item.name,
      size: item.size,
      width: item.size,
      height: item.size,
      format: 'png',
      label: item.label,
      purpose: item.purpose,
      dataUrl,
      blob
    });

    // Collect 16, 32, 48 for multi-size .ico
    if (item.size === 16 || item.size === 32 || item.size === 48) {
      icoPngBlobs.push({
        width: item.size,
        height: item.size,
        blob
      });
    }
  }

  // 1. Generate ICO Binary
  const icoBlob = await createIcoFromPngs(icoPngBlobs);
  const icoDataUrl = URL.createObjectURL(icoBlob);
  assets.unshift({
    fileName: 'favicon.ico',
    size: 48,
    width: 48,
    height: 48,
    format: 'ico',
    label: 'favicon.ico (Multi-size 16/32/48)',
    purpose: 'Universal Legacy & Modern Browser Favicon',
    dataUrl: icoDataUrl,
    blob: icoBlob
  });

  // 2. Generate SVG Favicon
  const fallbackCanvas = canvas512 || renderIconToCanvas(sourceImage, 512, options);
  const svgContent = generateSvgFavicon(fallbackCanvas, options);
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
  const svgDataUrl = URL.createObjectURL(svgBlob);
  assets.push({
    fileName: 'favicon.svg',
    size: 512,
    width: 512,
    height: 512,
    format: 'svg',
    label: 'favicon.svg (Vector Favicon)',
    purpose: 'Modern Vector Browser Icon (Scalable)',
    dataUrl: svgDataUrl,
    blob: svgBlob
  });

  // 3. Generate Web App Manifest
  const manifestData = {
    name: options.siteName || 'My Website',
    short_name: options.siteName || 'Website',
    description: `${options.siteName || 'Website'} Web App`,
    start_url: '/',
    display: 'standalone',
    background_color: options.backgroundColor === 'transparent' ? '#ffffff' : options.backgroundColor,
    theme_color: options.themeColor || '#2563eb',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  };
  const manifestContent = JSON.stringify(manifestData, null, 2);

  // 4. Generate browserconfig.xml
  const browserconfigContent = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/favicon-144x144.png"/>
      <TileColor>${options.themeColor || '#2563eb'}</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;

  // 5. Generate HTML Snippet
  const htmlSnippet = `<!-- Favicons for Google Search, Desktop & Mobile Browsers -->
<link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" href="/favicon.ico" sizes="48x48 32x32 16x16" />
<link rel="shortcut icon" href="/favicon.ico" />

<!-- Apple Touch Icon for iOS Safari & macOS -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

<!-- Web App Manifest for Android Chrome PWA -->
<link rel="manifest" href="/manifest.webmanifest" />

<!-- Windows Tile Configuration -->
<meta name="msapplication-TileColor" content="${options.themeColor || '#2563eb'}" />
<meta name="msapplication-TileImage" content="/favicon-144x144.png" />
<meta name="theme-color" content="${options.themeColor || '#2563eb'}" />`;

  // 6. Build Complete ZIP Archive
  const zip = new JSZip();
  for (const asset of assets) {
    zip.file(asset.fileName, asset.blob);
  }
  zip.file('manifest.webmanifest', manifestContent);
  zip.file('browserconfig.xml', browserconfigContent);
  zip.file('html-snippet.html', htmlSnippet);
  zip.file(
    'README.txt',
    `PDF Editfy Favicon & SEO Icon Package
======================================
1. Extract and upload all image files, manifest.webmanifest, and browserconfig.xml to your website's root directory (or /public folder in React/Next.js/Vite).
2. Paste the code from html-snippet.html inside the <head> section of your index.html / layout.tsx / header.php.
3. Open Google Search Console -> URL Inspection -> Enter your homepage URL -> Click "Request Indexing" to refresh your favicon in Google search results.`
  );

  const zipBlob = await zip.generateAsync({ type: 'blob' });

  return {
    assets,
    icoBlob,
    icoDataUrl,
    svgContent,
    manifestContent,
    browserconfigContent,
    htmlSnippet,
    zipBlob
  };
}
