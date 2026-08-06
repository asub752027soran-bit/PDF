import React, { useState } from 'react';
import { Upload, Download, Image as ImageIcon, ArrowLeft, RotateCw, Crop, Minimize2, Sparkles, Layers } from 'lucide-react';
import { processImage, formatBytes } from '../../utils/imageProcessor';
import { imagesToPDF } from '../../utils/pdfProcessor';
import { downloadBlob } from '../../utils/batchProcessor';

interface ImageEditorToolProps {
  onBack: () => void;
}

export const ImageEditorTool: React.FC<ImageEditorToolProps> = ({ onBack }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [quality, setQuality] = useState(80); // 1-100
  const [rotation, setRotation] = useState<number>(0);
  const [customWidth, setCustomWidth] = useState<number | undefined>(undefined);
  const [convertToPDFMode, setConvertToPDFMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Single preview stats
  const [processedResult, setProcessedResult] = useState<{ url: string; blob: Blob; origSize: number; newSize: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setProcessedResult(null);
    }
  };

  const handleProcessImage = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      if (convertToPDFMode) {
        const pdfBytes = await imagesToPDF(files);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, 'converted_images.pdf');
      } else {
        const file = files[0];
        const res = await processImage(file, {
          format: targetFormat,
          quality: quality / 100,
          rotationAngle: rotation,
          width: customWidth,
          maintainAspectRatio: true,
        });

        setProcessedResult({
          url: res.url,
          blob: res.blob,
          origSize: file.size,
          newSize: res.blob.size,
        });

        const ext = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
        downloadBlob(res.blob, `${file.name.replace(/\.[^/.]+$/, '')}.${ext}`);
      }
    } catch (err) {
      console.error('Image processing failed:', err);
      alert('Failed to process image.');
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
            <ImageIcon className="w-5 h-5 text-indigo-600" /> Image Converter & Editor
          </h1>
          <p className="text-xs text-slate-500">
            Convert JPG, PNG, WEBP, compress size, resize, rotate, or convert photos to PDF.
          </p>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-10 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Upload Image Files (JPG, PNG, WEBP, SVG, BMP)
          </h3>
          <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
            Zero account registration required. Fast in-browser processing.
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer transition-all">
            <Upload className="w-4 h-4" /> Choose Image Files
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 text-xs">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                Uploaded {files.length} Image(s)
              </h4>
              <p className="text-slate-500">{files[0].name}</p>
            </div>
            <button
              onClick={() => setFiles([])}
              className="font-bold text-rose-500 hover:underline"
            >
              Change Images
            </button>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            {/* Format & Mode */}
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Output Mode
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConvertToPDFMode(false)}
                    className={`flex-1 py-2 rounded-xl border font-bold transition-all ${
                      !convertToPDFMode
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Image Format
                  </button>
                  <button
                    onClick={() => setConvertToPDFMode(true)}
                    className={`flex-1 py-2 rounded-xl border font-bold transition-all ${
                      convertToPDFMode
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Convert to PDF
                  </button>
                </div>
              </div>

              {!convertToPDFMode && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Target Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['jpeg', 'png', 'webp'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setTargetFormat(fmt)}
                        className={`py-2 rounded-xl border font-bold uppercase transition-all ${
                          targetFormat === fmt
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {fmt === 'jpeg' ? 'JPG' : fmt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quality Slider & Rotate */}
            {!convertToPDFMode && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <span>Compression Quality ({quality}%)</span>
                    <span className="text-indigo-600">{quality < 50 ? 'High Compression' : 'High Quality'}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Rotation Angle
                  </label>
                  <div className="flex items-center gap-2">
                    {[0, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        onClick={() => setRotation(deg)}
                        className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                          rotation === deg
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Processed Size Savings Card */}
          {processedResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-950 dark:text-emerald-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold">Conversion & Compression Completed!</span>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Original: {formatBytes(processedResult.origSize)} → New: {formatBytes(processedResult.newSize)}
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
          )}

          {/* Download Action */}
          <button
            onClick={handleProcessImage}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Image...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Process & Download Image
              </>
            )}
          </button>

        </div>
      )}

    </div>
  );
};
