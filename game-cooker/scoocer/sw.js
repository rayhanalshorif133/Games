const CACHE_NAME = 'soccer-2d-cache-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './scripts/peerjs.min.js',
    './scripts/main.js',
    './scripts/game.js',
    './scripts/physics.js',
    './scripts/network.js',
    './scripts/effects.js',
    './scripts/audio.js',
    './scripts/ui.js',
    './Assets/Football Field.png',
    './Assets/soccer-ball.png',
    './Assets/Game Bar-Red.png',
    './Assets/Game Bar-yellow.png',
    './Assets/Score Bar.png',
    './Assets/Menu BG.png',
    './Assets/Game Mode Blank.png',
    './Assets/Lobby Blank.png',
    './Assets/Create Room.png',
    './Assets/Join With code.png',
    './Assets/Show Room List.png',
    './Assets/Enter button-blue.png',
    './Assets/Ready Button.png',
    './Assets/Font/Fredoka-Bold.ttf',
    './Assets/Font/Fredoka-Regular.ttf'
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

