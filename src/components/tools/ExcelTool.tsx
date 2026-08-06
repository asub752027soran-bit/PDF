import React, { useState } from 'react';
import { Upload, Download, Table, ArrowLeft, Grid, FileCheck, RefreshCw } from 'lucide-react';
import { readExcelFile, exportSheetToXLSX, exportSheetToCSV, convertExcelToPDF, SheetData } from '../../utils/excelProcessor';
import { downloadBlob } from '../../utils/batchProcessor';

interface ExcelToolProps {
  onBack: () => void;
}

export const ExcelTool: React.FC<ExcelToolProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setIsProcessing(true);
      try {
        const loadedSheets = await readExcelFile(selected);
        setSheets(loadedSheets);
        setActiveSheetIndex(0);
      } catch (err) {
        console.error('Failed reading spreadsheet:', err);
        alert('Failed to parse spreadsheet file.');
      } finally {
        setIsProcessing(false);
      }
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

  const handleExportXLSX = () => {
    const bytes = exportSheetToXLSX(sheets);
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadBlob(blob, `${file?.name.replace(/\.(xlsx|xls|csv)$/i, '') || 'spreadsheet'}_edited.xlsx`);
  };

  const handleExportCSV = () => {
    if (!sheets[activeSheetIndex]) return;
    const csvString = exportSheetToCSV(sheets[activeSheetIndex]);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `${sheets[activeSheetIndex].sheetName || 'sheet'}.csv`);
  };

  const handleExportPDF = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const pdfBytes = await convertExcelToPDF(file);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      downloadBlob(blob, `${file.name.replace(/\.(xlsx|xls|csv)$/i, '')}.pdf`);
    } catch (err) {
      console.error('Excel to PDF failed:', err);
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
            <Table className="w-5 h-5 text-indigo-600" /> Excel & CSV Spreadsheet Grid Editor
          </h1>
          <p className="text-xs text-slate-500">
            Open, inspect, edit cells online, and convert between XLSX, CSV, and PDF.
          </p>
        </div>
      </div>

      {!file ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-10 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Upload Excel or CSV File (.XLSX, .XLS, .CSV)
          </h3>
          <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
            Zero sign-up required. View and edit tables directly in your browser.
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer transition-all">
            <Upload className="w-4 h-4" /> Choose Spreadsheet
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.ods"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">
                📊 {file.name}
              </h4>
              <p className="text-xs text-slate-500">
                {sheets.length} Sheet(s) loaded
              </p>
            </div>

            {/* Export Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportXLSX}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow hover:bg-indigo-500 transition-all flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Save XLSX
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
              <button
                onClick={() => setFile(null)}
                className="text-xs font-bold text-rose-500 hover:underline px-2"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Sheet Selector Tabs */}
          {sheets.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-700">
              {sheets.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSheetIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeSheetIndex === idx
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-300/50'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {s.sheetName || `Sheet ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Interactive Spreadsheet Grid Table */}
          {currentSheet && (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl max-h-[450px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-2.5 w-12 text-center border-r border-slate-200 dark:border-slate-700 bg-slate-200/50 dark:bg-slate-800/80">
                      #
                    </th>
                    {currentSheet.data[0]?.map((_, colIdx) => (
                      <th
                        key={colIdx}
                        className="p-2.5 min-w-[120px] border-r border-slate-200 dark:border-slate-700 text-center font-mono text-[11px]"
                      >
                        {String.fromCharCode(65 + (colIdx % 26))}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentSheet.data.slice(0, 100).map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                    >
                      <td className="p-2 text-center font-mono text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                        {rowIdx + 1}
                      </td>
                      {row.map((cell, colIdx) => (
                        <td
                          key={colIdx}
                          className="p-1 border-r border-slate-200 dark:border-slate-700"
                        >
                          <input
                            type="text"
                            value={String(cell ?? '')}
                            onChange={(e) => handleCellEdit(rowIdx, colIdx, e.target.value)}
                            className="w-full px-2 py-1 bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-indigo-500 rounded outline-none"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
