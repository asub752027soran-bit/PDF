import React, { useEffect, useRef } from 'react';
import { Info } from 'lucide-react';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface AdSenseBannerProps {
  slotType?: 'leaderboard' | 'rectangle' | 'banner' | 'in-article' | 'sidebar';
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

  useEffect(() => {
    // Only attempt push once per ad slot component mount
    if (adInitialized.current) return;
    try {
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        adInitialized.current = true;
      }
    } catch (e) {
      // AdSense push may fail gracefully if ads are blocked or script not yet loaded
      console.debug('AdSense init notice:', e);
    }
  }, []);

  let containerStyle = 'w-full max-w-4xl min-h-[90px]';
  let adFormat = 'auto';

  if (slotType === 'rectangle') {
    containerStyle = 'w-full max-w-[336px] min-h-[280px] mx-auto';
    adFormat = 'rectangle';
  } else if (slotType === 'sidebar') {
    containerStyle = 'w-full max-w-[320px] min-h-[280px] lg:min-h-[600px] mx-auto';
    adFormat = 'vertical';
  } else if (slotType === 'banner') {
    containerStyle = 'w-full max-w-3xl min-h-[60px] mx-auto';
    adFormat = 'horizontal';
  } else if (slotType === 'in-article') {
    containerStyle = 'w-full max-w-2xl min-h-[120px] mx-auto';
    adFormat = 'fluid';
  }

  return (
    <div className={`my-6 mx-auto text-center w-full overflow-hidden ${className}`}>
      {showLabel && (
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center justify-center gap-1">
          <span>Advertisement</span>
          <Info className="w-2.5 h-2.5" />
        </div>
      )}

      <div className={`relative flex items-center justify-center rounded-2xl overflow-hidden ${containerStyle}`}>
        {/* Google AdSense ins tag */}
        <ins
          ref={adRef}
          className="adsbygoogle block w-full text-center"
          style={{ display: 'block' }}
          data-ad-client={client}
          {...(slot ? { 'data-ad-slot': slot } : {})}
          data-ad-format={adFormat}
          data-full-width-responsive="true"
        />

        {/* Subtle placeholder border and label in development/preview when ad has not filled yet */}
        <div className="absolute inset-0 -z-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center p-3 text-slate-400">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            Google AdSense Ad Space
          </span>
          <span className="text-[9px] font-mono text-slate-300 dark:text-slate-600 mt-0.5">
            ca-pub-9806760868514523
          </span>
        </div>
      </div>
    </div>
  );
};
