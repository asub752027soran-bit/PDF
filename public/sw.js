/**
 * Service Worker for Ads Verification & Web Push Notifications
 * PDF Editfy (https://pdfeditfy.com)
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Ad network script import for ad verification / push delivery
// Note: If your ad network provided a specific domain and zone ID,
// you can customize this or update it via Admin Dashboard -> Monetization -> Ad Verification.
try {
  // Common ad networks: Monetag, PropellerAds, Adsterra, Evadav, etc.
  // Example: importScripts('https://YOUR_AD_DOMAIN/sw.js?zoneid=YOUR_ZONE_ID');
} catch (e) {
  console.error('Failed to import ad verification script:', e);
}

self.addEventListener('fetch', (event) => {
  // Service worker pass-through fetch handler for verification crawlers
});
