import React, { useState, useEffect, useRef } from 'react';
import { AdSlotType } from '../types';

export type AdDimensionPreset =
  | 'leaderboard' // 728x90 (Desktop wide banner)
  | 'banner' // 468x60 / Responsive inline banner
  | 'sidebar' // 300x250 or 300x600 (Desktop sticky sidebar)
  | 'rectangle' // 300x250 (Medium rectangle / MPU)
  | 'large_rectangle' // 336x280
  | 'billboard' // 970x250 (Full width header)
  | 'mobile_banner' // 320x50 or 320x100
  | 'responsive'; // 100% width with min-height buffer

interface PresetDimensions {
  minHeight: string;
  maxWidth?: string;
  aspectRatio?: string;
  defaultHeight?: string;
}

export const AD_DIMENSION_PRESETS: Record<AdDimensionPreset, PresetDimensions> = {
  leaderboard: {
    minHeight: '90px',
    maxWidth: '970px',
    aspectRatio: '728 / 90',
    defaultHeight: '90px',
  },
  banner: {
    minHeight: '80px',
    maxWidth: '800px',
    aspectRatio: '728 / 90',
    defaultHeight: '80px',
  },
  sidebar: {
    minHeight: '250px',
    maxWidth: '340px',
    aspectRatio: '300 / 250',
    defaultHeight: '280px',
  },
  rectangle: {
    minHeight: '250px',
    maxWidth: '340px',
    aspectRatio: '300 / 250',
    defaultHeight: '250px',
  },
  large_rectangle: {
    minHeight: '280px',
    maxWidth: '380px',
    aspectRatio: '336 / 280',
    defaultHeight: '280px',
  },
  billboard: {
    minHeight: '250px',
    maxWidth: '1024px',
    aspectRatio: '970 / 250',
    defaultHeight: '250px',
  },
  mobile_banner: {
    minHeight: '50px',
    maxWidth: '360px',
    aspectRatio: '320 / 50',
    defaultHeight: '50px',
  },
  responsive: {
    minHeight: '90px',
    maxWidth: '100%',
    defaultHeight: 'auto',
  },
};

/**
 * Maps AdSlotType (homepage_top, sidebar, etc.) to an appropriate dimension preset
 */
export function mapSlotToPreset(slotType?: AdSlotType): AdDimensionPreset {
  switch (slotType) {
    case 'homepage_top':
    case 'homepage_bottom':
      return 'leaderboard';
    case 'sidebar':
      return 'sidebar';
    case 'rectangle':
      return 'rectangle';
    case 'banner':
      return 'banner';
    case 'leaderboard':
    default:
      return 'leaderboard';
  }
}

export interface AdSpaceProps {
  /** Preset dimension size (leaderboard, sidebar, rectangle, banner, etc.) */
  preset?: AdDimensionPreset;
  /** Automatically map from standard AdSlotType (homepage_top, banner, etc.) */
  slotType?: AdSlotType;
  /** Explicit container width (e.g. '100%', '728px', 300) */
  width?: string | number;
  /** Explicit container height (e.g. '90px', 250) */
  height?: string | number;
  /** Minimum container height to reserve space and prevent Cumulative Layout Shift (CLS) */
  minHeight?: string | number;
  /** Maximum container width */
  maxWidth?: string | number;
  /** CSS aspect ratio (e.g. '728/90', '300/250') */
  aspectRatio?: string;
  /** Custom CSS classes */
  className?: string;
  /** Inline CSS styles */
  style?: React.CSSProperties;
  /** Whether to enable viewport lazy-loading via IntersectionObserver (default: true) */
  lazy?: boolean;
  /** Distance in pixels before entering viewport to begin rendering (default: '150px 0px') */
  rootMargin?: string;
  /**
   * Only render the ad after the document has completely finished loading
   * (window load event / document.readyState === 'complete').
   * Prevents ad scripts from competing with core app hydration and assets.
   * Default: true
   */
  waitForPageLoad?: boolean;
  /** Optional delay (in ms) after viewport intersection & page load before rendering (default: 50) */
  loadDelay?: number;
  /** Show subtle layout placeholder shimmer while waiting to render (default: true) */
  showPlaceholderShimmer?: boolean;
  /** Custom placeholder content while waiting for load/viewport entry */
  placeholder?: React.ReactNode;
  /** Reserve container height even if empty to prevent layout shifts (default: true) */
  reserveSpace?: boolean;
  /** Optional header label (e.g. "Advertisement") */
  showLabel?: boolean;
  /** Label text (default: 'Advertisement') */
  labelText?: string;
  /** Child ad components (e.g. MonetagBanner, AdSenseBanner, CustomAdBanner) */
  children?: React.ReactNode;
  /** Callback fired once the ad space has mounted its content */
  onAdRendered?: () => void;
}

export const AdSpace: React.FC<AdSpaceProps> = ({
  preset,
  slotType,
  width,
  height,
  minHeight,
  maxWidth,
  aspectRatio,
  className = '',
  style,
  lazy = true,
  rootMargin = '150px 0px',
  waitForPageLoad = true,
  loadDelay = 50,
  showPlaceholderShimmer = true,
  placeholder,
  reserveSpace = true,
  showLabel = false,
  labelText = 'Advertisement',
  children,
  onAdRendered,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPageLoaded, setIsPageLoaded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (!waitForPageLoad) return true;
    return document.readyState === 'complete';
  });

  const [isInViewport, setIsInViewport] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !lazy;
  });

  const [shouldRenderAd, setShouldRenderAd] = useState<boolean>(false);

  // 1. Resolve dimension presets and overrides
  const activePresetKey: AdDimensionPreset =
    preset || (slotType ? mapSlotToPreset(slotType) : 'responsive');
  const presetConfig = AD_DIMENSION_PRESETS[activePresetKey] || AD_DIMENSION_PRESETS.responsive;

  const resolvedWidth = width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : '100%';
  const resolvedMinHeight =
    minHeight !== undefined
      ? typeof minHeight === 'number'
        ? `${minHeight}px`
        : minHeight
      : reserveSpace
      ? presetConfig.minHeight
      : undefined;

  const resolvedMaxWidth =
    maxWidth !== undefined
      ? typeof maxWidth === 'number'
        ? `${maxWidth}px`
        : maxWidth
      : presetConfig.maxWidth;

  const resolvedHeight =
    height !== undefined
      ? typeof height === 'number'
        ? `${height}px`
        : height
      : presetConfig.defaultHeight;

  const resolvedAspectRatio = aspectRatio || presetConfig.aspectRatio;

  // 2. Page Load Listener: Wait until the whole page/app has fully loaded
  useEffect(() => {
    if (!waitForPageLoad || isPageLoaded) return;

    if (document.readyState === 'complete') {
      setIsPageLoaded(true);
      return;
    }

    const handleWindowLoad = () => {
      setIsPageLoaded(true);
    };

    window.addEventListener('load', handleWindowLoad);

    // Fallback timer: ensure ads don't wait indefinitely if 'load' already fired
    const fallbackTimer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 1200);

    return () => {
      window.removeEventListener('load', handleWindowLoad);
      clearTimeout(fallbackTimer);
    };
  }, [waitForPageLoad, isPageLoaded]);

  // 3. Viewport Intersection Observer (Lazy Loading)
  useEffect(() => {
    if (!lazy || isInViewport) return;

    if (!('IntersectionObserver' in window)) {
      setIsInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    const currentEl = containerRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      observer.disconnect();
    };
  }, [lazy, isInViewport, rootMargin]);

  // 4. Combined Mount Condition: Page Loaded AND In Viewport (with optional small delay)
  useEffect(() => {
    if (isPageLoaded && isInViewport && !shouldRenderAd) {
      if (loadDelay > 0) {
        const timer = setTimeout(() => {
          setShouldRenderAd(true);
          onAdRendered?.();
        }, loadDelay);
        return () => clearTimeout(timer);
      } else {
        setShouldRenderAd(true);
        onAdRendered?.();
      }
    }
  }, [isPageLoaded, isInViewport, shouldRenderAd, loadDelay, onAdRendered]);

  const containerStyles: React.CSSProperties = {
    width: resolvedWidth,
    minHeight: resolvedMinHeight,
    maxWidth: resolvedMaxWidth,
    aspectRatio: resolvedAspectRatio,
    ...style,
  };

  return (
    <div
      ref={containerRef}
      data-ad-space="true"
      data-preset={activePresetKey}
      data-loaded={shouldRenderAd ? 'true' : 'false'}
      style={containerStyles}
      className={`ad-space-container relative mx-auto transition-opacity duration-300 ${className}`}
    >
      {/* Optional Top Label */}
      {showLabel && (
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center justify-between px-1">
          <span>{labelText}</span>
          <span className="font-mono text-[9px] opacity-60">{activePresetKey}</span>
        </div>
      )}

      {/* RENDER AD CONTENT (Once page loaded & scrolled into viewport) */}
      {shouldRenderAd ? (
        <div className="w-full h-full animate-in fade-in duration-300">
          {children}
        </div>
      ) : (
        /* PLACEHOLDER / SKELETON (Prevents Cumulative Layout Shift) */
        <div
          aria-hidden="true"
          className="w-full h-full flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 p-3 text-center overflow-hidden"
          style={{ minHeight: resolvedMinHeight || '80px' }}
        >
          {placeholder ? (
            placeholder
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 opacity-60">
              {showPlaceholderShimmer && (
                <div className="w-16 h-1 bg-slate-300 dark:bg-slate-700 rounded-full animate-pulse mb-1" />
              )}
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {labelText}
              </span>
              <span className="text-[9px] text-slate-400/80 font-mono">
                Preserved Layout • Zero Shift
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
