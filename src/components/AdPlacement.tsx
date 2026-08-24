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

  // 3. HYBRID MODE (Both can co-exist: e.g., in sidebar or leaderboard, show rich partner sponsor or AdSense)
  if (adServingMode === 'hybrid') {
    // In hybrid mode, if there is a customized sponsor ad for sidebar or banner, we can prioritize custom sponsor or alternate
    // For sidebar & inline banner, custom sponsor banner gives top conversion rate; AdSense fills leaderboard
    if (matchedCustomAd && (slotType === 'sidebar' || slotType === 'banner')) {
      return (
        <div className="space-y-4">
          <CustomAdBanner
            ad={matchedCustomAd}
            slotType={slotType}
            className={className}
            showLabel={showLabel}
          />
        </div>
      );
    }

    // Default to Google AdSense for leaderboard slots in hybrid mode, or fallback to custom ad
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
