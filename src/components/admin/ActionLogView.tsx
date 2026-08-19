import React, { useState, useMemo } from 'react';
import {
  Activity,
  BarChart2,
  Download,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  TrendingUp,
  HardDrive,
  Layers,
  ArrowUpDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar
} from 'lucide-react';
import { ActionLogEntry } from '../../types';
import {
  LiveStats,
  ToolPopularityMetric,
  CategoryMetric,
  getPopularToolsMetrics,
  getCategoryMetrics,
  exportActionLogsToCSV,
  exportActionLogsToJSON,
  seedSampleActionLogs,
  clearActionLogs,
  formatBytes
} from '../../utils/activityTracker';

interface ActionLogViewProps {
  logs: ActionLogEntry[];
  liveStats: LiveStats;
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const ActionLogView: React.FC<ActionLogViewProps> = ({
  logs,
  liveStats,
  onRefresh,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [selectedLog, setSelectedLog] = useState<ActionLogEntry | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Compute live popular tools metrics and category metrics
  const popularTools = useMemo(() => getPopularToolsMetrics(), [logs, liveStats]);
  const categoryMetrics = useMemo(() => getCategoryMetrics(), [logs, liveStats]);

  // Derive unique categories from logs
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.category));
    popularTools.forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [logs, popularTools]);

  // Top Most Popular Tool
  const topTool = popularTools.length > 0 ? popularTools[0] : null;

  // Filter logs
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;
    const thirtyDays = 30 * oneDay;

    return logs.filter((log) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = log.toolName.toLowerCase().includes(query);
        const matchesAction = log.action.toLowerCase().includes(query);
        const matchesCategory = log.category.toLowerCase().includes(query);
        const matchesDetails = (log.details || '').toLowerCase().includes(query);
        const matchesId = log.id.toLowerCase().includes(query);
        if (!matchesName && !matchesAction && !matchesCategory && !matchesDetails && !matchesId) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'All' && log.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && log.status !== statusFilter) {
        return false;
      }

      // Timeframe filter
      if (timeframeFilter === 'today' && now - log.timestamp > oneDay) {
        return false;
      }
      if (timeframeFilter === 'week' && now - log.timestamp > sevenDays) {
        return false;
      }
      if (timeframeFilter === 'month' && now - log.timestamp > thirtyDays) {
        return false;
      }

      return true;
    }).sort((a, b) => (sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp));
  }, [logs, searchTerm, categoryFilter, statusFilter, timeframeFilter, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const handleSeedData = () => {
    seedSampleActionLogs();
    onRefresh();
    showToast('Generated sample action logs for analysis');
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all action log entries?')) {
      clearActionLogs();
      onRefresh();
      showToast('Action logs cleared');
    }
  };

  const handleExportCSV = () => {
    exportActionLogsToCSV();
    showToast('Exported Action Log as CSV');
  };

  const handleExportJSON = () => {
    exportActionLogsToJSON();
    showToast('Exported Action Log as JSON');
  };

  // Helper for human-readable relative time
  const getRelativeTime = (timestamp: number) => {
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1: Total Conversions */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Conversions</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {liveStats.totalConversions.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Success Rate</span>
          </div>
        </div>

        {/* Metric 2: Most Popular Tool */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">#1 Popular Tool</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white truncate">
            {topTool ? topTool.toolName : 'Awaiting ops'}
          </p>
          <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 truncate">
            {topTool ? `${topTool.conversionsCount} ops (${topTool.percentage}% share)` : 'No conversions yet'}
          </div>
        </div>

        {/* Metric 3: Total Data Processed */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Data Transferred</span>
            <HardDrive className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {formatBytes(liveStats.bytesProcessed)}
          </p>
          <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
            Client memory volume
          </div>
        </div>

        {/* Metric 4: Total Logged Actions */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Logged Actions</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {logs.length}
          </p>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {logs.length > 0 ? `Latest: ${getRelativeTime(logs[0].timestamp)}` : 'Zero records'}
          </div>
        </div>
      </div>

      {/* 2. Popularity Leaderboard & Category Share Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Popular Tools Ranking */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                Tool Popularity Leaderboard (By Conversions)
              </h3>
              <p className="text-xs text-slate-400">
                Ranked by volume of successful conversions and tool usages
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
              {popularTools.length} Active Tools Recorded
            </span>
          </div>

          {popularTools.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-3">
              <Activity className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                No tool conversions recorded yet.
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Conversions executed by any tool on the site automatically log here in real-time.
              </p>
              <button
                onClick={handleSeedData}
                className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-200 dark:border-blue-800 inline-flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Seed Sample Historical Activity
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {popularTools.map((tool, idx) => (
                <div
                  key={tool.toolId}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2 hover:border-blue-400/60 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold flex items-center justify-center text-[10px]">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {tool.toolName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                        {tool.category}
                      </span>
                      {tool.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold uppercase">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {tool.formattedBytes}
                      </span>
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        {tool.conversionsCount} ops ({tool.percentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0
                          ? 'bg-blue-600'
                          : idx === 1
                          ? 'bg-indigo-500'
                          : idx === 2
                          ? 'bg-purple-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(5, Math.min(100, tool.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Share Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Category Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              Conversions volume aggregated by tool category
            </p>
          </div>

          {categoryMetrics.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No category data available yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {categoryMetrics.map((cat) => (
                <div
                  key={cat.category}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {cat.category}
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-[11px]">
                      {cat.count} ops ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${Math.max(4, cat.percentage)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 text-right">
                    Total Volume: {cat.formattedBytes}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Filterable Action Log Table Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Live Action Log History ({filteredLogs.length} Records)
            </h3>
            <p className="text-xs text-slate-400">
              Detailed audit trail of successful conversions, batch operations, and tool usages
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Export as CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Export as JSON payload"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>

            <button
              onClick={handleSeedData}
              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-all flex items-center gap-1.5"
              title="Seed sample realistic logs for testing"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Seed Activity
            </button>

            <button
              onClick={handleClearLogs}
              className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-900 transition-all flex items-center gap-1.5"
              title="Clear all action logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Logs
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search tool, action or ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-slate-300"
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Filter */}
          <div>
            <select
              value={timeframeFilter}
              onChange={(e) => {
                setTimeframeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="all">Timeframe: All Time</option>
              <option value="today">Timeframe: Today (Last 24h)</option>
              <option value="week">Timeframe: Past 7 Days</option>
              <option value="month">Timeframe: Past 30 Days</option>
            </select>
          </div>

          {/* Status Filter & Sort Order */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="all">Status: All</option>
              <option value="success">Status: Success</option>
              <option value="failed">Status: Failed</option>
            </select>

            <button
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
              title={sortOrder === 'desc' ? 'Sort Newest First' : 'Sort Oldest First'}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-3">
            <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              No matching action logs found.
            </p>
            <p className="text-[11px] text-slate-400">
              Try adjusting your search criteria or time filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Tool & Category</th>
                  <th className="py-3 px-3">Action Description</th>
                  <th className="py-3 px-3">Volume</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {getRelativeTime(log.timestamp)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' • '}
                        {new Date(log.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>

                    {/* Tool & Category */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{log.toolName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {log.category}
                      </span>
                    </td>

                    {/* Action Description */}
                    <td className="py-3 px-3">
                      <div className="text-slate-800 dark:text-slate-200 font-semibold line-clamp-1 max-w-xs sm:max-w-md">
                        {log.action}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs font-mono">
                        ID: {log.id}
                      </div>
                    </td>

                    {/* Volume */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[11px]">
                        {log.formattedSize}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'success'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                        }`}
                      >
                        {log.status === 'success' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Success
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Failed
                          </>
                        )}
                      </span>
                    </td>

                    {/* Details Action */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-400 text-[11px] font-bold transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredLogs.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span>Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-bold text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Action Log Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Action Log Details
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Tool Name</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedLog.toolName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Category</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedLog.category}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Volume</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedLog.formattedSize}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {selectedLog.status.toUpperCase()}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Action Executed
                </span>
                <p className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-medium text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
                  {selectedLog.action}
                </p>
              </div>

              {selectedLog.details && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Additional Details
                  </span>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-medium text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
                    {selectedLog.details}
                  </p>
                </div>
              )}

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Raw JSON Payload
                </span>
                <div className="p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[10px] overflow-x-auto border border-slate-800 max-h-32">
                  {JSON.stringify(selectedLog, null, 2)}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
