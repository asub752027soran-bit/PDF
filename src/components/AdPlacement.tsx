import React from 'react';
import { CustomAdItem, AdSlotType, MonetagConfig } from '../types';
import { AdSenseBanner } from './AdSenseBanner';
import { CustomAdBanner } from './CustomAdBanner';
import { MonetagBanner } from './ads/MonetagBanner';
import { AdSpace, AdDimensionPreset } from './AdSpace';
import { pickCustomAd } from '../utils/customAdTracker';

export interface AdPlacementProps {
  slotType: AdSlotType;
  toolId?: string;
  adsEnabled?: boolean;
  adServingMode?: 'monetag_primary' | 'hybrid' | 'adsense_only' | 'custom_only' | 'fallback';
  monetagConfig?: MonetagConfig;
  customAds?: CustomAdItem[];
  adsensePublisherId?: string;
  adsenseSlot?: string;
  className?: string;
  showLabel?: boolean;
  // Customizable dimensions & lazy-loading options forwarded to AdSpace
  preset?: AdDimensionPreset;
  width?: string | number;
  height?: string | number;
  minHeight?: string | number;
  maxWidth?: string | number;
  aspectRatio?: string;
  lazy?: boolean;
  waitForPageLoad?: boolean;
  loadDelay?: number;
  reserveSpace?: boolean;
}

export const AdPlacement: React.FC<AdPlacementProps> = ({
  slotType,
  toolId,
  adsEnabled = true,
  adServingMode = 'hybrid',
  monetagConfig,
  customAds,
  adsensePublisherId = 'ca-pub-9806760868514523',
  adsenseSlot,
  className = '',
  showLabel = true,
  preset,
  width,
  height,
  minHeight,
  maxWidth,
  aspectRatio,
  lazy = false,
  waitForPageLoad = false,
  loadDelay = 0,
  reserveSpace = true,
}) => {
  if (!adsEnabled) return null;

  const renderBannerContent = () => {
    // 1. ADSENSE ONLY MODE
    if (adServingMode === 'adsense_only') {
      return (
        <AdSenseBanner
          slotType={slotType as any}
          client={adsensePublisherId}
          slot={adsenseSlot}
          className="my-0"
          showLabel={showLabel}
        />
      );
    }

    // 2. MONETAG PRIMARY MODE (Monetag across all slots)
    if (adServingMode === 'monetag_primary') {
      return (
        <MonetagBanner
          slotType={slotType}
          monetagConfig={monetagConfig}
          className="my-0"
          showLabel={showLabel}
        />
      );
    }

    // 3. CUSTOM ADS ONLY
    if (adServingMode === 'custom_only') {
      const matchedCustomAd = pickCustomAd(customAds, slotType, toolId);
      if (matchedCustomAd) {
        return (
          <CustomAdBanner
            ad={matchedCustomAd}
            slotType={slotType}
            className="my-0"
            showLabel={showLabel}
          />
        );
      }
      return null;
    }

    // 4. HYBRID AGENCY MODE (Both Google AdSense & Monetag Agencies actively served)
    // - Leaderboards & Sidebars serve Google AdSense Agency ads
    // - In-Content Banners & Homepage Bottom serve Monetag Agency Verified ads
    if (slotType === 'homepage_top' || slotType === 'leaderboard' || slotType === 'sidebar') {
      return (
        <AdSenseBanner
          slotType={slotType as any}
          client={adsensePublisherId}
          slot={adsenseSlot}
          className="my-0"
          showLabel={showLabel}
        />
      );
    } else {
      return (
        <MonetagBanner
          slotType={slotType}
          monetagConfig={monetagConfig}
          className="my-0"
          showLabel={showLabel}
        />
      );
    }
  };

  return (
    <AdSpace
      slotType={slotType}
      preset={preset}
      width={width}
      height={height}
      minHeight={minHeight}
      maxWidth={maxWidth}
      aspectRatio={aspectRatio}
      lazy={lazy}
      waitForPageLoad={waitForPageLoad}
      loadDelay={loadDelay}
      reserveSpace={reserveSpace}
      className={className}
    >
      {renderBannerContent()}
    </AdSpace>
  );
};
