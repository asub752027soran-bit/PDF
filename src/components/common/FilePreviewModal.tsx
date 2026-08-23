import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Info,
  Calendar,
  HardDrive
} from 'lucide-react';
import { PreviewMetadata, formatFileSize, renderPdfPagePreview } from '../../utils/previewGenerator';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  initialMetadata?: PreviewMetadata | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  initialMetadata,
}) => {
  const [metadata, setMetadata] = useState<PreviewMetadata | null>(initialMetadata || null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageImageUrl, setPageImageUrl] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !file) return;

    // Reset states
    setCurrentPage(1);
    setZoomLevel(1);
    setRotation(0);
    setMetadata(initialMetadata || null);

    if (initialMetadata?.thumbnailUrl && initialMetadata.previewType === 'pdf') {
      setPageImageUrl(initialMetadata.thumbnailUrl);
    } else if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPageImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [isOpen, file, initialMetadata]);

  // Handle PDF page changes
  useEffect(() => {
    if (!isOpen || !file || file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return;
    }

    let isMounted = true;
    const loadPage = async () => {
      setIsLoadingPage(true);
      try {
        const result = await renderPdfPagePreview(file, currentPage, 1.8);
        if (isMounted) {
          setPageImageUrl(result.dataUrl);
          setMetadata((prev) => prev ? { ...prev, pageCount: result.totalPages, currentPage } : null);
        }
      } catch (err) {
        console.error('Failed to render PDF page modal:', err);
      } finally {
        if (isMounted) setIsLoadingPage(false);
      }
    };

    loadPage();
    return () => {
      isMounted = false;
    };
  }, [currentPage, file, isOpen]);

  if (!isOpen || !file) return null;

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(0.4, Math.min(3.0, Number((prev + delta).toFixed(2)))));
  };

  const handleRotate = (angle: number) => {
    setRotation((prev) => (prev + angle + 360) % 360);
  };

  const handleDownload = () => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalPages = metadata?.pageCount || 1;
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(file.name);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullScreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-5xl h-[88vh] max-h-[850px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {file.name}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span className="uppercase font-mono">{file.name.split('.').pop()}</span>
                {totalPages > 1 && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      Page {currentPage} of {totalPages}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleDownload}
              title="Download Original"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hidden sm:block"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              title="Close Preview"
              className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/60 dark:hover:text-red-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas & Viewer */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden relative">
          
          {/* Main Visual Stage */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-950/90 overflow-auto p-4 sm:p-8 flex items-center justify-center relative">
            
            {isLoadingPage && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/20 backdrop-blur-xs">
                <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {(isPdf || isImage) && pageImageUrl ? (
              <div
                className="transition-transform duration-150 flex items-center justify-center"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src={pageImageUrl}
                  alt={`Preview of ${file.name}`}
                  className="max-h-[62vh] max-w-full object-contain rounded-lg shadow-xl bg-white select-none transition-shadow"
                />
              </div>
            ) : metadata?.textSnippet ? (
              <div className="w-full max-w-2xl bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-xs font-mono whitespace-pre-wrap max-h-[60vh] overflow-y-auto leading-relaxed text-slate-800 dark:text-slate-200">
                {metadata.textSnippet}
              </div>
            ) : (
              <div className="text-center p-8 text-slate-400 text-xs space-y-2">
                <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                <p>Visual canvas preview not available for this binary format.</p>
                <p className="font-mono text-[11px]">{file.name} ({formatFileSize(file.size)})</p>
              </div>
            )}
          </div>

          {/* Right Info Sidebar (Metadata & Document Stats) */}
          <div className="w-full sm:w-64 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shrink-0 text-xs overflow-y-auto">
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Document Metadata
              </h4>
              <p className="text-[11px] text-slate-500">Live Client-Side Inspection</p>
            </div>

            <div className="space-y-2.5 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <span className="text-slate-400 font-medium block">File Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 break-all">{file.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <span className="text-slate-400 font-medium block">File Size</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{formatFileSize(file.size)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <span className="text-slate-400 font-medium block">Type</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 uppercase">{file.name.split('.').pop()}</span>
                </div>
              </div>

              {metadata?.width && metadata?.height && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <span className="text-slate-400 font-medium block">Resolution</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {Math.round(metadata.width)} × {Math.round(metadata.height)} px
                  </span>
                </div>
              )}

              {totalPages > 1 && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <span className="text-slate-400 font-medium block">Total Pages</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{totalPages} Pages</span>
                </div>
              )}

              {file.lastModified && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <span className="text-slate-400 font-medium block flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Last Modified
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {new Date(file.lastModified).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Floating Controls Bar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-3 shrink-0">
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => handleZoom(-0.2)}
              disabled={zoomLevel <= 0.4}
              title="Zoom Out"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-2 text-slate-700 dark:text-slate-200 min-w-[44px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.2)}
              disabled={zoomLevel >= 3.0}
              title="Zoom In"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="text-[10px] font-bold px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Rotation Controls */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => handleRotate(-90)}
              title="Rotate Left 90°"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-2 text-slate-700 dark:text-slate-200">
              {rotation}°
            </span>
            <button
              onClick={() => handleRotate(90)}
              title="Rotate Right 90°"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Multi-page PDF Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoadingPage}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold px-2 text-slate-700 dark:text-slate-200">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isLoadingPage}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
