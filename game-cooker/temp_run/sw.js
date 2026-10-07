// Construct 3 Service Worker Cache
const CACHE_NAME = 'c3-ninja-river-runner-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './scripts/supportCheck.js',
    './scripts/offlineClient.js',
    './scripts/main.js',
    './scripts/c3runtime.js',
    './data.json',
    './images/bg_forest_canopy.png',
    './images/player_run_0.png',
    './images/player_run_1.png',
    './images/player_run_2.png',
    './images/player_run_3.png',
    './images/player_jump.png',
    './images/player_slide.png',
    './images/player_crash.png',
    './images/coin_sun_0.png',
    './images/coin_sun_1.png',
    './images/coin_sun_2.png',
    './images/coin_sun_3.png',
    './images/obstacle_hurdle.png',
    './images/obstacle_barrier.png',
    './images/obstacle_rock.png',
    './images/obstacle_truck.png',
    './images/obstacle_train_wagon.png',
    './images/obstacle_ramp.png',
    './images/obstacle_crates.png',
    './images/env_floating_log.png',
    './images/env_bridge_planks.png',
    './images/env_tree_redwood.png',
    './images/env_mushroom.png',
    './images/powerup_rocket.png',
    './images/powerup_2x.png',
    './images/powerup_magnet.png',
    './images/ui_pause.png',
    './images/ui_play.png',
    './images/ui_restart.png',
    './icons/icon-128.png',
    './icons/icon-256.png',
    './icons/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request))
    );
});

