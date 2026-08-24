import React, { useEffect, useRef } from 'react';
import {
  ExternalLink,
  Sparkles,
  ArrowRight,
  Info,
  Tag,
  Code
} from 'lucide-react';
import { CustomAdItem, AdSlotType } from '../types';
import { recordAdImpression, recordAdClick } from '../utils/customAdTracker';

interface CustomAdBannerProps {
  ad: CustomAdItem;
  slotType?: AdSlotType;
  className?: string;
  showLabel?: boolean;
}

// Script & HTML Container that evaluates any injected <script> tags safely
const CustomHtmlScriptContainer: React.FC<{
  htmlContent?: string;
  scriptCode?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}> = ({ htmlContent, scriptCode, onClick, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    // Combine html content and script code
    const fullHtml = [htmlContent || '', scriptCode ? `<script>${scriptCode}</script>` : ''].filter(Boolean).join('\n');
    
    // Clear and insert content
    container.innerHTML = fullHtml;

    // Search and re-create all <script> elements so browsers execute them
    const scriptElements = Array.from(container.querySelectorAll('script'));
    scriptElements.forEach((oldScript) => {
      const newScript = document.createElement('script');
      
      // Copy attributes (src, type, async, defer, data-* etc.)
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });

      // Copy inline script text content
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }

      // Replace old non-executing script with executable script element
      if (oldScript.parentNode) {
        oldScript.parentNode.replaceChild(newScript, oldScript);
      }
    });

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [htmlContent, scriptCode]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`custom-ad-html-container overflow-hidden w-full flex items-center justify-center ${className}`}
    />
  );
};

export const CustomAdBanner: React.FC<CustomAdBannerProps> = ({
  ad,
  slotType = 'leaderboard',
  className = '',
  showLabel = true,
}) => {
  const impressionRecorded = useRef(false);

  useEffect(() => {
    if (!impressionRecorded.current && ad?.id) {
      recordAdImpression(ad.id);
      impressionRecorded.current = true;
    }
  }, [ad?.id]);

  if (!ad || !ad.enabled) return null;

  const handleClick = (e: React.MouseEvent) => {
    recordAdClick(ad.id);
  };

  const getGradientClasses = () => {
    switch (ad.bgGradient) {
      case 'purple':
        return 'from-purple-900/90 via-indigo-900 to-slate-900 border-purple-700/60 text-white';
      case 'emerald':
        return 'from-emerald-950 via-teal-900 to-slate-900 border-emerald-700/60 text-white';
      case 'amber':
        return 'from-amber-950 via-orange-900 to-slate-900 border-amber-700/60 text-white';
      case 'rose':
        return 'from-rose-950 via-pink-900 to-slate-900 border-rose-700/60 text-white';
      case 'dark':
      case 'slate':
        return 'from-slate-900 via-slate-800 to-slate-950 border-slate-700 text-white';
      case 'blue':
      default:
        return 'from-blue-950 via-slate-900 to-indigo-950 border-blue-700/60 text-white';
    }
  };

  const getButtonClasses = () => {
    switch (ad.bgGradient) {
      case 'purple':
        return 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-900/40';
      case 'emerald':
        return 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-emerald-950/40';
      case 'amber':
        return 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-amber-950/40';
      case 'rose':
        return 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-900/40';
      case 'dark':
      case 'slate':
        return 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40';
      case 'blue':
      default:
        return 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-900/40';
    }
  };

  // 1. CUSTOM RAW HTML / SCRIPT AD TAG
  if ((ad.adType === 'custom_html' || ad.adType === 'script') && (ad.htmlContent || ad.scriptCode)) {
    return (
      <div className={`my-3 mx-auto text-center w-full overflow-hidden ${className}`}>
        {showLabel && (
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center justify-center gap-1">
            <Code className="w-2.5 h-2.5 text-blue-500" />
            <span>Sponsor • {ad.sponsorName || 'Custom Partner Script'}</span>
            <Info className="w-2.5 h-2.5" />
          </div>
        )}
        <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-2 shadow-xs">
          <CustomHtmlScriptContainer
            htmlContent={ad.htmlContent}
            scriptCode={ad.scriptCode}
            onClick={handleClick}
          />
        </div>
      </div>
    );
  }

  // 2. PURE IMAGE BANNER AD + AFFILIATE LINK
  if (ad.adType === 'image' && ad.imageUrl) {
    return (
      <div className={`my-3 mx-auto text-center w-full overflow-hidden ${className}`}>
        {showLabel && (
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center justify-center gap-1">
            <span>Sponsored Banner • {ad.sponsorName || 'Direct Partner'}</span>
            <Info className="w-2.5 h-2.5" />
          </div>
        )}
        <a
          href={ad.targetUrl || '#'}
          target="_blank"
          rel="sponsored noopener noreferrer"
          onClick={handleClick}
          className="block rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:opacity-95 transition-opacity group"
        >
          <img
            src={ad.imageUrl}
            alt={ad.title || 'Advertisement'}
            className="w-full h-auto object-cover max-h-[160px] rounded-2xl mx-auto"
          />
        </a>
      </div>
    );
  }

  // 3. SIDEBAR AD CARD STYLE
  if (slotType === 'sidebar') {
    return (
      <div className={`text-center w-full overflow-hidden ${className}`}>
        {showLabel && (
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center justify-between px-1">
            <span className="flex items-center gap-1">
              <Tag className="w-2.5 h-2.5 text-blue-500" />
              <span>Sponsored Offer</span>
            </span>
            <span className="font-mono text-[9px] opacity-75">{ad.sponsorName || 'Partner'}</span>
          </div>
        )}

        <a
          href={ad.targetUrl || '#'}
          target="_blank"
          rel="sponsored noopener noreferrer"
          onClick={handleClick}
          className={`block p-5 rounded-2xl bg-gradient-to-br border shadow-md hover:shadow-xl transition-all duration-200 group text-left relative overflow-hidden ${getGradientClasses()}`}
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

          {/* Badge & Sponsor Header */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 backdrop-blur-sm border border-white/20 text-white flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {ad.badgeText || 'Featured Sponsor'}
            </span>
            <span className="text-[10px] opacity-80 flex items-center gap-1 group-hover:underline">
              Visit Partner <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-sm text-white mb-2 leading-snug group-hover:text-blue-200 transition-colors">
            {ad.title}
          </h3>

          {/* Description */}
          {ad.description && (
            <p className="text-xs text-slate-200/90 leading-relaxed mb-4">
              {ad.description}
            </p>
          )}

          {/* CTA Button */}
          <div className="pt-1">
            <div
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition-transform group-hover:scale-[1.02] active:scale-95 ${getButtonClasses()}`}
            >
              <span>{ad.ctaText || 'Learn More'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </a>
      </div>
    );
  }

  // 4. LEADERBOARD & INLINE BANNER STYLE (Horizontal Responsive)
  return (
    <div className={`my-3 mx-auto text-center w-full overflow-hidden ${className}`}>
      {showLabel && (
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center justify-between px-2 max-w-4xl mx-auto">
          <span className="flex items-center gap-1">
            <Tag className="w-2.5 h-2.5 text-blue-500" />
            <span>Sponsored Recommendation</span>
          </span>
          <span className="font-mono text-[9px] opacity-75">{ad.sponsorName || 'Direct Sponsor'}</span>
        </div>
      )}

      <a
        href={ad.targetUrl || '#'}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={handleClick}
        className={`max-w-4xl mx-auto block p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r border shadow-md hover:shadow-lg transition-all duration-200 group text-left relative overflow-hidden ${getGradientClasses()}`}
      >
        {/* Glow Accent */}
        <div className="absolute right-0 top-0 w-48 h-full bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          
          <div className="space-y-1 flex-1 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-white/20 backdrop-blur-sm border border-white/20 text-white flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                {ad.badgeText || 'Special Offer'}
              </span>
              <span className="font-extrabold text-xs text-white group-hover:text-blue-200 transition-colors">
                {ad.title}
              </span>
            </div>

            {ad.description && (
              <p className="text-[11px] sm:text-xs text-slate-200/85 line-clamp-2 sm:line-clamp-1 leading-relaxed">
                {ad.description}
              </p>
            )}
          </div>

          {/* Right Action Button */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <div
              className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md whitespace-nowrap group-hover:scale-105 transition-transform ${getButtonClasses()}`}
            >
              <span>{ad.ctaText || 'Claim Deal'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

        </div>
      </a>
    </div>
  );
};
