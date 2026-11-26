import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ExternalLink, ShieldCheck, Sparkles, Tag, Zap } from 'lucide-react';
import { AdSlotType } from '../types';

declare global {
  interface Window {
    ezstandalone?: {
      cmd: Array<() => void>;
      showAds?: (...placeholderIds: number[]) => void;
      destroyPlaceholders?: (...placeholderIds: number[]) => void;
      destroyAll?: () => void;
      define?: (...placeholderIds: number[]) => void;
    };
  }
}

let ezoicScriptRequested = false;
let ezoicCmpRequested = false;

function isPreviewOrLocalHost(): boolean {
  if (typeof window === 'undefined') return true;
  const h = window.location.hostname || '';
  return (
    !h ||
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h.endsWith('.local') ||
    h.endsWith('.run.app') ||
    h.endsWith('.web.app')
  );
}

/**
 * Ensures Ezoic Standalone (sa.min.js), Analytics, and Gatekeeper Consent CMP scripts are loaded once globally.
 */
export function ensureEzoicScriptsLoaded(enableCmp = true): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  window.ezstandalone = window.ezstandalone || { cmd: [] };
  window.ezstandalone.cmd = window.ezstandalone.cmd || [];

  if (enableCmp && !ezoicCmpRequested && !isPreviewOrLocalHost()) {
    ezoicCmpRequested = true;
    const cmpUrls = [
      { match: 'cmp.gatekeeperconsent.com/min.js', src: 'https://cmp.gatekeeperconsent.com/min.js' },
      { match: 'the.gatekeeperconsent.com/cmp.min.js', src: 'https://the.gatekeeperconsent.com/cmp.min.js' },
    ];
    cmpUrls.forEach(({ match, src }) => {
      if (!document.querySelector(`script[src*="${match}"]`)) {
        const script = document.createElement('script');
        script.src = src;
        script.setAttribute('data-cfasync', 'false');
        script.async = true;
        document.head.appendChild(script);
      }
    });
  }

  if (!ezoicScriptRequested) {
    ezoicScriptRequested = true;
    if (!document.querySelector('script[src*="ezojs.com/ezoic/sa.min.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.ezojs.com/ezoic/sa.min.js';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      document.head.appendChild(script);
    }
    if (!document.querySelector('script[src*="ezoicanalytics.com/analytics.js"]')) {
      const analyticsScript = document.createElement('script');
      analyticsScript.src = 'https://ezoicanalytics.com/analytics.js';
      analyticsScript.async = true;
      document.head.appendChild(analyticsScript);
    }
  }
}

interface EzoicBannerProps {
  slotType?: AdSlotType;
  placeholderId?: string;
  siteId?: string;
  cmpEnabled?: boolean;
  className?: string;
  showLabel?: boolean;
}

const DEFAULT_PLACEHOLDER_BY_SLOT: Record<AdSlotType, string> = {
  homepage_top: '101',
  leaderboard: '101',
  banner: '102',
  sidebar: '103',
  homepage_bottom: '104',
  rectangle: '105',
};

export const EzoicBanner: React.FC<EzoicBannerProps> = ({
  slotType = 'leaderboard',
  placeholderId,
  siteId,
  cmpEnabled = true,
  className = '',
  showLabel = true,
}) => {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [hasFilledAd, setHasFilledAd] = useState(false);

  const rawId = (placeholderId || DEFAULT_PLACEHOLDER_BY_SLOT[slotType] || '101').replace(/\D/g, '') || '101';
  const numericId = Number(rawId);

  useEffect(() => {
    ensureEzoicScriptsLoaded(cmpEnabled);

    const placeholderEl = placeholderRef.current;

    try {
      window.ezstandalone = window.ezstandalone || { cmd: [] };
      window.ezstandalone.cmd = window.ezstandalone.cmd || [];
      window.ezstandalone.cmd.push(() => {
        if (window.ezstandalone?.showAds) {
          window.ezstandalone.showAds(numericId);
        }
      });
    } catch (err) {
      console.debug('Ezoic init notice:', err);
    }

    const inspectContainer = () => {
      if (!placeholderEl) return;
      const hasInjectedNode =
        placeholderEl.querySelector('iframe, ins, img, .ezoic-ad') !== null ||
        placeholderEl.children.length > 0;
      if (hasInjectedNode) {
        setHasFilledAd(true);
      }
      placeholderEl.querySelectorAll('a[href]').forEach((anchor) => {
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'sponsored noopener noreferrer');
      });
    };

    const timer = setInterval(inspectContainer, 1000);
    let observer: MutationObserver | null = null;
    if (placeholderEl && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(inspectContainer);
      observer.observe(placeholderEl, { childList: true, subtree: true });
    }

    return () => {
      clearInterval(timer);
      observer?.disconnect();
      try {
        window.ezstandalone?.cmd?.push(() => {
          window.ezstandalone?.destroyPlaceholders?.(numericId);
        });
      } catch {
        // Ignore cleanup failures
      }
    };
  }, [numericId, cmpEnabled]);

  let containerStyle = 'w-full max-w-5xl min-h-[90px]';
  if (slotType === 'rectangle') {
    containerStyle = 'w-full max-w-[336px] min-h-[280px] mx-auto';
  } else if (slotType === 'sidebar') {
    containerStyle = 'w-full max-w-[340px] min-h-[250px] mx-auto';
  } else if (slotType === 'banner') {
    containerStyle = 'w-full max-w-4xl min-h-[80px] mx-auto';
  }

  return (
    <div className={`my-3 mx-auto text-center w-full overflow-hidden ${className}`}>
      {showLabel && (
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center justify-between px-2 max-w-5xl mx-auto">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold">
            <Tag className="w-3 h-3" />
            <span>Ezoic Certified Ad Service</span>
          </span>
          <span className="font-mono text-[9px] opacity-75">
            Placeholder #{rawId}{siteId ? ` • Site ${siteId}` : ''}
          </span>
        </div>
      )}

      <div className={`relative rounded-2xl overflow-hidden ${containerStyle}`}>
        {/* Official Ezoic Standalone Placeholder */}
        <div
          ref={placeholderRef}
          id={`ezoic-pub-ad-placeholder-${rawId}`}
          data-ezoic-placeholder={rawId}
          className="w-full text-center relative z-10"
        />

        {/* Fallback Partner Card while Ezoic placeholder is awaiting live domain fill */}
        {!hasFilledAd && (
          <a
            href="https://www.ezoic.com/"
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="w-full h-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 hover:border-emerald-400/70 text-left shadow-md hover:shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all group cursor-pointer"
          >
            <div className="space-y-1.5 flex-1 pr-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Ezoic AI Ad Network</span>
                </span>
                <span className="font-bold text-xs sm:text-sm text-white group-hover:text-emerald-200 transition-colors flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Automated Header Bidding &amp; Revenue Optimization</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed line-clamp-2 sm:line-clamp-1">
                Ezoic standalone placement #{rawId} active ({slotType.replace('_', ' ')}). Live ads serve automatically once domain verification completes.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>ezoic-pub-ad-placeholder-{rawId}{siteId ? ` • Site ID: ${siteId}` : ''}</span>
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-center">
              <span className="py-2 px-4 rounded-xl text-xs font-black bg-emerald-500 group-hover:bg-emerald-400 text-slate-950 shadow-md flex items-center gap-1.5 transition-transform group-hover:scale-105">
                <span>Ezoic Console</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                <ExternalLink className="w-3 h-3 opacity-80" />
              </span>
            </div>
          </a>
        )}
      </div>
    </div>
  );
};
