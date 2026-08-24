import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Eye,
  MousePointer,
  Percent,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  Layers,
  Layout,
  RefreshCw,
  Download,
  Upload,
  Code,
  Image as ImageIcon,
  Tag,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  X,
  Sliders,
  Play
} from 'lucide-react';
import { CustomAdItem, AdSlotType, AdminConfig } from '../../types';
import { DEFAULT_CUSTOM_ADS, getAdSyncedStats } from '../../utils/customAdTracker';
import { TOOLS } from '../../data/toolsData';
import { CustomAdBanner } from '../CustomAdBanner';

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
  const customAds: CustomAdItem[] = config.customAds && config.customAds.length > 0
    ? config.customAds
    : DEFAULT_CUSTOM_ADS;

  const currentMode = config.adServingMode || 'hybrid';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<CustomAdItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSponsorName, setFormSponsorName] = useState('');
  const [formTargetUrl, setFormTargetUrl] = useState('');
  const [formAdType, setFormAdType] = useState<'card' | 'image' | 'custom_html'>('card');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formHtmlContent, setFormHtmlContent] = useState('');
  const [formCtaText, setFormCtaText] = useState('Claim Deal');
  const [formBadgeText, setFormBadgeText] = useState('Featured Deal');
  const [formGradient, setFormGradient] = useState<'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'slate'>('blue');
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
    setFormCtaText(ad.ctaText || 'Learn More');
    setFormBadgeText(ad.badgeText || 'Sponsored');
    setFormGradient(ad.bgGradient || 'blue');
    setFormSlots(ad.slots || ['leaderboard', 'banner', 'sidebar']);
    setFormTargetTools(ad.targetTools || ['all']);
    setIsModalOpen(true);
  };

  const handleSaveAd = () => {
    if (!formTitle.trim() || !formTargetUrl.trim()) {
      showToast('Please provide an ad title and target URL.');
      return;
    }

    const updatedAd: CustomAdItem = {
      id: editingAd ? editingAd.id : `ad-${Date.now()}`,
      title: formTitle.trim(),
      description: formDescription.trim(),
      sponsorName: formSponsorName.trim() || 'Direct Sponsor',
      targetUrl: formTargetUrl.trim(),
      adType: formAdType,
      imageUrl: formImageUrl.trim(),
      htmlContent: formHtmlContent.trim(),
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
    const targeted = nextAds.find((a) => a.id === adId);
    onUpdateConfig({
      ...config,
      customAds: nextAds,
    });
    showToast(`Ad "${targeted?.title}" is now ${targeted?.enabled ? 'Active' : 'Disabled'}`);
  };

  const handleDeleteAd = (adId: string) => {
    if (!window.confirm('Are you sure you want to delete this custom advertisement?')) return;
    const nextAds = customAds.filter((a) => a.id !== adId);
    onUpdateConfig({
      ...config,
      customAds: nextAds,
    });
    showToast('Advertisement deleted.');
  };

  const handleResetStats = () => {
    if (!window.confirm('Reset all custom ad impressions and click counters?')) return;
    localStorage.removeItem('pdfeditfy_ad_stats');
    const nextAds = customAds.map((a) => ({ ...a, impressions: 0, clicks: 0 }));
    onUpdateConfig({
      ...config,
      customAds: nextAds,
    });
    showToast('Ad impression and click stats reset to zero.');
  };

  const handleExportAds = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(customAds, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pdfeditfy-custom-ads-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Custom ads exported to JSON');
  };

  const toggleSlotSelection = (slot: AdSlotType) => {
    if (formSlots.includes(slot)) {
      if (formSlots.length === 1) {
        showToast('At least one ad slot must be selected.');
        return;
      }
      setFormSlots(formSlots.filter((s) => s !== slot));
    } else {
      setFormSlots([...formSlots, slot]);
    }
  };

  // Construct draft ad item for live preview in modal
  const draftAd: CustomAdItem = {
    id: 'preview-ad',
    title: formTitle || 'Your Custom Ad Title Here',
    description: formDescription || 'Your ad description highlighting product features and benefits.',
    sponsorName: formSponsorName || 'Your Brand',
    targetUrl: formTargetUrl || 'https://example.com',
    adType: formAdType,
    imageUrl: formImageUrl,
    htmlContent: formHtmlContent,
    ctaText: formCtaText || 'Claim Deal',
    badgeText: formBadgeText || 'Special Offer',
    bgGradient: formGradient,
    slots: formSlots,
    targetTools: formTargetTools,
    enabled: true,
    impressions: 100,
    clicks: 12,
    createdAt: '2026-08-23',
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Overview Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Megaphone className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Self-Served Advertisements &amp; Direct Sponsorships
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Run custom partner banners, affiliate campaigns, direct sponsor ads &amp; promo cards alongside Google AdSense.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Ad</span>
            </button>
            <button
              onClick={handleExportAds}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export Ads to JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
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
                Displays Google AdSense alongside your custom sponsor cards in sidebar and banner positions.
              </p>
            </div>

            {/* 2. Custom Ads Only */}
            <div
              onClick={() => {
                onUpdateConfig({ ...config, adServingMode: 'custom_only' });
                showToast('Strategy changed to: Custom Ads Only');
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
                100% direct sponsor banners and affiliate links. Completely disables third-party Google AdSense scripts.
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
            1-Click High-Converting Sponsor Templates
          </h4>
          <span className="text-[11px] text-slate-400">Click any preset to launch immediately</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <button
            onClick={() =>
              handleOpenAddModal({
                title: 'PDF Pro Desktop Editor – Lifetime Deal 50% Off',
                description: 'Fast offline editing, conversion & unlimited batch OCR processing without subscription fees.',
                sponsorName: 'PDF Desktop Pro',
                ctaText: 'Claim 50% Off',
                badgeText: 'Top Rated',
                bgGradient: 'blue',
                targetUrl: 'https://pdfeditfy.com',
                slots: ['leaderboard', 'banner', 'sidebar', 'homepage_top'],
              })
            }
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-700/80 text-left transition-all group cursor-pointer"
          >
            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 block">
              💻 Desktop PDF Software Pro
            </span>
            <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
              Lifetime license promo for heavy document workflows.
            </span>
          </button>

          <button
            onClick={() =>
              handleOpenAddModal({
                title: 'Encrypted Cloud Backup – 50GB Free Storage',
                description: 'Safely store contracts, scans, and PDFs with zero-knowledge AES-256 cloud encryption.',
                sponsorName: 'VaultCloud Pro',
                ctaText: 'Get 50GB Free',
                badgeText: 'Special Deal',
                bgGradient: 'emerald',
                targetUrl: 'https://pdfeditfy.com',
                slots: ['sidebar', 'banner', 'homepage_bottom'],
              })
            }
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-700/80 text-left transition-all group cursor-pointer"
          >
            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 block">
              ☁️ Secure Cloud Backup
            </span>
            <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
              Free cloud vault promo ideal for security-minded users.
            </span>
          </button>

          <button
            onClick={() =>
              handleOpenAddModal({
                title: 'High-Speed Privacy VPN – 82% Off + 3 Mo Free',
                description: 'Browse, convert, and download files with 100% hidden IP and encrypted tunnel.',
                sponsorName: 'CyberGuard VPN',
                ctaText: 'Get 82% Off',
                badgeText: 'Exclusive Deal',
                bgGradient: 'purple',
                targetUrl: 'https://pdfeditfy.com',
                slots: ['leaderboard', 'sidebar', 'homepage_top'],
              })
            }
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/80 dark:border-slate-700/80 text-left transition-all group cursor-pointer"
          >
            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 block">
              🛡️ VPN &amp; Privacy Shield
            </span>
            <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
              High affiliate payout security &amp; privacy promotion.
            </span>
          </button>

        </div>
      </div>

      {/* Campaigns List Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Configured Custom Campaigns ({customAds.length})
          </h4>
          <button
            onClick={handleResetStats}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Stats</span>
          </button>
        </div>

        <div className="space-y-3">
          {customAds.map((ad) => {
            const stats = getAdSyncedStats(ad);
            return (
              <div
                key={ad.id}
                className={`p-4 rounded-2xl border transition-all ${
                  ad.enabled
                    ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                    : 'bg-slate-100/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Ad Info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {ad.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                        {ad.sponsorName || 'Direct Partner'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        {ad.badgeText || 'Sponsored'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                        {ad.adType}
                      </span>
                    </div>

                    {ad.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {ad.description}
                      </p>
                    )}

                    {/* Slot Badges & Target URL */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <div className="flex items-center gap-1 font-mono text-[11px] text-blue-600 dark:text-blue-400 truncate max-w-xs">
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{ad.targetUrl}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="font-bold text-slate-500">Slots:</span>
                        {ad.slots.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-[9px] font-medium uppercase"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Middle Stats Badges */}
                  <div className="flex items-center gap-3 shrink-0 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <div className="text-center px-2">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Views</span>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        {stats.impressions.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                    <div className="text-center px-2">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Clicks</span>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {stats.clicks.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                    <div className="text-center px-2">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">CTR</span>
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                        {stats.ctr}
                      </span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    
                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggleAd(ad.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        ad.enabled
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {ad.enabled ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Paused</span>
                        </>
                      )}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(ad)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-950 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Edit Advertisement"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
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
                  {editingAd ? 'Edit Custom Advertisement' : 'Create New Custom Advertisement'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 flex-1">
              
              {/* Ad Format Selector */}
              <div>
                <label className="block text-xs font-extrabold text-slate-900 dark:text-white mb-1.5">
                  Ad Format Type
                </label>
                <div className="grid grid-cols-3 gap-2">
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
                    <span>Rich Visual Card</span>
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
                    <span>Raw HTML / Code</span>
                  </button>
                </div>
              </div>

              {/* Title & Sponsor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ad Headline / Title *
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
                    Sponsor / Brand Name
                  </label>
                  <input
                    type="text"
                    value={formSponsorName}
                    onChange={(e) => setFormSponsorName(e.target.value)}
                    placeholder="e.g. CloudVault Inc."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Target URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Destination Target URL * (Affiliate link or sponsor landing page)
                </label>
                <input
                  type="url"
                  value={formTargetUrl}
                  onChange={(e) => setFormTargetUrl(e.target.value)}
                  placeholder="https://sponsorwebsite.com/deal?aff=123"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description Body */}
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

              {/* Custom HTML (if HTML mode) */}
              {formAdType === 'custom_html' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Custom HTML / Ad Tag Snippet
                  </label>
                  <textarea
                    rows={3}
                    value={formHtmlContent}
                    onChange={(e) => setFormHtmlContent(e.target.value)}
                    placeholder="<div><a href='...'><img src='...' /></a></div>"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                    { id: 'leaderboard', label: 'Top & Bottom Leaderboard' },
                    { id: 'banner', label: 'Inline Tool Banner' },
                    { id: 'sidebar', label: 'Desktop Sidebar Card' },
                    { id: 'homepage_top', label: 'Homepage Top' },
                    { id: 'homepage_bottom', label: 'Homepage Bottom' },
                  ].map((slot) => {
                    const isSelected = formSlots.includes(slot.id as AdSlotType);
                    return (
                      <button
                        type="button"
                        key={slot.id}
                        onClick={() => toggleSlotSelection(slot.id as AdSlotType)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
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
                    {(['leaderboard', 'banner', 'sidebar'] as AdSlotType[]).map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setPreviewSlot(s)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
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
