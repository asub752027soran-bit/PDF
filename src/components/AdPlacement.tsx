import React from 'react';
import { CustomAdItem, AdSlotType } from '../types';
import { AdSenseBanner, isValidAdSenseSlot } from './AdSenseBanner';
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
  reserveSpace = false,
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

  const matchedCustomAd = pickCustomAd(customAds, slotType, toolId);
  const hasManualAdSenseSlot = isValidAdSenseSlot(adsenseSlot);

  let bannerNode: React.ReactNode = null;

  if (adServingMode === 'ezoic_only') {
    bannerNode = (
      <EzoicBanner
        slotType={slotType}
        placeholderId={resolvedEzoicPlaceholderId}
        siteId={ezoicSiteId}
        cmpEnabled={ezoicCmpEnabled}
        className="my-0"
        showLabel={showLabel}
      />
    );
  } else if (adServingMode === 'custom_only') {
    if (matchedCustomAd) {
      bannerNode = (
        <CustomAdBanner
          ad={matchedCustomAd}
          slotType={slotType}
          className="my-0"
          showLabel={showLabel}
        />
      );
    }
  } else if (adServingMode === 'hybrid') {
    if (matchedCustomAd && (slotType === 'banner' || slotType === 'rectangle')) {
      bannerNode = (
        <CustomAdBanner
          ad={matchedCustomAd}
          slotType={slotType}
          className="my-0"
          showLabel={showLabel}
        />
      );
    } else if (ezoicEnabled) {
      bannerNode = (
        <EzoicBanner
          slotType={slotType}
          placeholderId={resolvedEzoicPlaceholderId}
          siteId={ezoicSiteId}
          cmpEnabled={ezoicCmpEnabled}
          className="my-0"
          showLabel={showLabel}
        />
      );
    } else if (hasManualAdSenseSlot) {
      bannerNode = (
        <AdSenseBanner
          slotType={slotType}
          client={adsensePublisherId}
          slot={adsenseSlot}
          className="my-0"
          showLabel={showLabel}
        />
      );
    }
  } else if (adServingMode === 'fallback' && ezoicEnabled) {
    bannerNode = (
      <EzoicBanner
        slotType={slotType}
        placeholderId={resolvedEzoicPlaceholderId}
        siteId={ezoicSiteId}
        cmpEnabled={ezoicCmpEnabled}
        className="my-0"
        showLabel={showLabel}
      />
    );
  } else if (hasManualAdSenseSlot) {
    bannerNode = (
      <AdSenseBanner
        slotType={slotType}
        client={adsensePublisherId}
        slot={adsenseSlot}
        className="my-0"
        showLabel={showLabel}
      />
    );
  }

  // Do not mount empty placeholder boxes when Google Auto Ads handles placements from <head>
  if (!bannerNode) {
    return null;
  }

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
      {bannerNode}
    </AdSpace>
  );
};
