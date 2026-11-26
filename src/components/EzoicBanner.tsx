import React, { useEffect, useRef, useState } from 'react';
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

  let containerStyle = 'w-full max-w-5xl';
  if (slotType === 'rectangle') {
    containerStyle = 'w-full max-w-[336px] mx-auto';
  } else if (slotType === 'sidebar') {
    containerStyle = 'w-full max-w-[340px] mx-auto';
  } else if (slotType === 'banner') {
    containerStyle = 'w-full max-w-4xl mx-auto';
  }

  return (
    <div className={`mx-auto text-center w-full overflow-hidden ${hasFilledAd ? 'my-3' : 'my-0'} ${className}`}>
      {showLabel && hasFilledAd && (
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1 px-2 max-w-5xl mx-auto text-left">
          <span>Advertisement</span>
        </div>
      )}

      <div className={`relative overflow-hidden ${containerStyle}`}>
        <div
          ref={placeholderRef}
          id={`ezoic-pub-ad-placeholder-${rawId}`}
          data-ezoic-placeholder={rawId}
          className="w-full text-center relative z-10"
        />
      </div>
    </div>
  );
};
