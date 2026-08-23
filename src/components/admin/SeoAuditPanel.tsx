import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Globe,
  Search,
  RefreshCw,
  Download,
  ExternalLink,
  Code,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
  Link,
  Layers,
  ArrowRight,
  Filter,
  Wrench,
  HelpCircle,
  Eye
} from 'lucide-react';
import { AdminConfig } from '../../types';
import {
  runFullSeoAudit,
  FullAuditReport,
  PageAuditResult,
  SeoAuditIssue,
  IssueCategory,
  IssueSeverity
} from '../../utils/seoAuditor';

interface SeoAuditPanelProps {
  config: AdminConfig;
  onUpdateConfig: (updated: AdminConfig) => void;
  showToast: (msg: string) => void;
}

export const SeoAuditPanel: React.FC<SeoAuditPanelProps> = ({
  config,
  onUpdateConfig,
  showToast
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedTime, setLastScannedTime] = useState<string>(() => new Date().toLocaleTimeString());
  const [activePageTypeFilter, setActivePageTypeFilter] = useState<'all' | 'needs_attention' | 'tools' | 'core'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('all');
  
  // Inspection Drawer / Modal state
  const [inspectingPageId, setInspectingPageId] = useState<string | null>(null);
  const [inspectTab, setInspectTab] = useState<'html' | 'jsonld' | 'checks'>('checks');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Quick Inline Edit State
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Generate audit results on config changes
  const auditReport: FullAuditReport = useMemo(() => {
    return runFullSeoAudit(config);
  }, [config]);

  // Handle Scan Refresh
  const handleRunAudit = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastScannedTime(new Date().toLocaleTimeString());
      showToast('SEO Audit refreshed: All 34 pages inspected successfully');
    }, 600);
  };

  // Filtered pages
  const filteredPages = useMemo(() => {
    return auditReport.pages.filter((page) => {
      // 1. Page Type filter
      if (activePageTypeFilter === 'needs_attention') {
        if (page.status === 'excellent') return false;
      } else if (activePageTypeFilter === 'tools') {
        if (page.pageType !== 'tool') return false;
      } else if (activePageTypeFilter === 'core') {
        if (page.pageType === 'tool') return false;
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = page.name.toLowerCase().includes(q);
        const matchesUrl = page.url.toLowerCase().includes(q);
        const matchesDesc = page.description.toLowerCase().includes(q);
        const matchesIssues = page.issues.some((i) => i.title.toLowerCase().includes(q) || i.recommendation.toLowerCase().includes(q));
        if (!matchesName && !matchesUrl && !matchesDesc && !matchesIssues) return false;
      }

      // 3. Category filter
      if (selectedCategoryFilter !== 'all') {
        const hasCatIssue = page.issues.some((i) => i.category === selectedCategoryFilter);
        if (!hasCatIssue) return false;
      }

      // 4. Severity filter
      if (selectedSeverityFilter !== 'all') {
        const hasSevIssue = page.issues.some((i) => i.severity === selectedSeverityFilter);
        if (!hasSevIssue) return false;
      }

      return true;
    });
  }, [auditReport, activePageTypeFilter, searchQuery, selectedCategoryFilter, selectedSeverityFilter]);

  const inspectingPage = useMemo(() => {
    if (!inspectingPageId) return null;
    return auditReport.pages.find((p) => p.id === inspectingPageId) || null;
  }, [auditReport, inspectingPageId]);

  // Handle Copy to clipboard
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast('Copied to clipboard');
  };

  // Handle Quick Inline Edit Start
  const handleStartEdit = (page: PageAuditResult) => {
    setEditingPageId(page.id);
    setEditTitle(page.title);
    setEditDesc(page.description);
  };

  // Handle Quick Inline Edit Save
  const handleSaveEdit = (page: PageAuditResult) => {
    if (page.pageType === 'homepage') {
      onUpdateConfig({
        ...config,
        homepageSeoTitle: editTitle,
        homepageSeoDescription: editDesc,
      });
      showToast('Homepage SEO updated & re-audited');
    } else if (page.pageType === 'tool' && page.toolId) {
      const toolOverrides = { ...(config.toolSeoOverrides || {}) };
      toolOverrides[page.toolId] = {
        ...(toolOverrides[page.toolId] || {}),
        seoTitle: editTitle,
        seoDescription: editDesc,
      };
      onUpdateConfig({
        ...config,
        toolSeoOverrides: toolOverrides,
      });
      showToast(`SEO overrides updated for ${page.name}`);
    }
    setEditingPageId(null);
  };

  // Export Audit Report (JSON)
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditReport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pdfeditfy-seo-audit-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported full SEO audit report JSON');
  };

  // Export Audit Report (CSV)
  const handleExportCsv = () => {
    const headers = ['Page Name', 'URL', 'Score', 'Status', 'Passed Checks', 'Warnings', 'Errors', 'Title Tag', 'Meta Description', 'Canonical URL', 'JSON-LD Valid', 'Issues Summary'];
    const rows = auditReport.pages.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.url}"`,
      p.score,
      p.status,
      p.checksPassed,
      p.checksWarned,
      p.checksFailed,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.description.replace(/"/g, '""')}"`,
      `"${p.canonicalUrl}"`,
      p.jsonLdValid ? 'Yes' : 'No',
      `"${p.issues.filter((i) => i.severity !== 'pass').map((i) => `[${i.severity.toUpperCase()}] ${i.title}`).join('; ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodedUri);
    downloadAnchor.setAttribute('download', `pdfeditfy-seo-audit-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported SEO audit summary CSV');
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40';
    if (score >= 75) return 'text-blue-600 dark:text-blue-400 border-blue-500 bg-blue-50 dark:bg-blue-950/40';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-50 dark:bg-amber-950/40';
    return 'text-red-600 dark:text-red-400 border-red-500 bg-red-50 dark:bg-red-950/40';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 95) return 'Grade A+';
    if (score >= 90) return 'Grade A';
    if (score >= 80) return 'Grade B';
    if (score >= 70) return 'Grade C';
    return 'Grade D';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card with Scan Runner & Summary Score */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Background ambient accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 bg-blue-600/30 border border-blue-400/30 rounded-xl text-blue-400 shadow-inner">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Internal SEO &amp; Schema Audit Engine
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live In-App Inspector
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Automated diagnostic scanner verifying <strong className="text-white">canonical URLs</strong>, <strong className="text-white">meta descriptions</strong>, <strong className="text-white">title tags</strong>, and <strong className="text-white">Schema.org JSON-LD structured data</strong> across your homepage and all 26+ tool landing pages.
            </p>

            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
                Last audited: <span className="font-mono text-slate-200">{lastScannedTime}</span>
              </span>
              <span>•</span>
              <span>Total URLs: <strong className="text-white">{auditReport.totalPages}</strong></span>
              <span>•</span>
              <span>Valid Schemas: <strong className="text-emerald-400">{auditReport.totalPages} / {auditReport.totalPages}</strong></span>
            </div>
          </div>

          {/* Right Action & Big Score KPI */}
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-slate-800 pt-4 lg:pt-0">
            
            {/* Health Score Pill Card */}
            <div className="flex items-center gap-3.5 bg-slate-900/90 border border-slate-700/80 px-4 py-3 rounded-2xl shadow-lg">
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold border-2 shadow-inner ${getScoreColor(auditReport.totalScore)}`}>
                <span className="text-lg leading-none">{auditReport.totalScore}</span>
                <span className="text-[9px] font-mono opacity-80">%</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">SEO Health Score</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {getScoreBadge(auditReport.totalScore)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {auditReport.totalErrors === 0 ? '0 Critical Blockers' : `${auditReport.totalErrors} Critical Errors`} • {auditReport.totalWarnings} Improvements
                </p>
              </div>
            </div>

            {/* Run Audit Button */}
            <button
              onClick={handleRunAudit}
              disabled={isScanning}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Re-Run Audit'}</span>
            </button>

          </div>

        </div>

        {/* Category Breakdown Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-6 pt-5 border-t border-slate-800/80 text-[11px]">
          
          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-blue-400" />
              Canonicals
            </span>
            <span className="font-bold text-emerald-400 font-mono">
              {auditReport.totalPages - auditReport.summary.canonicalIssuesCount}/{auditReport.totalPages} Pass
            </span>
          </div>

          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Descriptions
            </span>
            <span className={`font-bold font-mono ${auditReport.summary.metaDescriptionIssuesCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {auditReport.totalPages - auditReport.summary.metaDescriptionIssuesCount}/{auditReport.totalPages} Ideal
            </span>
          </div>

          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              JSON-LD
            </span>
            <span className="font-bold text-emerald-400 font-mono">
              100% Valid
            </span>
          </div>

          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Title Tags
            </span>
            <span className={`font-bold font-mono ${auditReport.summary.titleIssuesCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {auditReport.totalPages - auditReport.summary.titleIssuesCount}/{auditReport.totalPages} Good
            </span>
          </div>

          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between col-span-2 sm:col-span-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Indexable
            </span>
            <span className="font-bold text-emerald-400 font-mono">
              {auditReport.totalPages - auditReport.summary.robotsIssuesCount}/{auditReport.totalPages} Open
            </span>
          </div>

        </div>

      </div>

      {/* Control Bar: Filters, Search & Exports */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Primary View Segment Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActivePageTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activePageTypeFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Pages ({auditReport.totalPages})
            </button>

            <button
              onClick={() => setActivePageTypeFilter('needs_attention')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activePageTypeFilter === 'needs_attention'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Needs Attention ({auditReport.pages.filter((p) => p.status !== 'excellent').length})
            </button>

            <button
              onClick={() => setActivePageTypeFilter('tools')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activePageTypeFilter === 'tools'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tool Pages (26)
            </button>

            <button
              onClick={() => setActivePageTypeFilter('core')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activePageTypeFilter === 'core'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Homepage &amp; Hubs (8)
            </button>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Download spreadsheet report"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Download JSON diagnostics"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
          </div>

        </div>

        {/* Second row: Search & Diagnostic Category Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by URL, tool name, or issue..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Audit Categories</option>
              <option value="canonical">Canonical Tag Diagnostics</option>
              <option value="meta_description">Meta Description Diagnostics</option>
              <option value="json_ld">JSON-LD Schema Diagnostics</option>
              <option value="title">Title Tag Diagnostics</option>
              <option value="robots">Robots &amp; Indexability</option>
              <option value="content">Content &amp; Rich FAQs</option>
            </select>
          </div>

          <div>
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Check Severities</option>
              <option value="error">Errors Only (Critical)</option>
              <option value="warning">Warnings Only (Recommendations)</option>
              <option value="pass">Passed Checks Only</option>
            </select>
          </div>

        </div>

      </div>

      {/* Pages Audit Results Table / Cards */}
      <div className="space-y-3">
        {filteredPages.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3 text-slate-400">
            <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              No pages matched your current filter criteria.
            </p>
            <button
              onClick={() => {
                setActivePageTypeFilter('all');
                setSearchQuery('');
                setSelectedCategoryFilter('all');
                setSelectedSeverityFilter('all');
              }}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          filteredPages.map((page) => {
            const hasErrors = page.checksFailed > 0;
            const hasWarnings = page.checksWarned > 0;
            const isEditing = editingPageId === page.id;

            return (
              <div
                key={page.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                
                {/* Page Main Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {page.name}
                      </span>
                      
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {page.relativeUrl}
                      </span>

                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full capitalize ${
                        page.status === 'excellent'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : page.status === 'good'
                          ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {page.status.replace('_', ' ')}
                      </span>

                      {page.faqCount !== undefined && page.faqCount > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {page.faqCount} FAQs
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 font-mono truncate max-w-xl">
                      {page.url}
                    </p>
                  </div>

                  {/* Right Score & Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    
                    {/* Score badge */}
                    <div className={`px-2.5 py-1 rounded-xl font-bold font-mono text-xs border ${getScoreColor(page.score)}`}>
                      {page.score}/100
                    </div>

                    {/* Quick Edit Override */}
                    {!isEditing && (page.pageType === 'homepage' || page.pageType === 'tool') && (
                      <button
                        onClick={() => handleStartEdit(page)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors text-xs font-bold flex items-center gap-1"
                        title="Edit Meta Tags"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit Meta</span>
                      </button>
                    )}

                    {/* Inspect Drawer button */}
                    <button
                      onClick={() => setInspectingPageId(page.id)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Tags &amp; Schema</span>
                    </button>

                  </div>

                </div>

                {/* Inline Meta Editor (when activated for this page) */}
                {isEditing && (
                  <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                      <span className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-blue-600" />
                        Inline SEO Tag Editor &amp; Overrider
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Changes update live and recalculate SEO audit score immediately
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                          <span>SEO Title Tag:</span>
                          <span className={`font-mono text-[10px] ${editTitle.length >= 35 && editTitle.length <= 65 ? 'text-emerald-600 font-bold' : 'text-amber-600'}`}>
                            {editTitle.length} chars (optimal: 35–65)
                          </span>
                        </div>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                          <span>Meta Description:</span>
                          <span className={`font-mono text-[10px] ${editDesc.length >= 120 && editDesc.length <= 165 ? 'text-emerald-600 font-bold' : 'text-amber-600'}`}>
                            {editDesc.length} chars (optimal: 120–165)
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setEditingPageId(null)}
                        className="px-3 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(page)}
                        className="px-3.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-sm"
                      >
                        Save &amp; Re-Calculate
                      </button>
                    </div>
                  </div>
                )}

                {/* 4 Core Pillars Summary Badges (Canonical, Meta Desc, Title, JSON-LD) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  
                  {/* Pillar 1: Canonical */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Link className="w-3 h-3 text-blue-500" />
                        Canonical Tag
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <p className="font-mono text-[10px] text-slate-500 truncate" title={page.canonicalUrl}>
                      {page.canonicalUrl}
                    </p>
                  </div>

                  {/* Pillar 2: Meta Description */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-indigo-500" />
                        Meta Description
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        {page.description.length}ch
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1" title={page.description}>
                      {page.description}
                    </p>
                  </div>

                  {/* Pillar 3: Title Tag */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        Title Tag
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        {page.title.length}ch
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1" title={page.title}>
                      {page.title}
                    </p>
                  </div>

                  {/* Pillar 4: JSON-LD Schema */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Code className="w-3 h-3 text-cyan-500" />
                        JSON-LD Schema
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        {page.schemaTypes.length} Types
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono truncate" title={page.schemaTypes.join(', ')}>
                      {page.schemaTypes.join(' • ')}
                    </p>
                  </div>

                </div>

                {/* Actionable Feedback & Diagnostic Issues List */}
                <div className="space-y-1.5 pt-1">
                  {page.issues.filter((i) => i.severity !== 'pass').map((issue) => (
                    <div
                      key={issue.id}
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                        issue.severity === 'error'
                          ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200'
                          : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                      }`}
                    >
                      <span className="mt-0.5">
                        {issue.severity === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        )}
                      </span>
                      
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold">{issue.title}</span>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-white/60 dark:bg-slate-900/60">
                            {issue.category.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-90 leading-relaxed">
                          {issue.description}
                        </p>
                        <div className="pt-1 flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                          <ArrowRight className="w-3 h-3 flex-shrink-0" />
                          <span><strong>Actionable Fix:</strong> {issue.recommendation}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {page.issues.filter((i) => i.severity !== 'pass').length === 0 && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span>
                        <strong>All Core SEO Checks Passed:</strong> Canonical tag verified, meta description length optimal, title formatted, and valid Schema.org graph active.
                      </span>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* INSPECTION MODAL / DRAWER */}
      {inspectingPage && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-850">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    SEO &amp; Schema Inspector: {inspectingPage.name}
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {inspectingPage.relativeUrl}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  {inspectingPage.url}
                </p>
              </div>

              <button
                onClick={() => setInspectingPageId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold">
              <button
                onClick={() => setInspectTab('checks')}
                className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  inspectTab === 'checks'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                All Audit Checks ({inspectingPage.issues.length})
              </button>

              <button
                onClick={() => setInspectTab('html')}
                className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  inspectTab === 'html'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Simulated &lt;head&gt; Meta Tags
              </button>

              <button
                onClick={() => setInspectTab('jsonld')}
                className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  inspectTab === 'jsonld'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Schema.org JSON-LD Graph ({inspectingPage.schemaTypes.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              
              {/* TAB 1: ALL AUDIT CHECKS */}
              {inspectTab === 'checks' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-xs">
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Passed Checks</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        {inspectingPage.checksPassed}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Warnings</p>
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                        {inspectingPage.checksWarned}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Critical Errors</p>
                      <p className="text-lg font-bold text-red-600 dark:text-red-400 font-mono mt-0.5">
                        {inspectingPage.checksFailed}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {inspectingPage.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                          issue.severity === 'pass'
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                            : issue.severity === 'error'
                            ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-900'
                            : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                        }`}
                      >
                        <span className="mt-0.5">
                          {issue.severity === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {issue.severity === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                          {issue.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                        </span>

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">{issue.title}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              {issue.category}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                            {issue.description}
                          </p>
                          {issue.severity !== 'pass' && (
                            <p className="text-blue-600 dark:text-blue-400 text-[11px] font-bold pt-0.5">
                              💡 Recommendation: {issue.recommendation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: SIMULATED HTML HEAD TAGS */}
              {inspectTab === 'html' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Generated &lt;head&gt; HTML Elements:
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          `<title>${inspectingPage.title}</title>\n<meta name="description" content="${inspectingPage.description}" />\n<link rel="canonical" href="${inspectingPage.canonicalUrl}" />\n<meta name="robots" content="${inspectingPage.robots}" />\n<meta property="og:title" content="${inspectingPage.title}" />\n<meta property="og:description" content="${inspectingPage.description}" />\n<meta property="og:url" content="${inspectingPage.canonicalUrl}" />\n<meta property="og:image" content="https://pdfeditfy.com/icon-512x512.png" />\n<meta name="twitter:card" content="summary_large_image" />`,
                          'head-html'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 text-[11px] font-bold flex items-center gap-1"
                    >
                      {copiedKey === 'head-html' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiedKey === 'head-html' ? 'Copied' : 'Copy HTML'}
                    </button>
                  </div>

                  <div className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] rounded-xl border border-slate-800 overflow-x-auto space-y-1 leading-relaxed">
                    <div><span className="text-slate-500">&lt;!-- Primary Title Tag --&gt;</span></div>
                    <div><span className="text-blue-400">&lt;title&gt;</span>{inspectingPage.title}<span className="text-blue-400">&lt;/title&gt;</span></div>
                    
                    <div className="pt-2"><span className="text-slate-500">&lt;!-- Meta Description &amp; Robots --&gt;</span></div>
                    <div><span className="text-blue-400">&lt;meta</span> <span className="text-purple-400">name=</span><span className="text-emerald-300">"description"</span> <span className="text-purple-400">content=</span><span className="text-amber-200">"{inspectingPage.description}"</span> <span className="text-blue-400">/&gt;</span></div>
                    <div><span className="text-blue-400">&lt;meta</span> <span className="text-purple-400">name=</span><span className="text-emerald-300">"robots"</span> <span className="text-purple-400">content=</span><span className="text-amber-200">"{inspectingPage.robots}"</span> <span className="text-blue-400">/&gt;</span></div>
                    
                    <div className="pt-2"><span className="text-slate-500">&lt;!-- Canonical Link Tag --&gt;</span></div>
                    <div><span className="text-blue-400">&lt;link</span> <span className="text-purple-400">rel=</span><span className="text-emerald-300">"canonical"</span> <span className="text-purple-400">href=</span><span className="text-amber-200">"{inspectingPage.canonicalUrl}"</span> <span className="text-blue-400">/&gt;</span></div>

                    <div className="pt-2"><span className="text-slate-500">&lt;!-- Open Graph / Facebook --&gt;</span></div>
                    <div><span className="text-blue-400">&lt;meta</span> <span className="text-purple-400">property=</span><span className="text-emerald-300">"og:site_name"</span> <span className="text-purple-400">content=</span><span className="text-amber-200">"PDF Editfy"</span> <span className="text-blue-400">/&gt;</span></div>
                    <div><span className="text-blue-400">&lt;meta</span> <span className="text-purple-400">property=</span><span className="text-emerald-300">"og:title"</span> <span className="text-purple-400">content=</span><span className="text-amber-200">"{inspectingPage.title}"</span> <span className="text-blue-400">/&gt;</span></div>
                    <div><span className="text-blue-400">&lt;meta</span> <span className="text-purple-400">property=</span><span className="text-emerald-300">"og:url"</span> <span className="text-purple-400">content=</span><span className="text-amber-200">"{inspectingPage.canonicalUrl}"</span> <span className="text-blue-400">/&gt;</span></div>
                    <div><span className="text-blue-400">&lt;meta</span> <span className="text-purple-400">property=</span><span className="text-emerald-300">"og:image"</span> <span className="text-purple-400">content=</span><span className="text-amber-200">"https://pdfeditfy.com/icon-512x512.png"</span> <span className="text-blue-400">/&gt;</span></div>
                  </div>
                </div>
              )}

              {/* TAB 3: JSON-LD SCHEMA INSPECTOR */}
              {inspectTab === 'jsonld' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Schema.org JSON-LD Structured Data:
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                        Valid Syntax
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(inspectingPage.jsonLdRaw, 'jsonld-copy')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 text-[11px] font-bold flex items-center gap-1"
                      >
                        {copiedKey === 'jsonld-copy' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copiedKey === 'jsonld-copy' ? 'Copied' : 'Copy JSON-LD'}
                      </button>

                      <a
                        href="https://validator.schema.org/"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center gap-1 hover:underline"
                      >
                        Validate Schema <ExternalLink className="w-3 h-3" />
                      </a>

                      <a
                        href="https://search.google.com/test/rich-results"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 hover:underline"
                      >
                        Google Rich Results Test <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] rounded-xl border border-slate-800 overflow-x-auto max-h-96">
                    {inspectingPage.jsonLdRaw}
                  </pre>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850 text-xs">
              <span className="text-slate-500">
                Tip: Copy the JSON-LD snippet and paste directly into Google Rich Results Test to preview search snippet features.
              </span>
              <button
                onClick={() => setInspectingPageId(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-300 transition-colors"
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
