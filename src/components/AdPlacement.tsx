import React from 'react';
import { CustomAdItem, AdSlotType } from '../types';
import { AdSenseBanner } from './AdSenseBanner';
import { CustomAdBanner } from './CustomAdBanner';
import { AdSpace, AdDimensionPreset } from './AdSpace';
import { pickCustomAd } from '../utils/customAdTracker';

export interface AdPlacementProps {
  slotType: AdSlotType;
  toolId?: string;
  adsEnabled?: boolean;
  adServingMode?: 'hybrid' | 'adsense_only' | 'custom_only' | 'fallback';
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
  adServingMode = 'adsense_only',
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
    // 1. CUSTOM ADS ONLY
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

    // 2. HYBRID MODE (Custom Sponsor Ad on secondary in-content slots if available, AdSense on primary)
    if (adServingMode === 'hybrid') {
      const matchedCustomAd = pickCustomAd(customAds, slotType, toolId);
      if (matchedCustomAd && (slotType === 'banner' || slotType === 'rectangle')) {
        return (
          <CustomAdBanner
            ad={matchedCustomAd}
            slotType={slotType}
            className="my-0"
            showLabel={showLabel}
          />
        );
      }
    }

    // 3. GOOGLE ADSENSE PRIMARY
    return (
      <AdSenseBanner
        slotType={slotType as any}
        client={adsensePublisherId}
        slot={adsenseSlot}
        className="my-0"
        showLabel={showLabel}
      />
    );
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
