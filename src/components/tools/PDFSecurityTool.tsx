import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  Shield,
  Lock,
  Unlock,
  Stamp,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Sliders,
  RotateCw,
  Sparkles,
  Key,
  ShieldCheck,
  FileCheck,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
  Type,
  Trash2,
  Layers
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { watermarkPDF, lockPDF, unlockPDF, readFileAsArrayBuffer, readFileAsDataURL } from '../../utils/pdfProcessor';
import { downloadBlob } from '../../utils/batchProcessor';
import { recordToolConversion } from '../../utils/activityTracker';
import { FilePreviewCard } from '../common/FilePreviewCard';
import { useProgress } from '../../context/ProgressContext';
import { formatBytes } from '../../utils/imageProcessor';

// Set up pdf.js worker URL safely
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfWorker || `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
}

interface PDFSecurityToolProps {
  mode: 'watermark' | 'lock' | 'unlock';
  onBack: () => void;
  initialFile?: File | null;
}

export const PDFSecurityTool: React.FC<PDFSecurityToolProps> = ({ mode, onBack, initialFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const { startProgress, updateProgress, completeProgress, failProgress } = useProgress();

  // Watermark State
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [watermarkImageName, setWatermarkImageName] = useState<string>('');
  const [fontSize, setFontSize] = useState(48);
  const [imageScale, setImageScale] = useState(1.0);
  const [opacity, setOpacity] = useState(30); // 10-100%
  const [rotation, setRotation] = useState(45); // 0, 45, -45, 90
  const [watermarkColor, setWatermarkColor] = useState('#dc2626'); // red default
  const [watermarkLayout, setWatermarkLayout] = useState<'center' | 'grid'>('center');
  const [fontFamily, setFontFamily] = useState<'Helvetica' | 'Times' | 'Courier'>('Helvetica');
  const [isBold, setIsBold] = useState(true);
  const [targetPages, setTargetPages] = useState<'all' | 'first' | 'custom'>('all');
  const [customPagesStr, setCustomPagesStr] = useState('1');
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Lock State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Unlock State
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Success Result State
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getToolTitle = () => {
    switch (mode) {
      case 'watermark':
        return 'Watermark PDF Document';
      case 'lock':
        return 'Protect & Lock PDF File';
      case 'unlock':
        return 'Unlock Password-Protected PDF';
      default:
        return 'PDF Security & Watermark';
    }
  };

  const getToolSubtitle = () => {
    switch (mode) {
      case 'watermark':
        return 'Stamp custom text or confidential copyright watermarks across all pages with custom opacity & angle.';
      case 'lock':
        return 'Encrypt your PDF document with strong password protection to prevent unauthorized viewing or printing.';
      case 'unlock':
        return 'Remove password restrictions and security encryption from your PDF document.';
      default:
        return 'Fast, private client-side security tools for your PDF files.';
    }
  };

  const getToolIcon = () => {
    switch (mode) {
      case 'watermark':
        return <Stamp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'lock':
        return <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'unlock':
        return <Unlock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setSuccessMsg(null);
    setUnlockError(null);

    try {
      const dataUrl = await readFileAsDataURL(selectedFile);
      setPreviewDataUrl(dataUrl);

      // Attempt to load preview if not encrypted
      try {
        const loadingTask = pdfjsLib.getDocument({ url: dataUrl });
        const pdf = await loadingTask.promise;
        setNumPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.debug('PDF load note (file might be encrypted):', err);
      }
    } catch (e) {
      console.debug('Error reading file:', e);
    }
  };

  const handleImageLogoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const imgFile = e.target.files?.[0];
    if (!imgFile) return;

    setWatermarkImageName(imgFile.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setWatermarkImage(event.target.result);
      }
    };
    reader.readAsDataURL(imgFile);
  };

  useEffect(() => {
    if (initialFile) {
      handleFileSelected(initialFile);
    }
  }, [initialFile]);

  // Render PDF Preview Canvas with live Watermark Overlay
  useEffect(() => {
    if (!previewDataUrl || !previewCanvasRef.current || mode !== 'watermark') return;

    let isMounted = true;
    let loadingTask: any = null;
    let pdf: any = null;
    let page: any = null;

    const renderPreview = async () => {
      try {
        loadingTask = pdfjsLib.getDocument({ url: previewDataUrl });
        pdf = await loadingTask.promise;
        if (!isMounted) return;

        page = await pdf.getPage(currentPage);
        const canvas = previewCanvasRef.current;
        if (!canvas || !isMounted) return;

        const viewport = page.getViewport({ scale: 1.0 });
        const targetWidth = Math.min(canvas.parentElement?.clientWidth || 400, 480);
        const scale = targetWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const dpr = window.devicePixelRatio || 1;
        canvas.width = scaledViewport.width * dpr;
        canvas.height = scaledViewport.height * dpr;
        canvas.style.width = `${scaledViewport.width}px`;
        canvas.style.height = `${scaledViewport.height}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx || !isMounted) return;

        ctx.save();
        ctx.scale(dpr, dpr);

        await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas: canvas } as any).promise;

        if (!isMounted) return;

        // Draw Watermark on top of preview canvas
        ctx.save();

        if (watermarkType === 'image' && watermarkImage) {
          // --- Image Logo Watermark ---
          const img = new Image();
          img.src = watermarkImage;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });

          if (img.naturalWidth > 0 && isMounted) {
            ctx.globalAlpha = opacity / 100;
            const baseMaxDim = Math.min(scaledViewport.width * 0.45, 280 * scale);
            const aspect = img.naturalWidth / img.naturalHeight;
            const imgWidth = baseMaxDim * imageScale;
            const imgHeight = imgWidth / aspect;

            const drawImageStamp = (cx: number, cy: number) => {
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate((-rotation * Math.PI) / 180);
              ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
              ctx.restore();
            };

            if (watermarkLayout === 'center') {
              drawImageStamp(scaledViewport.width / 2, scaledViewport.height / 2);
            } else {
              const stepX = scaledViewport.width / 2;
              const stepY = scaledViewport.height / 3;
              for (let col = 0; col < 2; col++) {
                for (let row = 0; row < 3; row++) {
                  drawImageStamp((col + 0.5) * stepX, (row + 0.5) * stepY);
                }
              }
            }
          }
        } else {
          // --- Text Watermark ---
          ctx.fillStyle = watermarkColor;
          ctx.globalAlpha = opacity / 100;
          const fontName = fontFamily === 'Times' ? 'Georgia, serif' : fontFamily === 'Courier' ? 'Courier New, monospace' : 'sans-serif';
          ctx.font = `${isBold ? 'bold' : 'normal'} ${Math.round(fontSize * scale)}px ${fontName}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const drawTextStamp = (cx: number, cy: number) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((-rotation * Math.PI) / 180);
            ctx.fillText(watermarkText || 'CONFIDENTIAL', 0, 0);
            ctx.restore();
          };

          if (watermarkLayout === 'center') {
            drawTextStamp(scaledViewport.width / 2, scaledViewport.height / 2);
          } else {
            const stepX = scaledViewport.width / 2;
            const stepY = scaledViewport.height / 3;
            for (let col = 0; col < 2; col++) {
              for (let row = 0; row < 3; row++) {
                drawTextStamp((col + 0.5) * stepX, (row + 0.5) * stepY);
              }
            }
          }
        }

        ctx.restore();
        ctx.restore();
      } catch (err) {
        console.debug('Preview render note:', err);
      } finally {
        if (page && typeof page.cleanup === 'function') {
          try {
            page.cleanup();
          } catch {
            // ignore
          }
        }
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
    };

    renderPreview();
    return () => {
      isMounted = false;
    };
  }, [
    previewDataUrl,
    currentPage,
    mode,
    watermarkType,
    watermarkText,
    watermarkImage,
    fontSize,
    imageScale,
    opacity,
    rotation,
    watermarkColor,
    watermarkLayout,
    fontFamily,
    isBold
  ]);

  // Parse custom page list (e.g., "1, 3, 5-8")
  const parseCustomPages = (input: string, maxPages: number): number[] => {
    const pages = new Set<number>();
    const parts = input.split(/[,;\s]+/);
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.min(start, end); p <= Math.max(start, end); p++) {
            if (p >= 1 && p <= maxPages) pages.add(p);
          }
        }
      } else {
        const p = Number(part);
        if (!isNaN(p) && p >= 1 && p <= maxPages) {
          pages.add(p);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  // Handle Watermark Processing
  const handleApplyWatermark = async () => {
    if (!file) return;
    setIsProcessing(true);
    const label = watermarkType === 'image' ? (watermarkImageName || 'Logo Image') : `"${watermarkText}"`;
    startProgress({
      title: 'Applying Watermark to PDF',
      status: `Stamping ${label} across document...`,
      stage: 'Watermark Embedding',
      indeterminate: false
    });

    try {
      updateProgress(30, 'Calculating vector typography & opacity matrix...', 'Vector Transform');
      await new Promise((r) => setTimeout(r, 80));

      const parsedPages = targetPages === 'custom' ? parseCustomPages(customPagesStr, numPages) : undefined;

      updateProgress(60, 'Stamping watermark layers to each PDF page...', 'Page Stamping');
      const watermarkedBytes = await watermarkPDF(file, {
        type: watermarkType,
        text: watermarkType === 'text' ? watermarkText : undefined,
        imageDataUrl: watermarkType === 'image' && watermarkImage ? watermarkImage : undefined,
        opacity: opacity / 100,
        fontSize: fontSize,
        imageScale: imageScale,
        rotationAngle: rotation,
        colorHex: watermarkColor,
        layout: watermarkLayout,
        fontFamily: fontFamily,
        isBold: isBold,
        targetPages: targetPages,
        customPages: parsedPages
      });

      updateProgress(90, 'Packaging finalized document...', 'Finalizing PDF');
      const blob = new Blob([watermarkedBytes], { type: 'application/pdf' });
      const cleanName = file.name.replace(/\.pdf$/i, '');
      recordToolConversion('watermark-pdf', file.size);
      downloadBlob(blob, `${cleanName}_watermarked.pdf`);

      setSuccessMsg(`Watermark applied successfully to "${file.name}"!`);
      completeProgress('Watermark applied and PDF downloaded!');
    } catch (err: any) {
      console.error('Watermark failed:', err);
      failProgress(err?.message || 'Failed to apply watermark.');
      alert('Failed to apply watermark to PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Lock / Password Protection
  const handleApplyLock = async () => {
    if (!file) return;
    if (!password) {
      alert('Please enter a password to protect your PDF.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match. Please verify your password.');
      return;
    }

    setIsProcessing(true);
    startProgress({
      title: 'Encrypting PDF Document',
      status: 'Generating 128-bit AES encrypted PDF container...',
      stage: 'Key Generation & Encryption',
      indeterminate: false
    });

    try {
      updateProgress(40, 'Encrypting page dictionary objects & cross-references...', 'AES Encryption');
      const lockedBytes = await lockPDF(file, password);

      updateProgress(90, 'Packaging locked document...', 'Finalizing Locked PDF');
      const blob = new Blob([lockedBytes], { type: 'application/pdf' });
      const cleanName = file.name.replace(/\.pdf$/i, '');
      recordToolConversion('lock-pdf', file.size);
      downloadBlob(blob, `${cleanName}_protected.pdf`);

      setSuccessMsg(`PDF successfully protected with password!`);
      completeProgress('PDF locked and downloaded successfully!');
    } catch (err: any) {
      console.error('Lock failed:', err);
      failProgress(err?.message || 'Failed to password-protect PDF.');
      alert('Failed to lock PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Unlock / Decryption
  const handleApplyUnlock = async () => {
    if (!file) return;
    setIsProcessing(true);
    setUnlockError(null);
    startProgress({
      title: 'Unlocking PDF Document',
      status: 'Decrypting document security permissions...',
      stage: 'Decryption Processing',
      indeterminate: false
    });

    try {
      updateProgress(40, 'Removing password protections and access restrictions...', 'Decrypting Streams');
      const unlockedBytes = await unlockPDF(file, unlockPassword);

      updateProgress(90, 'Building clean decrypted PDF...', 'Finalizing PDF');
      const blob = new Blob([unlockedBytes], { type: 'application/pdf' });
      const cleanName = file.name.replace(/\.pdf$/i, '');
      recordToolConversion('unlock-pdf', file.size);
      downloadBlob(blob, `${cleanName}_unlocked.pdf`);

      setSuccessMsg(`PDF successfully unlocked and restrictions removed!`);
      completeProgress('PDF unlocked and downloaded successfully!');
    } catch (err: any) {
      console.error('Unlock failed:', err);
      setUnlockError(err?.message || 'Incorrect password or unable to decrypt this file.');
      failProgress(err?.message || 'Failed to unlock PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>
        <div className="text-right">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 justify-end">
            {getToolIcon()} {getToolTitle()}
          </h1>
          <p className="text-xs text-slate-500 max-w-lg ml-auto">
            {getToolSubtitle()}
          </p>
        </div>
      </div>

      {!file ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Select PDF Document
          </h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            {mode === 'watermark' && 'Select a PDF to stamp customized text or confidential watermarks.'}
            {mode === 'lock' && 'Select a PDF file to encrypt with strong password protection.'}
            {mode === 'unlock' && 'Select a password-protected PDF to decrypt and remove restrictions.'}
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 cursor-pointer transition-all">
            <Upload className="w-4 h-4" /> Select PDF File
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* File Card */}
          <FilePreviewCard
            file={file}
            onRemove={() => { setFile(null); setPreviewDataUrl(null); setSuccessMsg(null); }}
            onReplace={(newF) => handleFileSelected(newF)}
          />

          {/* Success Banner */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-3 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* WATERMARK MODE UI */}
          {mode === 'watermark' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Controls Column */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Stamp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Watermark Configuration
                  </h3>

                  {/* Mode Toggle: Text vs Logo Image */}
                  <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setWatermarkType('text')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        watermarkType === 'text'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Type className="w-3.5 h-3.5" /> Text Stamp
                    </button>
                    <button
                      type="button"
                      onClick={() => setWatermarkType('image')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        watermarkType === 'image'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Logo / Image
                    </button>
                  </div>
                </div>

                {watermarkType === 'text' ? (
                  <>
                    {/* Text Presets */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Watermark Text
                      </label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="e.g., CONFIDENTIAL, DRAFT, DO NOT COPY"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE', 'APPROVED', 'COPYRIGHT', 'PRIVATE', 'TOP SECRET'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setWatermarkText(preset)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              watermarkText === preset
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font & Color Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Font Style & Weight
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            value={fontFamily}
                            onChange={(e) => setFontFamily(e.target.value as any)}
                            className="flex-1 px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                          >
                            <option value="Helvetica">Sans-Serif (Helvetica)</option>
                            <option value="Times">Serif (Times New Roman)</option>
                            <option value="Courier">Monospace (Courier)</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setIsBold(!isBold)}
                            className={`px-3 py-2 rounded-xl font-extrabold text-xs border transition-all ${
                              isBold
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            B
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Watermark Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={watermarkColor}
                            onChange={(e) => setWatermarkColor(e.target.value)}
                            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent shrink-0"
                          />
                          <div className="flex gap-1.5 flex-wrap">
                            {['#dc2626', '#4f46e5', '#059669', '#d97706', '#0f172a', '#64748b'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setWatermarkColor(c)}
                                style={{ backgroundColor: c }}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${
                                  watermarkColor === c ? 'border-indigo-600 scale-110 shadow-xs' : 'border-white dark:border-slate-800'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Logo / Image Watermark Uploader */
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Upload Logo or Watermark Image (PNG with transparency recommended)
                    </label>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleImageLogoSelected}
                      className="hidden"
                    />

                    {watermarkImage ? (
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                        <img
                          src={watermarkImage}
                          alt="Watermark preview"
                          className="w-16 h-16 object-contain rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {watermarkImageName || 'Uploaded Logo'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Transparent PNG / Image
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setWatermarkImage(null);
                              setWatermarkImageName('');
                            }}
                            className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 transition-all flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900/40 cursor-pointer"
                      >
                        <ImageIcon className="w-8 h-8 text-indigo-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Click to select PNG logo or stamp image
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Supports PNG, JPG, WebP with custom opacity
                        </span>
                      </button>
                    )}

                    {watermarkImage && (
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          <span>Logo Scale</span>
                          <span>{Math.round(imageScale * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0.2}
                          max={2.0}
                          step={0.05}
                          value={imageScale}
                          onChange={(e) => setImageScale(Number(e.target.value))}
                          className="w-full accent-indigo-600"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Layout & Target Pages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Layout Placement
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setWatermarkLayout('center')}
                        className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          watermarkLayout === 'center'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Single Center
                      </button>
                      <button
                        type="button"
                        onClick={() => setWatermarkLayout('grid')}
                        className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          watermarkLayout === 'grid'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Repeat Grid (Tile)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Target Pages
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setTargetPages('all')}
                        className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          targetPages === 'all'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        All ({numPages})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetPages('first')}
                        className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          targetPages === 'first'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        First Page
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetPages('custom')}
                        className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          targetPages === 'custom'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                  </div>
                </div>

                {targetPages === 'custom' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Custom Page Numbers (e.g. 1, 3, 5-{numPages})
                    </label>
                    <input
                      type="text"
                      value={customPagesStr}
                      onChange={(e) => setCustomPagesStr(e.target.value)}
                      placeholder={`1, 2, 3-${numPages}`}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                    />
                  </div>
                )}

                {/* Opacity, Font Size & Rotation Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Opacity</span>
                      <span>{opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  {watermarkType === 'text' ? (
                    <div>
                      <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                        <span>Font Size</span>
                        <span>{fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={18}
                        max={96}
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                        <span>Scale</span>
                        <span>{Math.round(imageScale * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0.2}
                        max={2.0}
                        step={0.05}
                        value={imageScale}
                        onChange={(e) => setImageScale(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Rotation</span>
                      <span>{rotation}°</span>
                    </div>
                    <select
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                    >
                      <option value={45}>45° Diagonal</option>
                      <option value={-45}>-45° Reverse Diagonal</option>
                      <option value={0}>0° Horizontal</option>
                      <option value={90}>90° Vertical</option>
                    </select>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={handleApplyWatermark}
                  disabled={
                    isProcessing ||
                    (watermarkType === 'text' && !watermarkText.trim()) ||
                    (watermarkType === 'image' && !watermarkImage)
                  }
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Apply Watermark & Download PDF
                </button>
              </div>

              {/* Preview Column */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-between">
                <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Live Watermark Preview
                  </span>
                  {numPages > 1 && (
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 disabled:opacity-30 text-xs font-bold"
                      >
                        Prev
                      </button>
                      <span className="font-bold text-slate-500">
                        {currentPage} / {numPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                        disabled={currentPage >= numPages}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 disabled:opacity-30 text-xs font-bold"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>

                <div className="my-4 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-md max-w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center min-h-[300px] w-full p-2">
                  <canvas ref={previewCanvasRef} className="max-h-[380px] w-auto object-contain" />
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  {targetPages === 'all'
                    ? `This watermark will be stamped permanently across all ${numPages} page${numPages > 1 ? 's' : ''}.`
                    : targetPages === 'first'
                    ? 'This watermark will be stamped on page 1 only.'
                    : `This watermark will be stamped on pages: ${customPagesStr || 'selected pages'}`}
                </p>
              </div>

            </div>
          )}

          {/* LOCK / PROTECT MODE UI */}
          {mode === 'lock' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 max-w-xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Set Security Password
                  </h3>
                  <p className="text-xs text-slate-500">
                    Recipients will be required to enter this password to open the PDF.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Enter PDF Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter strong password..."
                      className="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password..."
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" /> Client-Side Encryption
                  </div>
                  <p>Your password is processed locally in your browser. Passwords are never sent to any server.</p>
                </div>

                <button
                  onClick={handleApplyLock}
                  disabled={isProcessing || !password || password !== confirmPassword}
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" /> Encrypt & Download Protected PDF
                </button>
              </div>
            </div>
          )}

          {/* UNLOCK MODE UI */}
          {mode === 'unlock' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 max-w-xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Unlock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Unlock & Decrypt PDF
                  </h3>
                  <p className="text-xs text-slate-500">
                    Remove password restrictions to view, edit, and print freely.
                  </p>
                </div>
              </div>

              {unlockError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{unlockError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Document Password (Optional if only permission locked)
                  </label>
                  <div className="relative">
                    <input
                      type={showUnlockPassword ? 'text' : 'password'}
                      value={unlockPassword}
                      onChange={(e) => setUnlockPassword(e.target.value)}
                      placeholder="Enter password (if required)..."
                      className="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showUnlockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleApplyUnlock}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Unlock className="w-4 h-4" /> Decrypt & Download Unlocked PDF
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
