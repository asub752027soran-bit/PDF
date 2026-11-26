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

export async function convertExcelToPDF(fileOrSheets: File | SheetData[]): Promise<Uint8Array> {
  const sheets = Array.isArray(fileOrSheets) ? fileOrSheets : await readExcelFile(fileOrSheets);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 36;
  const marginTop = 48;
  const marginBottom = 40;
  const usableWidth = pageWidth - marginX * 2;

  let pageNumber = 0;

  sheets.forEach((sheet, sheetIdx) => {
    const rows = (sheet.data || []).filter((r) => r.some((cell) => String(cell ?? '').trim() !== ''));
    const safeRows = rows.length > 0 ? rows : [['Empty Sheet']];
    const maxCols = Math.max(1, ...safeRows.map((r) => r.length));
    const displayCols = Math.min(maxCols, 14);
    const colWidth = usableWidth / displayCols;

    const addSheetHeader = (continued: boolean) => {
      if (pageNumber > 0) doc.addPage();
      pageNumber++;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      const title = continued
        ? `${sheet.sheetName || `Sheet ${sheetIdx + 1}`} (continued)`
        : sheet.sheetName || `Sheet ${sheetIdx + 1}`;
      doc.text(title, marginX, 30);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Page ${pageNumber}`, pageWidth - marginX - 35, 30);
    };

    addSheetHeader(false);
    let currentY = marginTop;
    const headerRow = safeRows[0];

    const drawRow = (row: (string | number)[], isHeader: boolean) => {
      doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
      doc.setFontSize(isHeader ? 9 : 8.5);

      const cellTexts: string[][] = [];
      let maxLines = 1;
      for (let c = 0; c < displayCols; c++) {
        const rawVal = String(row[c] ?? '').trim();
        const wrapped = doc.splitTextToSize(rawVal || ' ', Math.max(24, colWidth - 10));
        const capped = wrapped.slice(0, 6);
        cellTexts.push(capped);
        if (capped.length > maxLines) maxLines = capped.length;
      }

      const rowHeight = Math.max(18, maxLines * 11 + 8);

      if (currentY + rowHeight > pageHeight - marginBottom) {
        addSheetHeader(true);
        currentY = marginTop;
        if (!isHeader && headerRow) {
          drawRow(headerRow, true);
        }
      }

      if (isHeader) {
        doc.setFillColor(241, 245, 249);
        doc.rect(marginX, currentY, usableWidth, rowHeight, 'F');
      }

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.rect(marginX, currentY, usableWidth, rowHeight, 'S');

      for (let c = 0; c < displayCols; c++) {
        const cellX = marginX + c * colWidth;
        if (c > 0) {
          doc.line(cellX, currentY, cellX, currentY + rowHeight);
        }
        doc.setTextColor(isHeader ? 15 : 51, isHeader ? 23 : 65, isHeader ? 42 : 85);
        cellTexts[c].forEach((lineStr, lineIdx) => {
          doc.text(lineStr, cellX + 5, currentY + 12 + lineIdx * 11);
        });
      }

      currentY += rowHeight;
    };

    safeRows.forEach((row, rIdx) => {
      drawRow(row, rIdx === 0);
    });
  });

  return new Uint8Array(doc.output('arraybuffer'));
}

