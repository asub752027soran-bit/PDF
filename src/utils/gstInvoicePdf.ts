import { jsPDF } from 'jspdf';

export interface GSTInvoiceItem {
  id: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  rate: number;
  cgstRate: number;
  sgstRate: number;
}

export interface GSTInvoiceData {
  // Seller / Company
  logoDataUrl: string | null;
  sellerName: string;
  sellerGstin: string;
  sellerAddress: string;
  sellerPhone: string;
  sellerEmail: string;

  // Invoice Metadata
  invoiceTitle: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  placeOfSupply: string;
  currencySymbol: string;

  // Buyer / Bill To
  buyerName: string;
  buyerGstin: string;
  buyerAddress: string;
  buyerPhone: string;
  buyerDescription: string;

  // Line Items
  items: GSTInvoiceItem[];

  // Bank Details
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  upiId: string;

  // Totals & Notes
  roundOffEnabled: boolean;
  termsAndConditions: string;

  // Authorised Signature
  signatoryCompany: string;
  signatoryName: string;
  signatureDataUrl: string | null;
}

export interface CalculatedItem extends GSTInvoiceItem {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
}

export interface GSTInvoiceTotals {
  items: CalculatedItem[];
  totalQuantity: number;
  subTotal: number;
  totalCgst: number;
  totalSgst: number;
  totalTax: number;
  exactTotal: number;
  roundOff: number;
  grandTotal: number;
}

export const UNIT_OPTIONS = [
  'Pc',
  'Pcs',
  'Nos',
  'Box',
  'Set',
  'Pair',
  'Kg',
  'Gm',
  'Ltr',
  'Mtr',
  'Sqft',
  'Hrs',
  'Days',
  'Service',
];

export const CURRENCY_OPTIONS = [
  { symbol: '₹', label: 'INR (₹)', pdfPrefix: 'Rs. ' },
  { symbol: '$', label: 'USD ($)', pdfPrefix: '$' },
  { symbol: '€', label: 'EUR (€)', pdfPrefix: 'EUR ' },
  { symbol: '£', label: 'GBP (£)', pdfPrefix: 'GBP ' },
];

export const getDefaultGSTInvoiceData = (): GSTInvoiceData => {
  const today = new Date().toISOString().split('T')[0];
  const due = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    logoDataUrl: null,
    sellerName: 'Apex Enterprises Pvt. Ltd.',
    sellerGstin: '27AABCU9603R1ZM',
    sellerAddress: 'Plot 42, Industrial Estate, Andheri East, Mumbai, Maharashtra - 400069',
    sellerPhone: '+91 98765 43210',
    sellerEmail: 'billing@apexenterprises.in',

    invoiceTitle: 'TAX INVOICE',
    invoiceNumber: 'INV-2026-001',
    invoiceDate: today,
    dueDate: due,
    placeOfSupply: 'Maharashtra (27)',
    currencySymbol: '₹',

    buyerName: 'Horizon Retail & Trading Co.',
    buyerGstin: '27AAACH7409R1ZZ',
    buyerAddress: 'Suite 14, Trade Tower, MG Road, Pune, Maharashtra - 411001',
    buyerPhone: '+91 98220 11223',
    buyerDescription: 'Purchase Order: PO-2026-118 • Retail POS Hardware Supply',

    items: [
      {
        id: 'item-1',
        description: 'Wireless Barcode Scanner Pro (Model BS-400)',
        hsnSac: '847160',
        quantity: 5,
        unit: 'Pc',
        rate: 2400,
        cgstRate: 9,
        sgstRate: 9,
      },
      {
        id: 'item-2',
        description: 'Thermal Receipt Printer Rolls (80mm Pack)',
        hsnSac: '481190',
        quantity: 10,
        unit: 'Box',
        rate: 450,
        cgstRate: 6,
        sgstRate: 6,
      },
    ],

    bankName: 'HDFC Bank Ltd.',
    accountHolderName: 'Apex Enterprises Pvt. Ltd.',
    accountNumber: '50200048192034',
    ifscCode: 'HDFC0000142',
    branchName: 'Andheri East, Mumbai',
    upiId: 'apexenterprises@hdfcbank',

    roundOffEnabled: true,
    termsAndConditions:
      '1. Goods once sold will not be taken back.\n2. Payment is due within 15 days from the invoice date.\n3. Subject to Mumbai Jurisdiction only.',

    signatoryCompany: 'Apex Enterprises Pvt. Ltd.',
    signatoryName: 'Authorised Signatory',
    signatureDataUrl: null,
  };
};

export const getEmptyGSTInvoiceData = (): GSTInvoiceData => {
  const today = new Date().toISOString().split('T')[0];
  return {
    logoDataUrl: null,
    sellerName: '',
    sellerGstin: '',
    sellerAddress: '',
    sellerPhone: '',
    sellerEmail: '',

    invoiceTitle: 'TAX INVOICE',
    invoiceNumber: 'INV-001',
    invoiceDate: today,
    dueDate: '',
    placeOfSupply: '',
    currencySymbol: '₹',

    buyerName: '',
    buyerGstin: '',
    buyerAddress: '',
    buyerPhone: '',
    buyerDescription: '',

    items: [
      {
        id: `item-${Date.now()}`,
        description: '',
        hsnSac: '',
        quantity: 1,
        unit: 'Pc',
        rate: 0,
        cgstRate: 9,
        sgstRate: 9,
      },
    ],

    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    upiId: '',

    roundOffEnabled: true,
    termsAndConditions: '1. Payment due upon receipt.\n2. Thank you for your business.',

    signatoryCompany: '',
    signatoryName: 'Authorised Signatory',
    signatureDataUrl: null,
  };
};

export const calculateGSTInvoiceTotals = (data: GSTInvoiceData): GSTInvoiceTotals => {
  let totalQuantity = 0;
  let subTotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;

  const items: CalculatedItem[] = data.items.map((item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const rate = Math.max(0, Number(item.rate) || 0);
    const cgstRate = Math.max(0, Number(item.cgstRate) || 0);
    const sgstRate = Math.max(0, Number(item.sgstRate) || 0);

    const taxableAmount = qty * rate;
    const cgstAmount = (taxableAmount * cgstRate) / 100;
    const sgstAmount = (taxableAmount * sgstRate) / 100;
    const totalAmount = taxableAmount + cgstAmount + sgstAmount;

    totalQuantity += qty;
    subTotal += taxableAmount;
    totalCgst += cgstAmount;
    totalSgst += sgstAmount;

    return {
      ...item,
      quantity: qty,
      rate,
      cgstRate,
      sgstRate,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      totalAmount,
    };
  });

  const totalTax = totalCgst + totalSgst;
  const exactTotal = subTotal + totalTax;
  const roundOff = data.roundOffEnabled ? Math.round(exactTotal) - exactTotal : 0;
  const grandTotal = exactTotal + roundOff;

  return {
    items,
    totalQuantity,
    subTotal,
    totalCgst,
    totalSgst,
    totalTax,
    exactTotal,
    roundOff,
    grandTotal,
  };
};

export const formatMoney = (amount: number, symbol = '₹'): string => {
  const safeNum = Number.isFinite(amount) ? amount : 0;
  const locale = symbol === '₹' ? 'en-IN' : 'en-US';
  return `${symbol}${safeNum.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatPdfMoney = (amount: number, symbol = '₹'): string => {
  const safeNum = Number.isFinite(amount) ? amount : 0;
  const locale = symbol === '₹' ? 'en-IN' : 'en-US';
  const prefix =
    CURRENCY_OPTIONS.find((c) => c.symbol === symbol)?.pdfPrefix ?? `${symbol} `;
  return `${prefix}${safeNum.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function twoDigitWords(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return `${TENS[ten]}${one ? ` ${ONES[one]}` : ''}`;
}

function threeDigitWords(n: number): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundred > 0) parts.push(`${ONES[hundred]} Hundred`);
  if (rest > 0) parts.push(twoDigitWords(rest));
  return parts.join(' ');
}

export const amountToWords = (amount: number, currencySymbol = '₹'): string => {
  const safe = Math.max(0, Number.isFinite(amount) ? amount : 0);
  const whole = Math.floor(safe);
  const fraction = Math.round((safe - whole) * 100);

  const majorUnit =
    currencySymbol === '₹'
      ? 'Rupees'
      : currencySymbol === '$'
      ? 'Dollars'
      : currencySymbol === '€'
      ? 'Euros'
      : currencySymbol === '£'
      ? 'Pounds'
      : 'Units';

  const minorUnit =
    currencySymbol === '₹'
      ? 'Paise'
      : currencySymbol === '£'
      ? 'Pence'
      : 'Cents';

  if (whole === 0 && fraction === 0) {
    return `${majorUnit} Zero Only`;
  }

  const convertIndianWhole = (num: number): string => {
    if (num === 0) return 'Zero';
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const rest = num % 1000;

    const parts: string[] = [];
    if (crore > 0) parts.push(`${convertIndianWhole(crore)} Crore`);
    if (lakh > 0) parts.push(`${twoDigitWords(lakh)} Lakh`);
    if (thousand > 0) parts.push(`${twoDigitWords(thousand)} Thousand`);
    if (rest > 0) parts.push(threeDigitWords(rest));
    return parts.join(' ').trim();
  };

  let result = `${majorUnit} ${convertIndianWhole(whole)}`;
  if (fraction > 0) {
    result += ` and ${twoDigitWords(fraction)} ${minorUnit}`;
  }
  return `${result} Only`;
};

function normalizeImageForPdf(
  dataUrl: string
): Promise<{ pngDataUrl: string; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const naturalW = img.naturalWidth || 240;
        const naturalH = img.naturalHeight || 120;
        const maxDim = 800;
        const scale = Math.min(1, maxDim / Math.max(naturalW, naturalH));
        const w = Math.max(1, Math.round(naturalW * scale));
        const h = Math.max(1, Math.round(naturalH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve({
          pngDataUrl: canvas.toDataURL('image/png'),
          width: w,
          height: h,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export const generateGSTInvoicePDF = async (data: GSTInvoiceData): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totals = calculateGSTInvoiceTotals(data);
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm

  let y = margin;

  // Outer Frame Border (Top & Header Box)
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.35);

  // Header Accent Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 10, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text((data.invoiceTitle || 'TAX INVOICE').toUpperCase(), margin + 4, y + 6.7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('ORIGINAL FOR RECIPIENT', pageWidth - margin - 4, y + 6.5, { align: 'right' });

  y += 10;

  // Seller & Invoice Meta Split Block
  const sellerBoxStartY = y;
  const leftColWidth = 108;
  const rightColWidth = contentWidth - leftColWidth; // 78mm
  const rightColX = margin + leftColWidth;

  let leftY = y + 5;
  let textStartX = margin + 4;

  // Logo Placement (if provided)
  if (data.logoDataUrl) {
    try {
      const normalizedLogo = await normalizeImageForPdf(data.logoDataUrl);
      if (normalizedLogo) {
        const maxLogoW = 24;
        const maxLogoH = 20;
        const ratio = Math.min(maxLogoW / normalizedLogo.width, maxLogoH / normalizedLogo.height);
        const drawW = normalizedLogo.width * ratio;
        const drawH = normalizedLogo.height * ratio;
        doc.addImage(normalizedLogo.pngDataUrl, 'PNG', margin + 4, leftY - 1, drawW, drawH);
        textStartX = margin + 4 + drawW + 4;
      }
    } catch {
      // Ignore logo embed issues silently
    }
  }

  const sellerTextWidth = margin + leftColWidth - textStartX - 3;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  const sellerNameLines = doc.splitTextToSize(data.sellerName || 'Seller / Business Name', sellerTextWidth);
  doc.text(sellerNameLines, textStartX, leftY + 2);
  leftY += sellerNameLines.length * 4.8 + 1;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  if (data.sellerGstin) {
    doc.setFont('helvetica', 'bold');
    doc.text(`GSTIN: ${data.sellerGstin}`, textStartX, leftY + 2);
    doc.setFont('helvetica', 'normal');
    leftY += 4.5;
  }

  if (data.sellerAddress) {
    const addrLines = doc.splitTextToSize(data.sellerAddress, sellerTextWidth);
    doc.text(addrLines, textStartX, leftY + 2);
    leftY += addrLines.length * 3.9 + 1;
  }

  const contactParts = [
    data.sellerPhone ? `Ph: ${data.sellerPhone}` : '',
    data.sellerEmail ? `Email: ${data.sellerEmail}` : '',
  ].filter(Boolean);
  if (contactParts.length > 0) {
    const contactLines = doc.splitTextToSize(contactParts.join(' | '), sellerTextWidth);
    doc.text(contactLines, textStartX, leftY + 2);
    leftY += contactLines.length * 3.9 + 1;
  }

  // Right Meta Details
  let rightY = y + 6;
  const metaRows: [string, string][] = [
    ['Invoice No.:', data.invoiceNumber || '-'],
    ['Invoice Date:', data.invoiceDate || '-'],
  ];
  if (data.dueDate) metaRows.push(['Due Date:', data.dueDate]);
  if (data.placeOfSupply) metaRows.push(['Place of Supply:', data.placeOfSupply]);

  metaRows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(100, 116, 139);
    doc.text(label, rightColX + 4, rightY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const valLines = doc.splitTextToSize(val, rightColWidth - 34);
    doc.text(valLines, pageWidth - margin - 4, rightY, { align: 'right' });
    rightY += Math.max(5.2, valLines.length * 4.2 + 1.2);
  });

  const headerBlockHeight = Math.max(leftY - sellerBoxStartY + 4, rightY - sellerBoxStartY + 3, 28);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, sellerBoxStartY, leftColWidth, headerBlockHeight);
  doc.rect(rightColX, sellerBoxStartY, rightColWidth, headerBlockHeight);

  y = sellerBoxStartY + headerBlockHeight;

  // Buyer / Bill To Block
  const buyerStartY = y;
  let buyerY = y + 5;
  doc.setFillColor(248, 250, 252);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('BILL TO (BUYER DETAILS)', margin + 4, buyerY);
  buyerY += 4.8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(data.buyerName || 'Customer / Buyer Name', margin + 4, buyerY);
  buyerY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  if (data.buyerGstin) {
    doc.setFont('helvetica', 'bold');
    doc.text(`GSTIN: ${data.buyerGstin}`, margin + 4, buyerY);
    doc.setFont('helvetica', 'normal');
    buyerY += 4.3;
  }

  if (data.buyerAddress) {
    const bAddrLines = doc.splitTextToSize(data.buyerAddress, contentWidth - 8);
    doc.text(bAddrLines, margin + 4, buyerY);
    buyerY += bAddrLines.length * 3.9 + 1;
  }

  if (data.buyerPhone) {
    doc.text(`Phone: ${data.buyerPhone}`, margin + 4, buyerY);
    buyerY += 4.2;
  }

  if (data.buyerDescription) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    const bDescLines = doc.splitTextToSize(`Description: ${data.buyerDescription}`, contentWidth - 8);
    doc.text(bDescLines, margin + 4, buyerY);
    buyerY += bDescLines.length * 3.9 + 1;
    doc.setFont('helvetica', 'normal');
  }

  const buyerHeight = Math.max(buyerY - buyerStartY + 2, 18);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, buyerStartY, contentWidth, buyerHeight);
  y = buyerStartY + buyerHeight;

  // Items Table Columns (Total = 186mm)
  // #, Description, HSN/SAC, Qty/Pc, Rate, Taxable, CGST, SGST, Amount
  const cols = [
    { key: 'sno', label: '#', width: 8, align: 'center' as const },
    { key: 'desc', label: 'Item & Description', width: 50, align: 'left' as const },
    { key: 'hsn', label: 'HSN/SAC', width: 17, align: 'center' as const },
    { key: 'qty', label: 'Qty / Unit', width: 17, align: 'right' as const },
    { key: 'rate', label: 'Rate', width: 20, align: 'right' as const },
    { key: 'taxable', label: 'Taxable', width: 22, align: 'right' as const },
    { key: 'cgst', label: 'CGST', width: 17, align: 'right' as const },
    { key: 'sgst', label: 'SGST', width: 17, align: 'right' as const },
    { key: 'total', label: 'Amount', width: 18, align: 'right' as const },
  ];

  const drawTableHeader = (startY: number) => {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, startY, contentWidth, 8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    let x = margin;
    cols.forEach((col, i) => {
      if (i > 0) {
        doc.line(x, startY, x, startY + 8);
      }
      const textX =
        col.align === 'center'
          ? x + col.width / 2
          : col.align === 'right'
          ? x + col.width - 2
          : x + 2;
      doc.text(col.label, textX, startY + 5.2, { align: col.align });
      x += col.width;
    });
    return startY + 8;
  };

  y = drawTableHeader(y);

  // Table Rows
  totals.items.forEach((item, index) => {
    const descLines = doc.splitTextToSize(item.description || '-', cols[1].width - 4);
    const rowHeight = Math.max(10, descLines.length * 3.8 + 4);

    // Check page break
    if (y + rowHeight > pageHeight - 65) {
      doc.addPage();
      y = margin;
      y = drawTableHeader(y);
    }

    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, rowHeight);

    let x = margin;
    cols.forEach((col, i) => {
      if (i > 0) {
        doc.line(x, y, x, y + rowHeight);
      }
      x += col.width;
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(15, 23, 42);

    let cx = margin;
    // #
    doc.text(String(index + 1), cx + cols[0].width / 2, y + 5, { align: 'center' });
    cx += cols[0].width;

    // Description
    doc.setFont('helvetica', 'bold');
    doc.text(descLines, cx + 2, y + 4.5);
    doc.setFont('helvetica', 'normal');
    cx += cols[1].width;

    // HSN/SAC
    doc.text(item.hsnSac || '-', cx + cols[2].width / 2, y + 5, { align: 'center' });
    cx += cols[2].width;

    // Qty + Unit (Pc)
    doc.text(`${item.quantity} ${item.unit || 'Pc'}`, cx + cols[3].width - 2, y + 5, { align: 'right' });
    cx += cols[3].width;

    // Rate
    doc.text(formatPdfMoney(item.rate, data.currencySymbol), cx + cols[4].width - 2, y + 5, { align: 'right' });
    cx += cols[4].width;

    // Taxable
    doc.text(formatPdfMoney(item.taxableAmount, data.currencySymbol), cx + cols[5].width - 2, y + 5, { align: 'right' });
    cx += cols[5].width;

    // CGST
    doc.text(formatPdfMoney(item.cgstAmount, data.currencySymbol), cx + cols[6].width - 2, y + 4.4, { align: 'right' });
    doc.setFontSize(6.4);
    doc.setTextColor(100, 116, 139);
    doc.text(`(${item.cgstRate}%)`, cx + cols[6].width - 2, y + 7.6, { align: 'right' });
    doc.setFontSize(7.6);
    doc.setTextColor(15, 23, 42);
    cx += cols[6].width;

    // SGST
    doc.text(formatPdfMoney(item.sgstAmount, data.currencySymbol), cx + cols[7].width - 2, y + 4.4, { align: 'right' });
    doc.setFontSize(6.4);
    doc.setTextColor(100, 116, 139);
    doc.text(`(${item.sgstRate}%)`, cx + cols[7].width - 2, y + 7.6, { align: 'right' });
    doc.setFontSize(7.6);
    doc.setTextColor(15, 23, 42);
    cx += cols[7].width;

    // Line Total
    doc.setFont('helvetica', 'bold');
    doc.text(formatPdfMoney(item.totalAmount, data.currencySymbol), cx + cols[8].width - 2, y + 5, { align: 'right' });

    y += rowHeight;
  });

  // Ensure enough space for Bottom Summary + Bank + Signature (~85mm)
  if (y + 82 > pageHeight - margin) {
    doc.addPage();
    y = margin;
  }

  // Amount in Words + Totals Split Section
  const summaryStartY = y;
  const wordsColWidth = 108;
  const totalsColWidth = contentWidth - wordsColWidth; // 78mm
  const totalsColX = margin + wordsColWidth;

  // Left: Amount in words & Bank details
  let leftBottomY = summaryStartY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('INVOICE AMOUNT IN WORDS', margin + 4, leftBottomY);
  leftBottomY += 4.2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const wordLines = doc.splitTextToSize(
    amountToWords(totals.grandTotal, data.currencySymbol),
    wordsColWidth - 8
  );
  doc.text(wordLines, margin + 4, leftBottomY);
  leftBottomY += wordLines.length * 4 + 3;

  // Bank Details inside Left Block
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, leftBottomY - 1, margin + wordsColWidth, leftBottomY - 1);
  leftBottomY += 3.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('BANK DETAILS FOR PAYMENT', margin + 4, leftBottomY);
  leftBottomY += 4.3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const bankLines: string[] = [];
  if (data.bankName) bankLines.push(`Bank Name: ${data.bankName}`);
  if (data.accountHolderName) bankLines.push(`Account Name: ${data.accountHolderName}`);
  if (data.accountNumber) bankLines.push(`A/C No.: ${data.accountNumber}`);
  if (data.ifscCode) bankLines.push(`IFSC Code: ${data.ifscCode}`);
  if (data.branchName) bankLines.push(`Branch: ${data.branchName}`);
  if (data.upiId) bankLines.push(`UPI ID: ${data.upiId}`);
  if (bankLines.length === 0) bankLines.push('Bank details not specified.');

  bankLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, wordsColWidth - 8);
    doc.text(wrapped, margin + 4, leftBottomY);
    leftBottomY += wrapped.length * 3.8 + 0.5;
  });

  // Right: Totals Breakdown
  let rightBottomY = summaryStartY + 5.5;
  const totalRows: { label: string; value: string; bold?: boolean }[] = [
    { label: 'Total Quantity:', value: `${totals.totalQuantity}` },
    { label: 'Taxable Amount (Subtotal):', value: formatPdfMoney(totals.subTotal, data.currencySymbol) },
    { label: 'Total CGST:', value: formatPdfMoney(totals.totalCgst, data.currencySymbol) },
    { label: 'Total SGST:', value: formatPdfMoney(totals.totalSgst, data.currencySymbol) },
  ];
  if (data.roundOffEnabled) {
    const sign = totals.roundOff >= 0 ? '+' : '';
    totalRows.push({
      label: 'Round Off:',
      value: `${sign}${formatPdfMoney(totals.roundOff, data.currencySymbol)}`,
    });
  }

  totalRows.forEach((r) => {
    doc.setFont('helvetica', r.bold ? 'bold' : 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    doc.text(r.label, totalsColX + 4, rightBottomY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(r.value, pageWidth - margin - 4, rightBottomY, { align: 'right' });
    rightBottomY += 5.2;
  });

  // Grand Total Band on Right
  doc.setFillColor(241, 245, 249);
  doc.rect(totalsColX, rightBottomY - 1, totalsColWidth, 8.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Grand Total:', totalsColX + 4, rightBottomY + 4.8);
  doc.text(
    formatPdfMoney(totals.grandTotal, data.currencySymbol),
    pageWidth - margin - 4,
    rightBottomY + 4.8,
    { align: 'right' }
  );
  rightBottomY += 10;

  const midBlockHeight = Math.max(leftBottomY - summaryStartY + 2, rightBottomY - summaryStartY + 2, 36);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, summaryStartY, wordsColWidth, midBlockHeight);
  doc.rect(totalsColX, summaryStartY, totalsColWidth, midBlockHeight);

  y = summaryStartY + midBlockHeight;

  // Terms & Authorised Signature Split Block
  const footerStartY = y;
  let termsY = y + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TERMS & CONDITIONS', margin + 4, termsY);
  termsY += 4.2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(71, 85, 105);
  const termsLines = doc.splitTextToSize(
    data.termsAndConditions || 'Thank you for your business.',
    wordsColWidth - 8
  );
  doc.text(termsLines, margin + 4, termsY);
  termsY += termsLines.length * 3.7 + 3;

  // Signature Right Box
  let sigY = y + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const forLabel = `For ${data.signatoryCompany || data.sellerName || 'Seller'}`;
  const forLines = doc.splitTextToSize(forLabel, totalsColWidth - 8);
  doc.text(forLines, pageWidth - margin - 4, sigY, { align: 'right' });
  sigY += forLines.length * 3.8 + 2;

  if (data.signatureDataUrl) {
    try {
      const normalizedSig = await normalizeImageForPdf(data.signatureDataUrl);
      if (normalizedSig) {
        const maxSigW = 38;
        const maxSigH = 16;
        const ratio = Math.min(maxSigW / normalizedSig.width, maxSigH / normalizedSig.height);
        const drawW = normalizedSig.width * ratio;
        const drawH = normalizedSig.height * ratio;
        doc.addImage(
          normalizedSig.pngDataUrl,
          'PNG',
          pageWidth - margin - 4 - drawW,
          sigY,
          drawW,
          drawH
        );
        sigY += drawH + 3;
      } else {
        sigY += 15;
      }
    } catch {
      sigY += 16;
    }
  } else {
    sigY += 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text(data.signatoryName || 'Authorised Signatory', pageWidth - margin - 4, sigY, {
    align: 'right',
  });
  sigY += 4;

  const footerHeight = Math.max(termsY - footerStartY + 2, sigY - footerStartY + 2, 30);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, footerStartY, wordsColWidth, footerHeight);
  doc.rect(totalsColX, footerStartY, totalsColWidth, footerHeight);

  // Subtle Declaration Line
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is a computer-generated GST Tax Invoice.',
    pageWidth / 2,
    Math.min(footerStartY + footerHeight + 6, pageHeight - 6),
    { align: 'center' }
  );

  const safeInvNo = (data.invoiceNumber || 'GST-Invoice').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${safeInvNo}.pdf`);
};

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const buildPrintableInvoiceHtml = (data: GSTInvoiceData): string => {
  const totals = calculateGSTInvoiceTotals(data);
  const sym = data.currencySymbol || '₹';

  const itemsRows = totals.items
    .map(
      (item, idx) => `
      <tr>
        <td class="center">${idx + 1}</td>
        <td><strong>${escapeHtml(item.description || '-')}</strong></td>
        <td class="center mono">${escapeHtml(item.hsnSac || '-')}</td>
        <td class="right nowrap">${item.quantity} ${escapeHtml(item.unit || 'Pc')}</td>
        <td class="right nowrap">${escapeHtml(formatMoney(item.rate, sym))}</td>
        <td class="right nowrap">${escapeHtml(formatMoney(item.taxableAmount, sym))}</td>
        <td class="right nowrap">
          <div>${escapeHtml(formatMoney(item.cgstAmount, sym))}</div>
          <div class="sub">(${item.cgstRate}%)</div>
        </td>
        <td class="right nowrap">
          <div>${escapeHtml(formatMoney(item.sgstAmount, sym))}</div>
          <div class="sub">(${item.sgstRate}%)</div>
        </td>
        <td class="right nowrap"><strong>${escapeHtml(formatMoney(item.totalAmount, sym))}</strong></td>
      </tr>`
    )
    .join('');

  const sellerContact = [
    data.sellerPhone ? `Ph: ${escapeHtml(data.sellerPhone)}` : '',
    data.sellerEmail ? `Email: ${escapeHtml(data.sellerEmail)}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  const bankEntries = [
    data.bankName ? `<p><span>Bank Name:</span> <strong>${escapeHtml(data.bankName)}</strong></p>` : '',
    data.accountHolderName ? `<p><span>Account Name:</span> <strong>${escapeHtml(data.accountHolderName)}</strong></p>` : '',
    data.accountNumber ? `<p><span>A/C No.:</span> <strong class="mono">${escapeHtml(data.accountNumber)}</strong></p>` : '',
    data.ifscCode ? `<p><span>IFSC Code:</span> <strong class="mono">${escapeHtml(data.ifscCode)}</strong></p>` : '',
    data.branchName ? `<p><span>Branch:</span> <strong>${escapeHtml(data.branchName)}</strong></p>` : '',
    data.upiId ? `<p><span>UPI ID:</span> <strong>${escapeHtml(data.upiId)}</strong></p>` : '',
  ]
    .filter(Boolean)
    .join('');

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(data.invoiceNumber || 'GST Tax Invoice')}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm; }
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 11px;
          line-height: 1.4;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .sheet { width: 100%; border: 1px solid #cbd5e1; }
        .topbar {
          background: #0f172a;
          color: #ffffff;
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .topbar h1 { margin: 0; font-size: 14px; letter-spacing: 0.5px; text-transform: uppercase; }
        .topbar span { font-size: 10px; color: #cbd5e1; text-transform: uppercase; }
        .row { display: flex; border-bottom: 1px solid #cbd5e1; }
        .col-left { width: 58%; border-right: 1px solid #cbd5e1; padding: 12px 14px; }
        .col-right { width: 42%; padding: 12px 14px; }
        .seller-wrap { display: flex; gap: 12px; align-items: flex-start; }
        .logo { max-width: 72px; max-height: 64px; object-fit: contain; }
        .seller-name { font-size: 14px; font-weight: 800; margin: 0 0 3px 0; }
        .muted { color: #475569; margin: 2px 0; white-space: pre-line; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .meta-line { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 5px; }
        .meta-label { color: #64748b; font-weight: 600; }
        .buyer-box { padding: 12px 14px; border-bottom: 1px solid #cbd5e1; }
        .section-kicker { font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.4px; margin: 0 0 4px 0; }
        .buyer-name { font-size: 12.5px; font-weight: 800; margin: 0; }
        .buyer-desc { margin-top: 6px; padding-top: 5px; border-top: 1px solid #e2e8f0; color: #334155; white-space: pre-line; }
        table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
        th, td { border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; padding: 6px 7px; vertical-align: top; }
        th:last-child, td:last-child { border-right: none; }
        th { background: #f1f5f9; font-size: 10px; font-weight: 700; color: #334155; text-align: left; }
        .center { text-align: center; }
        .right { text-align: right; }
        .nowrap { white-space: nowrap; }
        .sub { font-size: 9px; color: #64748b; }
        .words-box { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; }
        .bank-box { padding: 10px 14px; }
        .bank-box p { margin: 2px 0; }
        .bank-box span { color: #64748b; }
        .totals-list { padding: 10px 14px; font-variant-numeric: tabular-nums; }
        .total-line { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .grand-total {
          background: #f1f5f9;
          border-top: 1px solid #cbd5e1;
          padding: 9px 14px;
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 800;
        }
        .sig-col { display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; text-align: right; min-height: 105px; }
        .sig-img { max-height: 48px; max-width: 140px; object-fit: contain; margin: 6px 0; }
        .sig-line { border-top: 1px solid #94a3b8; padding-top: 4px; min-width: 140px; font-weight: 700; }
        .footer-note { text-align: center; font-size: 9.5px; color: #94a3b8; margin-top: 8px; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="topbar">
          <h1>${escapeHtml(data.invoiceTitle || 'TAX INVOICE')}</h1>
          <span>Original for Recipient</span>
        </div>

        <div class="row">
          <div class="col-left">
            <div class="seller-wrap">
              ${data.logoDataUrl ? `<img class="logo" src="${data.logoDataUrl}" alt="Logo" />` : ''}
              <div>
                <p class="seller-name">${escapeHtml(data.sellerName || 'Seller / Business Name')}</p>
                ${data.sellerGstin ? `<p class="mono"><strong>GSTIN: ${escapeHtml(data.sellerGstin)}</strong></p>` : ''}
                ${data.sellerAddress ? `<p class="muted">${escapeHtml(data.sellerAddress)}</p>` : ''}
                ${sellerContact ? `<p class="muted">${sellerContact}</p>` : ''}
              </div>
            </div>
          </div>
          <div class="col-right" style="background:#f8fafc;">
            <div class="meta-line"><span class="meta-label">Invoice No.:</span><strong class="mono">${escapeHtml(data.invoiceNumber || '-')}</strong></div>
            <div class="meta-line"><span class="meta-label">Invoice Date:</span><strong>${escapeHtml(data.invoiceDate || '-')}</strong></div>
            ${data.dueDate ? `<div class="meta-line"><span class="meta-label">Due Date:</span><span>${escapeHtml(data.dueDate)}</span></div>` : ''}
            ${data.placeOfSupply ? `<div class="meta-line"><span class="meta-label">Place of Supply:</span><span>${escapeHtml(data.placeOfSupply)}</span></div>` : ''}
          </div>
        </div>

        <div class="buyer-box">
          <p class="section-kicker">Bill To (Buyer Details)</p>
          <p class="buyer-name">${escapeHtml(data.buyerName || 'Customer / Buyer Name')}</p>
          ${data.buyerGstin ? `<p class="mono" style="margin:2px 0;"><strong>GSTIN: ${escapeHtml(data.buyerGstin)}</strong></p>` : ''}
          ${data.buyerAddress ? `<p class="muted">${escapeHtml(data.buyerAddress)}</p>` : ''}
          ${data.buyerPhone ? `<p class="muted">Phone: ${escapeHtml(data.buyerPhone)}</p>` : ''}
          ${data.buyerDescription ? `<p class="buyer-desc"><span style="color:#64748b;font-weight:600;">Description:</span> ${escapeHtml(data.buyerDescription)}</p>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th class="center" style="width:28px;">#</th>
              <th>Item &amp; Description</th>
              <th class="center" style="width:68px;">HSN/SAC</th>
              <th class="right" style="width:66px;">Qty / Pc</th>
              <th class="right" style="width:76px;">Rate</th>
              <th class="right" style="width:82px;">Taxable</th>
              <th class="right" style="width:68px;">CGST</th>
              <th class="right" style="width:68px;">SGST</th>
              <th class="right" style="width:84px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="row">
          <div class="col-left" style="padding:0;">
            <div class="words-box">
              <p class="section-kicker">Invoice Amount in Words</p>
              <strong>${escapeHtml(amountToWords(totals.grandTotal, sym))}</strong>
            </div>
            <div class="bank-box">
              <p class="section-kicker">Bank Details for Payment</p>
              ${bankEntries || '<p class="muted">No bank details provided.</p>'}
            </div>
          </div>
          <div class="col-right" style="padding:0;display:flex;flex-direction:column;justify-content:space-between;">
            <div class="totals-list">
              <div class="total-line"><span class="meta-label">Total Quantity:</span><strong>${totals.totalQuantity}</strong></div>
              <div class="total-line"><span class="meta-label">Taxable Subtotal:</span><strong>${escapeHtml(formatMoney(totals.subTotal, sym))}</strong></div>
              <div class="total-line"><span class="meta-label">Total CGST:</span><strong>${escapeHtml(formatMoney(totals.totalCgst, sym))}</strong></div>
              <div class="total-line"><span class="meta-label">Total SGST:</span><strong>${escapeHtml(formatMoney(totals.totalSgst, sym))}</strong></div>
              ${
                data.roundOffEnabled
                  ? `<div class="total-line"><span class="meta-label">Round Off:</span><strong>${totals.roundOff >= 0 ? '+' : ''}${escapeHtml(formatMoney(totals.roundOff, sym))}</strong></div>`
                  : ''
              }
            </div>
            <div class="grand-total">
              <span>Grand Total:</span>
              <span>${escapeHtml(formatMoney(totals.grandTotal, sym))}</span>
            </div>
          </div>
        </div>

        <div class="row" style="border-bottom:none;">
          <div class="col-left">
            <p class="section-kicker">Terms &amp; Conditions</p>
            <p class="muted">${escapeHtml(data.termsAndConditions || 'Thank you for your business.')}</p>
          </div>
          <div class="col-right sig-col">
            <div style="font-weight:700;color:#334155;">For ${escapeHtml(data.signatoryCompany || data.sellerName || 'Seller')}</div>
            ${data.signatureDataUrl ? `<img class="sig-img" src="${data.signatureDataUrl}" alt="Signature" />` : '<div style="height:40px;"></div>'}
            <div class="sig-line">${escapeHtml(data.signatoryName || 'Authorised Signatory')}</div>
          </div>
        </div>
      </div>
      <p class="footer-note">This is a computer-generated GST Tax Invoice.</p>
    </body>
  </html>`;
};
