import { TOOLS } from '../data/toolsData';
import { ActionLogEntry } from '../types';

export interface LiveStats {
  totalConversions: number;
  bytesProcessed: number;
  toolUsage: Record<string, number>;
  lastActivity: number;
  sessionStart: number;
}

export interface ToolPopularityMetric {
  toolId: string;
  toolName: string;
  category: string;
  conversionsCount: number;
  percentage: number;
  totalBytesProcessed: number;
  formattedBytes: string;
  lastUsedTimestamp?: number;
  badge?: string;
}

export interface CategoryMetric {
  category: string;
  count: number;
  percentage: number;
  totalBytes: number;
  formattedBytes: string;
}

const STATS_STORAGE_KEY = 'pdfeditfy_live_stats';
const ACTION_LOGS_STORAGE_KEY = 'pdfeditfy_action_logs';
const MAX_LOG_ENTRIES = 500;

const DEFAULT_STATS: LiveStats = {
  totalConversions: 0,
  bytesProcessed: 0,
  toolUsage: {},
  lastActivity: Date.now(),
  sessionStart: Date.now(),
};

// Tool metadata helper
function getToolMeta(toolId: string) {
  const tool = TOOLS.find((t) => t.id === toolId);
  if (tool) {
    return { name: tool.name, category: tool.category, badge: tool.badge };
  }
  // Fallback prettification
  const cleanName = toolId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { name: cleanName, category: 'PDF Tools', badge: undefined };
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

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
    console.error('Error reading live stats:', e);
  }
  return { ...DEFAULT_STATS };
}

export function getActionLogs(): ActionLogEntry[] {
  try {
    const raw = localStorage.getItem(ACTION_LOGS_STORAGE_KEY);
    if (raw) {
      const parsed: ActionLogEntry[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => b.timestamp - a.timestamp);
      }
    }
  } catch (e) {
    console.error('Error reading action logs:', e);
  }
  return [];
}

export function recordToolConversion(
  toolId: string,
  fileSizeBytes: number = 0,
  actionName?: string,
  details?: string,
  status: 'success' | 'failed' = 'success'
): LiveStats {
  try {
    const bytes = fileSizeBytes > 0 ? fileSizeBytes : 1024 * 512; // default ~512KB fallback
    const toolMeta = getToolMeta(toolId);
    const resolvedAction = actionName || `${toolMeta.name} Conversion`;

    // 1. Update LiveStats
    const current = getLiveStats();
    const updatedStats: LiveStats = {
      ...current,
      totalConversions: current.totalConversions + (status === 'success' ? 1 : 0),
      bytesProcessed: current.bytesProcessed + bytes,
      toolUsage: {
        ...current.toolUsage,
        [toolId]: (current.toolUsage[toolId] || 0) + (status === 'success' ? 1 : 0),
      },
      lastActivity: Date.now(),
    };
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updatedStats));

    // 2. Append new ActionLogEntry
    const newLogEntry: ActionLogEntry = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      toolId,
      toolName: toolMeta.name,
      category: toolMeta.category,
      action: resolvedAction,
      fileSizeBytes: bytes,
      formattedSize: formatBytes(bytes),
      status,
      details: details || `Processed ${formatBytes(bytes)} via ${toolMeta.name}`,
    };

    const currentLogs = getActionLogs();
    const trimmedLogs = [newLogEntry, ...currentLogs].slice(0, MAX_LOG_ENTRIES);
    localStorage.setItem(ACTION_LOGS_STORAGE_KEY, JSON.stringify(trimmedLogs));

    // 3. Dispatch events for real-time reactivity
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pdfeditfy_stats_updated', { detail: updatedStats }));
      window.dispatchEvent(new CustomEvent('pdfeditfy_action_logged', { detail: newLogEntry }));
    }

    return updatedStats;
  } catch (e) {
    console.error('Error recording conversion action:', e);
    return getLiveStats();
  }
}

export function clearActionLogs(): void {
  try {
    localStorage.removeItem(ACTION_LOGS_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pdfeditfy_action_logged', { detail: null }));
    }
  } catch (e) {
    console.error('Error clearing action logs:', e);
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

/**
 * Calculates popular tools ranked by conversion volume and total bytes
 */
export function getPopularToolsMetrics(): ToolPopularityMetric[] {
  const stats = getLiveStats();
  const logs = getActionLogs();
  const totalConversions = Math.max(stats.totalConversions, 1);

  // Group bytes and last used time by toolId from logs and stats
  const toolStatsMap: Record<
    string,
    { count: number; bytes: number; lastUsed?: number }
  > = {};

  // Initialize from liveStats toolUsage
  for (const [toolId, count] of Object.entries(stats.toolUsage)) {
    toolStatsMap[toolId] = {
      count,
      bytes: count * 1024 * 750, // default estimation base
    };
  }

  // Refine exact bytes and timestamps from actual logs
  for (const log of logs) {
    if (!toolStatsMap[log.toolId]) {
      toolStatsMap[log.toolId] = { count: 0, bytes: 0, lastUsed: log.timestamp };
    }
    toolStatsMap[log.toolId].bytes += log.fileSizeBytes;
    if (!toolStatsMap[log.toolId].lastUsed || log.timestamp > (toolStatsMap[log.toolId].lastUsed || 0)) {
      toolStatsMap[log.toolId].lastUsed = log.timestamp;
    }
  }

  const metrics: ToolPopularityMetric[] = Object.entries(toolStatsMap)
    .filter(([_, data]) => data.count > 0)
    .map(([toolId, data]) => {
      const meta = getToolMeta(toolId);
      return {
        toolId,
        toolName: meta.name,
        category: meta.category,
        conversionsCount: data.count,
        percentage: Math.round((data.count / totalConversions) * 1000) / 10,
        totalBytesProcessed: data.bytes,
        formattedBytes: formatBytes(data.bytes),
        lastUsedTimestamp: data.lastUsed,
        badge: meta.badge,
      };
    });

  // Sort by highest conversions count descending
  return metrics.sort((a, b) => b.conversionsCount - a.conversionsCount);
}

/**
 * Calculates popularity by tool category
 */
export function getCategoryMetrics(): CategoryMetric[] {
  const popularTools = getPopularToolsMetrics();
  const totalCount = popularTools.reduce((acc, t) => acc + t.conversionsCount, 0) || 1;

  const categoryMap: Record<string, { count: number; bytes: number }> = {};

  for (const tool of popularTools) {
    if (!categoryMap[tool.category]) {
      categoryMap[tool.category] = { count: 0, bytes: 0 };
    }
    categoryMap[tool.category].count += tool.conversionsCount;
    categoryMap[tool.category].bytes += tool.totalBytesProcessed;
  }

  return Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      count: data.count,
      percentage: Math.round((data.count / totalCount) * 1000) / 10,
      totalBytes: data.bytes,
      formattedBytes: formatBytes(data.bytes),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Generates sample historical action logs for owner preview and analytics testing
 */
export function seedSampleActionLogs(): void {
  const sampleTools = [
    { id: 'edit-pdf', action: 'In-Place Text & Signature Edit', baseSize: 2.4 * 1024 * 1024, count: 18 },
    { id: 'compress-pdf', action: 'Extreme PDF Compression (78% saved)', baseSize: 6.8 * 1024 * 1024, count: 14 },
    { id: 'merge-pdf', action: 'Combined 4 PDF Documents', baseSize: 8.5 * 1024 * 1024, count: 12 },
    { id: 'universal-converter', action: 'Batch DOCX to PDF Conversion', baseSize: 3.1 * 1024 * 1024, count: 9 },
    { id: 'ocr-reader', action: 'Scanned Document OCR Text Extraction', baseSize: 4.2 * 1024 * 1024, count: 7 },
    { id: 'image-converter', action: 'Batch PNG to WebP Optimization', baseSize: 12.0 * 1024 * 1024, count: 8 },
    { id: 'excel-to-pdf', action: 'Spreadsheet Sheet to PDF Render', baseSize: 1.8 * 1024 * 1024, count: 5 },
    { id: 'split-pdf', action: 'Extracted Pages 1-5 to Single PDF', baseSize: 2.1 * 1024 * 1024, count: 6 },
    { id: 'word-to-pdf', action: 'DOCX Document Layout Preservation', baseSize: 3.5 * 1024 * 1024, count: 8 },
  ];

  const now = Date.now();
  const generatedLogs: ActionLogEntry[] = [];
  const toolUsage: Record<string, number> = {};
  let totalConversions = 0;
  let totalBytes = 0;

  sampleTools.forEach((st, sIdx) => {
    toolUsage[st.id] = st.count;
    totalConversions += st.count;

    for (let i = 0; i < st.count; i++) {
      const timeOffset = (sIdx * 7 + i * 19 + Math.floor(Math.random() * 30)) * 60 * 1000 * 15; // spread over past hours/days
      const logTime = now - timeOffset;
      const sizeVariation = st.baseSize * (0.8 + Math.random() * 0.4);
      totalBytes += sizeVariation;

      const meta = getToolMeta(st.id);

      generatedLogs.push({
        id: `sample_${sIdx}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: logTime,
        toolId: st.id,
        toolName: meta.name,
        category: meta.category,
        action: st.action,
        fileSizeBytes: Math.round(sizeVariation),
        formattedSize: formatBytes(sizeVariation),
        status: 'success',
        details: `Successfully converted and downloaded via ${meta.name}`,
      });
    }
  });

  generatedLogs.sort((a, b) => b.timestamp - a.timestamp);

  const updatedStats: LiveStats = {
    totalConversions,
    bytesProcessed: totalBytes,
    toolUsage,
    lastActivity: now,
    sessionStart: now - 3 * 24 * 60 * 60 * 1000,
  };

  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updatedStats));
  localStorage.setItem(ACTION_LOGS_STORAGE_KEY, JSON.stringify(generatedLogs));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pdfeditfy_stats_updated', { detail: updatedStats }));
    window.dispatchEvent(new CustomEvent('pdfeditfy_action_logged', { detail: generatedLogs[0] }));
  }
}

/**
 * Exports action logs as formatted CSV for spreadsheet analysis
 */
export function exportActionLogsToCSV(): void {
  const logs = getActionLogs();
  if (logs.length === 0) {
    alert('No action logs available to export.');
    return;
  }

  const headers = ['ID', 'Timestamp', 'Date Time', 'Tool ID', 'Tool Name', 'Category', 'Action', 'File Size (Bytes)', 'Formatted Size', 'Status', 'Details'];
  
  const rows = logs.map((log) => [
    log.id,
    log.timestamp,
    new Date(log.timestamp).toISOString(),
    log.toolId,
    `"${log.toolName.replace(/"/g, '""')}"`,
    `"${log.category.replace(/"/g, '""')}"`,
    `"${log.action.replace(/"/g, '""')}"`,
    log.fileSizeBytes,
    `"${log.formattedSize}"`,
    log.status,
    `"${(log.details || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `pdfeditfy_action_logs_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Exports action logs as formatted JSON
 */
export function exportActionLogsToJSON(): void {
  const logs = getActionLogs();
  const stats = getLiveStats();
  const popular = getPopularToolsMetrics();

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    statsSummary: stats,
    popularityRanking: popular,
    totalLogsCount: logs.length,
    logs,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `pdfeditfy_action_logs_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
