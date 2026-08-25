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
  AlertCircle
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
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(30); // 10-100%
  const [rotation, setRotation] = useState(45); // 0, 45, -45, 90
  const [watermarkColor, setWatermarkColor] = useState('#dc2626'); // red default
  const [watermarkLayout, setWatermarkLayout] = useState<'center' | 'grid'>('center');

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

  useEffect(() => {
    if (initialFile) {
      handleFileSelected(initialFile);
    }
  }, [initialFile]);

  // Render PDF Preview Canvas with live Watermark Overlay
  useEffect(() => {
    if (!previewDataUrl || !previewCanvasRef.current || mode !== 'watermark') return;

    let isMounted = true;
    const renderPreview = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ url: previewDataUrl });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(currentPage);

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
        if (!ctx) return;

        ctx.save();
        ctx.scale(dpr, dpr);

        await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas: canvas } as any).promise;

        // Draw Watermark on top of preview canvas
        ctx.save();
        ctx.fillStyle = watermarkColor;
        ctx.globalAlpha = opacity / 100;
        ctx.font = `bold ${Math.round(fontSize * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (watermarkLayout === 'center') {
          ctx.translate(scaledViewport.width / 2, scaledViewport.height / 2);
          ctx.rotate((-rotation * Math.PI) / 180);
          ctx.fillText(watermarkText || 'WATERMARK', 0, 0);
        } else {
          // Grid layout
          const stepX = scaledViewport.width / 2;
          const stepY = scaledViewport.height / 3;
          for (let gx = stepX / 2; gx < scaledViewport.width; gx += stepX) {
            for (let gy = stepY / 2; gy < scaledViewport.height; gy += stepY) {
              ctx.save();
              ctx.translate(gx, gy);
              ctx.rotate((-rotation * Math.PI) / 180);
              ctx.fillText(watermarkText || 'WATERMARK', 0, 0);
              ctx.restore();
            }
          }
        }

        ctx.restore();
        ctx.restore();
      } catch (err) {
        console.debug('Preview render note:', err);
      }
    };

    renderPreview();
    return () => {
      isMounted = false;
    };
  }, [previewDataUrl, currentPage, mode, watermarkText, fontSize, opacity, rotation, watermarkColor, watermarkLayout]);

  // Handle Watermark Processing
  const handleApplyWatermark = async () => {
    if (!file) return;
    setIsProcessing(true);
    startProgress({
      title: 'Applying Watermark to PDF',
      status: `Stamping "${watermarkText}" across all pages...`,
      stage: 'Watermark Embedding',
      indeterminate: false
    });

    try {
      updateProgress(30, 'Calculating vector typography & opacity matrix...', 'Vector Transform');
      await new Promise((r) => setTimeout(r, 100));

      updateProgress(60, 'Stamping watermark layers to each PDF page...', 'Page Stamping');
      const watermarkedBytes = await watermarkPDF(file, {
        text: watermarkText,
        opacity: opacity / 100,
        fontSize: fontSize,
        rotationAngle: rotation,
        colorHex: watermarkColor
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
      alert('Failed to apply watermark to PDF.');
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
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Stamp className="w-4 h-4 text-indigo-600" /> Watermark Configuration
                </h3>

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
                    {['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE', 'APPROVED', 'COPYRIGHT'].map((preset) => (
                      <button
                        key={preset}
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

                {/* Color and Layout */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Watermark Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={watermarkColor}
                        onChange={(e) => setWatermarkColor(e.target.value)}
                        className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                      />
                      <div className="flex gap-1">
                        {['#dc2626', '#4f46e5', '#059669', '#d97706', '#0f172a'].map((c) => (
                          <button
                            key={c}
                            onClick={() => setWatermarkColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              watermarkColor === c ? 'border-indigo-600 scale-110' : 'border-white dark:border-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Layout Style
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                      <button
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
                        onClick={() => setWatermarkLayout('grid')}
                        className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          watermarkLayout === 'grid'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Repeat Grid
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sliders */}
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

                  <div>
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Font Size</span>
                      <span>{fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={84}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Rotation</span>
                      <span>{rotation}°</span>
                    </div>
                    <select
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
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
                  onClick={handleApplyWatermark}
                  disabled={isProcessing || !watermarkText.trim()}
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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
                        onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                        disabled={currentPage >= numPages}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 disabled:opacity-30 text-xs font-bold"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>

                <div className="my-4 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-md max-w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center min-h-[300px]">
                  <canvas ref={previewCanvasRef} className="max-h-[380px] w-auto object-contain" />
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  This watermark will be stamped permanently across all {numPages} page{numPages > 1 ? 's' : ''}.
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
