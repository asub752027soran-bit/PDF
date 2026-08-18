export interface LiveStats {
  totalConversions: number;
  bytesProcessed: number;
  toolUsage: Record<string, number>;
  lastActivity: number;
  sessionStart: number;
}

const STATS_STORAGE_KEY = 'pdfeditfy_live_stats';

const DEFAULT_STATS: LiveStats = {
  totalConversions: 0,
  bytesProcessed: 0,
  toolUsage: {},
  lastActivity: Date.now(),
  sessionStart: Date.now(),
};

export function getLiveStats(): LiveStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATS,
        ...parsed,
      };
    }
  } catch (e) {
    console.error('Error reading stats:', e);
  }
  return { ...DEFAULT_STATS };
}

export function recordToolConversion(toolId: string, fileSizeBytes: number = 0): LiveStats {
  try {
    const current = getLiveStats();
    const updated: LiveStats = {
      ...current,
      totalConversions: current.totalConversions + 1,
      bytesProcessed: current.bytesProcessed + (fileSizeBytes > 0 ? fileSizeBytes : 1024 * 512), // default ~512KB if size not passed
      toolUsage: {
        ...current.toolUsage,
        [toolId]: (current.toolUsage[toolId] || 0) + 1,
      },
      lastActivity: Date.now(),
    };
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updated));
    // Dispatch custom event for immediate UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pdfeditfy_stats_updated', { detail: updated }));
    }
    return updated;
  } catch (e) {
    console.error('Error recording conversion:', e);
    return getLiveStats();
  }
}

export function resetLiveStats(): LiveStats {
  const fresh = { ...DEFAULT_STATS, sessionStart: Date.now(), lastActivity: Date.now() };
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(fresh));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pdfeditfy_stats_updated', { detail: fresh }));
    }
  } catch (e) {
    console.error('Error resetting stats:', e);
  }
  return fresh;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
