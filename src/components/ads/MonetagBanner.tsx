import React, { useEffect, useRef } from 'react';
import { Sparkles, ExternalLink, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { AdSlotType, MonetagConfig } from '../../types';
import { recordAdImpression, recordAdClick } from '../../utils/customAdTracker';
import { triggerMonetagAction } from '../../utils/monetag';

interface MonetagBannerProps {
  slotType: AdSlotType;
  monetagConfig?: MonetagConfig;
  className?: string;
  showLabel?: boolean;
}

const MONETAG_CAMPAIGNS = [
  {
    id: 'monetag-cloud-ocr',
    title: '⚡ High-Speed Cloud Document Converter & OCR Engine',
    desc: 'Extract tables, convert scanned PDFs to Word & Excel, and automate document pipelines with 99.99% uptime.',
    cta: 'Explore Free API',
    badge: 'Monetag Verified Offer',
    gradient: 'from-amber-950 via-slate-900 to-indigo-950 border-amber-500/40',
    buttonColor: 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black',
  },
  {
    id: 'monetag-pdf-pro',
    title: 'PDF Master Suite – Unlimited Offline Editor & Compressor',
    desc: '100% private in-browser document security, zero file limits, and instant document signatures.',
    cta: 'Claim Sponsor Deal',
    badge: 'Monetag Partner',
    gradient: 'from-blue-950 via-slate-900 to-indigo-950 border-blue-500/40',
    buttonColor: 'bg-blue-500 hover:bg-blue-400 text-white font-bold',
  },
  {
    id: 'monetag-vault-storage',
    title: 'Encrypted Cloud Document Vault – 50GB Free Tier',
    desc: 'AES-256 encrypted storage for confidential PDFs, contracts, and business spreadsheets. Instant backup.',
    cta: 'Get 50GB Free',
    badge: 'Featured Sponsor',
    gradient: 'from-emerald-950 via-slate-900 to-teal-950 border-emerald-500/40',
    buttonColor: 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black',
  },
];

export const MonetagBanner: React.FC<MonetagBannerProps> = ({
  slotType,
  monetagConfig,
  className = '',
  showLabel = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionLogged = useRef(false);

  // Pick campaign based on slot type
  const campaignIndex = slotType === 'sidebar' ? 0 : slotType === 'homepage_bottom' ? 2 : 1;
  const campaign = MONETAG_CAMPAIGNS[campaignIndex];

  const zoneId = monetagConfig?.zoneId || '11893764';
  const domain = monetagConfig?.domain || '5gvci.com';
  const customScript = monetagConfig?.customBannerScript;
  const targetUrl = monetagConfig?.directLinkUrl || `https://${domain}/act/files/tag.min.js?z=${zoneId}`;

  useEffect(() => {
    if (!impressionLogged.current) {
      recordAdImpression(`monetag-${zoneId}-${slotType}`);
      impressionLogged.current = true;
    }
  }, [zoneId, slotType]);

  // Execute custom script if publisher provided one in admin
  useEffect(() => {
    if (customScript && containerRef.current) {
      containerRef.current.innerHTML = customScript;
      const scripts = Array.from(containerRef.current.querySelectorAll('script'));
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (oldScript.textContent) {
          newScript.textContent = oldScript.textContent;
        }
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [customScript]);

  const handleClick = (e: React.MouseEvent) => {
    recordAdClick(`monetag-${zoneId}-${slotType}`);
    triggerMonetagAction('click', monetagConfig);

    if (targetUrl && targetUrl.startsWith('http')) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // If custom banner script code is provided by user, render container
  if (customScript) {
    return (
      <div className={`my-3 mx-auto w-full text-center ${className}`}>
        {showLabel && (
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center justify-center gap-1.5">
            <Zap className="w-2.5 h-2.5 text-amber-500" />
            <span>Monetag Ad Network • Zone #{zoneId}</span>
          </div>
        )}
        <div
          ref={containerRef}
          onClick={handleClick}
          className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-2 min-h-[90px] flex items-center justify-center cursor-pointer"
        />
      </div>
    );
  }

  // 1. SIDEBAR FORMAT (Vertical Card)
  if (slotType === 'sidebar' || slotType === 'rectangle') {
    return (
      <div className={`w-full overflow-hidden ${className}`}>
        {showLabel && (
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center justify-between px-1">
            <span className="flex items-center gap-1 text-amber-500 font-extrabold">
              <Zap className="w-3 h-3" />
              <span>Monetag Ad</span>
            </span>
            <span className="font-mono text-[9px] opacity-75">Zone {zoneId}</span>
          </div>
        )}

        <div
          onClick={handleClick}
          className={`block p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${campaign.gradient} border shadow-md hover:shadow-xl transition-all duration-300 group text-left relative overflow-hidden cursor-pointer`}
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

          {/* Top row badge */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/10 backdrop-blur-sm border border-white/20 text-amber-300 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{campaign.badge}</span>
            </span>
            <span className="text-[10px] text-slate-300 flex items-center gap-1 group-hover:underline">
              <span>Explore</span> <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm text-white mb-2 leading-snug group-hover:text-amber-200 transition-colors">
            {campaign.title}
          </h3>

          {/* Body */}
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            {campaign.desc}
          </p>

          {/* CTA Button */}
          <div className="pt-1">
            <button
              type="button"
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-transform group-hover:scale-[1.02] active:scale-95 cursor-pointer ${campaign.buttonColor}`}
            >
              <span>{campaign.cta}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Verified Network</span>
            </span>
            <span>{domain}</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. HORIZONTAL RESPONSIVE LEADERBOARD & BANNER FORMAT (Homepage Top, Homepage Bottom, Tool Leaderboards)
  return (
    <div className={`my-3 mx-auto w-full max-w-5xl overflow-hidden ${className}`}>
      {showLabel && (
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center justify-between px-2">
          <span className="flex items-center gap-1 text-amber-500 font-extrabold">
            <Zap className="w-3 h-3" />
            <span>Monetag Sponsored Ad</span>
          </span>
          <span className="font-mono text-[9px] opacity-75">Zone ID: {zoneId} • {domain}</span>
        </div>
      )}

      <div
        onClick={handleClick}
        className={`block p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r ${campaign.gradient} border shadow-md hover:shadow-xl transition-all duration-300 group text-left relative overflow-hidden cursor-pointer`}
      >
        {/* Glow Accent */}
        <div className="absolute right-0 top-0 w-48 h-full bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          
          <div className="space-y-1.5 flex-1 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-white/10 backdrop-blur-sm border border-white/20 text-amber-300 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{campaign.badge}</span>
              </span>
              <span className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-200 transition-colors">
                {campaign.title}
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-2 sm:line-clamp-1 leading-relaxed">
              {campaign.desc}
            </p>
          </div>

          {/* Action Button & Network Badge */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              type="button"
              className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md whitespace-nowrap group-hover:scale-105 active:scale-95 transition-transform cursor-pointer ${campaign.buttonColor}`}
            >
              <span>{campaign.cta}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
