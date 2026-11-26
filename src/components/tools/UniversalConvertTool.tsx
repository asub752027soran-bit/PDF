import React, { useState, useEffect } from 'react';
import {
  Upload,
  Layers,
  ArrowLeft,
  Archive,
  AlertCircle,
  X
} from 'lucide-react';
import { createZipArchive, downloadBlob } from '../../utils/batchProcessor';
import { recordToolConversion } from '../../utils/activityTracker';
import {
  convertWordToPDF,
  extractDocxHtml,
  extractPptxSlides,
  exportTextToDocxBlob
} from '../../utils/docProcessor';
import { readExcelFile, exportSheetToCSV, convertExcelToPDF } from '../../utils/excelProcessor';
import { extractTextFromPDF, renderPDFToImages } from '../../utils/pdfExtractor';
import { imagesToPDF } from '../../utils/pdfProcessor';
import { processImage } from '../../utils/imageProcessor';
import { MultiFilePreviewList } from '../common/MultiFilePreviewList';
import { useProgress } from '../../context/ProgressContext';

interface UniversalConvertToolProps {
  onBack: () => void;
  initialFiles?: File[] | null;
  initialFile?: File | null;
}

export const UniversalConvertTool: React.FC<UniversalConvertToolProps> = ({ onBack, initialFiles, initialFile }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>('pdf');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { startProgress, updateProgress, setItemsProgress, completeProgress, failProgress } = useProgress();

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setFiles((prev) => [...prev, ...initialFiles]);
    } else if (initialFile) {
      setFiles((prev) => [...prev, initialFile]);
    }
  }, [initialFiles, initialFile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      setErrorMsg(null);
    }
    e.target.value = '';
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
    setErrorMsg(null);

    startProgress({
      title: `Batch Converting to ${targetFormat.toUpperCase()}`,
      status: `Preparing ${files.length} document${files.length > 1 ? 's' : ''}...`,
      stage: 'Initialization',
      totalItems: files.length,
      itemsProcessed: 0
    });

    try {
      const convertedFiles: { name: string; data: Uint8Array | Blob | string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        const extension = file.name.split('.').pop()?.toLowerCase() || '';

        setItemsProgress(
          i,
          files.length,
          `Converting "${file.name}" to .${targetFormat}...`,
          `Processing ${i + 1}/${files.length}`
        );

        const prefix = files.length > 1 ? `${String(i + 1).padStart(2, '0')}_` : '';

        if (targetFormat === 'pdf') {
          let data: Uint8Array;
          if (extension === 'docx' || extension === 'doc' || extension === 'pptx' || extension === 'ppt' || extension === 'odp') {
            data = await convertWordToPDF(file);
          } else if (['xlsx', 'xls', 'csv', 'tsv', 'ods'].includes(extension)) {
            data = await convertExcelToPDF(file);
          } else if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'svg', 'gif'].includes(extension)) {
            data = await imagesToPDF([file]);
          } else if (extension === 'pdf') {
            data = new Uint8Array(await file.arrayBuffer());
          } else {
            const text = await file.text();
            data = await convertWordToPDF(text, { title: cleanName });
          }
          convertedFiles.push({ name: `${prefix}${cleanName}.pdf`, data });
        } else if (targetFormat === 'docx') {
          let data: Uint8Array | Blob;
          if (extension === 'docx') {
            data = new Uint8Array(await file.arrayBuffer());
          } else if (extension === 'pdf') {
            const pages = await extractTextFromPDF(file);
            const fullText = pages.map((p) => `# Page ${p.pageNumber}\n\n${p.text}`).join('\n\n');
            data = await exportTextToDocxBlob(fullText, { title: cleanName });
          } else if (['pptx', 'ppt', 'odp'].includes(extension)) {
            const slidesText = await extractPptxSlides(file);
            data = await exportTextToDocxBlob(slidesText, { title: cleanName });
          } else if (['xlsx', 'xls', 'csv'].includes(extension)) {
            const sheets = await readExcelFile(file);
            const csvText = sheets.map((s) => `# ${s.sheetName}\n\n${exportSheetToCSV(s)}`).join('\n\n');
            data = await exportTextToDocxBlob(csvText, { title: cleanName });
          } else {
            const rawText = await file.text();
            data = await exportTextToDocxBlob(rawText, { title: cleanName });
          }
          convertedFiles.push({ name: `${prefix}${cleanName}.docx`, data });
        } else if (targetFormat === 'txt') {
          let textOut = '';
          if (extension === 'docx' || extension === 'doc') {
            const extracted = await extractDocxHtml(file);
            textOut = extracted.text;
          } else if (['pptx', 'ppt', 'odp'].includes(extension)) {
            textOut = await extractPptxSlides(file);
          } else if (['xlsx', 'xls', 'csv'].includes(extension)) {
            const sheets = await readExcelFile(file);
            textOut = sheets.map((s) => `--- ${s.sheetName} ---\n${exportSheetToCSV(s)}`).join('\n\n');
          } else if (extension === 'pdf') {
            const pages = await extractTextFromPDF(file);
            textOut = pages.map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`).join('\n\n');
          } else {
            textOut = await file.text();
          }
          convertedFiles.push({ name: `${prefix}${cleanName}.txt`, data: textOut });
        } else if (targetFormat === 'png' || targetFormat === 'jpg' || targetFormat === 'webp') {
          const imgFmt = targetFormat === 'jpg' ? 'jpeg' : (targetFormat as 'png' | 'webp');
          if (extension === 'pdf') {
            const renderFmt = targetFormat === 'png' ? 'png' : 'jpeg';
            const pageImgs = await renderPDFToImages(file, renderFmt, 2.0);
            for (const pg of pageImgs) {
              let outBlob = pg.blob;
              if (targetFormat === 'webp') {
                const pgFile = new File([pg.blob], `${cleanName}_page_${pg.pageNumber}.png`, { type: 'image/png' });
                const conv = await processImage(pgFile, { format: 'webp', quality: 0.9 });
                outBlob = conv.blob;
              }
              convertedFiles.push({
                name: `${prefix}${cleanName}_page_${pg.pageNumber}.${targetFormat}`,
                data: outBlob,
              });
            }
          } else if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'svg', 'gif', 'ico'].includes(extension) || file.type.startsWith('image/')) {
            const res = await processImage(file, { format: imgFmt, quality: 0.9 });
            convertedFiles.push({
              name: `${prefix}${cleanName}.${targetFormat}`,
              data: res.blob,
            });
          } else {
            throw new Error(`Cannot convert "${file.name}" to an image format. Upload PDF or image files for image conversion.`);
          }
        } else {
          convertedFiles.push({
            name: `${prefix}${cleanName}.${targetFormat}`,
            data: new Uint8Array(await file.arrayBuffer()),
          });
        }

        const currentPct = Math.round(((i + 1) / files.length) * 90);
        setProgress(currentPct);
        setItemsProgress(
          i + 1,
          files.length,
          `Converted ${i + 1} of ${files.length} files`,
          `Packaging files`
        );
      }

      updateProgress(95, 'Generating download archive ZIP...', 'Packaging ZIP');
      const zipBlob = await createZipArchive(convertedFiles);
      const totalSize = files.reduce((acc, f) => acc + f.size, 0);
      recordToolConversion('universal-converter', totalSize || zipBlob.size);
      downloadBlob(zipBlob, `converted_batch_${targetFormat}_files.zip`);

      completeProgress(`Successfully converted ${files.length} document${files.length > 1 ? 's' : ''}!`);
    } catch (err: any) {
      console.error('Batch conversion failed:', err);
      const msg = err?.message || 'Batch conversion error. Please check your input files.';
      failProgress(msg);
      setErrorMsg(msg);
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
            Upload multiple documents or images, arrange sequence order, and convert cleanly in bulk.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-10 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <Upload className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Select Multiple Batch Files
        </h3>
        <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
          Drop PDF, Word (.docx), Excel (.xlsx/.csv), PowerPoint (.pptx), TXT, or Image files.
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
        <div className="space-y-6">
          <MultiFilePreviewList
            files={files}
            onRemoveFile={removeFile}
            onMoveFile={moveFile}
            onClearAll={() => { setFiles([]); setErrorMsg(null); }}
            onSortAlphabetical={sortAlphabetical}
            onReverseOrder={reverseOrder}
            title="Batch Files Queue & Visual Preview"
          />

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
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
              <option value="pdf">PDF Document (.pdf) — Professional Layout & Sequence</option>
              <option value="docx">Word Document (.docx) — Editable Typography</option>
              <option value="txt">Plain Text (.txt) — Clean Text Extraction</option>
              <option value="png">PNG Images (.png) — High-Res Lossless Pages/Images</option>
              <option value="jpg">JPG Images (.jpg) — Lightweight Photos/Pages</option>
              <option value="webp">WEBP Images (.webp) — Web-Optimized Images</option>
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
                Converting Batch Files ({progress}%)...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" /> Convert {files.length} File{files.length > 1 ? 's' : ''} & Download ZIP
              </>
            )}
          </button>
        </div>
      </div>
      )}

    </div>
  );
};
