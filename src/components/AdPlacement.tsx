import React from 'react';
import { CustomAdItem, AdSlotType } from '../types';
import { AdSenseBanner } from './AdSenseBanner';
import { CustomAdBanner } from './CustomAdBanner';
import { pickCustomAd } from '../utils/customAdTracker';

interface AdPlacementProps {
  slotType: AdSlotType;
  toolId?: string;
  adsEnabled?: boolean;
  adServingMode?: 'hybrid' | 'adsense_only' | 'custom_only' | 'fallback';
  customAds?: CustomAdItem[];
  adsensePublisherId?: string;
  adsenseSlot?: string;
  className?: string;
  showLabel?: boolean;
}

export const AdPlacement: React.FC<AdPlacementProps> = ({
  slotType,
  toolId,
  adsEnabled = true,
  adServingMode = 'hybrid',
  customAds,
  adsensePublisherId = 'ca-pub-9806760868514523',
  adsenseSlot,
  className = '',
  showLabel = true,
}) => {
  if (!adsEnabled) return null;

  // Custom Ad selection for this specific slot & tool context
  const matchedCustomAd = pickCustomAd(customAds, slotType, toolId);

  // 1. CUSTOM ONLY MODE
  if (adServingMode === 'custom_only') {
    if (matchedCustomAd) {
      return (
        <CustomAdBanner
          ad={matchedCustomAd}
          slotType={slotType}
          className={className}
          showLabel={showLabel}
        />
      );
    }
    return null;
  }

  // 2. ADSENSE ONLY MODE
  if (adServingMode === 'adsense_only') {
    return (
      <AdSenseBanner
        slotType={slotType as any}
        client={adsensePublisherId}
        slot={adsenseSlot}
        className={className}
        showLabel={showLabel}
      />
    );
  }

  // 3. HYBRID MODE (Both can co-exist: display verified sponsor banners across all active slots, with AdSense support)
  if (adServingMode === 'hybrid') {
    // If a verified sponsor or custom campaign matches this slot, show high-converting responsive ad unit
    if (matchedCustomAd) {
      return (
        <CustomAdBanner
          ad={matchedCustomAd}
          slotType={slotType}
          className={className}
          showLabel={showLabel}
        />
      );
    }

    // Default to Google AdSense when no custom ad is matched
    return (
      <AdSenseBanner
        slotType={slotType as any}
        client={adsensePublisherId}
        slot={adsenseSlot}
        className={className}
        showLabel={showLabel}
      />
    );
  }

  // 4. FALLBACK MODE (AdSense with Custom Ad ready)
  if (matchedCustomAd) {
    return (
      <CustomAdBanner
        ad={matchedCustomAd}
        slotType={slotType}
        className={className}
        showLabel={showLabel}
      />
    );
  }

  return (
    <AdSenseBanner
      slotType={slotType as any}
      client={adsensePublisherId}
      slot={adsenseSlot}
      className={className}
      showLabel={showLabel}
    />
  );
};
