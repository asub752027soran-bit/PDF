import React, { useState, useEffect } from 'react';
import {
  Upload,
  Download,
  Image as ImageIcon,
  ArrowLeft,
  RotateCw,
  Crop,
  Minimize2,
  Sparkles,
  Layers,
  FileArchive,
  Maximize2,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw
} from 'lucide-react';
import { processImage, formatBytes, ImageResizeOptions } from '../../utils/imageProcessor';
import { renderPDFToImages, PDFPageImage } from '../../utils/pdfExtractor';
import { imagesToPDF } from '../../utils/pdfProcessor';
import { createZipArchive, downloadBlob } from '../../utils/batchProcessor';
import { recordToolConversion } from '../../utils/activityTracker';
import { FilePreviewCard } from '../common/FilePreviewCard';
import { MultiFilePreviewList } from '../common/MultiFilePreviewList';
import { useProgress } from '../../context/ProgressContext';

interface ImageEditorToolProps {
  toolId?: string;
  onBack: () => void;
  initialFiles?: File[] | null;
  initialFile?: File | null;
}

export const ImageEditorTool: React.FC<ImageEditorToolProps> = ({
  toolId = 'image-converter',
  onBack,
  initialFiles,
  initialFile
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [quality, setQuality] = useState(80); // 1-100
  const [rotation, setRotation] = useState<number>(0);
  const [customWidth, setCustomWidth] = useState<number | ''>('');
  const [customHeight, setCustomHeight] = useState<number | ''>('');
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [origDimensions, setOrigDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const { startProgress, updateProgress, setItemsProgress, completeProgress, failProgress } = useProgress();

  // Results for PDF to Images conversion
  const [pdfPageImages, setPdfPageImages] = useState<PDFPageImage[]>([]);

  // Single processed result
  const [processedResult, setProcessedResult] = useState<{
    url: string;
    blob: Blob;
    origSize: number;
    newSize: number;
    width: number;
    height: number;
  } | null>(null);

  const isPdfToImage = toolId === 'pdf-to-image';
  const isImageToPdf = toolId === 'image-to-pdf';
  const isCompressor = toolId === 'image-compressor';
  const isResizer = toolId === 'image-resizer';

  const fileAccept = isPdfToImage ? '.pdf,application/pdf' : 'image/*,.svg,.bmp,.tiff';

  const getTitle = () => {
    if (isPdfToImage) return 'Convert PDF Pages to High-Resolution JPG / PNG Images';
    if (isImageToPdf) return 'Convert Photos to PDF Document';
    if (isCompressor) return 'Compress & Optimize Image File Size';
    if (isResizer) return 'Resize Dimensions & Scale Images';
    return 'Universal Image Converter';
  };

  const getSubtitle = () => {
    if (isPdfToImage) return 'Extract all pages from a PDF document into independent JPG or PNG images instantly.';
    if (isImageToPdf) return 'Combine single or multiple photos into a clean, printable PDF file.';
    if (isCompressor) return 'Reduce image file size up to 80% with adjustable compression.';
    if (isResizer) return 'Adjust pixel dimensions, scale resolution presets, and lock aspect ratio.';
    return 'Convert images between JPG, PNG, and WEBP formats with instant download.';
  };

  const processIncomingFiles = async (selected: File[]) => {
    setFiles(selected);
    setProcessedResult(null);
    setPdfPageImages([]);

    if (selected.length > 0 && !selected[0].name.toLowerCase().endsWith('.pdf')) {
      // Read original image dimensions
      const img = new Image();
      const objUrl = URL.createObjectURL(selected[0]);
      img.onload = () => {
        setOrigDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        if (isResizer) {
          setCustomWidth(img.naturalWidth);
          setCustomHeight(img.naturalHeight);
        }
        URL.revokeObjectURL(objUrl);
      };
      img.src = objUrl;
    }

    if (isPdfToImage && selected.length > 0 && selected[0].name.toLowerCase().endsWith('.pdf')) {
      setIsProcessing(true);
      startProgress({
        title: 'Extracting PDF Pages as Images',
        status: `Rendering pages in "${selected[0].name}"...`,
        stage: 'Rasterizing Pages',
        indeterminate: false
      });

      try {
        updateProgress(20, 'Reading PDF page tree...', 'PDF Parsing');
        const pageImgs = await renderPDFToImages(selected[0], targetFormat === 'png' ? 'png' : 'jpeg', 2.0);
        setPdfPageImages(pageImgs);
        completeProgress(`Extracted ${pageImgs.length} high-resolution page images!`);
      } catch (err: any) {
        console.error('PDF page rendering failed:', err);
        failProgress(err?.message || 'Failed to extract images from PDF.');
        alert('Failed to extract images from PDF.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      processIncomingFiles(initialFiles);
    } else if (initialFile) {
      processIncomingFiles([initialFile]);
    }
  }, [initialFiles, initialFile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected: File[] = Array.from(e.target.files);
      processIncomingFiles(selected);
    }
  };

  // Handle aspect ratio sync when width changes
  const handleWidthChange = (val: number | '') => {
    setCustomWidth(val);
    if (maintainAspect && origDimensions && val !== '' && origDimensions.width > 0) {
      const calculatedH = Math.round((val / origDimensions.width) * origDimensions.height);
      setCustomHeight(calculatedH);
    }
  };

  // Handle aspect ratio sync when height changes
  const handleHeightChange = (val: number | '') => {
    setCustomHeight(val);
    if (maintainAspect && origDimensions && val !== '' && origDimensions.height > 0) {
      const calculatedW = Math.round((val / origDimensions.height) * origDimensions.width);
      setCustomWidth(calculatedW);
    }
  };

  // Preset dimension scaling
  const handleScalePreset = (percent: number) => {
    if (!origDimensions) return;
    const newW = Math.round((origDimensions.width * percent) / 100);
    const newH = Math.round((origDimensions.height * percent) / 100);
    setCustomWidth(newW);
    setCustomHeight(newH);
  };

  const handleProcessSingle = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    if (isImageToPdf) {
      startProgress({
        title: 'Converting Images to PDF',
        status: `Packaging ${files.length} photo${files.length > 1 ? 's' : ''} into PDF document...`,
        stage: 'Vector PDF Compilation'
      });
      try {
        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        updateProgress(45, 'Embedding images into high-resolution PDF pages...', 'Rendering Pages');
        const pdfBytes = await imagesToPDF(files);
        updateProgress(90, 'Packaging PDF document...', 'Finalizing PDF');

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        recordToolConversion(toolId, totalSize);
        downloadBlob(blob, 'converted_images.pdf');
        completeProgress(`Combined ${files.length} photos into PDF document!`);
      } catch (err: any) {
        console.error('Image to PDF failed:', err);
        failProgress(err?.message || 'Failed to convert images to PDF.');
        alert('Failed to convert images to PDF.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      const file = files[0];
      startProgress({
        title: isResizer ? 'Resizing Image' : isCompressor ? 'Compressing Image' : 'Converting Image',
        status: `Processing "${file.name}"...`,
        stage: 'Canvas Transformation'
      });

      try {
        updateProgress(40, 'Rendering pixel rasterization...', 'Transforming Bitmaps');
        const options: ImageResizeOptions = {
          format: targetFormat,
          quality: quality / 100,
          rotationAngle: rotation,
          maintainAspectRatio: maintainAspect
        };

        if (customWidth && typeof customWidth === 'number') {
          options.width = customWidth;
        }
        if (customHeight && typeof customHeight === 'number') {
          options.height = customHeight;
        }

        const res = await processImage(file, options);

        setProcessedResult({
          url: res.url,
          blob: res.blob,
          origSize: file.size,
          newSize: res.blob.size,
          width: res.width,
          height: res.height
        });

        const ext = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
        recordToolConversion(toolId, file.size);
        downloadBlob(res.blob, `${file.name.replace(/\.[^/.]+$/, '')}_processed.${ext}`);
        completeProgress(
          `Processed image (${formatBytes(file.size)} → ${formatBytes(res.blob.size)}, ${res.width}x${res.height}px)!`
        );
      } catch (err: any) {
        console.error('Image processing failed:', err);
        failProgress(err?.message || 'Failed to process image.');
        alert('Failed to process image.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDownloadAllPdfImagesZip = async () => {
    if (pdfPageImages.length === 0) return;
    setIsProcessing(true);
    startProgress({
      title: 'Creating ZIP Package',
      status: `Archiving ${pdfPageImages.length} extracted images into ZIP...`,
      stage: 'Building ZIP Archive'
    });

    try {
      const ext = targetFormat === 'png' ? 'png' : 'jpg';
      const cleanName = files[0]?.name ? files[0].name.replace(/\.[^/.]+$/, '') : 'pdf_pages';

      const zipFiles = pdfPageImages.map((page) => ({
        name: `${cleanName}_page_${page.pageNumber}.${ext}`,
        data: page.blob
      }));

      const zipBlob = await createZipArchive(zipFiles);
      recordToolConversion(toolId, files[0]?.size || zipBlob.size);
      downloadBlob(zipBlob, `${cleanName}_images_all_pages.zip`);
      completeProgress(`Downloaded ZIP containing all ${pdfPageImages.length} pages!`);
    } catch (err: any) {
      console.error('Zip creation failed:', err);
      failProgress(err?.message || 'Failed to generate ZIP file.');
      alert('Failed to generate ZIP file.');
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
            <ImageIcon className="w-5 h-5 text-indigo-600" /> {getTitle()}
          </h1>
          <p className="text-xs text-slate-500 max-w-lg ml-auto">
            {getSubtitle()}
          </p>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center bg-white dark:bg-slate-800/80 hover:border-indigo-500 transition-all shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Upload Image or PDF File
          </h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            {isPdfToImage ? 'Select a PDF document to extract page images.' : 'Select JPG, PNG, WEBP, or SVG files.'}
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 cursor-pointer transition-all">
            <Upload className="w-4 h-4" /> Select File
            <input
              type="file"
              multiple={isImageToPdf}
              accept={fileAccept}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Visual Preview */}
          {files.length === 1 ? (
            <FilePreviewCard
              file={files[0]}
              onRemove={() => {
                setFiles([]);
                setPdfPageImages([]);
                setProcessedResult(null);
                setOrigDimensions(null);
              }}
              onReplace={(newF) => processIncomingFiles([newF])}
            />
          ) : (
            <MultiFilePreviewList
              files={files}
              onRemoveFile={(idx) => setFiles(files.filter((_, i) => i !== idx))}
              onMoveFile={(idx, dir) => {
                const target = dir === 'up' ? idx - 1 : idx + 1;
                if (target < 0 || target >= files.length) return;
                const next = [...files];
                const temp = next[idx];
                next[idx] = next[target];
                next[target] = temp;
                setFiles(next);
              }}
              onClearAll={() => {
                setFiles([]);
                setPdfPageImages([]);
                setProcessedResult(null);
                setOrigDimensions(null);
              }}
              title="Image Conversion Queue"
            />
          )}

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">

          {/* PDF Page Images Grid */}
          {isPdfToImage && pdfPageImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Extracted Pages ({pdfPageImages.length})
                </span>
                <button
                  onClick={handleDownloadAllPdfImagesZip}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-2"
                >
                  <FileArchive className="w-4 h-4" /> Download All Pages as ZIP
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-2xl">
                {pdfPageImages.map((page) => (
                  <div key={page.pageNumber} className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-900 flex flex-col items-center space-y-2">
                    <img src={page.dataUrl} alt={`Page ${page.pageNumber}`} className="max-h-32 object-contain rounded shadow-sm" />
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Page {page.pageNumber}</span>
                    <button
                      onClick={() => downloadBlob(page.blob, `page_${page.pageNumber}.${targetFormat === 'png' ? 'png' : 'jpg'}`)}
                      className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white text-[10px] font-bold transition-all"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resizer Dimension Controls */}
          {isResizer && origDimensions && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Crop className="w-4 h-4 text-indigo-600" /> Dimension & Aspect Ratio Controls
                </span>
                <span className="text-[11px] text-slate-500">
                  Original: {origDimensions.width} × {origDimensions.height} px
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => handleWidthChange(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Width in pixels"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => handleHeightChange(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Height in pixels"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintainAspect}
                    onChange={(e) => setMaintainAspect(e.target.checked)}
                    className="rounded text-indigo-600 accent-indigo-600"
                  />
                  <span>Lock Aspect Ratio</span>
                </label>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px]">Quick scale:</span>
                  {[25, 50, 75, 100, 150, 200].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handleScalePreset(pct)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-[11px] font-bold text-slate-700 dark:text-slate-300"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Common Image Settings Options */}
          {!isPdfToImage && !isImageToPdf && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Output Format
                </label>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="jpeg">JPG / JPEG Format</option>
                  <option value="png">PNG Format (Transparent support)</option>
                  <option value="webp">WEBP Format (Web optimized)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quality Compression ({quality}%)
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-indigo-600 mt-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rotation Angle
                </label>
                <select
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value={0}>0° Normal</option>
                  <option value={90}>90° Rotate Right</option>
                  <option value={180}>180° Rotate Upside Down</option>
                  <option value={270}>270° Rotate Left</option>
                </select>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!isPdfToImage && (
            <button
              onClick={handleProcessSingle}
              disabled={isProcessing || files.length === 0}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isImageToPdf
                ? `Convert ${files.length} Photo${files.length > 1 ? 's' : ''} to Single PDF`
                : isResizer
                ? 'Resize & Download Image'
                : isCompressor
                ? 'Compress & Download Image'
                : 'Convert & Download Image'}
            </button>
          )}

          {/* Savings Result Card */}
          {processedResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between font-bold">
              <span>
                Original: {formatBytes(processedResult.origSize)} → New: {formatBytes(processedResult.newSize)} ({processedResult.width}×{processedResult.height}px)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px]">
                {Math.round(((processedResult.origSize - processedResult.newSize) / processedResult.origSize) * 100)}% Saved
              </span>
            </div>
          )}

        </div>
      </div>
      )}

    </div>
  );
};
