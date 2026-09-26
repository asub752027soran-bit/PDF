/**
 * Monetag Official Ad Network Engine & Utilities
 * Zone ID: 11893764 | Domain: 5gvci.com
 */

import { MonetagConfig } from '../types';

export const DEFAULT_MONETAG_CONFIG: MonetagConfig = {
  enabled: true,
  zoneId: '11893764',
  domain: '5gvci.com',
  directLinkUrl: '',
  autoOnClick: true,
  showInPagePush: true,
  showVignette: true,
  showBanners: true,
  bannerMode: 'monetag_primary',
  customBannerScript: '',
};

let lastTriggerTimestamp = 0;
const ONCLICK_COOLDOWN_MS = 45000; // 45 seconds cooldown between auto-pops for smooth UX

/**
 * Ensures the official Monetag ad script is loaded and executed safely
 */
export function ensureMonetagScript(config?: Partial<MonetagConfig>): void {
  if (typeof window === 'undefined') return;

  const zoneId = config?.zoneId || DEFAULT_MONETAG_CONFIG.zoneId;
  const domain = config?.domain || DEFAULT_MONETAG_CONFIG.domain;

  // Initialize Monetag format queue global if needed
  (window as any).zfgformats = (window as any).zfgformats || [];

  // Register the service worker for WebPush and Monetag sw tracking
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.debug('[Monetag] sw.js registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Monetag] Service worker registration note:', err);
      });
  }

  // Check if existing script tag is already attached
  const existingScript = document.querySelector(`script[data-zone="${zoneId}"]`) ||
                         document.querySelector(`script[src*="${domain}/act/files/tag.min.js"]`);

  if (!existingScript) {
    const script = document.createElement('script');
    script.src = `https://${domain}/act/files/tag.min.js?z=${zoneId}`;
    script.setAttribute('data-zone', zoneId);
    script.setAttribute('data-domain', domain);
    script.setAttribute('data-sdk', `show_${zoneId}`);
    script.setAttribute('data-auto', 'true');
    script.setAttribute('data-cfasync', 'false');
    script.async = true;

    // Append to body when ready, or fallback to head
    if (document.body) {
      document.body.appendChild(script);
    } else {
      document.head.appendChild(script);
    }
  }
}

/**
 * Triggers Monetag ad flow safely on user interaction (e.g. tool download, page action)
 */
export function triggerMonetagAction(
  actionType: 'download' | 'convert' | 'navigate' | 'click' = 'click',
  config?: MonetagConfig
): void {
  if (typeof window === 'undefined') return;
  if (config && config.enabled === false) return;

  const zoneId = config?.zoneId || DEFAULT_MONETAG_CONFIG.zoneId;
  const directLink = config?.directLinkUrl;
  const sdkFuncName = `show_${zoneId}`;

  // 1. If Monetag SDK window.show_XXXX function exists, trigger it!
  const sdkFunc = (window as any)[sdkFuncName] || (window as any).showAd;
  if (typeof sdkFunc === 'function') {
    try {
      sdkFunc({ type: 'inApp' }).catch?.(() => {});
    } catch (e) {
      // safe fallback
    }
  }

  // 2. Cooldown check for action-based popunder / direct offer
  const now = Date.now();
  if (now - lastTriggerTimestamp < ONCLICK_COOLDOWN_MS) {
    return;
  }

  // If user completed a high-value tool export (download/convert) and directLink or popupUrl is configured
  if (actionType === 'download' || actionType === 'convert') {
    lastTriggerTimestamp = now;

    // Trigger browser push permission if default
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission().catch(() => {});
      } catch (e) {}
    }

    if (directLink && directLink.startsWith('http')) {
      try {
        window.open(directLink, '_blank', 'noopener,noreferrer');
      } catch (e) {}
    }
  }
}

/**
 * Live test of Monetag Zone API endpoint
 */
export async function testMonetagZoneEndpoint(
  zoneId: string = '11893764',
  domain: string = '5gvci.com'
): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`https://${domain}/zone?pub=0&zone_id=${zoneId}&domain=${window.location.hostname}`);
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} from ${domain}` };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error fetching zone' };
  }
}
