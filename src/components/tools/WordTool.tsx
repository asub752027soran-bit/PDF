import React, { useState } from 'react';
import { Upload, Download, FileText, ArrowLeft, FileCheck, Edit3 } from 'lucide-react';
import { convertWordToPDF, extractDocxHtml, exportTextToTxtBlob } from '../../utils/docProcessor';
import { downloadBlob } from '../../utils/batchProcessor';

interface WordToolProps {
  onBack: () => void;
}

export const WordTool: React.FC<WordToolProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setIsProcessing(true);
      try {
        if (selected.name.toLowerCase().endsWith('.docx')) {
          const { html, text } = await extractDocxHtml(selected);
          setHtmlContent(html);
          setExtractedText(text);
        } else {
          setExtractedText(`Content preview loaded for ${selected.name}`);
        }
      } catch (err) {
        console.error('Failed reading word file:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleConvertToPDF = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const pdfBytes = await convertWordToPDF(file);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      downloadBlob(blob, `${file.name.replace(/\.(docx|doc)$/i, '')}.pdf`);
    } catch (err) {
      console.error('PDF conversion failed:', err);
      alert('Failed to convert Word to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportTxt = () => {
    const blob = exportTextToTxtBlob(extractedText);
    downloadBlob(blob, `${file?.name.replace(/\.(docx|doc)$/i, '') || 'doc'}.txt`);
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
            <FileText className="w-5 h-5 text-indigo-600" /> Word Document Tools
          </h1>
          <p className="text-xs text-slate-500">
            Preview, edit text content, and convert DOC/DOCX files to PDF or TXT.
          </p>
        </div>
      </div>

      {!file ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-10 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Upload Word File (.DOCX, .DOC, .RTF)
          </h3>
          <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
            Zero account registration needed. Fast and secure document parsing.
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer transition-all">
            <Upload className="w-4 h-4" /> Choose Word Document
            <input
              type="file"
              accept=".docx,.doc,.rtf,.odt"
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
              <p className="text-xs text-slate-500">
                Size: {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-xs font-bold text-rose-500 hover:underline"
            >
              Change File
            </button>
          </div>

          {/* Text Editor Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Editable Document Text Content</span>
              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
            </label>
            <textarea
              rows={10}
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none"
            />
          </div>

          {/* Action Export Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleConvertToPDF}
              disabled={isProcessing}
              className="py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Convert & Export to PDF
            </button>
            <button
              onClick={handleExportTxt}
              className="py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-600"
            >
              <Download className="w-4 h-4" /> Save as Plain Text (.TXT)
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
