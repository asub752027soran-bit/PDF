import React, { useState, useEffect } from 'react';
import { Upload, Download, FileText, ArrowLeft, Edit3, FileCode, Presentation, Sparkles, CheckCircle2 } from 'lucide-react';
import { convertWordToPDF, extractDocxHtml, exportTextToDocxBlob, exportTextToTxtBlob } from '../../utils/docProcessor';
import { extractTextFromPDF } from '../../utils/pdfExtractor';
import { downloadBlob } from '../../utils/batchProcessor';

interface WordToolProps {
  toolId?: string;
  onBack: () => void;
}

export const WordTool: React.FC<WordToolProps> = ({ toolId = 'word-to-pdf', onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Determine configuration based on toolId
  const isPdfToWord = toolId === 'pdf-to-word';
  const isWordToPdf = toolId === 'word-to-pdf';
  const isEditWord = toolId === 'edit-word';
  const isWordToTxt = toolId === 'word-to-txt';
  const isPptToPdf = toolId === 'ppt-to-pdf';

  const fileAccept = isPdfToWord
    ? '.pdf,application/pdf'
    : isPptToPdf
    ? '.ppt,.pptx,.odp'
    : '.docx,.doc,.rtf,.odt,.txt';

  const getTitle = () => {
    if (isPdfToWord) return 'Convert PDF to Editable Word (.DOCX)';
    if (isWordToPdf) return 'Convert Word Document to PDF';
    if (isEditWord) return 'Online Word Document Viewer & Editor';
    if (isWordToTxt) return 'Convert Word to Plain Text (.TXT)';
    if (isPptToPdf) return 'Convert PowerPoint Presentation to PDF';
    return 'Word & Document Tool Workspace';
  };

  const getSubtitle = () => {
    if (isPdfToWord) return 'Extract pages and text from PDF documents into editable Microsoft Word (.DOCX) files.';
    if (isWordToPdf) return 'Turn DOCX and DOC files into clean, professional PDF documents instantly.';
    if (isEditWord) return 'Open, inspect, edit text content, and export modified DOCX documents directly in browser.';
    if (isWordToTxt) return 'Extract formatted text from Word files into clean plain text TXT format.';
    if (isPptToPdf) return 'Convert PPT/PPTX slides and text layout into printable PDF files.';
    return 'Process document files with zero login required.';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setIsProcessing(true);
      setStatusMsg('Parsing document content...');

      try {
        if (selected.name.toLowerCase().endsWith('.pdf')) {
          const pages = await extractTextFromPDF(selected);
          const fullText = pages.map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`).join('\n\n');
          setExtractedText(fullText);
        } else if (selected.name.toLowerCase().endsWith('.docx')) {
          const { text } = await extractDocxHtml(selected);
          setExtractedText(text);
        } else {
          const rawText = await selected.text();
          setExtractedText(rawText || `Document text loaded for ${selected.name}`);
        }
        setStatusMsg('Document loaded successfully');
      } catch (err) {
        console.error('Failed reading document file:', err);
        setExtractedText(`Loaded ${selected.name}. Content ready for export.`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleExportDocx = async () => {
    if (!extractedText) return;
    setIsProcessing(true);
    try {
      const blob = await exportTextToDocxBlob(extractedText);
      const cleanName = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'document';
      downloadBlob(blob, `${cleanName}_converted.docx`);
    } catch (err) {
      console.error('Docx export failed:', err);
      alert('Failed to export DOCX file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertToPDF = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const pdfBytes = await convertWordToPDF(file);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      downloadBlob(blob, `${cleanName}_converted.pdf`);
    } catch (err) {
      console.error('PDF conversion failed:', err);
      alert('Failed to convert document to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportTxt = () => {
    const blob = exportTextToTxtBlob(extractedText);
    const cleanName = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'document';
    downloadBlob(blob, `${cleanName}.txt`);
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
            {isPptToPdf ? <Presentation className="w-5 h-5 text-indigo-600" /> : <FileText className="w-5 h-5 text-indigo-600" />}
            {getTitle()}
          </h1>
          <p className="text-xs text-slate-500 max-w-lg ml-auto">
            {getSubtitle()}
          </p>
        </div>
      </div>

      {!file ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Upload File for Processing
          </h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            {isPdfToWord ? 'Select a PDF document to convert to editable Word format.' : 'Drag & drop or browse your local file.'}
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 cursor-pointer transition-all">
            <Upload className="w-4 h-4" /> Select Document
            <input
              type="file"
              accept={fileAccept}
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
                Size: {(file.size / 1024).toFixed(1)} KB {statusMsg && `• ${statusMsg}`}
              </p>
            </div>
            <button
              onClick={() => { setFile(null); setExtractedText(''); }}
              className="text-xs font-bold text-rose-500 hover:underline"
            >
              Change File
            </button>
          </div>

          {/* Text Content Editor Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Extracted & Editable Text Preview</span>
              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
            </label>
            <textarea
              rows={12}
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Text content will appear here..."
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none"
            />
          </div>

          {/* Action Export Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={handleExportDocx}
              disabled={isProcessing || !extractedText}
              className="py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Download Word (.DOCX)
            </button>
            <button
              onClick={handleConvertToPDF}
              disabled={isProcessing}
              className="py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Download PDF (.PDF)
            </button>
            <button
              onClick={handleExportTxt}
              disabled={!extractedText}
              className="py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-600"
            >
              <Download className="w-4 h-4" /> Download Plain Text (.TXT)
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
