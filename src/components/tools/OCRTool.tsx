import React, { useState } from 'react';
import { Upload, Download, ScanText, ArrowLeft, Copy, Check, FileText } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { renderPDFToImages } from '../../utils/pdfExtractor';
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
  const [statusMsg, setStatusMsg] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setExtractedText('');
      setProgress(0);
      setStatusMsg('');
    }
  };

  const runOCR = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(5);
    setStatusMsg('Initializing OCR engine...');

    try {
      const worker = await createWorker('eng');
      let combinedText = '';

      if (file.name.toLowerCase().endsWith('.pdf')) {
        setStatusMsg('Rendering PDF pages to high-res images...');
        setProgress(20);
        const pageImgs = await renderPDFToImages(file, 'png', 1.5);

        for (let i = 0; i < pageImgs.length; i++) {
          setStatusMsg(`Recognizing text on page ${i + 1} of ${pageImgs.length}...`);
          const ret = await worker.recognize(pageImgs[i].dataUrl);
          combinedText += `--- PAGE ${i + 1} ---\n${ret.data.text}\n\n`;
          setProgress(Math.round(20 + ((i + 1) / pageImgs.length) * 75));
        }
      } else {
        setStatusMsg('Recognizing text on image...');
        setProgress(40);
        const ret = await worker.recognize(file);
        combinedText = ret.data.text;
        setProgress(90);
      }

      setExtractedText(combinedText || 'No text could be extracted from this document.');
      setStatusMsg('OCR Recognition Complete!');
      await worker.terminate();
    } catch (err) {
      console.error('OCR failed:', err);
      alert('Failed to extract text from document. Please ensure file is valid.');
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
    const cleanName = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'ocr_text';
    downloadBlob(blob, `${cleanName}_ocr.txt`);
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
            <ScanText className="w-5 h-5 text-indigo-600" /> OCR Image & PDF Text Reader
          </h1>
          <p className="text-xs text-slate-500">
            Extract editable text from scanned PDF pages, photos, and images automatically.
          </p>
        </div>
      </div>

      {!file ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Upload Scanned Document or Image
          </h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            Supports PDF, JPG, PNG, WEBP, and BMP files. Zero account required.
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 cursor-pointer transition-all">
            <Upload className="w-4 h-4" /> Select File for OCR
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
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-md">
                📄 {file.name}
              </h4>
              <p className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB {statusMsg && `• ${statusMsg}`}
              </p>
            </div>
            <button
              onClick={() => { setFile(null); setExtractedText(''); }}
              className="text-xs font-bold text-rose-500 hover:underline"
            >
              Change File
            </button>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>{statusMsg || 'Running Optical Character Recognition...'}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Trigger */}
          {!extractedText && !isProcessing && (
            <button
              onClick={runOCR}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <ScanText className="w-4 h-4" /> Start OCR Text Extraction
            </button>
          )}

          {/* Extracted Text Result Box */}
          {extractedText && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Extracted Text Output
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </button>
                  <button
                    onClick={exportTxt}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Download (.TXT)
                  </button>
                </div>
              </div>

              <textarea
                rows={12}
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none"
              />
            </div>
          )}

        </div>
      )}

    </div>
  );
};
