import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { readFileAsArrayBuffer } from './pdfProcessor';

export interface SheetData {
  sheetName: string;
  data: (string | number)[][];
}

export async function readExcelFile(file: File): Promise<SheetData[]> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const result: SheetData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 });
    result.push({
      sheetName,
      data: jsonData,
    });
  }

  return result;
}

export function exportSheetToXLSX(sheetData: SheetData[]): Uint8Array {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheetData) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName || 'Sheet1');
  }

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(wbout);
}

export function exportSheetToCSV(sheetData: SheetData): string {
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData.data);
  return XLSX.utils.sheet_to_csv(worksheet);
}

export async function convertExcelToPDF(file: File): Promise<Uint8Array> {
  const sheets = await readExcelFile(file);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });

  sheets.forEach((sheet, idx) => {
    if (idx > 0) doc.addPage();
    doc.setFontSize(16);
    doc.text(sheet.sheetName, 40, 40);

    doc.setFontSize(10);
    let startY = 70;

    sheet.data.slice(0, 40).forEach((row) => {
      if (startY > 540) return;
      const rowText = row.map((cell) => String(cell ?? '')).join(' | ');
      doc.text(rowText.substring(0, 140), 40, startY);
      startY += 18;
    });
  });

  return new Uint8Array(doc.output('arraybuffer'));
}
