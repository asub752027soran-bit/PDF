import React, { useEffect, useState, useRef } from 'react';
import { UploadCloud, FileText, Sparkles, ShieldCheck, FileSpreadsheet, Image as ImgIcon, ArrowDown } from 'lucide-react';
import { TOOLS } from '../../data/toolsData';

interface GlobalDropZoneProps {
  activeToolId: string | null;
  onFilesDropped: (files: File[]) => void;
}

export const GlobalDropZone: React.FC<GlobalDropZoneProps> = ({
  activeToolId,
  onFilesDropped,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const activeTool = TOOLS.find((t) => t.id === activeToolId);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current += 1;

      if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const fileList = Array.from(e.dataTransfer.files);
        onFilesDropped(fileList);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onFilesDropped]);

  if (!isDragging) return null;

  return (
    <div
      id="global-drag-drop-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 pointer-events-none select-none"
    >
      <div className="w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-dashed border-blue-500 dark:border-blue-400 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-blue-500/20 text-center flex flex-col items-center justify-center relative overflow-hidden transition-all">
        
        {/* Glowing background ambient accent */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Icons & Main Drop Area */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/30 animate-bounce">
            <UploadCloud className="w-12 h-12" />
          </div>

          {/* Mini orbiting badges */}
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md animate-pulse">
            <ArrowDown className="w-4 h-4" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          {activeTool ? (
            <>Drop to open in <span className="text-blue-600 dark:text-blue-400">{activeTool.name}</span></>
          ) : (
            <>Drop your file here to <span className="text-blue-600 dark:text-blue-400">instantly edit</span></>
          )}
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mb-6 leading-relaxed">
          Release your file anywhere on the screen to load and start editing immediately without clicking file menus.
        </p>

        {/* Supported File Formats Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            PDF & Word (.docx)
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel (.xlsx, .csv)
          </span>
          <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5">
            <ImgIcon className="w-3.5 h-3.5" />
            Images (JPG, PNG, WEBP)
          </span>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>100% Client-Side & Private • Files never leave your browser</span>
        </div>

      </div>
    </div>
  );
};
