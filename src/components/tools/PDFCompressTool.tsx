import React, { useState, useEffect } from 'react';
import {
  Upload,
  Download,
  FileArchive,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { compressPDFDetailed, CompressionLevel } from '../../utils/pdfProcessor';
import { downloadBlob } from '../../utils/batchProcessor';
import { formatBytes } from '../../utils/imageProcessor';
import { recordToolConversion } from '../../utils/activityTracker';
import { FilePreviewCard } from '../common/FilePreviewCard';
import { useProgress } from '../../context/ProgressContext';

interface PDFCompressToolProps {
  onBack: () => void;
  initialFile?: File | null;
}

interface CompressionResultState {
  origSize: number;
  newSize: number;
  savedPercent: number;
  method: 'structural' | 'rasterized' | 'original';
  pageCount: number;
  blob: Blob;
  fileName: string;
}

export const PDFCompressTool: React.FC<PDFCompressToolProps> = ({ onBack, initialFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('recommended');
  const [preserveTextOnly, setPreserveTextOnly] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultInfo, setResultInfo] = useState<CompressionResultState | null>(null);
  const { startProgress, updateProgress, completeProgress, failProgress } = useProgress();

  useEffect(() => {
    if (initialFile) {
      setFile(initialFile);
      setResultInfo(null);
      setErrorMessage(null);
    }
  }, [initialFile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = '';
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.pdf') && selected.type !== 'application/pdf') {
      setErrorMessage('Please select a valid PDF (.pdf) file.');
      return;
    }

    setFile(selected);
    setResultInfo(null);
    setErrorMessage(null);
  };

  const handleCompress = async () => {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setResultInfo(null);

    startProgress({
      title: 'Compressing PDF Document',
      status: `Analyzing "${file.name}" structure...`,
      stage: 'Object Stream Analysis',
      indeterminate: false,
    });

    try {
      const result = await compressPDFDetailed(file, {
        level: compressionLevel,
        preserveTextOnly,
        onProgress: (percent, status, stage) => {
          updateProgress(percent, status, stage);
        },
      });

      const outName = `${file.name.replace(/\.pdf$/i, '')}_compressed.pdf`;
      const bufferCopy = new Uint8Array(result.data).buffer;
      const blob = new Blob([bufferCopy], { type: 'application/pdf' });

      setResultInfo({
        origSize: result.originalSize,
        newSize: result.compressedSize,
        savedPercent: result.savedPercent,
        method: result.method,
        pageCount: result.pageCount,
        blob,
        fileName: outName,
      });

      recordToolConversion(
        'compress-pdf',
        result.originalSize,
        `PDF Compressed (${result.savedPercent}% saved)`,
        `${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)}`
      );

      downloadBlob(blob, outName);

      if (result.savedPercent > 0) {
        completeProgress(
          `Compressed PDF by ${result.savedPercent}% (${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)})`
        );
      } else {
        completeProgress(`PDF is already optimally compressed (${formatBytes(result.originalSize)})`);
      }
    } catch (err: any) {
      console.error('Compression failed:', err);
      const message = err?.message || 'Failed to compress PDF. Please ensure the file is a valid, uncorrupted PDF.';
      setErrorMessage(message);
      failProgress(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAgain = () => {
    if (!resultInfo) return;
    downloadBlob(resultInfo.blob, resultInfo.fileName);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>
        <div className="text-right">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 justify-end">
            <FileArchive className="w-5 h-5 text-indigo-600" /> Compress PDF File
          </h2>
          <p className="text-xs text-slate-500">
            Reduce PDF file size cleanly with smart stream &amp; image optimization.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Compression Error</p>
            <p className="mt-0.5 opacity-90">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[11px] font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {!file ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-10 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Choose a PDF Document to Compress
          </h3>
          <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
            Drag &amp; drop PDF or click below. 100% private client-side compression.
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer transition-all">
            <Upload className="w-4 h-4" /> Select PDF
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Client-Side Visual File Preview */}
          <FilePreviewCard
            file={file}
            onRemove={() => {
              setFile(null);
              setResultInfo(null);
              setErrorMessage(null);
            }}
            onReplace={(newF) => {
              setFile(newF);
              setResultInfo(null);
              setErrorMessage(null);
            }}
          />

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            {/* Compression Presets */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Select Compression Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCompressionLevel('extreme');
                    setResultInfo(null);
                  }}
                  className={`p-4 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                    compressionLevel === 'extreme'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="font-extrabold mb-1">Extreme</div>
                  <div className="text-[10px] text-slate-500">Smallest file size (~72–96 DPI JPEG optimization)</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCompressionLevel('recommended');
                    setResultInfo(null);
                  }}
                  className={`p-4 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                    compressionLevel === 'recommended'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="font-extrabold mb-1">Recommended</div>
                  <div className="text-[10px] text-slate-500">Best balance of clarity &amp; high size reduction</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCompressionLevel('light');
                    setResultInfo(null);
                  }}
                  className={`p-4 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                    compressionLevel === 'light'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="font-extrabold mb-1">Light</div>
                  <div className="text-[10px] text-slate-500">High visual quality, gentle compression</div>
                </button>
              </div>
            </div>

            {/* Vector Text Preservation Toggle */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer">
              <input
                type="checkbox"
                checked={preserveTextOnly}
                onChange={(e) => {
                  setPreserveTextOnly(e.target.checked);
                  setResultInfo(null);
                }}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Lossless Structure Only (Keep Selectable Vector Text)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Strips metadata, thumbnails, and orphan objects without rasterizing text. Disable for maximum compression on scanned or image-heavy PDFs.
                </p>
              </div>
            </label>

            {/* Result Card */}
            {resultInfo && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 text-xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {resultInfo.savedPercent > 0
                          ? `Compression Completed — Reduced by ${resultInfo.savedPercent}%`
                          : 'PDF Already Optimally Compressed'}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      {formatBytes(resultInfo.origSize)} → <strong>{formatBytes(resultInfo.newSize)}</strong> ({resultInfo.pageCount} {resultInfo.pageCount === 1 ? 'page' : 'pages'} •{' '}
                      {resultInfo.method === 'rasterized'
                        ? 'Image & Stream Optimization'
                        : resultInfo.method === 'structural'
                        ? 'Lossless Structural Optimization'
                        : 'Original Size Preserved'}
                      )
                    </p>
                  </div>
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadAgain}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Compressed PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setResultInfo(null);
                      setErrorMessage(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100/50 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Compress Another</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleCompress}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Compressing PDF...
                </>
              ) : (
                <>
                  <FileArchive className="w-4 h-4" /> Compress PDF &amp; Download
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
