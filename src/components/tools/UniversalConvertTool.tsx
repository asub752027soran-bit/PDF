import React, { useState } from 'react';
import {
  Upload,
  Download,
  Layers,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  FileText,
  Archive,
  MoveUp,
  MoveDown,
  ArrowUpDown,
  Shuffle,
  Sparkles
} from 'lucide-react';
import { createZipArchive, downloadBlob } from '../../utils/batchProcessor';
import { recordToolConversion } from '../../utils/activityTracker';
import {
  convertWordToPDF,
  extractDocxHtml,
  exportTextToDocxBlob
} from '../../utils/docProcessor';
import { imagesToPDF } from '../../utils/pdfProcessor';

interface UniversalConvertToolProps {
  onBack: () => void;
}

export const UniversalConvertTool: React.FC<UniversalConvertToolProps> = ({ onBack }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>('pdf');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
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

  const sortAlphabetical = (ascending = true) => {
    const sorted = [...files].sort((a, b) =>
      ascending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
    setFiles(sorted);
  };

  const reverseOrder = () => {
    setFiles([...files].reverse());
  };

  const handleBatchConvert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(5);

    try {
      const convertedFiles: { name: string; data: Uint8Array | Blob | string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        const extension = file.name.split('.').pop()?.toLowerCase() || '';

        let convertedData: Uint8Array | Blob | string;

        if (targetFormat === 'pdf') {
          if (extension === 'docx' || extension === 'doc') {
            convertedData = await convertWordToPDF(file);
          } else if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
            convertedData = await imagesToPDF([file]);
          } else if (extension === 'pdf') {
            convertedData = new Uint8Array(await file.arrayBuffer());
          } else {
            // Text or fallback to PDF conversion
            const text = await file.text();
            convertedData = await convertWordToPDF(new File([text], `${cleanName}.txt`));
          }
        } else if (targetFormat === 'docx') {
          if (extension === 'docx') {
            convertedData = new Uint8Array(await file.arrayBuffer());
          } else {
            const rawText = await file.text();
            convertedData = await exportTextToDocxBlob(rawText, { title: cleanName });
          }
        } else if (targetFormat === 'txt') {
          if (extension === 'docx' || extension === 'doc') {
            const extracted = await extractDocxHtml(file);
            convertedData = extracted.text;
          } else {
            convertedData = await file.text();
          }
        } else {
          convertedData = new Uint8Array(await file.arrayBuffer());
        }

        // Maintain exact order in zip archive with padded sequential numbering prefix if multiple files
        const prefix = files.length > 1 ? `${String(i + 1).padStart(2, '0')}_` : '';
        convertedFiles.push({
          name: `${prefix}${cleanName}.${targetFormat}`,
          data: convertedData,
        });

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      const zipBlob = await createZipArchive(convertedFiles);
      const totalSize = files.reduce((acc, f) => acc + f.size, 0);
      recordToolConversion('universal-converter', totalSize || zipBlob.size);
      downloadBlob(zipBlob, `converted_batch_${targetFormat}_files.zip`);
    } catch (err) {
      console.error('Batch conversion failed:', err);
      alert('Batch conversion error. Please verify input files.');
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
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Batch Universal Converter & Sequencer
          </h1>
          <p className="text-xs text-slate-500">
            Upload multiple documents, arrange sequence order, and convert to professional PDF, Word, or Text.
          </p>
        </div>
      </div>

      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-10 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <Upload className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Select Multiple Batch Files
        </h3>
        <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
          Drop PDF, Word (.docx), TXT, or Image files. Converted output strictly preserves order.
        </p>
        <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer transition-all">
          <Upload className="w-4 h-4" /> Add Files to Batch
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-2">
              <span>Conversion Sequence ({files.length} files)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px]">
                Order Locked
              </span>
            </span>

            {files.length > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => sortAlphabetical(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <ArrowUpDown className="w-3 h-3" /> A-Z
                </button>
                <button
                  onClick={() => sortAlphabetical(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <ArrowUpDown className="w-3 h-3" /> Z-A
                </button>
                <button
                  onClick={reverseOrder}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <Shuffle className="w-3 h-3" /> Reverse
                </button>
              </div>
            )}

            <button onClick={() => setFiles([])} className="text-rose-500 hover:underline">
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3 truncate max-w-sm sm:max-w-md">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-mono font-extrabold flex items-center justify-center text-xs">
                    #{idx + 1}
                  </span>
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveFile(idx, 'up')}
                    disabled={idx === 0}
                    title="Move Up"
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-indigo-600 disabled:opacity-30"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveFile(idx, 'down')}
                    disabled={idx === files.length - 1}
                    title="Move Down"
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-indigo-600 disabled:opacity-30"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1.5 text-rose-500 hover:text-rose-600"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Target Format Selector */}
          <div className="text-xs space-y-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Target Batch Export Format
            </label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
            >
              <option value="pdf">PDF Document (.pdf) — Professional Header, Footer & Exact Sequence</option>
              <option value="docx">Word Document (.docx) — Standard Formatted Typography</option>
              <option value="txt">Plain Text (.txt) — Clean Extraction</option>
            </select>
          </div>

          <button
            onClick={handleBatchConvert}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Converting Batch Files in Exact Order ({progress}%)...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" /> Convert {files.length} Files & Download ZIP
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
};
