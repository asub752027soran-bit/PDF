import React, { useState } from 'react';
import {
  FileText,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
  Maximize2,
  Layers,
  ArrowUpDown,
  Shuffle,
  Sparkles
} from 'lucide-react';
import { FilePreviewCard } from './FilePreviewCard';
import { FilePreviewModal } from './FilePreviewModal';
import { formatFileSize } from '../../utils/previewGenerator';

interface MultiFilePreviewListProps {
  files: File[];
  onRemoveFile: (index: number) => void;
  onMoveFile?: (index: number, direction: 'up' | 'down') => void;
  onClearAll?: () => void;
  onSortAlphabetical?: (ascending?: boolean) => void;
  onReverseOrder?: () => void;
  className?: string;
  title?: string;
}

export const MultiFilePreviewList: React.FC<MultiFilePreviewListProps> = ({
  files,
  onRemoveFile,
  onMoveFile,
  onClearAll,
  onSortAlphabetical,
  onReverseOrder,
  className = '',
  title = 'Uploaded Files & Preview',
}) => {
  const [selectedFileForModal, setSelectedFileForModal] = useState<File | null>(null);

  if (files.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with counts and sorting tools */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
            {files.length}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-[11px] text-slate-500">
              Total Size: {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onSortAlphabetical && (
            <button
              type="button"
              onClick={() => onSortAlphabetical(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>A-Z</span>
            </button>
          )}

          {onReverseOrder && (
            <button
              type="button"
              onClick={onReverseOrder}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Reverse</span>
            </button>
          )}

          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="px-2.5 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of File Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {files.map((file, idx) => (
          <div key={`${file.name}_${file.size}_${idx}`} className="relative group">
            <FilePreviewCard
              file={file}
              onRemove={() => onRemoveFile(idx)}
              compact={false}
            />

            {/* Ordering controls on bottom/right */}
            {onMoveFile && files.length > 1 && (
              <div className="absolute top-3 right-16 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => onMoveFile(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30 rounded transition-colors"
                  title="Move Up"
                >
                  <MoveUp className="w-3 h-3" />
                </button>
                <span className="text-[10px] font-mono font-bold px-1 text-slate-400">
                  #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onMoveFile(idx, 'down')}
                  disabled={idx === files.length - 1}
                  className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30 rounded transition-colors"
                  title="Move Down"
                >
                  <MoveDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <FilePreviewModal
        isOpen={!!selectedFileForModal}
        onClose={() => setSelectedFileForModal(null)}
        file={selectedFileForModal}
      />
    </div>
  );
};
