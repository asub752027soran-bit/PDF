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
  /** Whether to enable viewport lazy-loading via IntersectionObserver (default: false for above-the-fold reliability) */
  lazy?: boolean;
  /** Distance in pixels before entering viewport to begin rendering (default: '150px 0px') */
  rootMargin?: string;
  /**
   * Only trigger heavy ad scripts after the document has completed its initial interactive phase.
   * Default: true
   */
  waitForPageLoad?: boolean;
  /** Optional delay (in ms) after viewport intersection & page load before rendering (default: 0) */
  loadDelay?: number;
  /** Show subtle layout placeholder shimmer while waiting to render (default: false) */
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
  lazy = false,
  rootMargin = '200px 0px',
  waitForPageLoad = false,
  loadDelay = 0,
  showPlaceholderShimmer = false,
  placeholder,
  reserveSpace = true,
  showLabel = false,
  labelText = 'Advertisement',
  children,
  onAdRendered,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState<boolean>(true);

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

  useEffect(() => {
    onAdRendered?.();
  }, [onAdRendered]);

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
      data-loaded="true"
      style={containerStyles}
      className={`ad-space-container relative mx-auto my-3 transition-opacity duration-300 ${className}`}
    >
      {/* Optional Top Label */}
      {showLabel && (
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center justify-between px-1">
          <span>{labelText}</span>
          <span className="font-mono text-[9px] opacity-60">{activePresetKey}</span>
        </div>
      )}

      {/* RENDER AD AGENCY CONTENT */}
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  );
};
