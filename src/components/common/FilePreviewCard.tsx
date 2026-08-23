import React, { useState, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Maximize2,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  PreviewMetadata,
  generateFilePreview,
  renderPdfPagePreview,
  formatFileSize
} from '../../utils/previewGenerator';
import { FilePreviewModal } from './FilePreviewModal';

interface FilePreviewCardProps {
  file: File;
  onRemove?: () => void;
  onReplace?: (newFile: File) => void;
  className?: string;
  showInspectorButton?: boolean;
  compact?: boolean;
}

export const FilePreviewCard: React.FC<FilePreviewCardProps> = ({
  file,
  onRemove,
  onReplace,
  className = '',
  showInspectorButton = true,
  compact = false,
}) => {
  const [metadata, setMetadata] = useState<PreviewMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [pageThumbnailUrl, setPageThumbnailUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setCurrentPage(1);

    generateFilePreview(file, 1)
      .then((meta) => {
        if (isMounted) {
          setMetadata(meta);
          if (meta.thumbnailUrl) {
            setPageThumbnailUrl(meta.thumbnailUrl);
          }
        }
      })
      .catch((err) => {
        console.error('Error generating preview in card:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [file]);

  const handlePageChange = async (newPage: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!metadata || !metadata.pageCount || newPage < 1 || newPage > metadata.pageCount) return;

    setCurrentPage(newPage);
    if (metadata.previewType === 'pdf') {
      try {
        const rendered = await renderPdfPagePreview(file, newPage, 1.0);
        setPageThumbnailUrl(rendered.dataUrl);
      } catch (err) {
        console.error('Failed page render:', err);
      }
    }
  };

  const isPdf = metadata?.previewType === 'pdf' || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = metadata?.previewType === 'image' || file.type.startsWith('image/');
  const totalPages = metadata?.pageCount || 1;

  if (compact) {
    return (
      <>
        <div className={`flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition-all ${className}`}>
          <div className="flex items-center gap-3 min-w-0">
            {/* Tiny Visual Thumbnail */}
            <div
              onClick={() => setIsModalOpen(true)}
              className="w-12 h-14 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200/80 dark:border-slate-700 shrink-0 flex items-center justify-center cursor-pointer relative group"
            >
              {pageThumbnailUrl ? (
                <img
                  src={pageThumbnailUrl}
                  alt={file.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <FileText className="w-5 h-5 text-slate-400" />
              )}
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Eye className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs">
                {file.name}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                <span>{formatFileSize(file.size)}</span>
                {totalPages > 1 && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{totalPages} pages</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {showInspectorButton && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors"
                title="Preview full document"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Remove file"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <FilePreviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          file={file}
          initialMetadata={metadata}
        />
      </>
    );
  }

  return (
    <>
      <div className={`p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:border-blue-500/80 dark:hover:border-blue-500/80 transition-all ${className}`}>
        
        {/* Top Header Row with status & remove */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
              {isPdf ? 'PDF Ready' : isImage ? 'Image Ready' : 'Document Ready'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Client-Side Loaded</span>
          </div>

          <div className="flex items-center gap-1.5">
            {showInspectorButton && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                title="Remove File"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Center Content: Visual Thumbnail Stage & Details */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pt-4">
          
          {/* Visual Preview Canvas Frame */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="w-36 h-48 sm:w-40 sm:h-52 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex flex-col items-center justify-center relative group cursor-pointer shadow-inner"
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] text-slate-400 font-bold">Rendering Preview...</span>
              </div>
            ) : pageThumbnailUrl ? (
              <>
                <img
                  src={pageThumbnailUrl}
                  alt={file.name}
                  className="w-full h-full object-contain p-1.5 bg-white dark:bg-slate-900 group-hover:scale-105 transition-transform duration-200 select-none"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity gap-1">
                  <Maximize2 className="w-5 h-5 drop-shadow-md" />
                  <span className="text-[10px] font-bold tracking-wide">Click to Enlarge</span>
                </div>
              </>
            ) : metadata?.textSnippet ? (
              <div className="w-full h-full p-2.5 overflow-hidden text-[9px] font-mono text-slate-600 dark:text-slate-400 leading-tight bg-white dark:bg-slate-900">
                {metadata.textSnippet.slice(0, 180)}...
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-slate-400">
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <span className="text-[10px] font-bold uppercase">{metadata?.extension || 'FILE'}</span>
              </div>
            )}

            {/* In-Card Page Navigation for Multi-Page PDF */}
            {totalPages > 1 && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-1.5 inset-x-2 bg-slate-900/80 backdrop-blur-xs text-white rounded-lg p-1 flex items-center justify-between text-[10px] font-bold shadow-md"
              >
                <button
                  type="button"
                  onClick={(e) => handlePageChange(currentPage - 1, e)}
                  disabled={currentPage <= 1}
                  className="p-1 rounded hover:bg-white/20 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span>{currentPage} / {totalPages}</span>
                <button
                  type="button"
                  onClick={(e) => handlePageChange(currentPage + 1, e)}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded hover:bg-white/20 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Metadata details and specs */}
          <div className="flex-1 min-w-0 space-y-3 w-full">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate" title={file.name}>
                {file.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{formatFileSize(file.size)}</span>
                <span>•</span>
                <span className="font-mono text-[11px] uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                  {metadata?.extension || file.name.split('.').pop()}
                </span>
              </p>
            </div>

            {/* Quick Metadata Badges */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {isPdf ? 'Total Pages' : 'Resolution'}
                </span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                  {isPdf
                    ? `${totalPages} Page${totalPages > 1 ? 's' : ''}`
                    : metadata?.width && metadata?.height
                    ? `${Math.round(metadata.width)} × ${Math.round(metadata.height)}`
                    : 'Standard'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Storage Status</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  In Browser Memory
                </span>
              </div>
            </div>

            {/* Replace / Change File Control */}
            {onReplace && (
              <div className="pt-1">
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 cursor-pointer transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Choose a different file</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        onReplace(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            )}

          </div>

        </div>

      </div>

      <FilePreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        file={file}
        initialMetadata={metadata}
      />
    </>
  );
};
