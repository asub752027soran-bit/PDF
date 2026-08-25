import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface ProgressConfig {
  title: string;
  status?: string;
  stage?: string;
  indeterminate?: boolean;
  totalItems?: number;
  itemsProcessed?: number;
  canCancel?: boolean;
  onCancel?: () => void;
  estimatedTotalSeconds?: number;
}

export interface GlobalProgressState {
  isActive: boolean;
  title: string;
  status: string;
  stage?: string;
  progress: number; // 0 - 100
  indeterminate: boolean;
  totalItems?: number;
  itemsProcessed?: number;
  startTime: number | null;
  estimatedSecondsRemaining: number | null;
  canCancel: boolean;
  onCancel?: () => void;
  isMinimized: boolean;
  isCompleted: boolean;
  isError: boolean;
  errorMessage?: string;
}

const DEFAULT_STATE: GlobalProgressState = {
  isActive: false,
  title: '',
  status: '',
  stage: '',
  progress: 0,
  indeterminate: false,
  totalItems: undefined,
  itemsProcessed: undefined,
  startTime: null,
  estimatedSecondsRemaining: null,
  canCancel: false,
  onCancel: undefined,
  isMinimized: false,
  isCompleted: false,
  isError: false,
  errorMessage: undefined
};

interface ProgressContextValue {
  state: GlobalProgressState;
  startProgress: (config: ProgressConfig) => void;
  updateProgress: (progress: number | ((prev: number) => number), status?: string, stage?: string) => void;
  setItemsProgress: (processed: number, total: number, status?: string, stage?: string) => void;
  completeProgress: (message?: string) => void;
  failProgress: (errorMessage?: string) => void;
  resetProgress: () => void;
  toggleMinimize: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

// Event-based bridge so non-React util functions can trigger/update progress
type ProgressEventListener = (state: Partial<GlobalProgressState> | 'RESET' | 'COMPLETE') => void;
const listeners = new Set<ProgressEventListener>();

export const progressTracker = {
  start: (config: ProgressConfig) => {
    listeners.forEach((l) =>
      l({
        isActive: true,
        isCompleted: false,
        isError: false,
        title: config.title,
        status: config.status || 'Processing files...',
        stage: config.stage,
        progress: config.indeterminate ? 10 : 0,
        indeterminate: !!config.indeterminate,
        totalItems: config.totalItems,
        itemsProcessed: config.itemsProcessed || 0,
        startTime: Date.now(),
        canCancel: !!config.canCancel,
        onCancel: config.onCancel
      })
    );
  },
  update: (progress: number, status?: string, stage?: string) => {
    listeners.forEach((l) =>
      l({
        progress: Math.min(100, Math.max(0, progress)),
        ...(status ? { status } : {}),
        ...(stage ? { stage } : {})
      })
    );
  },
  setItems: (processed: number, total: number, status?: string, stage?: string) => {
    const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
    listeners.forEach((l) =>
      l({
        itemsProcessed: processed,
        totalItems: total,
        progress: Math.min(100, Math.max(0, percent)),
        ...(status ? { status } : {}),
        ...(stage ? { stage } : {})
      })
    );
  },
  complete: (message?: string) => {
    listeners.forEach((l) =>
      l({
        isCompleted: true,
        progress: 100,
        status: message || 'Processing finished successfully!'
      })
    );
  },
  fail: (errorMessage?: string) => {
    listeners.forEach((l) =>
      l({
        isError: true,
        status: errorMessage || 'An error occurred during processing.',
        errorMessage
      })
    );
  },
  reset: () => {
    listeners.forEach((l) => l('RESET'));
  }
};

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GlobalProgressState>(DEFAULT_STATE);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate ETA based on progress velocity
  const calculateEta = useCallback((currProgress: number, startTime: number | null): number | null => {
    if (!startTime || currProgress <= 3 || currProgress >= 100) return null;
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    if (elapsedSeconds < 0.5) return null;
    const estimatedTotalSeconds = (elapsedSeconds / currProgress) * 100;
    const remaining = Math.max(1, Math.round(estimatedTotalSeconds - elapsedSeconds));
    return remaining;
  }, []);

  const startProgress = useCallback((config: ProgressConfig) => {
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    setState({
      isActive: true,
      title: config.title,
      status: config.status || 'Starting task...',
      stage: config.stage,
      progress: config.indeterminate ? 15 : 0,
      indeterminate: !!config.indeterminate,
      totalItems: config.totalItems,
      itemsProcessed: config.itemsProcessed,
      startTime: Date.now(),
      estimatedSecondsRemaining: config.estimatedTotalSeconds || null,
      canCancel: !!config.canCancel,
      onCancel: config.onCancel,
      isMinimized: false,
      isCompleted: false,
      isError: false,
      errorMessage: undefined
    });
  }, []);

  const updateProgress = useCallback(
    (progressVal: number | ((prev: number) => number), status?: string, stage?: string) => {
      setState((prev) => {
        if (!prev.isActive && !prev.isCompleted) return prev;
        const newProgress =
          typeof progressVal === 'function' ? progressVal(prev.progress) : progressVal;
        const clamped = Math.min(100, Math.max(0, newProgress));
        const eta = calculateEta(clamped, prev.startTime);

        return {
          ...prev,
          progress: clamped,
          status: status || prev.status,
          stage: stage !== undefined ? stage : prev.stage,
          indeterminate: false,
          estimatedSecondsRemaining: eta
        };
      });
    },
    [calculateEta]
  );

  const setItemsProgress = useCallback(
    (processed: number, total: number, status?: string, stage?: string) => {
      setState((prev) => {
        const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
        const eta = calculateEta(percent, prev.startTime);
        return {
          ...prev,
          itemsProcessed: processed,
          totalItems: total,
          progress: percent,
          status: status || `Processing item ${processed} of ${total}...`,
          stage: stage !== undefined ? stage : prev.stage,
          indeterminate: false,
          estimatedSecondsRemaining: eta
        };
      });
    },
    [calculateEta]
  );

  const completeProgress = useCallback((message?: string) => {
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    setState((prev) => ({
      ...prev,
      isCompleted: true,
      progress: 100,
      estimatedSecondsRemaining: 0,
      status: message || 'Completed successfully!'
    }));

    // Auto dismiss after 3.2 seconds
    finishTimeoutRef.current = setTimeout(() => {
      setState(DEFAULT_STATE);
    }, 3200);
  }, []);

  const failProgress = useCallback((errorMessage?: string) => {
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    setState((prev) => ({
      ...prev,
      isError: true,
      status: errorMessage || 'Processing failed.',
      errorMessage
    }));

    // Auto dismiss error card after 6 seconds
    finishTimeoutRef.current = setTimeout(() => {
      setState(DEFAULT_STATE);
    }, 6000);
  }, []);

  const resetProgress = useCallback(() => {
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    setState(DEFAULT_STATE);
  }, []);

  const toggleMinimize = useCallback(() => {
    setState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  // Listen to external event triggers
  useEffect(() => {
    const handleExternalEvent: ProgressEventListener = (payload) => {
      if (payload === 'RESET') {
        resetProgress();
      } else if (payload === 'COMPLETE') {
        completeProgress();
      } else {
        setState((prev) => {
          const next = { ...prev, ...payload };
          if (payload.progress !== undefined && payload.progress >= 100) {
            next.isCompleted = true;
          }
          return next;
        });

        if (payload.isCompleted) {
          if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
          finishTimeoutRef.current = setTimeout(() => {
            setState(DEFAULT_STATE);
          }, 3200);
        }
      }
    };

    listeners.add(handleExternalEvent);
    return () => {
      listeners.delete(handleExternalEvent);
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    };
  }, [resetProgress, completeProgress]);

  return (
    <ProgressContext.Provider
      value={{
        state,
        startProgress,
        updateProgress,
        setItemsProgress,
        completeProgress,
        failProgress,
        resetProgress,
        toggleMinimize
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    // Return safe fallback if used outside provider
    return {
      state: DEFAULT_STATE,
      startProgress: progressTracker.start,
      updateProgress: progressTracker.update,
      setItemsProgress: progressTracker.setItems,
      completeProgress: progressTracker.complete,
      failProgress: progressTracker.fail,
      resetProgress: progressTracker.reset,
      toggleMinimize: () => {}
    };
  }
  return context;
};
