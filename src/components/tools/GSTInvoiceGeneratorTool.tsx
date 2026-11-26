import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Download,
  Printer,
  Plus,
  Trash2,
  Copy,
  Upload,
  X,
  RotateCcw,
  Save,
  Check,
  PenTool,
  Image as ImageIcon,
  FileSpreadsheet,
  Building2,
  User,
  Landmark,
  Eye,
  Edit3,
  Columns2,
  Eraser
} from 'lucide-react';
import {
  GSTInvoiceData,
  GSTInvoiceItem,
  UNIT_OPTIONS,
  CURRENCY_OPTIONS,
  getDefaultGSTInvoiceData,
  getEmptyGSTInvoiceData,
  calculateGSTInvoiceTotals,
  formatMoney,
  amountToWords,
  generateGSTInvoicePDF
} from '../../utils/gstInvoicePdf';
import { recordToolConversion } from '../../utils/activityTracker';

interface GSTInvoiceGeneratorToolProps {
  onBack: () => void;
}

const STORAGE_KEY = 'pdfeditfy_gst_invoice_draft_v1';

const GST_SLABS = [
  { label: '0% (Nil)', half: 0 },
  { label: '5% (2.5+2.5)', half: 2.5 },
  { label: '12% (6+6)', half: 6 },
  { label: '18% (9+9)', half: 9 },
  { label: '28% (14+14)', half: 14 },
];

export const GSTInvoiceGeneratorTool: React.FC<GSTInvoiceGeneratorToolProps> = ({ onBack }) => {
  const [invoiceData, setInvoiceData] = useState<GSTInvoiceData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.items)) {
          return { ...getDefaultGSTInvoiceData(), ...parsed };
        }
      }
    } catch {
      // Ignore invalid draft
    }
    return getDefaultGSTInvoiceData();
  });

  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [syncGstRates, setSyncGstRates] = useState<boolean>(true);
  const [signatureTab, setSignatureTab] = useState<'upload' | 'draw'>('upload');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef<boolean>(false);

  const totals = useMemo(() => calculateGSTInvoiceTotals(invoiceData), [invoiceData]);

  // Auto-save draft silently on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoiceData));
    } catch {
      // Ignore quota errors if logo/signature is huge
    }
  }, [invoiceData]);

  const updateField = <K extends keyof GSTInvoiceData>(field: K, value: GSTInvoiceData[K]) => {
    setInvoiceData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (
    file: File | undefined,
    target: 'logoDataUrl' | 'signatureDataUrl'
  ) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid PNG, JPG, or WEBP image file.');
      return;
    }
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateField(target, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Item CRUD
  const addItem = () => {
    const newItem: GSTInvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: '',
      hsnSac: '',
      quantity: 1,
      unit: 'Pc',
      rate: 0,
      cgstRate: 9,
      sgstRate: 9,
    };
    setInvoiceData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const duplicateItem = (index: number) => {
    setInvoiceData((prev) => {
      const source = prev.items[index];
      if (!source) return prev;
      const copy: GSTInvoiceItem = {
        ...source,
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      const next = [...prev.items];
      next.splice(index + 1, 0, copy);
      return { ...prev, items: next };
    });
  };

  const removeItem = (index: number) => {
    setInvoiceData((prev) => {
      if (prev.items.length <= 1) {
        return {
          ...prev,
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
        };
      }
      return { ...prev, items: prev.items.filter((_, idx) => idx !== index) };
    });
  };

  const updateItem = <K extends keyof GSTInvoiceItem>(
    index: number,
    field: K,
    value: GSTInvoiceItem[K]
  ) => {
    setInvoiceData((prev) => {
      const next = [...prev.items];
      const current = { ...next[index], [field]: value };
      if (syncGstRates && field === 'cgstRate') {
        current.sgstRate = Number(value) || 0;
      } else if (syncGstRates && field === 'sgstRate') {
        current.cgstRate = Number(value) || 0;
      }
      next[index] = current;
      return { ...prev, items: next };
    });
  };

  const applyTaxSlabToAll = (halfRate: number) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({
        ...item,
        cgstRate: halfRate,
        sgstRate: halfRate,
      })),
    }));
  };

  // Canvas Signature Drawing Handlers
  const getCanvasPoint = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    const { x, y } = getCanvasPoint(e);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawStroke = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    updateField('signatureDataUrl', canvas.toDataURL('image/png'));
  };

  const clearSignatureCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    updateField('signatureDataUrl', null);
  };

  // Save Draft Manually with Feedback
  const handleManualSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoiceData));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch {
      setErrorMsg('Draft is too large to save in browser storage (try a smaller logo image).');
    }
  };

  const handleLoadSample = () => {
    setInvoiceData(getDefaultGSTInvoiceData());
    setErrorMsg(null);
  };

  const handleClearAll = () => {
    setInvoiceData(getEmptyGSTInvoiceData());
    setErrorMsg(null);
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setErrorMsg(null);
    try {
      await generateGSTInvoicePDF(invoiceData);
      recordToolConversion(
        'gst-invoice-generator',
        256 * 1024,
        'GST Invoice PDF Generated',
        `Generated ${invoiceData.invoiceNumber || 'GST-Invoice'}.pdf`
      );
    } catch (err) {
      console.error('PDF generation failed:', err);
      setErrorMsg('Failed to generate PDF. Please check uploaded images and try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Print using hidden iframe (avoids window.open popup blocks)
  const handlePrintInvoice = () => {
    const previewEl = previewRef.current;
    if (!previewEl) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`<!DOCTYPE html>
      <html>
        <head>
          <title>${invoiceData.invoiceNumber || 'GST Tax Invoice'}</title>
          ${styles}
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { background: #ffffff !important; color: #0f172a !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body>
          <div style="width: 100%; max-width: 190mm; margin: 0 auto;">
            ${previewEl.innerHTML}
          </div>
        </body>
      </html>`);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) document.body.removeChild(iframe);
        }, 1000);
      }
    }, 350);
  };

  const inputClass =
    'w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors';
  const labelClass =
    'block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1';

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                GST Tax Invoice Generator
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                HSN/SAC, CGST &amp; SGST breakdown, Bank details &amp; Authorised Signature
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher & Primary Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('split')}
              className={`hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'edit'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Form</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          </div>

          <button
            onClick={handleLoadSample}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            title="Fill with sample GST invoice data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sample</span>
          </button>

          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            title="Clear all fields"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            onClick={handleManualSave}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              savedNotice
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {savedNotice ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedNotice ? 'Saved' : 'Save Draft'}</span>
          </button>

          <button
            onClick={handlePrintInvoice}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'Exporting PDF...' : 'Export PDF Invoice'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dual-Pane Workspace */}
      <div
        className={`grid gap-6 items-start ${
          viewMode === 'split' ? 'grid-cols-1 xl:grid-cols-12' : 'grid-cols-1'
        }`}
      >
        {/* LEFT: EDITOR FORM */}
        {viewMode !== 'preview' && (
          <div
            className={`space-y-5 ${
              viewMode === 'split' ? 'xl:col-span-6' : 'max-w-5xl mx-auto w-full'
            }`}
          >
            {/* Section 1: Seller & Logo */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    01. Seller Business Details &amp; Logo
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                {/* Logo Uploader */}
                <div className="sm:col-span-1">
                  <label className={labelClass}>Company Logo</label>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files?.[0], 'logoDataUrl')}
                  />
                  {invoiceData.logoDataUrl ? (
                    <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800 flex items-center justify-center h-28">
                      <img
                        src={invoiceData.logoDataUrl}
                        alt="Seller Company Logo"
                        className="max-h-22 max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => updateField('logoDataUrl', null)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-sm hover:bg-red-700 cursor-pointer"
                        title="Remove logo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full h-28 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-[11px] font-semibold">Upload Logo</span>
                      <span className="text-[10px] text-slate-400">PNG / JPG / WEBP</span>
                    </button>
                  )}
                </div>

                {/* Seller Text Inputs */}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Business / Company Name</label>
                    <input
                      type="text"
                      value={invoiceData.sellerName}
                      onChange={(e) => updateField('sellerName', e.target.value)}
                      placeholder="e.g. Apex Enterprises Pvt. Ltd."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Seller GSTIN</label>
                    <input
                      type="text"
                      value={invoiceData.sellerGstin}
                      onChange={(e) => updateField('sellerGstin', e.target.value.toUpperCase())}
                      placeholder="e.g. 27AABCU9603R1ZM"
                      className={`${inputClass} font-mono uppercase`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <input
                      type="text"
                      value={invoiceData.sellerPhone}
                      onChange={(e) => updateField('sellerPhone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Email Address</label>
                    <input
                      type="email"
                      value={invoiceData.sellerEmail}
                      onChange={(e) => updateField('sellerEmail', e.target.value)}
                      placeholder="billing@company.com"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Seller Address</label>
                <textarea
                  rows={2}
                  value={invoiceData.sellerAddress}
                  onChange={(e) => updateField('sellerAddress', e.target.value)}
                  placeholder="Street, Building, City, State, PIN Code"
                  className={inputClass}
                />
              </div>
            </section>

            {/* Section 2: Invoice Details & Buyer Info */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    02. Invoice Info &amp; Buyer Details
                  </h3>
                </div>
              </div>

              {/* Invoice Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Invoice Title</label>
                  <input
                    type="text"
                    value={invoiceData.invoiceTitle}
                    onChange={(e) => updateField('invoiceTitle', e.target.value)}
                    placeholder="TAX INVOICE"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => updateField('invoiceNumber', e.target.value)}
                    placeholder="INV-2026-001"
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Currency</label>
                  <select
                    value={invoiceData.currencySymbol}
                    onChange={(e) => updateField('currencySymbol', e.target.value)}
                    className={inputClass}
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.symbol} value={c.symbol}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceData.invoiceDate}
                    onChange={(e) => updateField('invoiceDate', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Due Date (Optional)</label>
                  <input
                    type="date"
                    value={invoiceData.dueDate}
                    onChange={(e) => updateField('dueDate', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Place of Supply</label>
                  <input
                    type="text"
                    value={invoiceData.placeOfSupply}
                    onChange={(e) => updateField('placeOfSupply', e.target.value)}
                    placeholder="e.g. Maharashtra (27)"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Buyer / Bill To
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Buyer Name</label>
                    <input
                      type="text"
                      value={invoiceData.buyerName}
                      onChange={(e) => updateField('buyerName', e.target.value)}
                      placeholder="Customer / Business Name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Buyer GSTIN (Optional)</label>
                    <input
                      type="text"
                      value={invoiceData.buyerGstin}
                      onChange={(e) => updateField('buyerGstin', e.target.value.toUpperCase())}
                      placeholder="e.g. 27AAACH7409R1ZZ"
                      className={`${inputClass} font-mono uppercase`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Buyer Phone (Optional)</label>
                    <input
                      type="text"
                      value={invoiceData.buyerPhone}
                      onChange={(e) => updateField('buyerPhone', e.target.value)}
                      placeholder="+91 98220 11223"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Buyer Address</label>
                    <textarea
                      rows={2}
                      value={invoiceData.buyerAddress}
                      onChange={(e) => updateField('buyerAddress', e.target.value)}
                      placeholder="Buyer billing address, city, state, PIN"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Buyer Description / Order Notes (Optional)</label>
                    <textarea
                      rows={2}
                      value={invoiceData.buyerDescription}
                      onChange={(e) => updateField('buyerDescription', e.target.value)}
                      placeholder="e.g. Purchase Order No., project reference, or delivery instructions"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Line Items (Description, HSN/SAC, Qty, Pc/Unit, Rate, Amount, CGST, SGST) */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    03. Items, HSN/SAC &amp; GST Breakdown
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Add products or services with quantity, unit (Pc), rate, CGST &amp; SGST
                  </p>
                </div>

                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={syncGstRates}
                    onChange={(e) => setSyncGstRates(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Sync CGST = SGST</span>
                </label>
              </div>

              {/* Quick GST Slab Helper */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  Apply GST slab to all:
                </span>
                {GST_SLABS.map((slab) => (
                  <button
                    key={slab.label}
                    type="button"
                    onClick={() => applyTaxSlabToAll(slab.half)}
                    className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-400 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {slab.label}
                  </button>
                ))}
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {totals.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Item #{idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                          Total: {formatMoney(item.totalAmount, invoiceData.currencySymbol)}
                        </span>
                        <button
                          type="button"
                          onClick={() => duplicateItem(idx)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Duplicate item"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-8">
                        <label className={labelClass}>Item / Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          placeholder="e.g. Product Name or Service Description"
                          className={inputClass}
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className={labelClass}>HSN / SAC Code</label>
                        <input
                          type="text"
                          value={item.hsnSac}
                          onChange={(e) => updateItem(idx, 'hsnSac', e.target.value)}
                          placeholder="e.g. 8471 or 9983"
                          className={`${inputClass} font-mono`}
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-12 sm:col-span-12 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Qty</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(idx, 'quantity', Math.max(0, Number(e.target.value)))
                            }
                            className={`${inputClass} tabular-nums`}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className={labelClass}>Unit (Pc)</label>
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                            className={inputClass}
                          >
                            {UNIT_OPTIONS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className={labelClass}>Rate ({invoiceData.currencySymbol})</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.rate}
                            onChange={(e) =>
                              updateItem(idx, 'rate', Math.max(0, Number(e.target.value)))
                            }
                            className={`${inputClass} tabular-nums`}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className={labelClass}>CGST (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.25"
                            value={item.cgstRate}
                            onChange={(e) =>
                              updateItem(idx, 'cgstRate', Math.max(0, Number(e.target.value)))
                            }
                            className={`${inputClass} tabular-nums`}
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-3">
                          <label className={labelClass}>SGST (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.25"
                            value={item.sgstRate}
                            onChange={(e) =>
                              updateItem(idx, 'sgstRate', Math.max(0, Number(e.target.value)))
                            }
                            className={`${inputClass} tabular-nums`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row Sub-summary */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70 text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                      <span>
                        Taxable Amt:{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {formatMoney(item.taxableAmount, invoiceData.currencySymbol)}
                        </strong>
                      </span>
                      <span>
                        CGST ({item.cgstRate}%):{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {formatMoney(item.cgstAmount, invoiceData.currencySymbol)}
                        </strong>
                      </span>
                      <span>
                        SGST ({item.sgstRate}%):{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {formatMoney(item.sgstAmount, invoiceData.currencySymbol)}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addItem}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Item Row</span>
              </button>
            </section>

            {/* Section 4: Bank Details */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Landmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  04. Bank Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Bank Name</label>
                  <input
                    type="text"
                    value={invoiceData.bankName}
                    onChange={(e) => updateField('bankName', e.target.value)}
                    placeholder="e.g. HDFC Bank Ltd."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Account Holder Name</label>
                  <input
                    type="text"
                    value={invoiceData.accountHolderName}
                    onChange={(e) => updateField('accountHolderName', e.target.value)}
                    placeholder="e.g. Apex Enterprises Pvt. Ltd."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Account Number</label>
                  <input
                    type="text"
                    value={invoiceData.accountNumber}
                    onChange={(e) => updateField('accountNumber', e.target.value)}
                    placeholder="e.g. 50200048192034"
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelClass}>IFSC Code</label>
                  <input
                    type="text"
                    value={invoiceData.ifscCode}
                    onChange={(e) => updateField('ifscCode', e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0000142"
                    className={`${inputClass} font-mono uppercase`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Branch Name</label>
                  <input
                    type="text"
                    value={invoiceData.branchName}
                    onChange={(e) => updateField('branchName', e.target.value)}
                    placeholder="e.g. Andheri East, Mumbai"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>UPI ID (Optional)</label>
                  <input
                    type="text"
                    value={invoiceData.upiId}
                    onChange={(e) => updateField('upiId', e.target.value)}
                    placeholder="e.g. business@hdfcbank"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* Section 5: Authorised Signature & Terms */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    05. Authorised Signature &amp; Terms
                  </h3>
                </div>

                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={invoiceData.roundOffEnabled}
                    onChange={(e) => updateField('roundOffEnabled', e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Round Off Grand Total</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>For Company Label</label>
                  <input
                    type="text"
                    value={invoiceData.signatoryCompany}
                    onChange={(e) => updateField('signatoryCompany', e.target.value)}
                    placeholder={invoiceData.sellerName || 'Company Name'}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Signatory Title / Name</label>
                  <input
                    type="text"
                    value={invoiceData.signatoryName}
                    onChange={(e) => updateField('signatoryName', e.target.value)}
                    placeholder="Authorised Signatory"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Signature Upload or Draw Pad */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Signature Image / Draw Pad</label>
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setSignatureTab('upload')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                        signatureTab === 'upload'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Upload Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureTab('draw')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                        signatureTab === 'draw'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Draw Signature
                    </button>
                  </div>
                </div>

                {signatureTab === 'upload' ? (
                  <div>
                    <input
                      ref={sigInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files?.[0], 'signatureDataUrl')}
                    />
                    {invoiceData.signatureDataUrl ? (
                      <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white flex items-center justify-center h-24">
                        <img
                          src={invoiceData.signatureDataUrl}
                          alt="Authorised Signature"
                          className="max-h-18 max-w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => updateField('signatureDataUrl', null)}
                          className="absolute top-2 right-2 px-2 py-1 rounded-md bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100 cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => sigInputRef.current?.click()}
                        className="w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/30"
                      >
                        <Upload className="w-4 h-4" />
                        <span className="text-xs font-semibold">Upload Signature PNG / JPG</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="border border-slate-300 dark:border-slate-700 rounded-xl bg-white overflow-hidden relative">
                      <canvas
                        ref={sigCanvasRef}
                        width={480}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={drawStroke}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={drawStroke}
                        onTouchEnd={stopDrawing}
                        className="w-full h-28 cursor-crosshair touch-none block"
                      />
                      <span className="absolute bottom-1.5 left-3 text-[10px] text-slate-400 pointer-events-none select-none">
                        Sign inside this box
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={clearSignatureCanvas}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Clear Pad
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Terms &amp; Conditions</label>
                <textarea
                  rows={3}
                  value={invoiceData.termsAndConditions}
                  onChange={(e) => updateField('termsAndConditions', e.target.value)}
                  className={inputClass}
                />
              </div>
            </section>
          </div>
        )}

        {/* RIGHT: LIVE A4 GST TAX INVOICE PREVIEW */}
        {viewMode !== 'edit' && (
          <div
            className={`${
              viewMode === 'split' ? 'xl:col-span-6 xl:sticky xl:top-20' : 'max-w-4xl mx-auto w-full'
            }`}
          >
            <div className="bg-slate-200/70 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-2xl p-3 sm:p-5 overflow-x-auto">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Live A4 Tax Invoice Preview
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  {totals.items.length} item{totals.items.length === 1 ? '' : 's'} · Grand Total:{' '}
                  <strong className="text-slate-800 dark:text-white">
                    {formatMoney(totals.grandTotal, invoiceData.currencySymbol)}
                  </strong>
                </span>
              </div>

              {/* A4 Sheet */}
              <div
                ref={previewRef}
                className="bg-white text-slate-900 border border-slate-300 shadow-md mx-auto min-w-[660px] max-w-[794px] text-[11px] leading-snug"
              >
                {/* Top Header Strip */}
                <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm font-extrabold tracking-wide uppercase">
                    {invoiceData.invoiceTitle || 'TAX INVOICE'}
                  </span>
                  <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">
                    Original for Recipient
                  </span>
                </div>

                {/* Seller + Invoice Metadata Grid */}
                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-7 p-3.5 border-r border-slate-300 flex items-start gap-3">
                    {invoiceData.logoDataUrl && (
                      <img
                        src={invoiceData.logoDataUrl}
                        alt="Seller Logo"
                        className="w-16 h-16 object-contain shrink-0 rounded"
                      />
                    )}
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-extrabold text-slate-900 break-words">
                        {invoiceData.sellerName || 'Your Company / Seller Name'}
                      </h4>
                      {invoiceData.sellerGstin && (
                        <p className="text-[11px] font-bold text-slate-800 font-mono">
                          GSTIN: {invoiceData.sellerGstin}
                        </p>
                      )}
                      {invoiceData.sellerAddress && (
                        <p className="text-[11px] text-slate-600 whitespace-pre-line break-words">
                          {invoiceData.sellerAddress}
                        </p>
                      )}
                      {(invoiceData.sellerPhone || invoiceData.sellerEmail) && (
                        <p className="text-[10px] text-slate-600 break-words">
                          {[
                            invoiceData.sellerPhone ? `Ph: ${invoiceData.sellerPhone}` : '',
                            invoiceData.sellerEmail ? `Email: ${invoiceData.sellerEmail}` : '',
                          ]
                            .filter(Boolean)
                            .join(' | ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="col-span-5 p-3.5 space-y-1.5 bg-slate-50/60 tabular-nums">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 font-semibold">Invoice No.:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {invoiceData.invoiceNumber || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 font-semibold">Invoice Date:</span>
                      <span className="font-bold text-slate-900">
                        {invoiceData.invoiceDate || '-'}
                      </span>
                    </div>
                    {invoiceData.dueDate && (
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 font-semibold">Due Date:</span>
                        <span className="font-semibold text-slate-800">
                          {invoiceData.dueDate}
                        </span>
                      </div>
                    )}
                    {invoiceData.placeOfSupply && (
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 font-semibold">Place of Supply:</span>
                        <span className="font-semibold text-slate-800 text-right">
                          {invoiceData.placeOfSupply}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Buyer / Bill To Block */}
                <div className="p-3.5 border-b border-slate-300 bg-white">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Bill To (Buyer Details)
                  </p>
                  <p className="text-xs font-extrabold text-slate-900">
                    {invoiceData.buyerName || 'Buyer / Customer Name'}
                  </p>
                  {invoiceData.buyerGstin && (
                    <p className="text-[11px] font-bold text-slate-800 font-mono mt-0.5">
                      GSTIN: {invoiceData.buyerGstin}
                    </p>
                  )}
                  {invoiceData.buyerAddress && (
                    <p className="text-[11px] text-slate-600 mt-0.5 whitespace-pre-line">
                      {invoiceData.buyerAddress}
                    </p>
                  )}
                  {invoiceData.buyerPhone && (
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Phone: {invoiceData.buyerPhone}
                    </p>
                  )}
                  {invoiceData.buyerDescription && (
                    <p className="text-[10.5px] text-slate-700 mt-1 pt-1 border-t border-slate-200/80 whitespace-pre-line">
                      <span className="font-semibold text-slate-500">Description:</span>{' '}
                      {invoiceData.buyerDescription}
                    </p>
                  )}
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse tabular-nums">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold text-slate-700">
                        <th className="py-2 px-2 border-r border-slate-300 text-center w-8">#</th>
                        <th className="py-2 px-2 border-r border-slate-300 text-left">
                          Item &amp; Description
                        </th>
                        <th className="py-2 px-2 border-r border-slate-300 text-center w-16">
                          HSN/SAC
                        </th>
                        <th className="py-2 px-2 border-r border-slate-300 text-right w-16">
                          Qty / Pc
                        </th>
                        <th className="py-2 px-2 border-r border-slate-300 text-right w-20">
                          Rate
                        </th>
                        <th className="py-2 px-2 border-r border-slate-300 text-right w-20">
                          Taxable
                        </th>
                        <th className="py-2 px-2 border-r border-slate-300 text-right w-18">
                          CGST
                        </th>
                        <th className="py-2 px-2 border-r border-slate-300 text-right w-18">
                          SGST
                        </th>
                        <th className="py-2 px-2 text-right w-22">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {totals.items.map((item, idx) => (
                        <tr key={item.id} className="border-b border-slate-200 align-top">
                          <td className="py-2 px-2 border-r border-slate-200 text-center text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 font-semibold text-slate-900 break-words">
                            {item.description || '-'}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 text-center font-mono text-[10px] text-slate-700">
                            {item.hsnSac || '-'}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 text-right whitespace-nowrap">
                            {item.quantity} {item.unit || 'Pc'}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 text-right whitespace-nowrap">
                            {formatMoney(item.rate, invoiceData.currencySymbol)}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 text-right whitespace-nowrap">
                            {formatMoney(item.taxableAmount, invoiceData.currencySymbol)}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 text-right whitespace-nowrap">
                            <div>{formatMoney(item.cgstAmount, invoiceData.currencySymbol)}</div>
                            <div className="text-[9px] text-slate-500">({item.cgstRate}%)</div>
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 text-right whitespace-nowrap">
                            <div>{formatMoney(item.sgstAmount, invoiceData.currencySymbol)}</div>
                            <div className="text-[9px] text-slate-500">({item.sgstRate}%)</div>
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-slate-900 whitespace-nowrap">
                            {formatMoney(item.totalAmount, invoiceData.currencySymbol)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Middle Split: Amount in Words + Bank Details | Totals */}
                <div className="grid grid-cols-12 border-t border-slate-300">
                  <div className="col-span-7 border-r border-slate-300 flex flex-col justify-between">
                    <div className="p-3 border-b border-slate-200">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                        Invoice Amount in Words
                      </p>
                      <p className="text-[11px] font-bold text-slate-900">
                        {amountToWords(totals.grandTotal, invoiceData.currencySymbol)}
                      </p>
                    </div>

                    <div className="p-3 space-y-0.5 text-[10.5px]">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Bank Details for Payment
                      </p>
                      {invoiceData.bankName && (
                        <p>
                          <span className="text-slate-500">Bank Name:</span>{' '}
                          <strong className="text-slate-800">{invoiceData.bankName}</strong>
                        </p>
                      )}
                      {invoiceData.accountHolderName && (
                        <p>
                          <span className="text-slate-500">Account Name:</span>{' '}
                          <strong className="text-slate-800">{invoiceData.accountHolderName}</strong>
                        </p>
                      )}
                      {invoiceData.accountNumber && (
                        <p>
                          <span className="text-slate-500">A/C No.:</span>{' '}
                          <strong className="text-slate-800 font-mono">
                            {invoiceData.accountNumber}
                          </strong>
                        </p>
                      )}
                      {invoiceData.ifscCode && (
                        <p>
                          <span className="text-slate-500">IFSC Code:</span>{' '}
                          <strong className="text-slate-800 font-mono">{invoiceData.ifscCode}</strong>
                        </p>
                      )}
                      {invoiceData.branchName && (
                        <p>
                          <span className="text-slate-500">Branch:</span>{' '}
                          <strong className="text-slate-800">{invoiceData.branchName}</strong>
                        </p>
                      )}
                      {invoiceData.upiId && (
                        <p>
                          <span className="text-slate-500">UPI ID:</span>{' '}
                          <strong className="text-slate-800">{invoiceData.upiId}</strong>
                        </p>
                      )}
                      {!invoiceData.bankName &&
                        !invoiceData.accountNumber &&
                        !invoiceData.ifscCode &&
                        !invoiceData.upiId && (
                          <p className="text-slate-400 italic">No bank details provided.</p>
                        )}
                    </div>
                  </div>

                  {/* Totals Column */}
                  <div className="col-span-5 flex flex-col justify-between tabular-nums">
                    <div className="p-3 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Quantity:</span>
                        <span className="font-semibold text-slate-900">{totals.totalQuantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Taxable Subtotal:</span>
                        <span className="font-semibold text-slate-900">
                          {formatMoney(totals.subTotal, invoiceData.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total CGST:</span>
                        <span className="font-semibold text-slate-900">
                          {formatMoney(totals.totalCgst, invoiceData.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total SGST:</span>
                        <span className="font-semibold text-slate-900">
                          {formatMoney(totals.totalSgst, invoiceData.currencySymbol)}
                        </span>
                      </div>
                      {invoiceData.roundOffEnabled && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Round Off:</span>
                          <span className="font-semibold text-slate-900">
                            {totals.roundOff >= 0 ? '+' : ''}
                            {formatMoney(totals.roundOff, invoiceData.currencySymbol)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-100 border-t border-slate-300 px-3 py-2.5 flex justify-between items-center">
                      <span className="text-xs font-extrabold text-slate-900">Grand Total:</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatMoney(totals.grandTotal, invoiceData.currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Split: Terms & Authorised Signature */}
                <div className="grid grid-cols-12 border-t border-slate-300">
                  <div className="col-span-7 p-3 border-r border-slate-300">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Terms &amp; Conditions
                    </p>
                    <p className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">
                      {invoiceData.termsAndConditions || 'Thank you for your business.'}
                    </p>
                  </div>

                  <div className="col-span-5 p-3 flex flex-col justify-between items-end text-right min-h-[108px]">
                    <p className="text-[10px] font-bold text-slate-700">
                      For {invoiceData.signatoryCompany || invoiceData.sellerName || 'Seller'}
                    </p>

                    <div className="my-1.5 flex items-center justify-end w-full h-12">
                      {invoiceData.signatureDataUrl ? (
                        <img
                          src={invoiceData.signatureDataUrl}
                          alt="Authorised Signature"
                          className="max-h-12 max-w-[140px] object-contain"
                        />
                      ) : (
                        <span className="text-[9px] text-slate-300 italic">
                          Signature space
                        </span>
                      )}
                    </div>

                    <p className="text-[10.5px] font-bold text-slate-900 border-t border-slate-300 pt-1 min-w-[130px]">
                      {invoiceData.signatoryName || 'Authorised Signatory'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
