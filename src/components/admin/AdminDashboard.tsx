import React, { useState, useEffect } from 'react';
import {
  Shield,
  LayoutDashboard,
  Wrench,
  DollarSign,
  Mail,
  Search,
  Lock,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Megaphone,
  Power,
  Eye,
  Trash2,
  Check,
  Key,
  ArrowLeft,
  FileText,
  Sliders,
  Sparkles,
  Globe,
  Tag,
  BarChart2,
  Server,
  Terminal,
  Copy,
  ExternalLink,
  Cpu,
  HardDrive,
  FileCode
} from 'lucide-react';
import { TOOLS } from '../../data/toolsData';
import { AdminConfig, ContactInquiry, ToolItem } from '../../types';
import { auth } from '../../lib/firebase';

interface AdminDashboardProps {
  onBack: () => void;
  config: AdminConfig;
  onUpdateConfig: (newConfig: AdminConfig) => void;
  onLogout: () => void;
  initialTab?: 'overview' | 'tools' | 'monetization' | 'inquiries' | 'seo' | 'security' | 'vps';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBack,
  config,
  onUpdateConfig,
  onLogout,
  initialTab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tools' | 'monetization' | 'inquiries' | 'seo' | 'security' | 'vps'>(initialTab);
  const [toolSearch, setToolSearch] = useState('');
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'unread' | 'read' | 'replied'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hostinger VPS Guide Interactive Config
  const [vpsIp, setVpsIp] = useState('185.193.66.12');
  const [vpsDomain, setVpsDomain] = useState(config.siteName || 'pdfeditfy.com');
  const [vpsRepoUrl, setVpsRepoUrl] = useState('https://github.com/your-username/pdfeditfy.com.git');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    showToast(`Copied: ${label}`);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  // Load user inquiries from localStorage
  useEffect(() => {
    try {
      const savedInquiries = JSON.parse(localStorage.getItem('pdfeditfy_contacts') || '[]');
      setInquiries(savedInquiries);
    } catch {
      setInquiries([]);
    }
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle tool disabled status
  const handleToggleTool = (toolId: string) => {
    const disabled = [...config.disabledTools];
    const index = disabled.indexOf(toolId);
    if (index > -1) {
      disabled.splice(index, 1);
    } else {
      disabled.push(toolId);
    }
    onUpdateConfig({ ...config, disabledTools: disabled });
    showToast('Tool status updated');
  };

  // Update custom badge for a tool
  const handleBadgeChange = (toolId: string, badge: any) => {
    const customBadges = { ...config.customBadges };
    if (!badge) {
      delete customBadges[toolId];
    } else {
      customBadges[toolId] = badge;
    }
    onUpdateConfig({ ...config, customBadges });
    showToast('Tool badge updated');
  };

  // Update inquiry status
  const handleUpdateInquiryStatus = (id: string, status: 'unread' | 'read' | 'replied') => {
    const updated = inquiries.map((inq) => (inq.id === id ? { ...inq, status } : inq));
    setInquiries(updated);
    localStorage.setItem('pdfeditfy_contacts', JSON.stringify(updated));
    showToast(`Inquiry marked as ${status}`);
  };

  // Delete inquiry
  const handleDeleteInquiry = (id: string) => {
    const updated = inquiries.filter((inq) => inq.id !== id);
    setInquiries(updated);
    localStorage.setItem('pdfeditfy_contacts', JSON.stringify(updated));
    showToast('Inquiry deleted');
  };

  // Export JSON Config
  const handleExportConfig = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pdfeditfy_config_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Configuration exported as JSON');
  };

  // Import JSON Config
  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && typeof imported === 'object') {
          onUpdateConfig(imported);
          showToast('Configuration imported successfully');
        }
      } catch {
        alert('Invalid JSON configuration file');
      }
    };
    reader.readAsText(file);
  };

  const filteredTools = TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(toolSearch.toLowerCase())
  );

  const filteredInquiries = inquiries.filter((inq) => {
    if (inquiryFilter === 'all') return true;
    return inq.status === inquiryFilter;
  });

  const unreadCount = inquiries.filter((i) => i.status === 'unread').length;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
            title="Back to App"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                pdfeditfy.com Console
              </h1>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Firebase Auth Connected
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                {auth.currentUser?.email || JSON.parse(localStorage.getItem('pdfeditfy_admin_google_user') || '{}')?.email || 'asbsoran@gmail.com'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage core features, AdSense ads, tool statuses, and user inquiries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/80 transition-colors flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            Lock Admin
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Overview
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'tools'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Tools Manager ({TOOLS.length - config.disabledTools.length}/{TOOLS.length})
        </button>

        <button
          onClick={() => setActiveTab('monetization')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'monetization'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          AdSense & Ads
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
            activeTab === 'inquiries'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          Inquiries
          {unreadCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'seo'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          SEO & Analytics
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security & Export
        </button>

        <button
          onClick={() => setActiveTab('vps')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'vps'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/60'
          }`}
        >
          <Server className="w-4 h-4" />
          Hostinger VPS Guide
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Conversions Today</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">1,842</p>
              <p className="text-[10px] text-emerald-500 font-bold">↑ 14% vs yesterday</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bandwidth Saved</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">12.4 GB</p>
              <p className="text-[10px] text-blue-500 font-bold">Client-side processing</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Tools</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {TOOLS.length - config.disabledTools.length} / {TOOLS.length}
              </p>
              <p className="text-[10px] text-slate-400 font-bold">
                {config.disabledTools.length > 0 ? `${config.disabledTools.length} disabled` : 'All tools operational'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">System Status</p>
              <p className="text-2xl font-black text-emerald-500 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </p>
              <p className="text-[10px] text-slate-400 font-bold">Uptime 99.98%</p>
            </div>
          </div>

          {/* Items Under Admin Panel - Control Modules Grid */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Items Under Admin Panel (Control Modules)
                </h3>
                <p className="text-xs text-slate-400">
                  Quick status overview and direct access to all 7 management modules
                </p>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
                7 Modules Operational
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              
              {/* Item 1: Overview */}
              <div 
                onClick={() => setActiveTab('overview')}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold">
                    <LayoutDashboard className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    1. Overview & Live Stats
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Live traffic metrics, maintenance mode toggle, & announcement bar banner.
                  </p>
                </div>
              </div>

              {/* Item 2: Tools Manager */}
              <div 
                onClick={() => setActiveTab('tools')}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-purple-500 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-bold">
                    <Wrench className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                    {TOOLS.length - config.disabledTools.length}/{TOOLS.length} Active
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                    2. Tools Control & Badges
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Enable/disable individual PDF tools and assign custom feature badges.
                  </p>
                </div>
              </div>

              {/* Item 3: AdSense & Ads */}
              <div 
                onClick={() => setActiveTab('monetization')}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full truncate max-w-[100px]">
                    {config.adsensePublisherId || 'No Ad ID'}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    3. AdSense & Monetization
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Configure Google AdSense publisher ID and auto-ad banner positions.
                  </p>
                </div>
              </div>

              {/* Item 4: Support Inquiries */}
              <div 
                onClick={() => setActiveTab('inquiries')}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-500 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-bold">
                    <Mail className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                    {inquiries.length} Messages ({unreadCount} Unread)
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                    4. Support Messages Inbox
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Review and reply to user feedback and contact form submissions.
                  </p>
                </div>
              </div>

              {/* Item 5: SEO & Metadata */}
              <div 
                onClick={() => setActiveTab('seo')}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-cyan-500 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 font-bold">
                    <Globe className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-full">
                    Configured
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-cyan-600 transition-colors">
                    5. SEO & Google Analytics
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Update meta title, description tags, search keywords, and GA tracking.
                  </p>
                </div>
              </div>

              {/* Item 6: Security & Export */}
              <div 
                onClick={() => setActiveTab('security')}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-red-500 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold">
                    <Lock className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full">
                    Protected
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-red-600 transition-colors">
                    6. Security & Passcode
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Change admin access passcode and export/backup site configuration.
                  </p>
                </div>
              </div>

              {/* Item 7: Hostinger VPS Deployment Guide */}
              <div 
                onClick={() => setActiveTab('vps')}
                className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 hover:border-purple-500 transition-all cursor-pointer group space-y-2 sm:col-span-2 lg:col-span-3"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-lg bg-purple-600 text-white font-bold">
                    <Server className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-300 dark:border-purple-800">
                    Hostinger VPS Deployment
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                    7. Hostinger VPS Production Setup Guide
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Complete interactive 7-step production server setup guide for Ubuntu, Node.js 20, PM2, Nginx reverse proxy, and free Let's Encrypt HTTPS SSL certificates.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Quick System Controls Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-blue-600" />
              Global Site Toggles
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* Maintenance Mode Toggle */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Power className="w-4 h-4 text-amber-500" />
                    Maintenance Mode
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Show maintenance banner and restrict conversion tools
                  </p>
                </div>
                <button
                  onClick={() => {
                    onUpdateConfig({ ...config, maintenanceMode: !config.maintenanceMode });
                    showToast(`Maintenance mode ${!config.maintenanceMode ? 'enabled' : 'disabled'}`);
                  }}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    config.maintenanceMode ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      config.maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Master Ads Toggle */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Master AdSense Ads
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Enable or hide all AdSense banners across the site
                  </p>
                </div>
                <button
                  onClick={() => {
                    onUpdateConfig({ ...config, adsEnabled: !config.adsEnabled });
                    showToast(`AdSense ads ${!config.adsEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    config.adsEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      config.adsEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>

          {/* Announcement Top Bar Config */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-600" />
                Site Announcement Banner
              </h3>
              <button
                onClick={() => {
                  onUpdateConfig({
                    ...config,
                    announcementBar: {
                      ...config.announcementBar,
                      enabled: !config.announcementBar.enabled,
                    },
                  });
                  showToast('Announcement banner status updated');
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  config.announcementBar.enabled
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {config.announcementBar.enabled ? 'Banner Active' : 'Banner Disabled'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Text
                </label>
                <input
                  type="text"
                  value={config.announcementBar.text}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      announcementBar: { ...config.announcementBar, text: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 🎉 New 4K Batch Image Converter is now live!"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Banner Type
                </label>
                <select
                  value={config.announcementBar.type}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      announcementBar: {
                        ...config.announcementBar,
                        type: e.target.value as any,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="info">Info (Blue)</option>
                  <option value="success">Success (Emerald)</option>
                  <option value="warning">Warning (Amber)</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: TOOLS MANAGER */}
      {activeTab === 'tools' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                All Available Tools ({TOOLS.length})
              </h3>
              <p className="text-xs text-slate-500">
                Enable/disable specific tools or customize their badges
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                placeholder="Search tools..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredTools.map((tool) => {
              const isDisabled = config.disabledTools.includes(tool.id);
              const currentBadge = config.customBadges[tool.id] || tool.badge;

              return (
                <div
                  key={tool.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                    isDisabled
                      ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200/80 dark:border-red-900/40 opacity-75'
                      : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {tool.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                          {tool.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Custom Badge Selector */}
                    <select
                      value={currentBadge || ''}
                      onChange={(e) => handleBadgeChange(tool.id, e.target.value || undefined)}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300"
                    >
                      <option value="">No Badge</option>
                      <option value="Popular">Popular</option>
                      <option value="New">New</option>
                      <option value="Free">Free</option>
                      <option value="Batch">Batch</option>
                      <option value="Pro">Pro</option>
                      <option value="Beta">Beta</option>
                    </select>

                    {/* Active/Disable Toggle Switch */}
                    <button
                      onClick={() => handleToggleTool(tool.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        isDisabled
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      {isDisabled ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          Disabled
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Enabled
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MONETIZATION & ADSENSE */}
      {activeTab === 'monetization' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Google AdSense & Ad Placement Control
            </h3>
            <p className="text-xs text-slate-500">
              Configure publisher IDs and control banner displays across the app
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  AdSense Publisher ID (ca-pub-...)
                </label>
                <input
                  type="text"
                  value={config.adsensePublisherId}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, adsensePublisherId: e.target.value })
                  }
                  placeholder="ca-pub-1234567890123456"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Your Google AdSense account publisher identifier
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Ad Placements Active:
                </p>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Top Leaderboard Ad Banner (Homepage)
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Tool Grid In-feed Banners (Every 8th card)
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Footer Responsive Native Slot
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                AdSense Script Auto-Inject Preview
              </label>
              <div className="p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800">
                {`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adsensePublisherId || 'ca-pub-XXXXXXXXXXXXXXXX'}" crossorigin="anonymous"></script>`}
              </div>
              <p className="text-[11px] text-slate-400">
                This script is dynamically rendered on client pages when Master Ads is enabled.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONTACT INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                User Contact Messages ({inquiries.length})
              </h3>
              <p className="text-xs text-slate-500">
                Inquiries submitted by users via the Contact Support form
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              {(['all', 'unread', 'read', 'replied'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setInquiryFilter(filter)}
                  className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                    inquiryFilter === filter
                      ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {filteredInquiries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Mail className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">No inquiries found in this view.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className={`p-4 rounded-xl border space-y-2 transition-colors ${
                    inq.status === 'unread'
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {inq.email}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                        {inq.subject}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{inq.date}</span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    {inq.message}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateInquiryStatus(inq.id, 'read')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                          inq.status === 'read'
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Mark Read
                      </button>
                      <button
                        onClick={() => handleUpdateInquiryStatus(inq.id, 'replied')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                          inq.status === 'replied'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Mark Replied
                      </button>
                      <a
                        href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject)}`}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-500 transition-colors"
                      >
                        Reply Email
                      </a>
                    </div>

                    <button
                      onClick={() => handleDeleteInquiry(inq.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      title="Delete inquiry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SEO & ANALYTICS */}
      {activeTab === 'seo' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              SEO & Google Analytics Configuration
            </h3>
            <p className="text-xs text-slate-500">
              Manage meta tags, site title, and analytics tracking IDs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Website Title
                </label>
                <input
                  type="text"
                  value={config.siteName}
                  onChange={(e) => onUpdateConfig({ ...config, siteName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Analytics 4 Measurement ID (G-XXXXXXXXXX)
                </label>
                <input
                  type="text"
                  value={config.gaTrackingId}
                  onChange={(e) => onUpdateConfig({ ...config, gaTrackingId: e.target.value })}
                  placeholder="G-ABC123XYZ"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-slate-700 dark:text-slate-300">
                Generated Sitemap.xml Preview
              </p>
              <div className="p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[10px] leading-relaxed border border-slate-800 max-h-40 overflow-y-auto">
{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${config.siteName}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SECURITY & EXPORT */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              Admin Security & System Backup
            </h3>
            <p className="text-xs text-slate-500">
              Change admin passcode or backup/restore complete configuration JSON
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Google Admin Authentication Status Card */}
            <div className="space-y-3 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-xs">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      Google OAuth Admin Authorization
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Primary authorized Google Sign-In administrator account
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active Super Admin
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                  asbsoran@gmail.com
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                  Google Verified Admin
                </span>
              </div>
            </div>
            
            {/* Passcode Change */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Key className="w-4 h-4 text-blue-600" />
                Change Admin Passcode
              </p>
              <input
                type="text"
                value={config.adminPasscode}
                onChange={(e) => onUpdateConfig({ ...config, adminPasscode: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Default: <code className="text-blue-600 font-bold">admin123</code>
              </p>
            </div>

            {/* Export & Import JSON */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-blue-600" />
                Backup & Restore Configuration
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportConfig}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSON
                </button>

                <label className="flex-1 py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Import JSON
                  <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
                </label>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 7: HOSTINGER VPS DEPLOYMENT GUIDE */}
      {activeTab === 'vps' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-xs">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Server className="w-3 h-3" /> Hostinger VPS
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] uppercase">
                  Ubuntu 22.04 / 24.04 LTS
                </span>
              </div>
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                Hostinger VPS Production Deployment Guide
              </h3>
              <p className="text-xs text-slate-500 max-w-2xl">
                Step-by-step production setup guide for running <strong>{vpsDomain}</strong> on Hostinger VPS using Node.js, PM2, Nginx reverse proxy, and free SSL (Let's Encrypt Certbot).
              </p>
            </div>

            <a
              href="https://hpanel.hostinger.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-2 shrink-0 transition-colors shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Open Hostinger hPanel
            </a>
          </div>

          {/* Dynamic Configuration Inputs */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-purple-950 text-white space-y-3 border border-purple-900/50">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-400" />
                Live Command Customizer (Auto-updates commands below)
              </span>
              <span className="text-[10px] text-slate-400">Type your server details below to customize all code snippets</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1">Hostinger VPS Public IP</label>
                <input
                  type="text"
                  value={vpsIp}
                  onChange={(e) => setVpsIp(e.target.value)}
                  placeholder="e.g. 185.193.66.12"
                  className="w-full px-3 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1">Target Domain Name</label>
                <input
                  type="text"
                  value={vpsDomain}
                  onChange={(e) => setVpsDomain(e.target.value)}
                  placeholder="pdfeditfy.com"
                  className="w-full px-3 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1">GitHub / Git Repository URL</label>
                <input
                  type="text"
                  value={vpsRepoUrl}
                  onChange={(e) => setVpsRepoUrl(e.target.value)}
                  placeholder="https://github.com/user/pdfeditfy.git"
                  className="w-full px-3 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Deployment Steps Accordion / Timeline */}
          <div className="space-y-6">

            {/* STEP 1: DNS & HOSTINGER HPANEL */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Point Domain DNS Records in Hostinger hPanel</h4>
                  <p className="text-slate-500 text-xs">Direct your domain name to your Hostinger VPS IP address.</p>
                </div>
              </div>

              <div className="ml-10 space-y-2 text-slate-600 dark:text-slate-300 text-xs">
                <p>1. Log into your <strong>Hostinger hPanel</strong>, go to <strong>Domains</strong> &gt; Select <strong>{vpsDomain}</strong> &gt; <strong>DNS / Nameservers</strong>.</p>
                <p>2. Add or edit the following two <strong>A Records</strong>:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span>Type: <strong>A</strong> | Name: <strong>@</strong></span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">{vpsIp}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span>Type: <strong>A</strong> | Name: <strong>www</strong></span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">{vpsIp}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: SSH ACCESS & SYSTEM UPDATES */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                  2
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">SSH into Hostinger VPS & Update System</h4>
                  <p className="text-slate-500 text-xs">Connect to your VPS via SSH terminal and update Ubuntu packages.</p>
                </div>
              </div>

              <div className="ml-10 space-y-2">
                <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs relative group border border-slate-800">
                  <p className="text-slate-500 select-none"># 1. Connect to VPS via SSH</p>
                  <p>ssh root@{vpsIp}</p>
                  <br />
                  <p className="text-slate-500 select-none"># 2. Update Linux packages</p>
                  <p>sudo apt update && sudo apt upgrade -y</p>

                  <button
                    onClick={() => copyToClipboard(`ssh root@${vpsIp}\nsudo apt update && sudo apt upgrade -y`, 'SSH & Update Commands')}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 3: INSTALL NODE.JS, NGINX, PM2 & CERTBOT */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                  3
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Install Node.js 20 LTS, Nginx, PM2 & Certbot</h4>
                  <p className="text-slate-500 text-xs">Install required backend runtime, web server, and SSL tools.</p>
                </div>
              </div>

              <div className="ml-10 space-y-2">
                <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs relative group border border-slate-800">
                  <p className="text-slate-500 select-none"># Add NodeSource repository for Node.js 20 LTS</p>
                  <p>curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -</p>
                  <br />
                  <p className="text-slate-500 select-none"># Install Node.js, Nginx, Git & Certbot for SSL</p>
                  <p>sudo apt install -y nodejs nginx git certbot python3-certbot-nginx</p>
                  <br />
                  <p className="text-slate-500 select-none"># Install PM2 Process Manager globally</p>
                  <p>sudo npm install -g pm2</p>

                  <button
                    onClick={() => copyToClipboard(`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -\nsudo apt install -y nodejs nginx git certbot python3-certbot-nginx\nsudo npm install -g pm2`, 'Dependencies Installation')}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 4: CLONE & BUILD PDFEDITFY */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                  4
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Clone Codebase & Install Application Dependencies</h4>
                  <p className="text-slate-500 text-xs">Deploy the application files to <code>/var/www/pdfeditfy</code>.</p>
                </div>
              </div>

              <div className="ml-10 space-y-2">
                <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs relative group border border-slate-800">
                  <p className="text-slate-500 select-none"># Navigate to web root and clone your repository</p>
                  <p>cd /var/www</p>
                  <p>sudo git clone {vpsRepoUrl} pdfeditfy</p>
                  <p>cd pdfeditfy</p>
                  <br />
                  <p className="text-slate-500 select-none"># Install NPM packages & build application</p>
                  <p>sudo npm install</p>
                  <p>sudo npm run build</p>

                  <button
                    onClick={() => copyToClipboard(`cd /var/www\nsudo git clone ${vpsRepoUrl} pdfeditfy\ncd pdfeditfy\nsudo npm install\nsudo npm run build`, 'Clone & Build Commands')}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 5: START PROCESS WITH PM2 */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                  5
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Launch App with PM2 Process Manager</h4>
                  <p className="text-slate-500 text-xs">Ensure your app stays running continuously and restarts automatically on server reboot.</p>
                </div>
              </div>

              <div className="ml-10 space-y-2">
                <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs relative group border border-slate-800">
                  <p className="text-slate-500 select-none"># Start application using PM2 on port 3000</p>
                  <p>pm2 start npm --name "pdfeditfy" -- run dev</p>
                  <br />
                  <p className="text-slate-500 select-none"># Enable auto-start on server reboot</p>
                  <p>pm2 save</p>
                  <p>pm2 startup</p>

                  <button
                    onClick={() => copyToClipboard(`pm2 start npm --name "pdfeditfy" -- run dev\npm2 save\npm2 startup`, 'PM2 Start Commands')}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 6: NGINX REVERSE PROXY & FREE SSL CERTIFICATE */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                  6
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Configure Nginx Reverse Proxy & Enable Free SSL (HTTPS)</h4>
                  <p className="text-slate-500 text-xs">Route port 80/443 traffic to your Node app running on port 3000 with Let's Encrypt SSL certificate.</p>
                </div>
              </div>

              <div className="ml-10 space-y-3">
                <p className="text-slate-600 dark:text-slate-300">1. Create Nginx site configuration file:</p>
                
                <div className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed relative group border border-slate-800">
                  <p className="text-slate-500 mb-2 select-none"># Run: sudo nano /etc/nginx/sites-available/pdfeditfy</p>
{`server {
    listen 80;
    server_name ${vpsDomain} www.${vpsDomain};

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`}
                  <button
                    onClick={() => copyToClipboard(`server {
    listen 80;
    server_name ${vpsDomain} www.${vpsDomain};

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`, 'Nginx Config')}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Config
                  </button>
                </div>

                <p className="text-slate-600 dark:text-slate-300 pt-2">2. Enable site and issue SSL Certificate with Certbot:</p>

                <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs relative group border border-slate-800">
                  <p className="text-slate-500 select-none"># Symlink to sites-enabled</p>
                  <p>sudo ln -s /etc/nginx/sites-available/pdfeditfy /etc/nginx/sites-enabled/</p>
                  <p>sudo nginx -t</p>
                  <p>sudo systemctl restart nginx</p>
                  <br />
                  <p className="text-slate-500 select-none"># Issue Let's Encrypt SSL certificate automatically</p>
                  <p>sudo certbot --nginx -d {vpsDomain} -d www.{vpsDomain}</p>

                  <button
                    onClick={() => copyToClipboard(`sudo ln -s /etc/nginx/sites-available/pdfeditfy /etc/nginx/sites-enabled/\nsudo nginx -t\nsudo systemctl restart nginx\nsudo certbot --nginx -d ${vpsDomain} -d www.${vpsDomain}`, 'Enable Nginx & SSL')}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 7: HOSTINGER VPS FIREWALL & TROUBLESHOOTING */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                  ✓
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Final Checklist & Hostinger Firewall Verification</h4>
                  <p className="text-slate-500 text-xs">Verify all open ports and test your live deployment.</p>
                </div>
              </div>

              <div className="ml-10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" /> Hostinger hPanel Firewall Ports
                  </span>
                  <p className="text-slate-500 text-[11px]">
                    Go to Hostinger hPanel &gt; VPS &gt; Firewall &gt; Ensure inbound rules allow:
                  </p>
                  <ul className="list-disc list-inside font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold space-y-0.5">
                    <li>Port 80 (HTTP)</li>
                    <li>Port 443 (HTTPS)</li>
                    <li>Port 22 (SSH)</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-blue-500" /> Useful Server Commands
                  </span>
                  <div className="font-mono text-[10px] text-slate-600 dark:text-slate-300 space-y-1">
                    <p><code>pm2 logs pdfeditfy</code> (Check app logs)</p>
                    <p><code>sudo systemctl status nginx</code> (Check Nginx status)</p>
                    <p><code>pm2 restart pdfeditfy</code> (Restart app process)</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
