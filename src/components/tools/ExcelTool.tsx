import React, { useState, useEffect } from 'react';
import { Upload, Download, Table, ArrowLeft, Grid, RefreshCw, FileText } from 'lucide-react';
import { readExcelFile, exportSheetToXLSX, exportSheetToCSV, convertExcelToPDF, SheetData } from '../../utils/excelProcessor';
import { extractTablesFromPDF } from '../../utils/pdfExtractor';
import { downloadBlob } from '../../utils/batchProcessor';
import { recordToolConversion } from '../../utils/activityTracker';
import { useProgress } from '../../context/ProgressContext';

interface ExcelToolProps {
  toolId?: string;
  onBack: () => void;
  initialFile?: File | null;
}

export const ExcelTool: React.FC<ExcelToolProps> = ({ toolId = 'edit-excel', onBack, initialFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const { startProgress, updateProgress, completeProgress, failProgress } = useProgress();


  const isPdfToExcel = toolId === 'pdf-to-excel';
  const isExcelToPdf = toolId === 'excel-to-pdf';
  const isEditExcel = toolId === 'edit-excel';
  const isCsvConverter = toolId === 'csv-excel-converter';

  const fileAccept = isPdfToExcel ? '.pdf,application/pdf' : '.xlsx,.xls,.csv,.ods';

  const getTitle = () => {
    if (isPdfToExcel) return 'Convert PDF Tables to Excel (.XLSX & CSV)';
    if (isExcelToPdf) return 'Convert Excel & CSV Spreadsheets to PDF';
    if (isEditExcel) return 'Free Online Excel & CSV Spreadsheet Grid Editor';
    if (isCsvConverter) return 'Convert CSV to Excel & Excel to CSV';
    return 'Excel & Spreadsheet Workspace';
  };

  const getSubtitle = () => {
    if (isPdfToExcel) return 'Extract table data from PDF files into fully editable Microsoft Excel spreadsheets.';
    if (isExcelToPdf) return 'Convert XLSX, XLS, and CSV spreadsheets into crisp printable PDF documents.';
    if (isEditExcel) return 'Open, inspect, edit cell values online, and export updated XLSX or CSV spreadsheets.';
    if (isCsvConverter) return 'Seamlessly convert between CSV and Excel formats with UTF-8 encoding support.';
    return 'Fast, private in-browser spreadsheet tools.';
  };

  const processFile = async (selected: File) => {
    setFile(selected);
    setIsProcessing(true);
    setStatusMsg('Parsing spreadsheet data...');

    try {
      if (selected.name.toLowerCase().endsWith('.pdf')) {
        const pdfPagesData = await extractTablesFromPDF(selected);
        const loadedSheets: SheetData[] = pdfPagesData.map((pageRows, idx) => ({
          sheetName: `PDF Page ${idx + 1}`,
          data: pageRows.length > 0 ? pageRows : [['No structured text found']],
        }));
        setSheets(loadedSheets);
      } else {
        const loadedSheets = await readExcelFile(selected);
        setSheets(loadedSheets);
      }
      setActiveSheetIndex(0);
      setStatusMsg('Data parsed successfully');
    } catch (err) {
      console.error('Failed reading file:', err);
      alert('Failed to parse file. Please ensure file format is valid.');
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

  const handleCellEdit = (rowIdx: number, colIdx: number, val: string) => {
    const updatedSheets = [...sheets];
    const currentData = [...updatedSheets[activeSheetIndex].data];
    if (!currentData[rowIdx]) currentData[rowIdx] = [];
    currentData[rowIdx] = [...currentData[rowIdx]];
    currentData[rowIdx][colIdx] = val;
    updatedSheets[activeSheetIndex].data = currentData;
    setSheets(updatedSheets);
  };

  const handleExportXLSX = async () => {
    if (sheets.length === 0) return;
    setIsProcessing(true);
    startProgress({
      title: 'Compiling Excel (.XLSX) Workbook',
      status: `Formatting ${sheets.length} worksheet${sheets.length > 1 ? 's' : ''}...`,
      stage: 'Building OpenXML Worksheets'
    });

    try {
      updateProgress(40, 'Writing rows, cells, and formula references...', 'ExcelJS Encoding');
      const bytes = await exportSheetToXLSX(sheets);
      updateProgress(90, 'Packaging workbook into zip package...', 'Finalizing XLSX');

      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const cleanName = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'spreadsheet';
      recordToolConversion(toolId, file?.size || blob.size);
      downloadBlob(blob, `${cleanName}_exported.xlsx`);
      completeProgress('Exported .XLSX workbook successfully!');
    } catch (err: any) {
      console.error('XLSX export failed:', err);
      failProgress(err?.message || 'Failed to export Excel file.');
      alert('Failed to export Excel file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = () => {
    if (!sheets[activeSheetIndex]) return;
    const csvString = exportSheetToCSV(sheets[activeSheetIndex]);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    const sheetName = sheets[activeSheetIndex].sheetName || 'sheet';
    recordToolConversion(toolId, file?.size || blob.size);
    downloadBlob(blob, `${sheetName}.csv`);
  };

  const handleExportPDF = async () => {
    if (!file) return;
    setIsProcessing(true);
    startProgress({
      title: 'Converting Spreadsheet to PDF',
      status: `Generating printable table grid for "${file.name}"...`,
      stage: 'Vector Table Rendering'
    });

    try {
      updateProgress(45, 'Calculating column widths and grid layout...', 'PDF Layout Processing');
      const pdfBytes = await convertExcelToPDF(file);
      updateProgress(90, 'Generating printable PDF document...', 'Writing PDF Stream');

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      recordToolConversion(toolId, file.size);
      downloadBlob(blob, `${cleanName}_converted.pdf`);
      completeProgress('Converted spreadsheet to PDF document!');
    } catch (err: any) {
      console.error('Excel to PDF failed:', err);
      failProgress(err?.message || 'Failed to generate PDF from spreadsheet.');
      alert('Failed to generate PDF from spreadsheet.');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentSheet = sheets[activeSheetIndex];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      
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
            <Table className="w-5 h-5 text-indigo-600" /> {getTitle()}
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
            Upload Spreadsheet or File
          </h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            {isPdfToExcel ? 'Select a PDF document containing table data.' : 'Select an XLSX, XLS, or CSV file.'}
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 cursor-pointer transition-all">
            <Upload className="w-4 h-4" /> Select File
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
                📊 {file.name}
              </h4>
              <p className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB {statusMsg && `• ${statusMsg}`}
              </p>
            </div>
            <button
              onClick={() => { setFile(null); setSheets([]); }}
              className="text-xs font-bold text-rose-500 hover:underline"
            >
              Change File
            </button>
          </div>

          {/* Sheet Selector Tabs */}
          {sheets.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-700">
              {sheets.map((sheet, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSheetIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeSheetIndex === idx
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {sheet.sheetName || `Sheet ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Data Table Preview Grid */}
          {currentSheet && (
            <div className="overflow-x-auto max-h-[400px] border border-slate-200 dark:border-slate-700 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentSheet.data.slice(0, 50).map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-100 dark:bg-slate-900 font-bold' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-700 bg-slate-200/50 dark:bg-slate-800 text-slate-400 font-mono text-[10px] w-8 text-center">
                        {rIdx + 1}
                      </td>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 border-r border-slate-100 dark:border-slate-800 min-w-[100px]">
                          <input
                            type="text"
                            value={String(cell ?? '')}
                            onChange={(e) => handleCellEdit(rIdx, cIdx, e.target.value)}
                            className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200 focus:bg-indigo-50 dark:focus:bg-indigo-950/50 px-1 rounded"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Export Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={handleExportXLSX}
              disabled={isProcessing || sheets.length === 0}
              className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Download Excel (.XLSX)
            </button>
            <button
              onClick={handleExportCSV}
              disabled={isProcessing || !currentSheet}
              className="py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Download CSV (.CSV)
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isProcessing}
              className="py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-600"
            >
              <Download className="w-4 h-4" /> Download PDF (.PDF)
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
