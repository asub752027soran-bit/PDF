import React, { useState } from 'react';
import {
  Upload,
  Download,
  Combine,
  Split,
  Trash2,
  MoveUp,
  MoveDown,
  ArrowLeft,
  FileCheck,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { mergePDFs, splitPDF } from '../../utils/pdfProcessor';
import { createZipArchive, downloadBlob } from '../../utils/batchProcessor';

interface PDFMergeSplitToolProps {
  mode: 'merge' | 'split';
  onBack: () => void;
}

export const PDFMergeSplitTool: React.FC<PDFMergeSplitToolProps> = ({ mode, onBack }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [splitRange, setSplitRange] = useState('1-3, 4-6');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= files.length) return;
    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setFiles(updated);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please select at least 2 PDF files to merge.');
      return;
    }
    setIsProcessing(true);
    try {
      const mergedBytes = await mergePDFs(files);
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      downloadBlob(blob, 'merged_document.pdf');
    } catch (err) {
      console.error('Merge failed:', err);
      alert('Failed to merge PDFs. Please check file validity.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      // Parse ranges like "1-3, 4-6"
      const ranges = splitRange
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r) => {
          const parts = r.split('-').map(Number);
          return {
            start: parts[0] || 1,
            end: parts[1] || parts[0] || 1,
          };
        });

      const splitResults = await splitPDF(files[0], ranges);

      if (splitResults.length === 1) {
        const blob = new Blob([splitResults[0].data], { type: 'application/pdf' });
        downloadBlob(blob, splitResults[0].name);
      } else if (splitResults.length > 1) {
        const zipBlob = await createZipArchive(splitResults);
        downloadBlob(zipBlob, `${files[0].name.replace(/\.pdf$/i, '')}_split.zip`);
      }
    } catch (err) {
      console.error('Split failed:', err);
      alert('Failed to split PDF. Check page ranges.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
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
            {mode === 'merge' ? (
              <>
                <Combine className="w-5 h-5 text-indigo-600" /> Merge PDF Files
              </>
            ) : (
              <>
                <Split className="w-5 h-5 text-indigo-600" /> Split PDF Document
              </>
            )}
          </h1>
          <p className="text-xs text-slate-500">
            {mode === 'merge'
              ? 'Combine multiple PDF files into one clean organized document.'
              : 'Extract pages or split your PDF into independent file parts.'}
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <Upload className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          {mode === 'merge' ? 'Select PDF Files to Combine' : 'Select PDF File to Split'}
        </h3>
        <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
          Drag & drop PDF files or click below. Zero account registration required.
        </p>
        <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer transition-all">
          <Upload className="w-4 h-4" /> Browse PDF Files
          <input
            type="file"
            accept=".pdf,application/pdf"
            multiple={mode === 'merge'}
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Selected File List */}
      {files.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>Uploaded PDF Files ({files.length})</span>
            <button
              onClick={() => setFiles([])}
              className="text-rose-500 hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {mode === 'merge' && (
                    <>
                      <button
                        onClick={() => moveFile(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveFile(idx, 'down')}
                        disabled={idx === files.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1 rounded text-rose-500 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Mode specific controls */}
          {mode === 'split' && (
            <div className="pt-2 text-xs space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Split Page Ranges (e.g. "1-3, 4-6, 8")
              </label>
              <input
                type="text"
                value={splitRange}
                onChange={(e) => setSplitRange(e.target.value)}
                placeholder="1-3, 4-6, 8"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Process Action Button */}
          <button
            onClick={mode === 'merge' ? handleMerge : handleSplit}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing PDF...
              </>
            ) : mode === 'merge' ? (
              <>
                <Combine className="w-4 h-4" /> Merge PDF Files Now
              </>
            ) : (
              <>
                <Split className="w-4 h-4" /> Split PDF & Download
              </>
            )}
          </button>

        </div>
      )}

    </div>
  );
};
