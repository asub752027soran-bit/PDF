import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Upload,
  Download,
  Wand2,
  RotateCcw,
  SplitSquareHorizontal,
  Columns2,
  Eye,
  ZoomIn,
  Maximize2,
  AlertCircle,
  CheckCircle2,
  X,
  MoveHorizontal,
  FileText,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  EnhancePreset,
  EnhanceOptions,
  ENHANCE_PRESETS,
  enhanceAndRestoreImage,
} from '../../utils/imageEnhancer';
import { formatBytes } from '../../utils/imageProcessor';
import { downloadBlob } from '../../utils/batchProcessor';
import { recordToolConversion } from '../../utils/activityTracker';
import { useProgress } from '../../context/ProgressContext';

interface ImageEnhancerToolProps {
  onBack: () => void;
  initialFile?: File | null;
  initialFiles?: File[] | null;
}

type CompareMode = 'split' | 'side-by-side' | 'after';

export const ImageEnhancerTool: React.FC<ImageEnhancerToolProps> = ({
  onBack,
  initialFile,
  initialFiles,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [origDims, setOrigDims] = useState<{ w: number; h: number } | null>(null);

  const [activePreset, setActivePreset] = useState<EnhancePreset>('unblur-photo');
  const [options, setOptions] = useState<Omit<EnhanceOptions, 'preset' | 'format' | 'quality' | 'maxWorkingDim'>>({
    ...ENHANCE_PRESETS['unblur-photo'].options,
  });

  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [compareMode, setCompareMode] = useState<CompareMode>('split');
  const [zoomFull, setZoomFull] = useState<boolean>(false);
  const [splitPos, setSplitPos] = useState<number>(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const previewJobRef = useRef<number>(0);
  const { startProgress, updateProgress, completeProgress, failProgress } = useProgress();

  const handleLoadFile = useCallback((selected: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selected.type.startsWith('image/') && !selected.name.match(/\.(jpg|jpeg|png|webp|bmp|gif|avif)$/i)) {
      setErrorMsg('Please upload a supported image file (JPG, PNG, WEBP, BMP, or GIF).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl !== 'string') {
        setErrorMsg('Could not read the selected image file.');
        return;
      }

      const probe = new Image();
      probe.onload = () => {
        setOrigDims({ w: probe.naturalWidth || probe.width, h: probe.naturalHeight || probe.height });
        setOriginalUrl(dataUrl);
        setPreviewUrl(null);
        setFile(selected);
        setSplitPos(50);
      };
      probe.onerror = () => {
        setErrorMsg('Could not decode this image file. Please try another photo.');
      };
      probe.src = dataUrl;
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the uploaded file.');
    };
    reader.readAsDataURL(selected);
  }, []);

  useEffect(() => {
    const incoming = initialFile || initialFiles?.[0];
    if (incoming) {
      handleLoadFile(incoming);
    }
  }, [initialFile, initialFiles, handleLoadFile]);

  // Debounced live preview generation
  useEffect(() => {
    if (!originalUrl) return;

    const jobId = ++previewJobRef.current;
    setIsPreviewing(true);

    const timer = window.setTimeout(async () => {
      try {
        const result = await enhanceAndRestoreImage(originalUrl, {
          ...options,
          format: 'png',
          quality: 0.92,
          maxWorkingDim: 960,
        });
        if (previewJobRef.current === jobId) {
          setPreviewUrl(result.dataUrl);
        }
      } catch (err: any) {
        if (previewJobRef.current === jobId) {
          setErrorMsg(err?.message || 'Failed to generate enhancement preview.');
        }
      } finally {
        if (previewJobRef.current === jobId) {
          setIsPreviewing(false);
        }
      }
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, [originalUrl, options]);

  // Drag handler for before/after comparison slider
  const updateSplitFromClientX = useCallback((clientX: number) => {
    const container = stageRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplitPos(Math.max(2, Math.min(98, pct)));
  }, []);

  useEffect(() => {
    if (!isDraggingSlider) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateSplitFromClientX(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        updateSplitFromClientX(e.touches[0].clientX);
      }
    };
    const handleUp = () => setIsDraggingSlider(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDraggingSlider, updateSplitFromClientX]);

  const handleSelectPreset = (presetId: EnhancePreset) => {
    setActivePreset(presetId);
    setOptions({ ...ENHANCE_PRESETS[presetId].options });
    setSuccessMsg(null);
  };

  const handleReset = () => {
    setOptions({ ...ENHANCE_PRESETS[activePreset].options });
    setSuccessMsg(null);
  };

  const handleExportDownload = async () => {
    if (!file || !originalUrl) return;
    setIsExporting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    startProgress({
      title: 'Enhancing & Restoring Image',
      status: 'Initializing full-resolution restoration pipeline...',
      stage: 'Image Restoration',
      indeterminate: false,
    });

    try {
      const result = await enhanceAndRestoreImage(
        file,
        {
          ...options,
          format,
          quality: format === 'png' ? 1.0 : 0.94,
        },
        (pct, stage) => {
          updateProgress(pct, stage, 'Enhancing Pixels');
        }
      );

      const ext = format === 'jpeg' ? 'jpg' : format;
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const outName = `${baseName}_clear_${result.width}x${result.height}.${ext}`;
      downloadBlob(result.blob, outName);
      recordToolConversion('image-enhancer', file.size);

      setSuccessMsg(
        `Saved "${outName}" (${result.width}×${result.height} px, ${formatBytes(result.blob.size)})`
      );
      completeProgress('Clear restored image downloaded successfully!');
    } catch (err: any) {
      console.error('Image enhance export failed:', err);
      const msg = err?.message || 'Failed to enhance and export image.';
      setErrorMsg(msg);
      failProgress(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const projectedOutDims = origDims
    ? (() => {
        const workScale = Math.max(origDims.w, origDims.h) > 2000 ? 2000 / Math.max(origDims.w, origDims.h) : 1;
        let w = Math.round(origDims.w * workScale * options.upscale);
        let h = Math.round(origDims.h * workScale * options.upscale);
        if (Math.max(w, h) > 4096) {
          const cap = 4096 / Math.max(w, h);
          w = Math.round(w * cap);
          h = Math.round(h * cap);
        }
        return { w, h };
      })()
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>

        <div className="sm:text-right">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 sm:justify-end">
            <Wand2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Blur-to-Clear & Old Photo Restorer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl sm:ml-auto">
            Sharpen blurry photos or unreadable text and restore faded, scratched, yellowed vintage pictures cleanly in your browser.
          </p>
        </div>
      </div>

      {/* Inline Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-3 font-semibold">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-500"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Inline Success Banner */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between gap-3 font-bold">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Dropzone */}
      {!file || !originalUrl ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleLoadFile(e.dataTransfer.files[0]);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-10 sm:p-14 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Wand2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">
            Upload a Blurry or Old Faded Photo
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Supports JPG, PNG, WEBP, BMP, and scanned photos. All enhancement and restoration runs locally on your device.
          </p>

          <label className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 cursor-pointer transition-all">
            <Upload className="w-4 h-4" /> Select Image to Clear & Restore
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                e.target.value = '';
                if (picked) handleLoadFile(picked);
              }}
              className="hidden"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-10 pt-8 border-t border-slate-100 dark:border-slate-700/70 text-left">
            {(Object.keys(ENHANCE_PRESETS) as EnhancePreset[]).map((key) => {
              const p = ENHANCE_PRESETS[key];
              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800"
                >
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white mb-1">
                    {p.label}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {p.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Interactive Before / After Stage */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Stage Toolbar */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-900/50">
              <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCompareMode('split')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    compareMode === 'split'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <SplitSquareHorizontal className="w-3.5 h-3.5" /> Split Slider
                </button>
                <button
                  type="button"
                  onClick={() => setCompareMode('side-by-side')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    compareMode === 'side-by-side'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Columns2 className="w-3.5 h-3.5" /> Side by Side
                </button>
                <button
                  type="button"
                  onClick={() => setCompareMode('after')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    compareMode === 'after'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Clear Only
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomFull(!zoomFull)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                    zoomFull
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {zoomFull ? <Maximize2 className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                  {zoomFull ? 'Fit View' : 'Inspect 100%'}
                </button>

                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 cursor-pointer transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const picked = e.target.files?.[0];
                      e.target.value = '';
                      if (picked) handleLoadFile(picked);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Viewport */}
            <div className="p-4 bg-slate-950/95 flex items-center justify-center min-h-[380px] sm:min-h-[460px] overflow-auto relative">
              {isPreviewing && (
                <div className="absolute top-3 right-3 z-30 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-[11px] font-bold flex items-center gap-2 shadow-md">
                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  Refining clarity...
                </div>
              )}

              {compareMode === 'split' && (
                <div
                  ref={stageRef}
                  onMouseDown={(e) => {
                    setIsDraggingSlider(true);
                    updateSplitFromClientX(e.clientX);
                  }}
                  onTouchStart={(e) => {
                    setIsDraggingSlider(true);
                    if (e.touches[0]) updateSplitFromClientX(e.touches[0].clientX);
                  }}
                  className={`relative select-none cursor-ew-resize inline-block overflow-hidden rounded-xl shadow-2xl ${
                    zoomFull ? '' : 'max-h-[520px] max-w-full'
                  }`}
                >
                  {/* Base Layer: Enhanced Clear Result */}
                  <img
                    src={previewUrl || originalUrl}
                    alt="Enhanced clear preview"
                    draggable={false}
                    className={`block ${
                      zoomFull ? 'max-w-none w-auto h-auto' : 'max-h-[520px] w-auto max-w-full object-contain'
                    }`}
                  />

                  {/* Top Clipped Layer: Original Image on Left */}
                  <img
                    src={originalUrl}
                    alt="Original image"
                    draggable={false}
                    style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />

                  {/* Divider Line & Drag Handle */}
                  <div
                    style={{ left: `${splitPos}%` }}
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.85)] pointer-events-none z-20"
                  >
                    <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-lg flex items-center justify-center border border-slate-300">
                      <MoveHorizontal className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Labels */}
                  <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-slate-900/75 text-white text-[10px] font-extrabold uppercase tracking-wider pointer-events-none">
                    Original
                  </span>
                  <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg bg-indigo-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider pointer-events-none">
                    Clear Restored
                  </span>
                </div>
              )}

              {compareMode === 'side-by-side' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <div className="space-y-1.5 text-center">
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Before (Original)
                    </span>
                    <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center p-2">
                      <img
                        src={originalUrl}
                        alt="Before enhancement"
                        className={zoomFull ? 'max-w-none' : 'max-h-[440px] w-auto object-contain'}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-center">
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                      After (Clear & Restored)
                    </span>
                    <div className="rounded-xl overflow-hidden bg-slate-900 border border-indigo-500/40 flex items-center justify-center p-2">
                      <img
                        src={previewUrl || originalUrl}
                        alt="After enhancement"
                        className={zoomFull ? 'max-w-none' : 'max-h-[440px] w-auto object-contain'}
                      />
                    </div>
                  </div>
                </div>
              )}

              {compareMode === 'after' && (
                <div className="relative inline-block overflow-hidden rounded-xl shadow-2xl">
                  <img
                    src={previewUrl || originalUrl}
                    alt="Clear restored result"
                    className={zoomFull ? 'max-w-none' : 'max-h-[520px] w-auto object-contain'}
                  />
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-indigo-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider">
                    Clear Restored
                  </span>
                </div>
              )}
            </div>

            {/* Footer Metadata Strip */}
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-900/50">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-bold truncate max-w-[200px]" title={file.name}>
                  {file.name}
                </span>
                {origDims && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Input: {origDims.w}×{origDims.h} px ({formatBytes(file.size)})
                  </span>
                )}
                {projectedOutDims && (
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    Output ({options.upscale}×): {projectedOutDims.w}×{projectedOutDims.h} px
                  </span>
                )}
              </div>

              {compareMode === 'split' && (
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400">Split</span>
                  <input
                    type="range"
                    min={2}
                    max={98}
                    value={Math.round(splitPos)}
                    onChange={(e) => setSplitPos(Number(e.target.value))}
                    aria-label="Before and after split slider"
                    className="w-24 accent-indigo-600"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right: Presets & Fine-Tune Controls */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Restoration Presets
              </h3>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ENHANCE_PRESETS) as EnhancePreset[]).map((key) => {
                const preset = ENHANCE_PRESETS[key];
                const isSelected = activePreset === key;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                    }`}
                  >
                    <div className="text-[11px] font-extrabold leading-snug">{preset.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Blurry Text Boost Toggle */}
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div className="flex items-center gap-2.5 pr-2">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Blurry Text Clarity Boost
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    Crisps text strokes on blurry docs & scans
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={options.textBoost}
                onChange={(e) => setOptions((prev) => ({ ...prev, textBoost: e.target.checked }))}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </label>

            {/* Sliders */}
            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Deblur & Focus Sharpness</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{options.deblur}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={options.deblur}
                  onChange={(e) => setOptions((p) => ({ ...p, deblur: Number(e.target.value) }))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Old Photo Fade & Cast Fix</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{options.restoreOld}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={options.restoreOld}
                  onChange={(e) => setOptions((p) => ({ ...p, restoreOld: Number(e.target.value) }))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Dust, Scratches & Grain Clean</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{options.noiseReduction}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={options.noiseReduction}
                  onChange={(e) => setOptions((p) => ({ ...p, noiseReduction: Number(e.target.value) }))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Local Clarity & Shadow Lift</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{options.clarity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={options.clarity}
                  onChange={(e) => setOptions((p) => ({ ...p, clarity: Number(e.target.value) }))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Color Vibrancy Revival</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{options.vibrance}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={options.vibrance}
                  onChange={(e) => setOptions((p) => ({ ...p, vibrance: Number(e.target.value) }))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            {/* HD Upscale & Export Format */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/70 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  HD Upscale
                </label>
                <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  {([1, 2, 3, 4] as const).map((factor) => (
                    <button
                      key={factor}
                      type="button"
                      onClick={() => setOptions((p) => ({ ...p, upscale: factor }))}
                      className={`py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                        options.upscale === factor
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {factor}×
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Output Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg' | 'webp')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                >
                  <option value="png">PNG (Lossless)</option>
                  <option value="jpeg">JPG (Compact)</option>
                  <option value="webp">WEBP (Modern)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportDownload}
              disabled={isExporting}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Restoring Full Resolution...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Enhance & Download Clear Image
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
