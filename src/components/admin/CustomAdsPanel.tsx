import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  Eye,
  MousePointer,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  XCircle,
  BarChart3,
  Sliders,
  Code,
  Image as ImageIcon,
  Layout,
  Tag,
  Zap,
  ShieldCheck,
  Percent,
  Download,
  Upload,
  RefreshCw,
  X,
  Copy,
  Check,
  HelpCircle,
  FileCode2,
  Link2
} from 'lucide-react';
import { AdminConfig, CustomAdItem, AdSlotType } from '../../types';
import { CustomAdBanner } from '../CustomAdBanner';
import { getAdSyncedStats, resetAdStats } from '../../utils/customAdTracker';
import { TOOLS } from '../../data/toolsData';

interface CustomAdsPanelProps {
  config: AdminConfig;
  onUpdateConfig: (newConfig: AdminConfig) => void;
  showToast: (msg: string) => void;
}

export const CustomAdsPanel: React.FC<CustomAdsPanelProps> = ({
  config,
  onUpdateConfig,
  showToast,
}) => {
  const customAds = config.customAds || [];
  const currentMode = config.adServingMode || 'hybrid';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<CustomAdItem | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSponsorName, setFormSponsorName] = useState('');
  const [formTargetUrl, setFormTargetUrl] = useState('');
  const [formAdType, setFormAdType] = useState<'card' | 'image' | 'custom_html' | 'script'>('card');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formHtmlContent, setFormHtmlContent] = useState('');
  const [formScriptCode, setFormScriptCode] = useState('');
  const [formCtaText, setFormCtaText] = useState('Claim Deal');
  const [formBadgeText, setFormBadgeText] = useState('Featured Deal');
  const [formGradient, setFormGradient] = useState<'blue' | 'purple' | 'emerald' | 'amber' | 'dark' | 'rose' | 'slate'>('blue');
  const [formSlots, setFormSlots] = useState<AdSlotType[]>(['leaderboard', 'banner', 'sidebar']);
  const [formTargetTools, setFormTargetTools] = useState<string[]>(['all']);
  const [previewSlot, setPreviewSlot] = useState<AdSlotType>('leaderboard');

  // Compute Aggregates
  let totalImpressions = 0;
  let totalClicks = 0;
  customAds.forEach((ad) => {
    const stats = getAdSyncedStats(ad);
    totalImpressions += stats.impressions;
    totalClicks += stats.clicks;
  });
  const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0.00%';
  const activeAdsCount = customAds.filter((a) => a.enabled).length;

  const handleOpenAddModal = (preset?: Partial<CustomAdItem>) => {
    setEditingAd(null);
    setFormTitle(preset?.title || 'Exclusive Partner Offer – Special Discount');
    setFormDescription(preset?.description || 'Get high-speed document tools & encrypted storage today.');
    setFormSponsorName(preset?.sponsorName || 'Direct Sponsor');
    setFormTargetUrl(preset?.targetUrl || 'https://pdfeditfy.com');
    setFormAdType(preset?.adType || 'card');
    setFormImageUrl(preset?.imageUrl || '');
    setFormHtmlContent(preset?.htmlContent || '');
    setFormScriptCode(preset?.scriptCode || '');
    setFormCtaText(preset?.ctaText || 'Get Deal');
    setFormBadgeText(preset?.badgeText || 'Special Offer');
    setFormGradient(preset?.bgGradient || 'blue');
    setFormSlots(preset?.slots || ['leaderboard', 'banner', 'sidebar', 'homepage_top', 'homepage_bottom']);
    setFormTargetTools(preset?.targetTools || ['all']);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ad: CustomAdItem) => {
    setEditingAd(ad);
    setFormTitle(ad.title);
    setFormDescription(ad.description || '');
    setFormSponsorName(ad.sponsorName || '');
    setFormTargetUrl(ad.targetUrl);
    setFormAdType(ad.adType);
    setFormImageUrl(ad.imageUrl || '');
    setFormHtmlContent(ad.htmlContent || '');
    setFormScriptCode(ad.scriptCode || '');
    setFormCtaText(ad.ctaText || 'Learn More');
    setFormBadgeText(ad.badgeText || 'Sponsored');
    setFormGradient(ad.bgGradient || 'blue');
    setFormSlots(ad.slots || ['leaderboard', 'banner', 'sidebar']);
    setFormTargetTools(ad.targetTools || ['all']);
    setIsModalOpen(true);
  };

  const handleSaveAd = () => {
    if (!formTitle.trim()) {
      showToast('Please provide an ad title or campaign label.');
      return;
    }
    if (formAdType !== 'custom_html' && formAdType !== 'script' && !formTargetUrl.trim()) {
      showToast('Please provide a target affiliate or sponsor URL.');
      return;
    }

    const updatedAd: CustomAdItem = {
      id: editingAd ? editingAd.id : `ad-${Date.now()}`,
      title: formTitle.trim(),
      description: formDescription.trim(),
      sponsorName: formSponsorName.trim() || 'Direct Sponsor',
      targetUrl: formTargetUrl.trim() || '#',
      adType: formAdType,
      imageUrl: formImageUrl.trim(),
      htmlContent: formHtmlContent.trim(),
      scriptCode: formScriptCode.trim(),
      ctaText: formCtaText.trim() || 'Learn More',
      badgeText: formBadgeText.trim() || 'Sponsored',
      bgGradient: formGradient,
      slots: formSlots.length > 0 ? formSlots : ['leaderboard', 'banner', 'sidebar'],
      targetTools: formTargetTools.length > 0 ? formTargetTools : ['all'],
      enabled: editingAd ? editingAd.enabled : true,
      impressions: editingAd ? editingAd.impressions : 0,
      clicks: editingAd ? editingAd.clicks : 0,
      createdAt: editingAd ? editingAd.createdAt : new Date().toISOString().split('T')[0],
    };

    let nextAds: CustomAdItem[];
    if (editingAd) {
      nextAds = customAds.map((a) => (a.id === editingAd.id ? updatedAd : a));
      showToast(`Updated ad: "${updatedAd.title}"`);
    } else {
      nextAds = [updatedAd, ...customAds];
      showToast(`Created new ad: "${updatedAd.title}"`);
    }

    onUpdateConfig({
      ...config,
      customAds: nextAds,
    });

    setIsModalOpen(false);
  };

  const handleToggleAd = (adId: string) => {
    const nextAds = customAds.map((a) =>
      a.id === adId ? { ...a, enabled: !a.enabled } : a
    );
    onUpdateConfig({ ...config, customAds: nextAds });
    showToast('Ad status updated');
  };

  const handleDeleteAd = (adId: string) => {
    if (window.confirm('Are you sure you want to delete this custom advertisement?')) {
      const nextAds = customAds.filter((a) => a.id !== adId);
      onUpdateConfig({ ...config, customAds: nextAds });
      showToast('Ad campaign deleted');
    }
  };

  const handleResetStats = (adId: string) => {
    resetAdStats(adId);
    const nextAds = customAds.map((a) =>
      a.id === adId ? { ...a, impressions: 0, clicks: 0 } : a
    );
    onUpdateConfig({ ...config, customAds: nextAds });
    showToast('Analytics counters reset for this ad');
  };

  const toggleSlotSelection = (slot: AdSlotType) => {
    if (formSlots.includes(slot)) {
      if (formSlots.length === 1) {
        showToast('At least one ad slot must remain selected.');
        return;
      }
      setFormSlots(formSlots.filter((s) => s !== slot));
    } else {
      setFormSlots([...formSlots, slot]);
    }
  };

  const handleExportAds = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(customAds, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `pdfeditfy-custom-ads-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported ads configuration to JSON');
  };

  const handleImportAds = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onUpdateConfig({ ...config, customAds: parsed });
            showToast(`Successfully imported ${parsed.length} ad campaigns!`);
          } else {
            showToast('Invalid JSON file format for ads');
          }
        } catch (err) {
          showToast('Failed to parse ads JSON file');
        }
      };
    }
  };

  const draftAd: CustomAdItem = {
    id: 'draft-preview',
    title: formTitle || 'Exclusive Partner Offer – Special Discount',
    description: formDescription || 'Accelerate workflows with secure high-speed document tools.',
    sponsorName: formSponsorName || 'Direct Sponsor',
    targetUrl: formTargetUrl || 'https://pdfeditfy.com',
    adType: formAdType,
    imageUrl: formImageUrl,
    htmlContent: formHtmlContent,
    scriptCode: formScriptCode,
    ctaText: formCtaText || 'Claim Deal',
    badgeText: formBadgeText || 'Special Offer',
    bgGradient: formGradient,
    slots: formSlots,
    targetTools: formTargetTools,
    enabled: true,
    impressions: 1250,
    clicks: 84,
    createdAt: new Date().toISOString().split('T')[0],
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner & Strategy Selector */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Custom Ads, Script Injection &amp; Affiliate Links
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inject custom HTML banners, affiliate links, third-party JS ad scripts, or sponsor cards into defined slots (Sidebar, Below Tools, Leaderboards).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Ad / Script</span>
            </button>
            <button
              onClick={handleExportAds}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export Ads to JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <label className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportAds} className="hidden" />
            </label>
          </div>
        </div>

        {/* Global Strategy Mode Selector */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              Ad Monetization Delivery Strategy
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Active Strategy: <strong className="text-blue-600 uppercase">{currentMode.replace('_', ' ')}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* 1. Hybrid Co-Existence */}
            <div
              onClick={() => {
                onUpdateConfig({ ...config, adServingMode: 'hybrid' });
                showToast('Strategy changed to: Hybrid (AdSense + Custom Ads)');
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                currentMode === 'hybrid'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Hybrid Co-existence
                </span>
                {currentMode === 'hybrid' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Displays Google AdSense alongside your custom sponsor cards and scripts in sidebar and tool banner positions.
              </p>
            </div>

            {/* 2. Custom Ads Only */}
            <div
              onClick={() => {
                onUpdateConfig({ ...config, adServingMode: 'custom_only' });
                showToast('Strategy changed to: Custom Ads & Scripts Only');
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                currentMode === 'custom_only'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-600" />
                  Custom Ads Only
                </span>
                {currentMode === 'custom_only' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                100% direct sponsor banners, HTML snippets, and affiliate links. Completely disables Google AdSense.
              </p>
            </div>

            {/* 3. Google AdSense Only */}
            <div
              onClick={() => {
                onUpdateConfig({ ...config, adServingMode: 'adsense_only' });
                showToast('Strategy changed to: Google AdSense Only');
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                currentMode === 'adsense_only'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                  <Layout className="w-3 h-3 text-amber-600" />
                  AdSense Only
                </span>
                {currentMode === 'adsense_only' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Serves exclusively Google programmatic ads across all enabled placement slots.
              </p>
            </div>

            {/* 4. AdSense + Fallback */}
            <div
              onClick={() => {
                onUpdateConfig({ ...config, adServingMode: 'fallback' });
                showToast('Strategy changed to: AdSense + Custom Fallback');
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                currentMode === 'fallback'
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-600" />
                  Custom Fallback
                </span>
                {currentMode === 'fallback' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Serves direct sponsor ads as failover when AdSense units are unfilled or blocked.
              </p>
            </div>

          </div>
        </div>

        {/* Live Aggregates Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Campaigns
            </span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <span>{activeAdsCount}</span>
              <span className="text-xs font-normal text-slate-400">/ {customAds.length} total</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Eye className="w-3 h-3 text-blue-500" /> Total Impressions
            </span>
            <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {totalImpressions.toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <MousePointer className="w-3 h-3 text-emerald-500" /> Total Clicks
            </span>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {totalClicks.toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Percent className="w-3 h-3 text-indigo-500" /> Overall CTR
            </span>
            <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {overallCtr}
            </div>
          </div>

        </div>

      </div>

      {/* 1-Click Quick Creative Templates */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            1-Click High-Converting Sponsor &amp; Affiliate Templates
          </h4>
          <span className="text-[11px] text-slate-400">Click any preset to launch immediately</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Preset 1: Software Affiliate Card */}
          <button
            onClick={() =>
              handleOpenAddModal({
                title: 'PDF Pro Desktop Editor – Lifetime Deal 50% Off',
                description: 'Fast offline editing, conversion & unlimited batch OCR processing without subscription fees.',
                sponsorName: 'PDF Desktop Pro',
                ctaText: 'Claim 50% Off',
                badgeText: 'Top Rated',
                bgGradient: 'blue',
                adType: 'card',
                targetUrl: 'https://pdfeditfy.com?ref=partner-50',
                slots: ['leaderboard', 'banner', 'sidebar', 'homepage_top'],
              })
            }
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-700/80 text-left transition-all group cursor-pointer"
          >
            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 block">
              💻 Software Affiliate Promo
            </span>
            <span className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
              High-converting visual promo card for desktop PDF licenses &amp; affiliate links.
            </span>
          </button>

          {/* Preset 2: Custom HTML Banner */}
          <button
            onClick={() =>
              handleOpenAddModal({
                title: 'CloudVault Backup 50GB Free (HTML Banner)',
                sponsorName: 'CloudVault Inc',
                adType: 'custom_html',
                htmlContent: `<div style="background: linear-gradient(135deg, #059669, #0f172a); border-radius: 12px; padding: 14px 20px; color: #fff; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
  <div>
    <div style="font-size: 13px; font-weight: 800;">⚡ 50GB Encrypted Cloud Storage – Free Forever</div>
    <div style="font-size: 11px; opacity: 0.85;">Zero-knowledge AES-256 backup for your documents & contracts.</div>
  </div>
  <a href="https://pdfeditfy.com?aff=cloudvault" target="_blank" rel="sponsored" style="background: #10b981; color: #022c22; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 900; text-decoration: none; white-space: nowrap;">Get 50GB Free</a>
</div>`,
                targetUrl: 'https://pdfeditfy.com?aff=cloudvault',
                slots: ['banner', 'sidebar', 'homepage_bottom'],
              })
            }
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-700/80 text-left transition-all group cursor-pointer"
          >
            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 block">
              🏷️ Custom HTML Banner
            </span>
            <span className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
              Rich custom HTML container with gradient styling and affiliate CTA button.
            </span>
          </button>

          {/* Preset 3: Custom JS Ad Tag Script */}
          <button
            onClick={() =>
              handleOpenAddModal({
                title: 'Third-Party Ad Network Tag / JS Script',
                sponsorName: 'Ad Network Partner',
                adType: 'script',
                htmlContent: `<div id="partner-ad-unit" class="text-center p-3">
  <!-- Injected Ad Network Widget Placeholder -->
  <div style="padding: 12px; border: 1px dashed #3b82f6; border-radius: 8px; font-size: 11px; color: #3b82f6; font-family: monospace;">
    [Active Ad Script Tag / Affiliate Iframe Container]
  </div>
</div>`,
                scriptCode: `console.log("Custom ad script initialized successfully for slot");`,
                targetUrl: '#',
                slots: ['sidebar', 'banner', 'leaderboard'],
              })
            }
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/80 dark:border-slate-700/80 text-left transition-all group cursor-pointer"
          >
            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 block">
              📜 JS Ad Script / Tag
            </span>
            <span className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
              Inject external ad networks (Media.net, BuySellAds, PropellerAds, Ezoic).
            </span>
          </button>

          {/* Preset 4: VPN & Security Affiliate */}
          <button
            onClick={() =>
              handleOpenAddModal({
                title: 'High-Speed Privacy VPN – 82% Off + 3 Mo Free',
                description: 'Browse, convert, and download files with 100% hidden IP and encrypted tunnel.',
                sponsorName: 'CyberGuard VPN',
                ctaText: 'Get 82% Off',
                badgeText: 'Exclusive Deal',
                bgGradient: 'purple',
                adType: 'card',
                targetUrl: 'https://pdfeditfy.com?aff=vpn82',
                slots: ['leaderboard', 'sidebar', 'homepage_top'],
              })
            }
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/80 dark:border-slate-700/80 text-left transition-all group cursor-pointer"
          >
            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 block">
              🛡️ VPN Affiliate Promo
            </span>
            <span className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
              High affiliate payout privacy &amp; security promotion for document users.
            </span>
          </button>

        </div>
      </div>

      {/* Campaigns List Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Configured Custom Ads &amp; Scripts ({customAds.length})</span>
          </h4>
          <span className="text-xs text-slate-400">All changes persist in browser &amp; exports</span>
        </div>

        {customAds.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
              <Megaphone className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="font-extrabold text-sm text-slate-900 dark:text-white">No Custom Ads Configured Yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Create a high-converting affiliate promo card, inject a custom script tag, or add an HTML banner in the sidebar or below tools.
              </p>
            </div>
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Custom Ad</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {customAds.map((ad) => {
              const stats = getAdSyncedStats(ad);
              const ctr = stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(2) + '%' : '0.00%';

              return (
                <div
                  key={ad.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    ad.enabled
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          ad.enabled ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-slate-400'
                        }`}
                      />
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {ad.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        {ad.adType === 'card' && <Sparkles className="w-2.5 h-2.5 text-blue-500" />}
                        {ad.adType === 'image' && <ImageIcon className="w-2.5 h-2.5 text-emerald-500" />}
                        {ad.adType === 'custom_html' && <Code className="w-2.5 h-2.5 text-purple-500" />}
                        {ad.adType === 'script' && <FileCode2 className="w-2.5 h-2.5 text-amber-500" />}
                        <span className="uppercase">{ad.adType}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        • {ad.sponsorName || 'Direct Sponsor'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {ad.description || ad.targetUrl || 'Custom HTML / Script Container'}
                    </p>

                    {/* Slots Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold">Active Slots:</span>
                      {ad.slots.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 uppercase"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Metrics & Actions */}
                  <div className="flex items-center gap-4 shrink-0 flex-wrap">
                    
                    {/* Metrics Pill */}
                    <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Views</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{stats.impressions.toLocaleString()}</strong>
                      </div>
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Clicks</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{stats.clicks.toLocaleString()}</strong>
                      </div>
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">CTR</span>
                        <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{ctr}</strong>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-1.5">
                      
                      <button
                        onClick={() => handleToggleAd(ad.id)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          ad.enabled
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                        }`}
                        title={ad.enabled ? 'Click to Pause Ad' : 'Click to Enable Ad'}
                      >
                        {ad.enabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(ad)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Edit Ad Campaign"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleResetStats(ad.id)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Reset Impressions and Clicks"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteAd(ad.id)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-950 text-slate-600 dark:text-slate-300 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Advertisement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
                  <Megaphone className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {editingAd ? 'Edit Custom Advertisement / Script' : 'Create Custom Ad Script or Affiliate Banner'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 flex-1">
              
              {/* Ad Format Selector */}
              <div>
                <label className="block text-xs font-extrabold text-slate-900 dark:text-white mb-1.5">
                  Ad / Script Format Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormAdType('card')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formAdType === 'card'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Visual Promo Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormAdType('custom_html')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formAdType === 'custom_html'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Custom HTML Banner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormAdType('script')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formAdType === 'script'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>JS Script / Ad Tag</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormAdType('image')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formAdType === 'image'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Image Banner URL</span>
                  </button>
                </div>
              </div>

              {/* Title & Sponsor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ad Headline / Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. PDF Desktop Pro – 50% Off Lifetime"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sponsor / Network Name
                  </label>
                  <input
                    type="text"
                    value={formSponsorName}
                    onChange={(e) => setFormSponsorName(e.target.value)}
                    placeholder="e.g. CloudVault / Media.net / Direct Partner"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Target Destination URL */}
              {formAdType !== 'script' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Destination Target URL * (Affiliate link or sponsor landing page)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formTargetUrl}
                      onChange={(e) => setFormTargetUrl(e.target.value)}
                      placeholder="https://partnerwebsite.com/deal?aff=123"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              )}

              {/* Description Body (for Card) */}
              {formAdType === 'card' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ad Description / Value Proposition
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe the key benefit, discount code, or special offer..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  />
                </div>
              )}

              {/* Image URL (if Image mode) */}
              {formAdType === 'image' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Image Banner URL (728x90, 300x250, or responsive image)
                  </label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://yoursite.com/banners/sponsor-728x90.png"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Custom HTML Banner (if HTML mode) */}
              {formAdType === 'custom_html' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Custom HTML Banner Markup
                    </label>
                    <span className="text-[11px] text-slate-400">Supports HTML, CSS, affiliate links &amp; buttons</span>
                  </div>
                  <textarea
                    rows={5}
                    value={formHtmlContent}
                    onChange={(e) => setFormHtmlContent(e.target.value)}
                    placeholder="<div style='background: #1e293b; color: white; padding: 12px; border-radius: 8px;'><a href='...'>...</a></div>"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* JS Script Code / Ad Tag Snippet (if Script mode) */}
              {formAdType === 'script' && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        HTML &amp; Script Tag Snippet (e.g. &lt;script src="..."&gt;&lt;/script&gt; or embed div)
                      </label>
                    </div>
                    <textarea
                      rows={4}
                      value={formHtmlContent}
                      onChange={(e) => setFormHtmlContent(e.target.value)}
                      placeholder='<script async src="https://partner-ad-network.com/tag.js" data-slot="12345"></script>'
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Optional Inline JavaScript Runner Code
                      </label>
                    </div>
                    <textarea
                      rows={2}
                      value={formScriptCode}
                      onChange={(e) => setFormScriptCode(e.target.value)}
                      placeholder='window.partnerAdInit && window.partnerAdInit({ slot: "sidebar" });'
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Card Style Controls: CTA Button, Badge, Color Theme */}
              {formAdType === 'card' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                  
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={formCtaText}
                      onChange={(e) => setFormCtaText(e.target.value)}
                      placeholder="e.g. Claim 50% Off"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Badge / Pill Label
                    </label>
                    <input
                      type="text"
                      value={formBadgeText}
                      onChange={(e) => setFormBadgeText(e.target.value)}
                      placeholder="e.g. Special Deal"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Card Color Theme
                    </label>
                    <select
                      value={formGradient}
                      onChange={(e: any) => setFormGradient(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                    >
                      <option value="blue">Blue Gradient</option>
                      <option value="purple">Purple Gradient</option>
                      <option value="emerald">Emerald Gradient</option>
                      <option value="amber">Amber / Gold Gradient</option>
                      <option value="rose">Rose / Coral Gradient</option>
                      <option value="slate">Dark Slate</option>
                      <option value="dark">Charcoal Black</option>
                    </select>
                  </div>

                </div>
              )}

              {/* Slot Target Placements */}
              <div>
                <label className="block text-xs font-extrabold text-slate-900 dark:text-white mb-2">
                  Display Placements / Ad Slots
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'sidebar', label: '📌 Desktop Sidebar (Right column next to tool)' },
                    { id: 'banner', label: '📍 Below Tool Workspace (Inline banner)' },
                    { id: 'leaderboard', label: '🔝 Leaderboards (Top & Bottom of page)' },
                    { id: 'homepage_top', label: '🏠 Homepage Top' },
                    { id: 'homepage_bottom', label: '🏠 Homepage Bottom' },
                  ].map((slot) => {
                    const isSelected = formSlots.includes(slot.id as AdSlotType);
                    return (
                      <button
                        type="button"
                        key={slot.id}
                        onClick={() => toggleSlotSelection(slot.id as AdSlotType)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                        <span>{slot.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LIVE INTERACTIVE PREVIEW */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    Live Render Preview
                  </span>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-400 mr-1">Preview Slot:</span>
                    {(['sidebar', 'banner', 'leaderboard'] as AdSlotType[]).map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setPreviewSlot(s)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                          previewSlot === s
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <CustomAdBanner
                    ad={draftAd}
                    slotType={previewSlot}
                    showLabel={true}
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAd}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingAd ? 'Save Changes' : 'Publish Ad Campaign'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
