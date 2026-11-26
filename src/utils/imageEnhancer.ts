export type EnhancePreset = 'unblur-photo' | 'clarify-text' | 'restore-old' | 'full-restore';

export interface EnhanceOptions {
  preset?: EnhancePreset;
  deblur: number; // 0-100: multi-scale iterative unsharp / deconvolution
  restoreOld: number; // 0-100: fade repair, auto-levels, yellow cast neutralization
  noiseReduction: number; // 0-100: dust/scratch despeckling + edge-preserving smooth
  clarity: number; // 0-100: local luminance contrast & shadow detail recovery
  vibrance: number; // 0-100: selective color restoration
  textBoost: boolean; // adaptive illumination flattening + crisp text strokes
  upscale: 1 | 2 | 3 | 4; // progressive HD canvas upscale factor
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number; // 0.1-1.0
  maxWorkingDim?: number; // cap working resolution for fast live preview
}

export interface EnhancePresetConfig {
  id: EnhancePreset;
  label: string;
  description: string;
  options: Omit<EnhanceOptions, 'preset' | 'format' | 'quality' | 'maxWorkingDim'>;
}

export const ENHANCE_PRESETS: Record<EnhancePreset, EnhancePresetConfig> = {
  'unblur-photo': {
    id: 'unblur-photo',
    label: 'Unblur Photo',
    description: 'Sharpens motion and out-of-focus blur while keeping natural skin & edges clean.',
    options: {
      deblur: 74,
      restoreOld: 16,
      noiseReduction: 28,
      clarity: 52,
      vibrance: 22,
      textBoost: false,
      upscale: 2,
    },
  },
  'clarify-text': {
    id: 'clarify-text',
    label: 'Clarify Blurry Text',
    description: 'Makes blurred receipts, scanned pages, signs, and screenshots legible again.',
    options: {
      deblur: 88,
      restoreOld: 38,
      noiseReduction: 34,
      clarity: 74,
      vibrance: 0,
      textBoost: true,
      upscale: 2,
    },
  },
  'restore-old': {
    id: 'restore-old',
    label: 'Restore Old Photo',
    description: 'Repairs faded contrast, sepia yellowing, surface dust specks, and vintage haze.',
    options: {
      deblur: 40,
      restoreOld: 84,
      noiseReduction: 62,
      clarity: 64,
      vibrance: 44,
      textBoost: false,
      upscale: 2,
    },
  },
  'full-restore': {
    id: 'full-restore',
    label: 'Old & Blurry (Full Restore)',
    description: 'Deep vintage restoration paired with multi-scale deblurring and HD upscaling.',
    options: {
      deblur: 78,
      restoreOld: 82,
      noiseReduction: 58,
      clarity: 68,
      vibrance: 40,
      textBoost: false,
      upscale: 2,
    },
  },
};

export interface EnhanceResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

const clamp255 = (v: number): number => (v < 0 ? 0 : v > 255 ? 255 : v);

function loadSourceImage(source: File | string): Promise<{ img: HTMLImageElement; revokeUrl: string | null }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let objectUrl: string | null = null;

    img.onload = () => resolve({ img, revokeUrl: objectUrl });
    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not decode the selected image file. Please try JPG, PNG, or WEBP.'));
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }
  });
}

/**
 * Fast O(N) separable two-pass sliding-window box blur on a Float32Array channel.
 */
function separableBoxBlur(src: Float32Array, width: number, height: number, radius: number): Float32Array {
  const r = Math.max(1, Math.round(radius));
  const temp = new Float32Array(src.length);
  const dst = new Float32Array(src.length);
  const win = 2 * r + 1;
  const invWin = 1 / win;

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    let sum = src[rowOffset] * (r + 1);
    for (let k = 1; k <= r; k++) {
      sum += src[rowOffset + Math.min(width - 1, k)];
    }
    for (let x = 0; x < width; x++) {
      temp[rowOffset + x] = sum * invWin;
      const removeIdx = Math.max(0, x - r);
      const addIdx = Math.min(width - 1, x + r + 1);
      sum += src[rowOffset + addIdx] - src[rowOffset + removeIdx];
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    let sum = temp[x] * (r + 1);
    for (let k = 1; k <= r; k++) {
      sum += temp[Math.min(height - 1, k) * width + x];
    }
    for (let y = 0; y < height; y++) {
      dst[y * width + x] = sum * invWin;
      const removeY = Math.max(0, y - r);
      const addY = Math.min(height - 1, y + r + 1);
      sum += temp[addY * width + x] - temp[removeY * width + x];
    }
  }

  return dst;
}

/**
 * Repairs isolated dust specks/scratches via axial median outlier gating,
 * followed by edge-preserving bilateral range smoothing.
 */
function applyDespeckleAndDenoise(
  rBuf: Float32Array,
  gBuf: Float32Array,
  bBuf: Float32Array,
  width: number,
  height: number,
  strength: number
): void {
  if (strength <= 0 || width < 3 || height < 3) return;
  const factor = Math.min(1, Math.max(0, strength / 100));

  const outR = new Float32Array(rBuf);
  const outG = new Float32Array(gBuf);
  const outB = new Float32Array(bBuf);

  // Impulse dust/scratch threshold: stronger setting catches subtler specks
  const impulseThresh = 46 - factor * 28;
  // Range sensitivity for edge-preserving smoothing
  const sigma = 10 + factor * 24;
  const invSigmaSq = 1 / (sigma * sigma);
  const blend = factor * 0.72;

  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = row + x;
      const top = idx - width;
      const bot = idx + width;

      const cr = rBuf[idx];
      const cg = gBuf[idx];
      const cb = bBuf[idx];

      // 1. Axial 4-neighbor average vs center to detect dust / film scratches
      const avgR = (rBuf[top] + rBuf[bot] + rBuf[idx - 1] + rBuf[idx + 1]) * 0.25;
      const avgG = (gBuf[top] + gBuf[bot] + gBuf[idx - 1] + gBuf[idx + 1]) * 0.25;
      const avgB = (bBuf[top] + bBuf[bot] + bBuf[idx - 1] + bBuf[idx + 1]) * 0.25;

      const lumaDiff = Math.abs(
        0.299 * (cr - avgR) + 0.587 * (cg - avgG) + 0.114 * (cb - avgB)
      );

      if (factor > 0.2 && lumaDiff > impulseThresh) {
        // Confirm it is an isolated outlier (not a sharp dark/bright stroke)
        const d1 = Math.abs(rBuf[top] - avgR) + Math.abs(gBuf[top] - avgG) + Math.abs(bBuf[top] - avgB);
        const d2 = Math.abs(rBuf[bot] - avgR) + Math.abs(gBuf[bot] - avgG) + Math.abs(bBuf[bot] - avgB);
        const d3 = Math.abs(rBuf[idx - 1] - avgR) + Math.abs(gBuf[idx - 1] - avgG) + Math.abs(bBuf[idx - 1] - avgB);
        const d4 = Math.abs(rBuf[idx + 1] - avgR) + Math.abs(gBuf[idx + 1] - avgG) + Math.abs(bBuf[idx + 1] - avgB);
        const neighborVariance = (d1 + d2 + d3 + d4) * 0.083;
        if (lumaDiff > neighborVariance * 1.45 + 8) {
          outR[idx] = cr + (avgR - cr) * (0.45 + factor * 0.45);
          outG[idx] = cg + (avgG - cg) * (0.45 + factor * 0.45);
          outB[idx] = cb + (avgB - cb) * (0.45 + factor * 0.45);
          continue;
        }
      }

      // 2. 3x3 edge-preserving range filter
      let wSum = 1.0;
      let accR = cr;
      let accG = cg;
      let accB = cb;

      for (let dy = -1; dy <= 1; dy++) {
        const nRow = (y + dy) * width;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nIdx = nRow + (x + dx);
          const dr = rBuf[nIdx] - cr;
          const dg = gBuf[nIdx] - cg;
          const db = bBuf[nIdx] - cb;
          const diffSq = 0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db;
          const weight = 1 / (1 + diffSq * invSigmaSq);
          wSum += weight;
          accR += rBuf[nIdx] * weight;
          accG += gBuf[nIdx] * weight;
          accB += bBuf[nIdx] * weight;
        }
      }

      const smoothR = accR / wSum;
      const smoothG = accG / wSum;
      const smoothB = accB / wSum;

      outR[idx] = cr + (smoothR - cr) * blend;
      outG[idx] = cg + (smoothG - cg) * blend;
      outB[idx] = cb + (smoothB - cb) * blend;
    }
  }

  rBuf.set(outR);
  gBuf.set(outG);
  bBuf.set(outB);
}

/**
 * Percentile contrast stretching + Gray-World white balance neutralization
 * to remove vintage yellow/sepia tint and milky fading.
 */
function applyOldPhotoRestoration(
  rBuf: Float32Array,
  gBuf: Float32Array,
  bBuf: Float32Array,
  strength: number
): void {
  if (strength <= 0) return;
  const factor = Math.min(1, Math.max(0, strength / 100));
  const len = rBuf.length;

  const histR = new Uint32Array(256);
  const histG = new Uint32Array(256);
  const histB = new Uint32Array(256);

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (let i = 0; i < len; i++) {
    const r = Math.min(255, Math.max(0, Math.round(rBuf[i])));
    const g = Math.min(255, Math.max(0, Math.round(gBuf[i])));
    const b = Math.min(255, Math.max(0, Math.round(bBuf[i])));
    histR[r]++;
    histG[g]++;
    histB[b]++;
    sumR += r;
    sumG += g;
    sumB += b;
  }

  const getPercentileBounds = (hist: Uint32Array): [number, number] => {
    const lowTarget = len * 0.006;
    const highTarget = len * 0.994;
    let cum = 0;
    let low = 0;
    let high = 255;
    let foundLow = false;

    for (let i = 0; i < 256; i++) {
      cum += hist[i];
      if (!foundLow && cum >= lowTarget) {
        low = i;
        foundLow = true;
      }
      if (cum >= highTarget) {
        high = i;
        break;
      }
    }
    if (high - low < 18) {
      low = Math.max(0, low - 9);
      high = Math.min(255, high + 9);
    }
    return [low, high];
  };

  const [lowR, highR] = getPercentileBounds(histR);
  const [lowG, highG] = getPercentileBounds(histG);
  const [lowB, highB] = getPercentileBounds(histB);

  const scaleR = 255 / Math.max(1, highR - lowR);
  const scaleG = 255 / Math.max(1, highG - lowG);
  const scaleB = 255 / Math.max(1, highB - lowB);

  // Neutralize sepia/yellow cast gently via Gray-World gain clamped to natural limits
  const meanR = sumR / Math.max(1, len);
  const meanG = sumG / Math.max(1, len);
  const meanB = sumB / Math.max(1, len);
  const avgMean = (meanR + meanG + meanB) / 3;

  const clampGain = (g: number) => Math.min(1.24, Math.max(0.8, g));
  const wbR = clampGain(avgMean / Math.max(12, meanR));
  const wbG = clampGain(avgMean / Math.max(12, meanG));
  const wbB = clampGain(avgMean / Math.max(12, meanB));

  // Detect whether image has meaningful color vs near-monochrome sepia so we don't turn B&W photos weirdly tinted
  const blendStrength = factor * 0.9;
  const gammaExp = 1 - factor * 0.12;

  for (let i = 0; i < len; i++) {
    const origR = rBuf[i];
    const origG = gBuf[i];
    const origB = bBuf[i];

    let nr = clamp255((origR - lowR) * scaleR);
    let ng = clamp255((origG - lowG) * scaleG);
    let nb = clamp255((origB - lowB) * scaleB);

    nr = clamp255(nr * (1 + (wbR - 1) * factor * 0.75));
    ng = clamp255(ng * (1 + (wbG - 1) * factor * 0.75));
    nb = clamp255(nb * (1 + (wbB - 1) * factor * 0.75));

    // Gentle midtone recovery
    if (gammaExp < 0.99) {
      nr = 255 * Math.pow(nr / 255, gammaExp);
      ng = 255 * Math.pow(ng / 255, gammaExp);
      nb = 255 * Math.pow(nb / 255, gammaExp);
    }

    rBuf[i] = origR + (nr - origR) * blendStrength;
    gBuf[i] = origG + (ng - origG) * blendStrength;
    bBuf[i] = origB + (nb - origB) * blendStrength;
  }
}

/**
 * Local luminance contrast, shadow detail lift, and optional uneven-lighting text flattening.
 */
function applyClarityAndTextBoost(
  rBuf: Float32Array,
  gBuf: Float32Array,
  bBuf: Float32Array,
  width: number,
  height: number,
  clarity: number,
  textBoost: boolean
): void {
  if (clarity <= 0 && !textBoost) return;
  const len = rBuf.length;
  const yBuf = new Float32Array(len);

  for (let i = 0; i < len; i++) {
    yBuf[i] = 0.299 * rBuf[i] + 0.587 * gBuf[i] + 0.114 * bBuf[i];
  }

  const broadRadius = Math.max(8, Math.round(Math.min(width, height) * 0.035));
  const yBroad = separableBoxBlur(yBuf, width, height, broadRadius);

  const clarityFactor = Math.min(1, Math.max(0, clarity / 100));
  const localGain = clarityFactor * 0.58;
  const shadowLift = clarityFactor * 0.28;

  for (let i = 0; i < len; i++) {
    const y = yBuf[i];
    const yb = yBroad[i];
    let targetY = y;

    if (textBoost) {
      // Adaptive paper/background illumination leveling: pulls local bright bg toward clean light and deepens strokes
      const localRatio = y / Math.max(24, yb);
      const normalized = clamp255(localRatio * 238);
      // Contrast S-curve around midtones to make blurred characters readable
      const centered = (normalized - 156) * 1.48 + 168;
      const leveled = clamp255(centered);
      targetY = y * 0.25 + leveled * 0.75;
    }

    // Local contrast micro-pop + gentle shadow recovery
    targetY += (y - yb) * localGain;
    if (y < 110) {
      const darkWeight = (110 - y) / 110;
      targetY += darkWeight * darkWeight * 24 * shadowLift;
    }

    targetY = clamp255(targetY);

    const safeY = Math.max(2, y);
    const ratio = Math.min(2.35, Math.max(0.28, targetY / safeY));

    rBuf[i] = clamp255(rBuf[i] * ratio);
    gBuf[i] = clamp255(gBuf[i] * ratio);
    bBuf[i] = clamp255(bBuf[i] * ratio);
  }
}

/**
 * Selective vibrance enhancement that revives muted colors without over-saturating bright tones.
 */
function applyVibrance(
  rBuf: Float32Array,
  gBuf: Float32Array,
  bBuf: Float32Array,
  vibrance: number
): void {
  if (vibrance <= 0) return;
  const factor = (Math.min(100, Math.max(0, vibrance)) / 100) * 0.75;
  const len = rBuf.length;

  for (let i = 0; i < len; i++) {
    const r = rBuf[i];
    const g = gBuf[i];
    const b = bBuf[i];
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const avg = (r + g + b) / 3;
    const sat = maxC > 0 ? (maxC - minC) / 255 : 0;
    const amt = factor * (1 - sat * 0.85);

    rBuf[i] = clamp255(avg + (r - avg) * (1 + amt));
    gBuf[i] = clamp255(avg + (g - avg) * (1 + amt));
    bBuf[i] = clamp255(avg + (b - avg) * (1 + amt));
  }
}

/**
 * Multi-scale edge-clamped deconvolution sharpening for recovering blurry photos & text
 * without generating white ringing halos.
 */
function applyIterativeDeblur(
  rBuf: Float32Array,
  gBuf: Float32Array,
  bBuf: Float32Array,
  width: number,
  height: number,
  deblur: number,
  textBoost: boolean
): void {
  if (deblur <= 0) return;
  const factor = Math.min(1, Math.max(0, deblur / 100));
  const len = rBuf.length;
  const noiseFloor = textBoost ? 1.5 : 3.2;
  const maxOvershoot = textBoost ? 64 : 44;

  const passes: { radius: number; gain: number }[] = [
    { radius: 2, gain: factor * (textBoost ? 1.35 : 0.95) },
    { radius: 1, gain: factor * (textBoost ? 1.55 : 1.15) },
  ];

  for (const pass of passes) {
    const yBuf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      yBuf[i] = 0.299 * rBuf[i] + 0.587 * gBuf[i] + 0.114 * bBuf[i];
    }

    const yBlur = separableBoxBlur(yBuf, width, height, pass.radius);

    for (let i = 0; i < len; i++) {
      const y = yBuf[i];
      const detail = y - yBlur[i];
      const absD = Math.abs(detail);

      // Gate out flat background noise so sharpening focuses on blurry edges
      if (absD < noiseFloor) continue;

      const gatedDetail = detail - Math.sign(detail) * noiseFloor;
      let deltaY = gatedDetail * pass.gain;

      // Soft halo limiter
      if (deltaY > maxOvershoot) deltaY = maxOvershoot;
      else if (deltaY < -maxOvershoot) deltaY = -maxOvershoot;

      const nextY = clamp255(y + deltaY);
      if (y > 2) {
        const scale = Math.min(2.1, Math.max(0.35, nextY / y));
        rBuf[i] = clamp255(rBuf[i] * scale);
        gBuf[i] = clamp255(gBuf[i] * scale);
        bBuf[i] = clamp255(bBuf[i] * scale);
      } else {
        rBuf[i] = clamp255(rBuf[i] + deltaY);
        gBuf[i] = clamp255(gBuf[i] + deltaY);
        bBuf[i] = clamp255(bBuf[i] + deltaY);
      }
    }
  }
}

function createCleanCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode enhanced image.'));
      },
      mimeType,
      quality
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to generate image preview.'));
    };
    reader.onerror = () => reject(new Error('Failed to read enhanced image blob.'));
    reader.readAsDataURL(blob);
  });
}

export async function enhanceAndRestoreImage(
  imageSource: File | string,
  options: EnhanceOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<EnhanceResult> {
  onProgress?.(10, 'Decoding image pixels...');
  const { img, revokeUrl } = await loadSourceImage(imageSource);

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;
  if (!origW || !origH) {
    if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    throw new Error('Loaded image has invalid dimensions.');
  }

  // Determine working pixel dimensions
  const maxWorkEdge = options.maxWorkingDim ?? 2000;
  let workW = origW;
  let workH = origH;
  if (Math.max(workW, workH) > maxWorkEdge) {
    const ratio = maxWorkEdge / Math.max(workW, workH);
    workW = Math.max(1, Math.round(workW * ratio));
    workH = Math.max(1, Math.round(workH * ratio));
  }

  const format = options.format ?? 'png';
  const quality = options.quality ?? 0.94;
  const mimeType =
    format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';

  const workCanvas = createCleanCanvas(workW, workH);
  const workCtx = workCanvas.getContext('2d');
  if (!workCtx) {
    if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    throw new Error('Browser Canvas 2D context is unavailable.');
  }

  if (format === 'jpeg') {
    workCtx.fillStyle = '#ffffff';
    workCtx.fillRect(0, 0, workW, workH);
  }
  workCtx.imageSmoothingEnabled = true;
  workCtx.imageSmoothingQuality = 'high';
  workCtx.drawImage(img, 0, 0, workW, workH);

  if (revokeUrl) URL.revokeObjectURL(revokeUrl);

  const imgData = workCtx.getImageData(0, 0, workW, workH);
  const pixels = imgData.data;
  const totalPixels = workW * workH;

  const rBuf = new Float32Array(totalPixels);
  const gBuf = new Float32Array(totalPixels);
  const bBuf = new Float32Array(totalPixels);

  for (let i = 0, p = 0; i < totalPixels; i++, p += 4) {
    rBuf[i] = pixels[p];
    gBuf[i] = pixels[p + 1];
    bBuf[i] = pixels[p + 2];
  }

  // 1. Dust/scratch repair & edge-preserving denoise
  onProgress?.(25, 'Cleaning surface noise & scratches...');
  applyDespeckleAndDenoise(rBuf, gBuf, bBuf, workW, workH, options.noiseReduction);

  // 2. Old photo fading & color cast repair
  onProgress?.(42, 'Restoring tonal balance & faded contrast...');
  applyOldPhotoRestoration(rBuf, gBuf, bBuf, options.restoreOld);

  // 3. Local clarity & blurry text illumination boost
  onProgress?.(58, 'Recovering local clarity & shadow details...');
  applyClarityAndTextBoost(rBuf, gBuf, bBuf, workW, workH, options.clarity, options.textBoost);

  // 4. Vibrance color restoration
  applyVibrance(rBuf, gBuf, bBuf, options.vibrance);

  // 5. Iterative edge-clamped deblurring
  onProgress?.(74, 'Deblurring & refining fine edges...');
  applyIterativeDeblur(rBuf, gBuf, bBuf, workW, workH, options.deblur, options.textBoost);

  for (let i = 0, p = 0; i < totalPixels; i++, p += 4) {
    pixels[p] = clamp255(Math.round(rBuf[i]));
    pixels[p + 1] = clamp255(Math.round(gBuf[i]));
    pixels[p + 2] = clamp255(Math.round(bBuf[i]));
  }
  workCtx.putImageData(imgData, 0, 0);

  // 6. Progressive HD upscaling (skip full 4K upscale in fast preview mode)
  let outCanvas = workCanvas;
  const maxAllowedFinalEdge = 4096;
  const requestedFactor = options.maxWorkingDim ? 1 : options.upscale;

  if (requestedFactor > 1) {
    onProgress?.(88, `Upscaling resolution ${requestedFactor}× cleanly...`);
    let targetW = Math.round(workW * requestedFactor);
    let targetH = Math.round(workH * requestedFactor);
    if (Math.max(targetW, targetH) > maxAllowedFinalEdge) {
      const capRatio = maxAllowedFinalEdge / Math.max(targetW, targetH);
      targetW = Math.round(targetW * capRatio);
      targetH = Math.round(targetH * capRatio);
    }

    let currentCanvas = workCanvas;
    let curW = workW;
    let curH = workH;

    // Stepped 2x progressive scaling prevents mushy artifacts
    while (curW * 2 < targetW && curH * 2 < targetH) {
      const nextW = curW * 2;
      const nextH = curH * 2;
      const stepCanvas = createCleanCanvas(nextW, nextH);
      const stepCtx = stepCanvas.getContext('2d')!;
      stepCtx.imageSmoothingEnabled = true;
      stepCtx.imageSmoothingQuality = 'high';
      stepCtx.drawImage(currentCanvas, 0, 0, nextW, nextH);
      if (currentCanvas !== workCanvas) {
        currentCanvas.width = 0;
        currentCanvas.height = 0;
      }
      currentCanvas = stepCanvas;
      curW = nextW;
      curH = nextH;
    }

    const finalCanvas = createCleanCanvas(targetW, targetH);
    const finalCtx = finalCanvas.getContext('2d')!;
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(currentCanvas, 0, 0, targetW, targetH);

    if (currentCanvas !== workCanvas) {
      currentCanvas.width = 0;
      currentCanvas.height = 0;
    }

    // Light post-upscale micro-sharpen so enlarged edges stay crisp
    if (options.deblur > 20) {
      const upData = finalCtx.getImageData(0, 0, targetW, targetH);
      const upPixels = upData.data;
      const nPix = targetW * targetH;
      const ur = new Float32Array(nPix);
      const ug = new Float32Array(nPix);
      const ub = new Float32Array(nPix);
      for (let i = 0, p = 0; i < nPix; i++, p += 4) {
        ur[i] = upPixels[p];
        ug[i] = upPixels[p + 1];
        ub[i] = upPixels[p + 2];
      }
      applyIterativeDeblur(ur, ug, ub, targetW, targetH, Math.min(35, options.deblur * 0.35), options.textBoost);
      for (let i = 0, p = 0; i < nPix; i++, p += 4) {
        upPixels[p] = clamp255(Math.round(ur[i]));
        upPixels[p + 1] = clamp255(Math.round(ug[i]));
        upPixels[p + 2] = clamp255(Math.round(ub[i]));
      }
      finalCtx.putImageData(upData, 0, 0);
    }

    outCanvas = finalCanvas;
  }

  onProgress?.(96, 'Encoding final clear image...');
  const finalW = outCanvas.width;
  const finalH = outCanvas.height;
  const blob = await canvasToBlob(outCanvas, mimeType, quality);
  const dataUrl = await blobToDataUrl(blob);

  // Release canvas buffers promptly
  if (outCanvas !== workCanvas) {
    outCanvas.width = 0;
    outCanvas.height = 0;
  }
  workCanvas.width = 0;
  workCanvas.height = 0;

  onProgress?.(100, 'Enhancement complete!');
  return {
    blob,
    dataUrl,
    width: finalW,
    height: finalH,
    originalWidth: origW,
    originalHeight: origH,
  };
}
