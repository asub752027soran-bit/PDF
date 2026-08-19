import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  FileText,
  ArrowLeft,
  Edit3,
  Eraser,
  Undo2,
  Redo2,
  Search,
  Replace,
  Trash2,
  Copy,
  Check,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Plus,
  Scissors,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Minimize2,
  FileCode,
  CheckCircle2,
  Layers,
  SplitSquareVertical,
  HelpCircle
} from 'lucide-react';
import {
  convertWordToPDF,
  extractDocxHtml,
  exportTextToDocxBlob,
  exportTextToTxtBlob,
  exportTextToHtmlBlob
} from '../../utils/docProcessor';
import { extractTextFromPDF } from '../../utils/pdfExtractor';
import { downloadBlob } from '../../utils/batchProcessor';
import { recordToolConversion } from '../../utils/activityTracker';

interface WordToolProps {
  toolId?: string;
  onBack: () => void;
  initialFile?: File | null;
}

export const WordTool: React.FC<WordToolProps> = ({ toolId = 'word-to-pdf', onBack, initialFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Search & Erase / Replace tool
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [searchMatchCount, setSearchMatchCount] = useState(0);

  // Editor View Controls
  const [fontSize, setFontSize] = useState<number>(14);
  const [lineHeight, setLineHeight] = useState<'normal' | 'relaxed' | 'loose'>('relaxed');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [isFullScreen, setIsFullScreen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (isPdfToWord) return 'PDF to Word (.DOCX) Studio & Editor';
    if (isWordToPdf) return 'Word to Professional PDF Converter';
    if (isEditWord) return 'Online Word & Document Editor';
    if (isWordToTxt) return 'Word to Plain Text (.TXT) Extractor';
    if (isPptToPdf) return 'PowerPoint to PDF Converter';
    return 'Professional Word & Document Editor';
  };

  const getSubtitle = () => {
    if (isPdfToWord) return 'Convert PDF to editable Word format with full layout and page order preservation.';
    if (isWordToPdf) return 'Convert DOCX documents to publication-grade PDF files with headers and margins.';
    if (isEditWord) return 'Edit text, erase unwanted content, format paragraphs, and export in exact sequence.';
    if (isWordToTxt) return 'Extract clean text without formatting loss or encoding artifacts.';
    return 'Full-featured document editing and conversion with zero server uploads.';
  };

  // Helper to update text with history tracking
  const updateContentWithHistory = (newText: string) => {
    const updatedHistory = history.slice(0, historyIdx + 1);
    updatedHistory.push(newText);
    // Keep max 40 history states
    if (updatedHistory.length > 40) updatedHistory.shift();
    setHistory(updatedHistory);
    setHistoryIdx(updatedHistory.length - 1);
    setExtractedText(newText);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      setHistoryIdx(prevIdx);
      setExtractedText(history[prevIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setExtractedText(history[nextIdx]);
    }
  };

  const processFile = async (selected: File) => {
    setFile(selected);
    setIsProcessing(true);
    setStatusMsg('Reading and parsing document structure...');

    try {
      if (selected.name.toLowerCase().endsWith('.pdf')) {
        const pages = await extractTextFromPDF(selected);
        // Preserve exact sequential page order
        const fullText = pages
          .sort((a, b) => a.pageNumber - b.pageNumber)
          .map((p) => `# Page ${p.pageNumber}\n\n${p.text}`)
          .join('\n\n--- PAGE BREAK ---\n\n');
        updateContentWithHistory(fullText);
      } else if (selected.name.toLowerCase().endsWith('.docx')) {
        const { text } = await extractDocxHtml(selected);
        updateContentWithHistory(text || '');
      } else {
        const rawText = await selected.text();
        updateContentWithHistory(rawText || `Document loaded: ${selected.name}`);
      }
      setStatusMsg('Document loaded successfully with exact page order preserved.');
    } catch (err) {
      console.error('Failed reading document file:', err);
      const fallback = `Loaded ${selected.name}. Edit or type content below:`;
      updateContentWithHistory(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (initialFile) {
      processFile(initialFile);
    }
  }, [initialFile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Erasing & Content Manipulation Functions
  const handleEraseSelection = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    if (start === end) {
      alert('Please highlight the text you want to erase with your cursor first.');
      return;
    }
    const before = extractedText.substring(0, start);
    const after = extractedText.substring(end);
    updateContentWithHistory(before + after);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start;
        textareaRef.current.selectionEnd = start;
        textareaRef.current.focus();
      }
    }, 50);
  };

  const handleEraseAllOccurrences = () => {
    if (!searchQuery) return;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const replaced = extractedText.replace(regex, replaceQuery);
    updateContentWithHistory(replaced);
    setShowSearchModal(false);
    setSearchQuery('');
    setReplaceQuery('');
  };

  const handleEraseEmptyLines = () => {
    const cleaned = extractedText
      .split('\n')
      .filter((l, idx, arr) => {
        if (!l.trim() && !arr[idx - 1]?.trim()) return false;
        return true;
      })
      .join('\n');
    updateContentWithHistory(cleaned);
  };

  const handleEraseFormatting = () => {
    // Strip markdown formatting symbols (#, **, *, ---)
    const cleaned = extractedText
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^[-*•]\s+/gm, '')
      .replace(/--- PAGE BREAK ---/g, '\n');
    updateContentWithHistory(cleaned);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to erase all document text?')) {
      updateContentWithHistory('');
    }
  };

  // Formatting insertion helpers
  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = extractedText.substring(start, end);

    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newText = extractedText.substring(0, start) + replacement + extractedText.substring(end);
    updateContentWithHistory(newText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          start + prefix.length,
          start + prefix.length + (selected.length || 4)
        );
      }
    }, 50);
  };

  const insertPageBreak = () => {
    insertFormatting('\n\n--- PAGE BREAK ---\n\n');
  };

  const insertTableTemplate = () => {
    const tableTemplate = `\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Item A   | $120.00   | Active   |\n| Item B   | $450.00   | Pending  |\n\n`;
    insertFormatting(tableTemplate);
  };

  // Search match count calculator
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatchCount(0);
      return;
    }
    try {
      const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = extractedText.match(regex);
      setSearchMatchCount(matches ? matches.length : 0);
    } catch {
      setSearchMatchCount(0);
    }
  }, [searchQuery, extractedText]);

  // Statistics calculation
  const wordsCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;
  const charsCount = extractedText.length;
  const paragraphsCount = extractedText.trim() ? extractedText.trim().split(/\n\s*\n/).length : 0;
  const readingTimeMins = Math.max(1, Math.ceil(wordsCount / 200));

  // Export handlers
  const handleExportDocx = async () => {
    if (!extractedText.trim()) return;
    setIsProcessing(true);
    try {
      const cleanName = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'document';
      const blob = await exportTextToDocxBlob(extractedText, { title: cleanName });
      recordToolConversion(toolId, file?.size || blob.size);
      downloadBlob(blob, `${cleanName}_edited.docx`);
    } catch (err) {
      console.error('Docx export failed:', err);
      alert('Failed to export DOCX file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertToPDF = async () => {
    if (!extractedText.trim()) return;
    setIsProcessing(true);
    try {
      const cleanName = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'document';
      const pdfBytes = await convertWordToPDF(extractedText, {
        title: cleanName,
        showPageNumbers: true,
      });
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      recordToolConversion(toolId, file?.size || blob.size);
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
    recordToolConversion(toolId, file?.size || blob.size);
    downloadBlob(blob, `${cleanName}.txt`);
  };

  const handleExportHtml = () => {
    const cleanName = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'document';
    const blob = exportTextToHtmlBlob(extractedText, cleanName);
    recordToolConversion(toolId, file?.size || blob.size);
    downloadBlob(blob, `${cleanName}.html`);
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`max-w-5xl mx-auto px-4 py-8 space-y-6 ${isFullScreen ? 'fixed inset-0 z-50 bg-slate-900/95 p-6 overflow-y-auto max-w-none' : ''}`}>
      
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>
        <div className="text-right">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 justify-end">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {getTitle()}
          </h1>
          <p className="text-xs text-slate-500 max-w-lg ml-auto">
            {getSubtitle()}
          </p>
        </div>
      </div>

      {!file && !extractedText ? (
        /* Upload Hero Card */
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Upload Document to Edit & Convert
          </h3>
          <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
            {isPdfToWord
              ? 'Select any PDF file to extract, edit, erase sections, and export as editable Word (.DOCX).'
              : 'Select DOCX, DOC, PDF, RTF, or TXT file. Edit freely, erase unwanted content, and convert with strict sequential order.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <label className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 cursor-pointer transition-all">
              <Upload className="w-4 h-4" /> Select File
              <input
                type="file"
                accept={fileAccept}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={() => updateContentWithHistory('# New Document\n\nStart writing, editing, or pasting your text here...\n\n- Point 1\n- Point 2\n')}
              className="px-5 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all border border-slate-200 dark:border-slate-600 flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Create Blank Document
            </button>
          </div>
        </div>
      ) : (
        /* Document Studio & Workspace */
        <div className="space-y-4">
          
          {/* Document Meta & Status Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-sm">
                  {file?.name || 'Untitled Document.docx'}
                </h4>
                <p className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>{wordsCount} words</span>
                  <span>•</span>
                  <span>{charsCount} characters</span>
                  <span>•</span>
                  <span>~{readingTimeMins} min read</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyClipboard}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Copy all text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => setShowSearchModal(!showSearchModal)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  showSearchModal
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
                title="Find & Erase / Replace"
              >
                <Search className="w-3.5 h-3.5" /> Find & Erase
              </button>
              <button
                onClick={() => { setFile(null); setExtractedText(''); setHistory([]); setHistoryIdx(-1); }}
                className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold transition-colors"
              >
                New / Open File
              </button>
            </div>
          </div>

          {/* Search & Erase Drawer */}
          {showSearchModal && (
            <div className="bg-indigo-50/80 dark:bg-slate-800/95 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-4 shadow-sm space-y-3 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Eraser className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Find & Erase Words
                </span>
                <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium">
                  {searchMatchCount} occurrences found
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Word / Sentence to Erase or Find
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type words to erase..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Replace With (Leave empty to Erase/Delete)
                  </label>
                  <input
                    type="text"
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    placeholder="Replacement text..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    setReplaceQuery('');
                    handleEraseAllOccurrences();
                  }}
                  disabled={!searchQuery.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Eraser className="w-3.5 h-3.5" /> Erase All Matching Words
                </button>
                <button
                  onClick={handleEraseAllOccurrences}
                  disabled={!searchQuery.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Replace className="w-3.5 h-3.5" /> Replace All
                </button>
              </div>
            </div>
          )}

          {/* Professional Word Editing Toolbar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-1 text-slate-700 dark:text-slate-300">
            
            {/* Undo / Redo */}
            <div className="flex items-center border-r border-slate-200 dark:border-slate-700 pr-2 mr-1 gap-0.5">
              <button
                onClick={handleUndo}
                disabled={historyIdx <= 0}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIdx >= history.length - 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {/* Eraser Actions Suite */}
            <div className="flex items-center border-r border-slate-200 dark:border-slate-700 pr-2 mr-1 gap-1">
              <button
                onClick={handleEraseSelection}
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1 transition-colors"
                title="Erase highlighted text"
              >
                <Eraser className="w-3.5 h-3.5" /> Erase Selected
              </button>
              <button
                onClick={handleEraseEmptyLines}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
                title="Erase extra blank lines"
              >
                Clean Spaces
              </button>
              <button
                onClick={handleEraseFormatting}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
                title="Erase all markdown & formatting tags"
              >
                Clear Format
              </button>
            </div>

            {/* Headings & Structure */}
            <div className="flex items-center border-r border-slate-200 dark:border-slate-700 pr-2 mr-1 gap-0.5">
              <button
                onClick={() => insertFormatting('# ', '')}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold"
                title="Heading 1"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertFormatting('## ', '')}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold"
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertFormatting('### ', '')}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold"
                title="Heading 3"
              >
                <Heading3 className="w-4 h-4" />
              </button>
            </div>

            {/* Formatting (Bold, Italic, Lists) */}
            <div className="flex items-center border-r border-slate-200 dark:border-slate-700 pr-2 mr-1 gap-0.5">
              <button
                onClick={() => insertFormatting('**', '**')}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 font-bold"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertFormatting('*', '*')}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 italic"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertFormatting('- ', '')}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertFormatting('1. ', '')}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
            </div>

            {/* Insert Tools */}
            <div className="flex items-center border-r border-slate-200 dark:border-slate-700 pr-2 mr-1 gap-1">
              <button
                onClick={insertPageBreak}
                className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1"
                title="Insert explicit page break for PDF/Word separation"
              >
                <SplitSquareVertical className="w-3.5 h-3.5 text-indigo-600" /> Page Break
              </button>
              <button
                onClick={insertTableTemplate}
                className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1"
                title="Insert formatted Table"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Table
              </button>
            </div>

            {/* Text Alignment */}
            <div className="flex items-center gap-0.5 ml-auto">
              <button
                onClick={() => setTextAlign('left')}
                className={`p-1.5 rounded-lg ${textAlign === 'left' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                title="Align Left"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTextAlign('center')}
                className={`p-1.5 rounded-lg ${textAlign === 'center' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                title="Align Center"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTextAlign('right')}
                className={`p-1.5 rounded-lg ${textAlign === 'right' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                title="Align Right"
              >
                <AlignRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 ml-1 text-slate-500"
                title="Toggle Fullscreen"
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

          </div>

          {/* Interactive Document Page Canvas (A4 Paper Aesthetic) */}
          <div className="bg-slate-100 dark:bg-slate-900/90 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-inner flex justify-center">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 min-h-[600px] p-8 sm:p-12 relative flex flex-col">
              
              {/* Paper Top Rule Indicator */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3 mb-4 text-[10px] text-slate-400 font-mono">
                <span>DOCX / PDF A4 PAGE CANVAS</span>
                <span>EXACT SEQUENTIAL ORDER: PRESERVED</span>
              </div>

              {/* Main Interactive Textarea */}
              <textarea
                ref={textareaRef}
                value={extractedText}
                onChange={(e) => updateContentWithHistory(e.target.value)}
                placeholder="Type or paste document content here... Use tools above to erase words, format headings, or insert page breaks."
                style={{ textAlign }}
                className="w-full flex-1 min-h-[460px] bg-transparent outline-none resize-y font-sans leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              />

              {/* Paper Bottom Footer */}
              <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Page 1 of {Math.max(1, Math.ceil(wordsCount / 350))}</span>
                <span>PDFEditfy Studio Engine</span>
              </div>
            </div>
          </div>

          {/* Professional Conversion & Export Action Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Export & Convert Document
              </h4>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Exact Layout & Order Preserved
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={handleExportDocx}
                disabled={isProcessing || !extractedText.trim()}
                className="py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Export Word (.DOCX)
              </button>

              <button
                onClick={handleConvertToPDF}
                disabled={isProcessing || !extractedText.trim()}
                className="py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Convert to PDF (.PDF)
              </button>

              <button
                onClick={handleExportHtml}
                disabled={isProcessing || !extractedText.trim()}
                className="py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-600 disabled:opacity-50"
              >
                <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Export Web (.HTML)
              </button>

              <button
                onClick={handleExportTxt}
                disabled={!extractedText.trim()}
                className="py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-600 disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Plain Text (.TXT)
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
