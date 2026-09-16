// Construct 3 Service Worker
const CACHE_NAME = "c3-coindrop-v1";
const CACHED_URLS = [
    "./",
    "./index.html",
    "./style.css",
    "./appmanifest.json",
    "./data.json",
    "./c3manifest.json",
    "./c3runtime.js",
    "./send_score_api.js",
    "./scripts/supportcheck.js",
    "./scripts/audio.js",
    "./scripts/particles.js",
    "./scripts/physics.js",
    "./scripts/entities.js",
    "./scripts/levels.js",
    "./scripts/ui.js",
    "./scripts/c3runtime.js",
    "./scripts/game.js",
    "./scripts/main.js"
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

