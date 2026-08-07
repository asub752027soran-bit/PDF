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
  RotateCw,
  RotateCcw,
  Layers,
  FileCheck,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { mergePDFs, splitPDF, manipulatePDFPages, readFileAsArrayBuffer } from '../../utils/pdfProcessor';
import { createZipArchive, downloadBlob } from '../../utils/batchProcessor';
import { PDFDocument } from 'pdf-lib';

interface PDFMergeSplitToolProps {
  mode: 'merge' | 'split' | 'organize';
  onBack: () => void;
}

export const PDFMergeSplitTool: React.FC<PDFMergeSplitToolProps> = ({ mode, onBack }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [splitRange, setSplitRange] = useState('1-3, 4-6');
  const [pagesList, setPagesList] = useState<{ origIndex: number; rotation: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);

      if (mode === 'organize' && newFiles.length > 0) {
        try {
          const targetFile = newFiles[0] as File;
          const buf = await readFileAsArrayBuffer(targetFile);
          const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
          const count = doc.getPageCount();
          const initialPages = Array.from({ length: count }, (_, i) => ({
            origIndex: i,
            rotation: 0,
          }));
          setPagesList(initialPages);
        } catch (err) {
          console.error('Failed reading page count:', err);
        }
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    if (mode === 'organize') {
      setPagesList([]);
    }
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

  const rotatePage = (index: number, angle: number) => {
    setPagesList((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, rotation: (p.rotation + angle + 360) % 360 } : p
      )
    );
  };

  const movePage = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= pagesList.length) return;
    const updated = [...pagesList];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setPagesList(updated);
  };

  const removePage = (index: number) => {
    setPagesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOrganize = async () => {
    if (files.length === 0 || pagesList.length === 0) return;
    setIsProcessing(true);
    try {
      const pagesInfo = pagesList.map((p) => ({
        pageIndex: p.origIndex,
        rotation: p.rotation,
      }));
      const resBytes = await manipulatePDFPages(files[0], pagesInfo);
      const blob = new Blob([resBytes], { type: 'application/pdf' });
      downloadBlob(blob, `${files[0].name.replace(/\.pdf$/i, '')}_organized.pdf`);
    } catch (err) {
      console.error('Organize failed:', err);
      alert('Failed to organize PDF pages.');
    } finally {
      setIsProcessing(false);
    }
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
            ) : mode === 'split' ? (
              <>
                <Split className="w-5 h-5 text-indigo-600" /> Split PDF Document
              </>
            ) : (
              <>
                <Layers className="w-5 h-5 text-indigo-600" /> Rearrange & Rotate Pages
              </>
            )}
          </h1>
          <p className="text-xs text-slate-500">
            {mode === 'merge'
              ? 'Combine multiple PDF files into one clean organized document.'
              : mode === 'split'
              ? 'Extract pages or split your PDF into independent file parts.'
              : 'Reorder pages, rotate orientation, or remove unwanted pages.'}
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <Upload className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          {mode === 'merge'
            ? 'Select PDF Files to Combine'
            : mode === 'split'
            ? 'Select PDF File to Split'
            : 'Select PDF File to Rearrange Pages'}
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

      {/* Selected File List / Page Grid */}
      {files.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>
              {mode === 'organize'
                ? `Pages in ${files[0].name} (${pagesList.length} pages)`
                : `Uploaded PDF Files (${files.length})`}
            </span>
            <button
              onClick={() => {
                setFiles([]);
                setPagesList([]);
              }}
              className="text-rose-500 hover:underline"
            >
              Clear All
            </button>
          </div>

          {mode === 'organize' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
              {pagesList.map((page, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-between text-xs space-y-2 relative"
                >
                  <div className="w-full text-center py-6 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl font-bold text-indigo-600 dark:text-indigo-400 flex flex-col items-center justify-center">
                    <span className="text-lg">📄</span>
                    <span>Page {page.origIndex + 1}</span>
                    {page.rotation > 0 && (
                      <span className="text-[10px] text-slate-500 mt-1">
                        Rotated {page.rotation}°
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-1 w-full pt-1">
                    <button
                      onClick={() => rotatePage(idx, -90)}
                      title="Rotate Left 90°"
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-indigo-600"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => rotatePage(idx, 90)}
                      title="Rotate Right 90°"
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-indigo-600"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => movePage(idx, 'up')}
                      disabled={idx === 0}
                      title="Move Left/Up"
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-indigo-600 disabled:opacity-30"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => movePage(idx, 'down')}
                      disabled={idx === pagesList.length - 1}
                      title="Move Right/Down"
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-indigo-600 disabled:opacity-30"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removePage(idx)}
                      title="Delete Page"
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
          )}

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
            onClick={
              mode === 'merge'
                ? handleMerge
                : mode === 'split'
                ? handleSplit
                : handleOrganize
            }
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
            ) : mode === 'split' ? (
              <>
                <Split className="w-4 h-4" /> Split PDF & Download
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" /> Download Rearranged PDF
              </>
            )}
          </button>

        </div>
      )}

    </div>
  );
};
