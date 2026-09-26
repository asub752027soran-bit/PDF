self.options = {
    "domain": "5gvci.com",
    "zoneId": 11893764
};
self.lary = "";
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw');

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
