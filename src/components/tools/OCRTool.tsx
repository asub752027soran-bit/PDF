import React, { useState } from 'react';
import { Upload, Download, ScanText, ArrowLeft, Copy, Check, FileCode } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { downloadBlob } from '../../utils/batchProcessor';

interface OCRToolProps {
  onBack: () => void;
}

export const OCRTool: React.FC<OCRToolProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setExtractedText('');
    }
  };

  const runOCR = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(10);
    try {
      const worker = await createWorker('eng');
      setProgress(40);
      const ret = await worker.recognize(file);
      setProgress(90);
      setExtractedText(ret.data.text);
      await worker.terminate();
    } catch (err) {
      console.error('OCR failed:', err);
      alert('Failed to extract text from document.');
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportTxt = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, 'extracted_ocr_text.txt');
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
            <ScanText className="w-5 h-5 text-indigo-600" /> OCR Text Recognition
          </h1>
          <p className="text-xs text-slate-500">
            Extract editable text from scanned documents, photos, or images automatically.
          </p>
        </div>
      </div>

      {!file ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-10 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Upload Scanned Document or Image (JPG, PNG, WEBP)
          </h3>
          <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
            Zero account registration required. Automated optical character recognition.
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer transition-all">
            <Upload className="w-4 h-4" /> Select Scanned File
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 text-xs">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                📄 {file.name}
              </h4>
              <p className="text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="font-bold text-rose-500 hover:underline"
            >
              Change File
            </button>
          </div>

          {!extractedText ? (
            <button
              onClick={runOCR}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running Character Recognition ({progress}%)...
                </>
              ) : (
                <>
                  <ScanText className="w-4 h-4" /> Extract Text with OCR
                </>
              )}
            </button>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Extracted Text Result
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Text'}
                  </button>
                  <button
                    onClick={exportTxt}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold flex items-center gap-1 hover:bg-indigo-500"
                  >
                    <Download className="w-3.5 h-3.5" /> Save TXT
                  </button>
                </div>
              </div>

              <textarea
                rows={12}
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200 leading-relaxed outline-none"
              />
            </div>
          )}

        </div>
      )}

    </div>
  );
};
