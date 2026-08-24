import { CustomAdItem, AdSlotType } from '../types';

export const DEFAULT_CUSTOM_ADS: CustomAdItem[] = [
  {
    id: 'ad-pdf-pro-suite',
    title: 'PDF Master Desktop Pro – Lifetime License',
    description: 'Edit, sign & convert unlimited documents offline with 100% privacy & lightning speed.',
    sponsorName: 'PDF Master Software',
    targetUrl: 'https://pdfeditfy.com',
    adType: 'card',
    ctaText: 'Claim 60% Off',
    badgeText: 'Featured Partner',
    slots: ['leaderboard', 'banner', 'sidebar', 'homepage_top', 'homepage_bottom'],
    targetTools: ['all'],
    enabled: true,
    impressions: 1420,
    clicks: 68,
    bgGradient: 'blue',
    createdAt: '2026-08-01',
  },
  {
    id: 'ad-cloud-vault',
    title: 'Secure Cloud Vault – 25GB Free Document Storage',
    description: 'End-to-end encrypted backup for PDFs, Word files & contracts. Access anywhere.',
    sponsorName: 'VaultCloud Secure',
    targetUrl: 'https://pdfeditfy.com',
    adType: 'card',
    ctaText: 'Get 25GB Free',
    badgeText: 'Exclusive Deal',
    slots: ['sidebar', 'banner', 'homepage_bottom'],
    targetTools: ['all'],
    enabled: true,
    impressions: 980,
    clicks: 45,
    bgGradient: 'emerald',
    createdAt: '2026-08-10',
  },
  {
    id: 'ad-esign-fast',
    title: 'Instant eSign & Document Flow for Teams',
    description: 'Legally binding digital signatures, audit logs, and automatic PDF certificate seals.',
    sponsorName: 'SignFlow Global',
    targetUrl: 'https://pdfeditfy.com',
    adType: 'card',
    ctaText: 'Try eSign Free',
    badgeText: 'Verified Partner',
    slots: ['leaderboard', 'sidebar', 'homepage_top'],
    targetTools: ['edit-pdf', 'lock-pdf', 'unlock-pdf', 'watermark-pdf'],
    enabled: true,
    impressions: 740,
    clicks: 39,
    bgGradient: 'purple',
    createdAt: '2026-08-15',
  },
];

/**
 * Tracks an ad impression in persistent local storage
 */
export function recordAdImpression(adId: string): void {
  try {
    const raw = localStorage.getItem('pdfeditfy_ad_stats') || '{}';
    const stats: Record<string, { impressions: number; clicks: number }> = JSON.parse(raw);
    if (!stats[adId]) {
      stats[adId] = { impressions: 0, clicks: 0 };
    }
    stats[adId].impressions += 1;
    localStorage.setItem('pdfeditfy_ad_stats', JSON.stringify(stats));
  } catch (e) {
    console.debug('Failed to record ad impression:', e);
  }
}

/**
 * Tracks an ad click in persistent local storage
 */
export function recordAdClick(adId: string): void {
  try {
    const raw = localStorage.getItem('pdfeditfy_ad_stats') || '{}';
    const stats: Record<string, { impressions: number; clicks: number }> = JSON.parse(raw);
    if (!stats[adId]) {
      stats[adId] = { impressions: 0, clicks: 0 };
    }
    stats[adId].clicks += 1;
    localStorage.setItem('pdfeditfy_ad_stats', JSON.stringify(stats));
  } catch (e) {
    console.debug('Failed to record ad click:', e);
  }
}

/**
 * Retrieves synced impression/click stats for an ad item
 */
export function getAdSyncedStats(ad: CustomAdItem): { impressions: number; clicks: number; ctr: string } {
  try {
    const raw = localStorage.getItem('pdfeditfy_ad_stats');
    if (raw) {
      const stats = JSON.parse(raw);
      if (stats[ad.id]) {
        const imp = (ad.impressions || 0) + (stats[ad.id].impressions || 0);
        const clk = (ad.clicks || 0) + (stats[ad.id].clicks || 0);
        const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(2) + '%' : '0.00%';
        return { impressions: imp, clicks: clk, ctr };
      }
    }
  } catch (e) {
    // fallback
  }
  const imp = ad.impressions || 0;
  const clk = ad.clicks || 0;
  const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(2) + '%' : '0.00%';
  return { impressions: imp, clicks: clk, ctr };
}

/**
 * Selects the best active custom ad matching the requested slot and current tool context
 */
export function pickCustomAd(
  ads: CustomAdItem[] | undefined,
  slot: AdSlotType,
  toolId?: string
): CustomAdItem | null {
  const adList = ads && ads.length > 0 ? ads : DEFAULT_CUSTOM_ADS;

  const eligible = adList.filter((ad) => {
    if (!ad.enabled) return false;
    // Slot check
    if (!ad.slots || !ad.slots.includes(slot)) return false;
    // Target tool check
    if (toolId && ad.targetTools && ad.targetTools.length > 0) {
      if (!ad.targetTools.includes('all') && !ad.targetTools.includes(toolId)) {
        return false;
      }
    }
    return true;
  });

  if (eligible.length === 0) return null;

  // Round-robin or randomized selection for natural rotation
  const randomIndex = Math.floor(Math.random() * eligible.length);
  return eligible[randomIndex];
}
