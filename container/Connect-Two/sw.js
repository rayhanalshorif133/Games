// Construct 3 Service Worker - Connect The Dots
const CACHE_NAME = "c3-connect-two-v1";
const CACHED_URLS = [
    "./",
    "./index.html",
    "./style.css",
    "./appmanifest.json",
    "./data.json",
    "./c3manifest.json",
    "./offline.json",
    "./c3runtime.js",
    "./send_score_api.js",
    "./scripts/supportcheck.js",
    "./scripts/audio.js",
    "./scripts/particles.js",
    "./scripts/physics.js",
    "./scripts/state.js",
    "./scripts/board.js",
    "./scripts/ui.js",
    "./scripts/input.js",
    "./scripts/main.js",
    "./scripts/register-sw.js",
    "./icons/icon-16.png",
    "./icons/icon-32.png",
    "./icons/icon-64.png",
    "./icons/icon-128.png",
    "./icons/icon-256.png",
    "./icons/icon-512.png",
    "./icons/loading-logo.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(CACHED_URLS)).then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});
