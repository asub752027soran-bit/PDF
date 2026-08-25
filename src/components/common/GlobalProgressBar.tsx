import React from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Minimize2,
  Maximize2,
  Clock,
  Zap,
  Sparkles,
  Layers
} from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';

export const GlobalProgressBar: React.FC = () => {
  const {
    state,
    resetProgress,
    toggleMinimize
  } = useProgress();

  if (!state.isActive && !state.isCompleted && !state.isError) {
    return null;
  }

  const {
    title,
    status,
    stage,
    progress,
    indeterminate,
    itemsProcessed,
    totalItems,
    estimatedSecondsRemaining,
    canCancel,
    onCancel,
    isMinimized,
    isCompleted,
    isError,
    errorMessage
  } = state;

  const formattedEta = (): string | null => {
    if (isCompleted) return 'Done';
    if (isError) return null;
    if (estimatedSecondsRemaining === null || estimatedSecondsRemaining === undefined) return null;
    if (estimatedSecondsRemaining <= 0) return 'Almost ready...';
    if (estimatedSecondsRemaining < 60) return `~${estimatedSecondsRemaining}s remaining`;
    const mins = Math.floor(estimatedSecondsRemaining / 60);
    const secs = estimatedSecondsRemaining % 60;
    return `~${mins}m ${secs}s remaining`;
  };

  const etaText = formattedEta();

  return (
    <>
      {/* 1. TOP EDGE STREAMING PROGRESS BAR */}
      <div
        id="global-top-progress-bar-container"
        className="fixed top-0 left-0 right-0 z-[99999] h-1 pointer-events-none overflow-hidden bg-slate-200/50 dark:bg-slate-800/50"
      >
        <div
          id="global-top-progress-bar-fill"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className={`h-full transition-all duration-300 ease-out ${
            isError
              ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
              : isCompleted
              ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
              : indeterminate
              ? 'w-1/3 animate-[indeterminate_1.5s_infinite_linear] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-[0_0_12px_rgba(99,102,241,0.8)]'
          }`}
          style={{
            width: indeterminate ? undefined : `${Math.max(3, progress)}%`
          }}
        />
      </div>

      {/* 2. MINIMIZED PILL (Bottom Right) */}
      {isMinimized && (
        <div
          id="global-progress-minimized-pill"
          onClick={toggleMinimize}
          className="fixed bottom-5 right-5 z-[99998] cursor-pointer flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-750 shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-slate-800 dark:text-slate-100 group"
          title="Click to expand details"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : isError ? (
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin flex-shrink-0" />
          )}

          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight truncate max-w-[140px]">
              {title || 'Processing'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {isCompleted ? 'Completed' : isError ? 'Error' : `${Math.round(progress)}%`}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimize();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. EXPANDED FLOATING STATUS CARD (Bottom Right) */}
      {!isMinimized && (
        <div
          id="global-progress-card"
          className="fixed bottom-5 right-5 z-[99998] w-[calc(100vw-2.5rem)] sm:w-96 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/10 dark:shadow-black/50 p-4 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
          role="status"
          aria-live="polite"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isError
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    : isCompleted
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                {isError ? (
                  <AlertCircle className="w-4 h-4" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
              </div>

              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {title || 'File Processing'}
                </h4>
                {stage && (
                  <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                    {stage}
                  </p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {totalItems !== undefined && totalItems > 1 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {itemsProcessed !== undefined ? `${itemsProcessed}/${totalItems}` : `${totalItems} files`}
                </span>
              )}

              <button
                id="global-progress-minimize-btn"
                onClick={toggleMinimize}
                title="Minimize indicator"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>

              {(isCompleted || isError) && (
                <button
                  id="global-progress-close-btn"
                  onClick={resetProgress}
                  title="Close"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Track & Percentage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-600 dark:text-slate-300 truncate max-w-[220px]">
                {status || (isCompleted ? 'Finished' : 'Processing...')}
              </span>
              <span
                className={`font-mono text-xs ${
                  isError
                    ? 'text-rose-600 dark:text-rose-400'
                    : isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                {isCompleted ? '100%' : isError ? 'Error' : `${Math.round(progress)}%`}
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isError
                    ? 'bg-rose-500'
                    : isCompleted
                    ? 'bg-emerald-500'
                    : indeterminate
                    ? 'w-1/2 animate-[indeterminate_1.5s_infinite_linear] bg-gradient-to-r from-blue-500 to-indigo-600'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
                }`}
                style={{
                  width: indeterminate ? undefined : `${Math.max(4, progress)}%`
                }}
              />
            </div>
          </div>

          {/* Bottom Meta Information (ETA, Cancel Button, Error Message) */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            {isError ? (
              <span className="text-rose-500 font-medium truncate max-w-[280px]">
                {errorMessage || 'Operation encountered an issue.'}
              </span>
            ) : (
              <div className="flex items-center gap-1.5 font-medium">
                {etaText && (
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    {etaText}
                  </span>
                )}
                {!etaText && !isCompleted && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <Zap className="w-3 h-3 text-amber-500" />
                    In-browser client conversion
                  </span>
                )}
                {isCompleted && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    Ready for download
                  </span>
                )}
              </div>
            )}

            {canCancel && !isCompleted && !isError && onCancel && (
              <button
                onClick={() => {
                  onCancel();
                  resetProgress();
                }}
                className="px-2 py-0.5 rounded text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
