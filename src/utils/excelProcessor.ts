import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import { readFileAsArrayBuffer } from './pdfProcessor';

export interface SheetData {
  sheetName: string;
  data: (string | number)[][];
}

export async function readExcelFile(file: File): Promise<SheetData[]> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const result: SheetData[] = [];

  workbook.eachSheet((worksheet) => {
    const sheetData: (string | number)[][] = [];
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const rowValues = Array.isArray(row.values)
        ? row.values.slice(1).map((val) => {
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') {
              if ('result' in val) return String((val as any).result ?? '');
              if ('text' in val) return String((val as any).text ?? '');
              if ('richText' in val) return (val as any).richText.map((rt: any) => rt.text).join('');
            }
            return val as string | number;
          })
        : [];
      sheetData.push(rowValues);
    });
    result.push({
      sheetName: worksheet.name,
      data: sheetData,
    });
  });

  return result;
}

export async function exportSheetToXLSX(sheetData: SheetData[]): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheetData) {
    const worksheet = workbook.addWorksheet(sheet.sheetName || 'Sheet1');
    for (const row of sheet.data) {
      worksheet.addRow(row);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

export function exportSheetToCSV(sheetData: SheetData): string {
  return sheetData.data
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
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
