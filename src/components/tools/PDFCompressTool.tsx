import React, { useState } from 'react';
import { Upload, Download, FileArchive, ArrowLeft, Check, Sparkles, Zap } from 'lucide-react';
import { compressPDF } from '../../utils/pdfProcessor';
import { downloadBlob } from '../../utils/batchProcessor';
import { formatBytes } from '../../utils/imageProcessor';
import { recordToolConversion } from '../../utils/activityTracker';

interface PDFCompressToolProps {
  onBack: () => void;
}

export const PDFCompressTool: React.FC<PDFCompressToolProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<'extreme' | 'recommended' | 'light'>('recommended');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultInfo, setResultInfo] = useState<{ origSize: number; newSize: number; savedPercent: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResultInfo(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const factor = compressionLevel === 'extreme' ? 0.3 : compressionLevel === 'recommended' ? 0.7 : 0.9;
      const compressedBytes = await compressPDF(file, factor);
      
      const origSize = file.size;
      const newSize = compressedBytes.byteLength;
      const saved = Math.max(0, Math.round(((origSize - newSize) / origSize) * 100));

      setResultInfo({
        origSize,
        newSize,
        savedPercent: saved,
      });

      const blob = new Blob([compressedBytes], { type: 'application/pdf' });
      recordToolConversion('compress-pdf', origSize);
      downloadBlob(blob, `${file.name.replace(/\.pdf$/i, '')}_compressed.pdf`);
    } catch (err) {
      console.error('Compression failed:', err);
      alert('Failed to compress PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>
        <div className="text-right">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 justify-end">
            <FileArchive className="w-5 h-5 text-indigo-600" /> Compress PDF File
          </h1>
          <p className="text-xs text-slate-500">
            Reduce PDF file size for email sharing without sacrificing resolution.
          </p>
        </div>
      </div>

      {!file ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-10 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Choose a PDF Document to Compress
          </h3>
          <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
            Drag & drop PDF or click below. Private client-side compression.
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
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">
                📄 {file.name}
              </h4>
              <p className="text-xs text-slate-500">Original Size: {formatBytes(file.size)}</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-xs font-bold text-rose-500 hover:underline"
            >
              Change File
            </button>
          </div>

          {/* Compression Presets */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Select Compression Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setCompressionLevel('extreme')}
                className={`p-4 rounded-2xl border text-left text-xs transition-all ${
                  compressionLevel === 'extreme'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-extrabold mb-1">Extreme</div>
                <div className="text-[10px] text-slate-500">Maximum compression, lower quality</div>
              </button>

              <button
                onClick={() => setCompressionLevel('recommended')}
                className={`p-4 rounded-2xl border text-left text-xs transition-all ${
                  compressionLevel === 'recommended'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-extrabold mb-1">Recommended</div>
                <div className="text-[10px] text-slate-500">Good quality, balanced compression</div>
              </button>

              <button
                onClick={() => setCompressionLevel('light')}
                className={`p-4 rounded-2xl border text-left text-xs transition-all ${
                  compressionLevel === 'light'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-extrabold mb-1">Light</div>
                <div className="text-[10px] text-slate-500">High quality, subtle compression</div>
              </button>
            </div>
          </div>

          {/* Result Card if calculated */}
          {resultInfo && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold">Compression Completed!</span>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  New size: {formatBytes(resultInfo.newSize)} (Reduced by {resultInfo.savedPercent}%)
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}

          <button
            onClick={handleCompress}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Compressing PDF...
              </>
            ) : (
              <>
                <FileArchive className="w-4 h-4" /> Compress PDF & Download
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
};
