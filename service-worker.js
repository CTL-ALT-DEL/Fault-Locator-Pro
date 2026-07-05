const CACHE_NAME = "fault-locator-pro-2-0-4";
const FILES = [
  "./",
  "index.html",
  "manifest.json",
  "src/main.js",
  "src/ui/styles.css",
  "src/ui/dom.js",
  "src/core/calculator.js",
  "src/data/wires.js",
  "src/data/reference.js",
  "src/features/diagnostics.js",
  "src/features/jobs.js",
  "src/features/timeline.js",
  "src/features/cableBuilder.js",
  "assets/icons/icon-180.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
