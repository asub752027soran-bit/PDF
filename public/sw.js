/**
 * Service Worker - PDF Editfy (https://pdfeditfy.com)
 * Standard offline cache and crawler verification handler
 */

const CACHE_NAME = 'pdfeditfy-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through network fetch handler
});
