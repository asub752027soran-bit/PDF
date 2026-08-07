import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  Type,
  Pencil,
  Square,
  Highlighter,
  PenTool,
  RotateCw,
  Trash2,
  FileCheck,
  Check,
  X,
  Palette,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  Lock,
  Unlock,
  Stamp
} from 'lucide-react';
import { applyPDFAnnotations, watermarkPDF, lockPDF, unlockPDF, readFileAsArrayBuffer, readFileAsDataURL } from '../../utils/pdfProcessor';
import { downloadBlob } from '../../utils/batchProcessor';
import { PDFAnnotation } from '../../types';

interface PDFEditorToolProps {
  mode?: 'edit' | 'watermark' | 'lock' | 'unlock';
  onBack: () => void;
}

export const PDFEditorTool: React.FC<PDFEditorToolProps> = ({ mode = 'edit', onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'draw' | 'signature' | 'shape' | 'highlight'>('text');
  
  // Annotation state
  const [annotations, setAnnotations] = useState<PDFAnnotation[]>([]);
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#1e293b');
  const [showSigModal, setShowSigModal] = useState(false);
  const [sigDataUrl, setSigDataUrl] = useState<string | null>(null);

  // Watermark state
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [watermarkAngle, setWatermarkAngle] = useState(45);
  const [watermarkFontSize, setWatermarkFontSize] = useState(48);

  // Lock / Unlock password
  const [pdfPassword, setPdfPassword] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Canvas ref for signature drawing
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingSig, setIsDrawingSig] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      const dataUrl = await readFileAsDataURL(selected);
      setFileDataUrl(dataUrl);
      setAnnotations([]);
    }
  };

  const addTextAnnotation = () => {
    if (!textInput.trim()) return;
    const newAnn: PDFAnnotation = {
      id: Math.random().toString(36).substring(7),
      pageNumber: 1,
      type: 'text',
      x: 20 + annotations.length * 5,
      y: 20 + annotations.length * 5,
      content: textInput,
      fontSize: fontSize,
      color: textColor,
    };
    setAnnotations([...annotations, newAnn]);
    setTextInput('');
  };

  const addShapeAnnotation = () => {
    const newAnn: PDFAnnotation = {
      id: Math.random().toString(36).substring(7),
      pageNumber: 1,
      type: 'shape',
      shapeType: 'rectangle',
      x: 30,
      y: 30,
      width: 150,
      height: 80,
    };
    setAnnotations([...annotations, newAnn]);
  };

  const addHighlightAnnotation = () => {
    const newAnn: PDFAnnotation = {
      id: Math.random().toString(36).substring(7),
      pageNumber: 1,
      type: 'highlight',
      x: 25,
      y: 25,
      width: 200,
      height: 24,
    };
    setAnnotations([...annotations, newAnn]);
  };

  const addSignatureAnnotation = () => {
    if (!sigDataUrl) return;
    const newAnn: PDFAnnotation = {
      id: Math.random().toString(36).substring(7),
      pageNumber: 1,
      type: 'signature',
      x: 35,
      y: 35,
      width: 140,
      height: 70,
      content: sigDataUrl,
    };
    setAnnotations([...annotations, newAnn]);
    setShowSigModal(false);
  };

  // Signature canvas handlers
  const startSigDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawingSig(true);
  };

  const drawSig = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopSigDraw = () => {
    if (!isDrawingSig) return;
    setIsDrawingSig(false);
    const canvas = sigCanvasRef.current;
    if (canvas) {
      setSigDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearSigCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSigDataUrl(null);
    }
  };

  const handleExportPDF = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const pdfBytes = await applyPDFAnnotations(file, annotations);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const cleanName = file.name.replace(/\.pdf$/i, '');
      downloadBlob(blob, `${cleanName}_edited.pdf`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export PDF. Please ensure file is valid.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWatermarkPDF = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const pdfBytes = await watermarkPDF(file, {
        text: watermarkText,
        opacity: watermarkOpacity,
        rotationAngle: watermarkAngle,
        fontSize: watermarkFontSize,
      });
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const cleanName = file.name.replace(/\.pdf$/i, '');
      downloadBlob(blob, `${cleanName}_watermarked.pdf`);
    } catch (err) {
      console.error('Watermark failed:', err);
      alert('Failed to apply watermark.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLockPDF = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const pdfBytes = await lockPDF(file, pdfPassword);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const cleanName = file.name.replace(/\.pdf$/i, '');
      downloadBlob(blob, `${cleanName}_protected.pdf`);
    } catch (err) {
      console.error('Lock failed:', err);
      alert('Failed to protect PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlockPDF = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const pdfBytes = await unlockPDF(file, pdfPassword);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const cleanName = file.name.replace(/\.pdf$/i, '');
      downloadBlob(blob, `${cleanName}_unlocked.pdf`);
    } catch (err) {
      console.error('Unlock failed:', err);
      alert('Failed to unlock PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>
        <div className="text-right">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center justify-end gap-2">
            {mode === 'watermark' ? (
              <>
                <Stamp className="w-5 h-5 text-indigo-600" /> Watermark PDF
              </>
            ) : mode === 'lock' ? (
              <>
                <Lock className="w-5 h-5 text-indigo-600" /> Protect & Lock PDF
              </>
            ) : mode === 'unlock' ? (
              <>
                <Unlock className="w-5 h-5 text-indigo-600" /> Unlock & Decrypt PDF
              </>
            ) : (
              'Online Interactive PDF Editor'
            )}
          </h1>
          <p className="text-xs text-slate-500">
            {mode === 'watermark'
              ? 'Add custom text watermarks to all pages in your PDF document.'
              : mode === 'lock'
              ? 'Encrypt and protect your PDF with custom password security.'
              : mode === 'unlock'
              ? 'Remove password restrictions and unlock protected PDF files.'
              : 'Add text, signatures, highlights, and annotations to your PDF.'}
          </p>
        </div>
      </div>

      {!file ? (
        /* Dropzone */
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Select or Drop a PDF File
          </h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            Upload any PDF document. Private in-browser processing.
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 cursor-pointer transition-all">
            <Upload className="w-4 h-4" /> Choose PDF File
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : mode === 'watermark' ? (
        /* Watermark Panel */
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>📄 {file.name}</span>
            <button onClick={() => setFile(null)} className="text-rose-500 hover:underline">
              Change File
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Watermark Text
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="e.g. CONFIDENTIAL or DRAFT"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Font Size ({watermarkFontSize}px)
                </label>
                <input
                  type="range"
                  min={20}
                  max={90}
                  value={watermarkFontSize}
                  onChange={(e) => setWatermarkFontSize(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Opacity ({Math.round(watermarkOpacity * 100)}%)
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rotation ({watermarkAngle}°)
                </label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={15}
                  value={watermarkAngle}
                  onChange={(e) => setWatermarkAngle(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleWatermarkPDF}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Applying Watermark...
                </>
              ) : (
                <>
                  <Stamp className="w-4 h-4" /> Apply Watermark & Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      ) : mode === 'lock' || mode === 'unlock' ? (
        /* Lock / Unlock Panel */
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 max-w-xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>📄 {file.name}</span>
            <button onClick={() => setFile(null)} className="text-rose-500 hover:underline">
              Change File
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {mode === 'lock' ? 'Set Encryption Password' : 'Enter Password to Decrypt'}
              </label>
              <input
                type="password"
                value={pdfPassword}
                onChange={(e) => setPdfPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
              />
            </div>

            <button
              onClick={mode === 'lock' ? handleLockPDF : handleUnlockPDF}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing PDF...
                </>
              ) : mode === 'lock' ? (
                <>
                  <Lock className="w-4 h-4" /> Protect & Download PDF
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" /> Unlock & Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Controls & Annotations Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                📄 {file.name}
              </span>
              <button
                onClick={() => setFile(null)}
                className="text-xs text-rose-500 font-bold hover:underline"
              >
                Change File
              </button>
            </div>

            {/* Tools Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('text')}
                className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'text' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-500'
                }`}
              >
                <Type className="w-4 h-4" /> Text
              </button>
              <button
                onClick={() => setActiveTab('signature')}
                className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'signature' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-500'
                }`}
              >
                <PenTool className="w-4 h-4" /> Sign
              </button>
              <button
                onClick={() => setActiveTab('shape')}
                className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'shape' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-500'
                }`}
              >
                <Square className="w-4 h-4" /> Shape
              </button>
              <button
                onClick={() => setActiveTab('highlight')}
                className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'highlight' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-500'
                }`}
              >
                <Highlighter className="w-4 h-4" /> Highlight
              </button>
            </div>

            {/* Tab Controls */}
            {activeTab === 'text' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Text Content
                  </label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type text to overlay..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Font Size
                    </label>
                    <input
                      type="number"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-20 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Color
                    </label>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-12 h-9 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                    />
                  </div>
                </div>
                <button
                  onClick={addTextAnnotation}
                  disabled={!textInput.trim()}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 disabled:opacity-50 transition-all"
                >
                  + Add Text Overlay
                </button>
              </div>
            )}

            {activeTab === 'signature' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-500">
                  Draw or generate your signature and embed it into your document.
                </p>
                <button
                  onClick={() => setShowSigModal(true)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all"
                >
                  🖋️ Open Signature Pad
                </button>
              </div>
            )}

            {activeTab === 'shape' && (
              <div className="space-y-4 text-xs">
                <button
                  onClick={addShapeAnnotation}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all"
                >
                  + Add Rectangle Shape Box
                </button>
              </div>
            )}

            {activeTab === 'highlight' && (
              <div className="space-y-4 text-xs">
                <button
                  onClick={addHighlightAnnotation}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-400 transition-all"
                >
                  + Add Yellow Highlight Marker
                </button>
              </div>
            )}

            {/* Added Annotations List */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-2">
                Active Elements ({annotations.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {annotations.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No annotations added yet.</p>
                ) : (
                  annotations.map((ann) => (
                    <div
                      key={ann.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize truncate max-w-[150px]">
                        {ann.type}: {ann.content || ann.shapeType || 'Annotation'}
                      </span>
                      <button
                        onClick={() =>
                          setAnnotations(annotations.filter((a) => a.id !== ann.id))
                        }
                        className="text-rose-500 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download Edited PDF
                </>
              )}
            </button>

          </div>

          {/* Right Live Canvas Preview */}
          <div className="lg:col-span-2 bg-slate-100 dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center relative min-h-[500px]">
            <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden border border-slate-200 dark:border-slate-700 text-center min-h-[450px] flex flex-col items-center justify-center">
              
              <div className="space-y-2 mb-6">
                <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  Document Preview Canvas
                </span>
                <p className="text-xs text-slate-500">
                  Annotations layer previewed below. Click download to bake modifications into final PDF.
                </p>
              </div>

              {/* Render Simulated Annotations Layer */}
              <div className="relative w-full max-w-md h-80 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 flex flex-col justify-between overflow-hidden">
                <div className="text-[10px] text-slate-400 font-mono text-left">
                  PDF Page 1 - {file.name}
                </div>

                {/* Overlaid Annotations */}
                {annotations.map((ann) => (
                  <div
                    key={ann.id}
                    className="absolute p-1 rounded transition-all pointer-events-none"
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                    }}
                  >
                    {ann.type === 'text' && (
                      <span
                        style={{
                          color: ann.color || '#000',
                          fontSize: `${ann.fontSize || 16}px`,
                        }}
                        className="font-bold drop-shadow-sm"
                      >
                        {ann.content}
                      </span>
                    )}

                    {ann.type === 'signature' && ann.content && (
                      <img src={ann.content} alt="Signature" className="h-12 object-contain" />
                    )}

                    {ann.type === 'shape' && (
                      <div className="w-32 h-16 border-2 border-indigo-600 rounded bg-indigo-500/10" />
                    )}

                    {ann.type === 'highlight' && (
                      <div className="w-40 h-6 bg-amber-300/60 rounded" />
                    )}
                  </div>
                ))}

                <div className="text-[10px] text-slate-400 font-mono text-right">
                  {annotations.length} Annotations Active
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Signature Modal */}
      {showSigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <PenTool className="w-4 h-4 text-indigo-600" /> Draw Your Signature
              </h3>
              <button onClick={() => setShowSigModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="border border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-900 overflow-hidden">
              <canvas
                ref={sigCanvasRef}
                width={380}
                height={160}
                onMouseDown={startSigDraw}
                onMouseMove={drawSig}
                onMouseUp={stopSigDraw}
                onMouseLeave={stopSigDraw}
                className="w-full cursor-crosshair touch-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={clearSigCanvas}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold"
              >
                Clear Pad
              </button>
              <button
                onClick={addSignatureAnnotation}
                disabled={!sigDataUrl}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs disabled:opacity-50"
              >
                Insert Signature
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
