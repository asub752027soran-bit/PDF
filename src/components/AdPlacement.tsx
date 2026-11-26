import React from 'react';
import { CustomAdItem, AdSlotType } from '../types';
import { AdSenseBanner } from './AdSenseBanner';
import { EzoicBanner } from './EzoicBanner';
import { CustomAdBanner } from './CustomAdBanner';
import { AdSpace, AdDimensionPreset } from './AdSpace';
import { pickCustomAd } from '../utils/customAdTracker';

export interface AdPlacementProps {
  slotType: AdSlotType;
  toolId?: string;
  adsEnabled?: boolean;
  adServingMode?: 'hybrid' | 'adsense_only' | 'ezoic_only' | 'custom_only' | 'fallback';
  customAds?: CustomAdItem[];
  adsensePublisherId?: string;
  adsenseSlot?: string;
  ezoicEnabled?: boolean;
  ezoicSiteId?: string;
  ezoicCmpEnabled?: boolean;
  ezoicPlaceholderId?: string;
  ezoicPlaceholders?: {
    leaderboard?: string;
    banner?: string;
    sidebar?: string;
    homepageBottom?: string;
    rectangle?: string;
  };
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
  ezoicEnabled = false,
  ezoicSiteId,
  ezoicCmpEnabled = true,
  ezoicPlaceholderId,
  ezoicPlaceholders,
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

  const resolvedEzoicPlaceholderId =
    ezoicPlaceholderId ||
    (slotType === 'homepage_bottom'
      ? ezoicPlaceholders?.homepageBottom
      : slotType === 'homepage_top' || slotType === 'leaderboard'
      ? ezoicPlaceholders?.leaderboard
      : slotType === 'banner'
      ? ezoicPlaceholders?.banner
      : slotType === 'sidebar'
      ? ezoicPlaceholders?.sidebar
      : slotType === 'rectangle'
      ? ezoicPlaceholders?.rectangle
      : undefined);

  const renderBannerContent = () => {
    // 1. EZOIC ADS SERVICE ONLY
    if (adServingMode === 'ezoic_only') {
      return (
        <EzoicBanner
          slotType={slotType}
          placeholderId={resolvedEzoicPlaceholderId}
          siteId={ezoicSiteId}
          cmpEnabled={ezoicCmpEnabled}
          className="my-0"
          showLabel={showLabel}
        />
      );
    }

    // 2. CUSTOM ADS ONLY
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

    // 3. HYBRID MODE (Custom Sponsor Ad on secondary in-content slots if available, Ezoic or AdSense on primary)
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
      if (ezoicEnabled) {
        return (
          <EzoicBanner
            slotType={slotType}
            placeholderId={resolvedEzoicPlaceholderId}
            siteId={ezoicSiteId}
            cmpEnabled={ezoicCmpEnabled}
            className="my-0"
            showLabel={showLabel}
          />
        );
      }
    }

    // 4. FALLBACK MODE WITH EZOIC ENABLED
    if (adServingMode === 'fallback' && ezoicEnabled) {
      return (
        <EzoicBanner
          slotType={slotType}
          placeholderId={resolvedEzoicPlaceholderId}
          siteId={ezoicSiteId}
          cmpEnabled={ezoicCmpEnabled}
          className="my-0"
          showLabel={showLabel}
        />
      );
    }

    // 5. GOOGLE ADSENSE PRIMARY
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
