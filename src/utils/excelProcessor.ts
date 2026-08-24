import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import { readFileAsArrayBuffer } from './pdfProcessor';

export interface SheetData {
  sheetName: string;
  data: (string | number)[][];
}

/**
 * Parses raw CSV or TSV text into 2D array with quote support
 */
function parseDelimitedText(text: string, delimiter: string = ','): (string | number)[][] {
  const lines = text.split(/\r\n|\n|\r/);
  const rows: (string | number)[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    
    const row: (string | number)[] = [];
    let insideQuotes = false;
    let currentField = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        const trimmed = currentField.trim();
        const num = Number(trimmed);
        row.push(trimmed !== '' && !isNaN(num) ? num : currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }
    const trimmed = currentField.trim();
    const num = Number(trimmed);
    row.push(trimmed !== '' && !isNaN(num) ? num : currentField);
    rows.push(row);
  }

  return rows;
}

export async function readExcelFile(file: File): Promise<SheetData[]> {
  const fileName = file.name.toLowerCase();
  
  // Direct CSV or TSV Handling
  if (fileName.endsWith('.csv') || fileName.endsWith('.tsv') || fileName.endsWith('.txt')) {
    const rawText = await file.text();
    const delimiter = fileName.endsWith('.tsv') ? '\t' : ',';
    const parsedData = parseDelimitedText(rawText, delimiter);
    const cleanSheetName = file.name.replace(/\.[^/.]+$/, '');
    return [
      {
        sheetName: cleanSheetName || 'Sheet1',
        data: parsedData.length > 0 ? parsedData : [['No data in CSV file']]
      }
    ];
  }

  try {
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
        data: sheetData.length > 0 ? sheetData : [['']]
      });
    });

    return result.length > 0 ? result : [{ sheetName: 'Sheet1', data: [['']] }];
  } catch (err) {
    // If workbook load fails, try reading as text CSV fallback
    try {
      const rawText = await file.text();
      const parsedData = parseDelimitedText(rawText, ',');
      if (parsedData.length > 0) {
        return [
          {
            sheetName: file.name.replace(/\.[^/.]+$/, '') || 'Sheet1',
            data: parsedData
          }
        ];
      }
    } catch {
      // ignore
    }
    throw err;
  }
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
