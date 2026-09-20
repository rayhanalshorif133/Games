const CACHE_NAME = 'jelly-slingshot-popper-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './appmanifest.json',
    './offline.json',
    './send_score_api.js',
    './scripts/audio.js',
    './scripts/physics.js',
    './scripts/entities.js',
    './scripts/levels.js',
    './scripts/game.js',
    './assets/asset_pack_banner.png',
    './assets/banner.png',
    './assets/ball_blue.png',
    './assets/ball_green.png',
    './assets/ball_red.png',
    './assets/ball_yellow.png',
    './assets/bolt.png',
    './assets/bolt_hires.png',
    './assets/header_bar.png',
    './assets/home_button.png',
    './assets/jelly_blue.png',
    './assets/jelly_blue_extracted.png',
    './assets/jelly_green.png',
    './assets/jelly_green_extracted.png',
    './assets/jelly_grey.png',
    './assets/jelly_red.png',
    './assets/jelly_red_extracted.png',
    './assets/jelly_tall_blue.png',
    './assets/jelly_tall_green.png',
    './assets/jelly_tall_grey.png',
    './assets/jelly_tall_red.png',
    './assets/jelly_tall_yellow.png',
    './assets/jelly_yellow.png',
    './assets/jelly_yellow_extracted.png',
    './assets/promo_hero_banner.jpg',
    './assets/pupil.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS).catch((err) => {
                console.warn('Pre-caching partial failure', err);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Only cache GET requests and non-websocket
    if (event.request.method !== 'GET' || event.request.url.startsWith('ws')) return;
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        }).catch(() => fetch(event.request))
    );
});

