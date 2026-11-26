import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export function isValidAdSenseSlot(slot?: string): boolean {
  return Boolean(slot && /^\d{6,}$/.test(slot.trim()));
}

interface AdSenseBannerProps {
  slotType?: 'leaderboard' | 'rectangle' | 'banner' | 'in-article' | 'sidebar' | 'homepage_top' | 'homepage_bottom';
  client?: string;
  slot?: string;
  className?: string;
  showLabel?: boolean;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slotType = 'leaderboard',
  client = 'ca-pub-9806760868514523',
  slot,
  className = '',
  showLabel = true,
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const adInitialized = useRef(false);
  const [adStatus, setAdStatus] = useState<'loading' | 'filled' | 'unfilled'>('loading');

  const hasValidSlot = isValidAdSenseSlot(slot);

  useEffect(() => {
    if (!hasValidSlot || adInitialized.current) return;

    try {
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        adInitialized.current = true;
      }
    } catch (e) {
      console.debug('AdSense init notice:', e);
    }

    const inspectAdUnit = () => {
      const el = adRef.current;
      if (!el) return;

      const status = el.getAttribute('data-ad-status');
      const hasIframe = el.querySelector('iframe') !== null;

      if (status === 'unfilled') {
        setAdStatus('unfilled');
      } else if (status === 'filled' || hasIframe) {
        setAdStatus('filled');
      }

      el.querySelectorAll('a[href]').forEach((anchor) => {
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'sponsored noopener noreferrer');
      });
    };

    const timer = setInterval(inspectAdUnit, 1000);
    let observer: MutationObserver | null = null;
    if (adRef.current && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(inspectAdUnit);
      observer.observe(adRef.current, {
        attributes: true,
        attributeFilter: ['data-ad-status'],
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearInterval(timer);
      observer?.disconnect();
    };
  }, [hasValidSlot]);

  // Without an explicit numeric AdSense unit slot ID, Google Auto Ads manages placements via <head>
  // Avoiding slotless <ins class="adsbygoogle"> prevents AdSense TagErrors and empty placeholder boxes.
  if (!hasValidSlot || adStatus === 'unfilled') {
    return null;
  }

  let containerStyle = 'w-full max-w-5xl';
  let adFormat = 'auto';

  if (slotType === 'rectangle') {
    containerStyle = 'w-full max-w-[336px] mx-auto';
    adFormat = 'rectangle';
  } else if (slotType === 'sidebar') {
    containerStyle = 'w-full max-w-[340px] mx-auto';
    adFormat = 'vertical';
  } else if (slotType === 'banner') {
    containerStyle = 'w-full max-w-4xl mx-auto';
    adFormat = 'horizontal';
  }

  return (
    <div
      className={`my-3 mx-auto text-center w-full overflow-hidden ${
        adStatus === 'filled' ? '' : 'min-h-0'
      } ${className}`}
    >
      {showLabel && adStatus === 'filled' && (
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1 px-2 max-w-5xl mx-auto text-left">
          <span>Advertisement</span>
        </div>
      )}

      <div className={`relative overflow-hidden ${containerStyle}`}>
        <ins
          ref={adRef}
          className="adsbygoogle block w-full text-center"
          style={{ display: 'block' }}
          data-ad-client={client}
          data-ad-slot={slot!.trim()}
          data-ad-format={adFormat}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};
