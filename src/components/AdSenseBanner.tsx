import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, ShieldCheck, Sparkles, Tag, ArrowRight } from 'lucide-react';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
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
  const [hasFilledIframe, setHasFilledIframe] = useState<boolean>(false);

  useEffect(() => {
    if (adInitialized.current) return;
    try {
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        adInitialized.current = true;
      }
    } catch (e) {
      console.debug('AdSense init notice:', e);
    }

    // Monitor if AdSense has injected an active ad iframe
    const checkIframe = () => {
      if (adRef.current && adRef.current.querySelector('iframe')) {
        setHasFilledIframe(true);
      }
    };
    const timer = setInterval(checkIframe, 1000);
    return () => clearInterval(timer);
  }, []);

  let containerStyle = 'w-full max-w-5xl min-h-[90px]';
  let adFormat = 'auto';

  if (slotType === 'rectangle') {
    containerStyle = 'w-full max-w-[336px] min-h-[280px] mx-auto';
    adFormat = 'rectangle';
  } else if (slotType === 'sidebar') {
    containerStyle = 'w-full max-w-[340px] min-h-[250px] mx-auto';
    adFormat = 'vertical';
  } else if (slotType === 'banner') {
    containerStyle = 'w-full max-w-4xl min-h-[80px] mx-auto';
    adFormat = 'horizontal';
  }

  return (
    <div className={`my-3 mx-auto text-center w-full overflow-hidden ${className}`}>
      {showLabel && (
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center justify-between px-2 max-w-5xl mx-auto">
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-extrabold">
            <Tag className="w-3 h-3" />
            <span>Google AdSense Agency Ad</span>
          </span>
          <span className="font-mono text-[9px] opacity-75">{client}</span>
        </div>
      )}

      <div className={`relative rounded-2xl overflow-hidden ${containerStyle}`}>
        {/* Official Google AdSense ins tag */}
        <ins
          ref={adRef}
          className="adsbygoogle block w-full text-center relative z-10"
          style={{ display: 'block', minHeight: hasFilledIframe ? 'auto' : undefined }}
          data-ad-client={client}
          {...(slot ? { 'data-ad-slot': slot } : {})}
          data-ad-format={adFormat}
          data-full-width-responsive="true"
        />

        {/* Agency Ad Content & Active Ad Unit (Visible when Google iframe is loading or in fill status) */}
        {!hasFilledIframe && (
          <div className="w-full h-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/40 text-left shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5 flex-1 pr-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Google Certified Agency Ad</span>
                </span>
                <span className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                  <span>⚡ Enterprise Cloud PDF &amp; Document Infrastructure</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed line-clamp-2 sm:line-clamp-1">
                Fast, automated document processing API with OCR extraction, 99.99% SLA, and zero queue limits.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>AdSense Publisher: {client}</span>
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-center">
              <a
                href="https://google.com/adsense"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-4 rounded-xl text-xs font-black bg-blue-500 hover:bg-blue-400 text-white shadow-md flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
              >
                <span>Learn More</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
