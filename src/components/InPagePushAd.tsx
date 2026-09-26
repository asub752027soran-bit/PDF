import React, { useState, useEffect } from 'react';
import { Bell, X, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { MonetagConfig } from '../types';
import { recordAdClick, recordAdImpression } from '../utils/customAdTracker';
import { triggerMonetagAction } from '../utils/monetag';

interface InPagePushAdProps {
  adsEnabled?: boolean;
  monetagConfig?: MonetagConfig;
}

export const InPagePushAd: React.FC<InPagePushAdProps> = ({
  adsEnabled = true,
  monetagConfig,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const isConfigEnabled = monetagConfig?.enabled ?? true;
  const isIppEnabled = isConfigEnabled && (monetagConfig?.showInPagePush ?? true);
  const zoneId = monetagConfig?.zoneId || '11893764';
  const domain = monetagConfig?.domain || '5gvci.com';
  const targetUrl = monetagConfig?.directLinkUrl || `https://${domain}/act/files/tag.min.js?z=${zoneId}`;

  useEffect(() => {
    if (!adsEnabled || !isIppEnabled) return;

    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('pdfeditfy_monetag_ipp_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Delay entry by 2.5 seconds for natural appearance
    const timer = setTimeout(() => {
      setIsVisible(true);
      recordAdImpression(`monetag-${zoneId}-ipp`);
    }, 2500);

    return () => clearTimeout(timer);
  }, [adsEnabled, isIppEnabled, zoneId]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('pdfeditfy_monetag_ipp_dismissed', 'true');
  };

  const handleClick = () => {
    recordAdClick(`monetag-${zoneId}-ipp`);
    triggerMonetagAction('click', monetagConfig);

    // Optionally trigger browser push notification permission for WebPush ad delivery
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission().catch(() => {});
      } catch (err) {}
    }

    // Direct to offer / verified sponsor
    if (targetUrl && targetUrl.startsWith('http')) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!adsEnabled || !isIppEnabled || isDismissed || !isVisible) {
    return null;
  }

  return (
    <aside
      aria-label="Monetag Sponsored Notification"
      className="fixed bottom-4 right-4 z-50 max-w-[340px] w-[calc(100vw-32px)] sm:w-auto animate-in fade-in slide-in-from-bottom-5 duration-500"
    >
      <div
        onClick={handleClick}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-amber-400 hover:shadow-amber-500/25"
      >
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/20 blur-xl" />

        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <Bell className="h-3 w-3 animate-pulse" />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" />
              <span>Monetag Verified Sponsor</span>
            </span>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Close notification"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Ad Title & Body */}
        <div className="space-y-1 pr-1">
          <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
            <span>⚡ High-Speed Cloud Document Converter</span>
          </h4>
          <p className="text-[11px] text-slate-300/90 leading-relaxed">
            Batch convert & compress PDFs with zero queue limits and automated OCR text extraction.
          </p>
        </div>

        {/* Footer CTA & Badge */}
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>Zone {zoneId} • {domain}</span>
          </span>

          <div className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform">
            <span>Explore Offer</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </aside>
  );
};
