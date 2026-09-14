/**
 * Construct 3 HTML5 Build - Service Worker
 * Enables offline caching and PWA app support.
 */
'use strict';

const CACHE_NAME = 'make7-c3-v1';
const CACHE_URLS = [
    './',
    './index.html',
    './style.css',
    './c3runtime.js',
    './data.json',
    './appmanifest.json',
    './media/audio.js',
    './scripts/main.js',
    './scripts/supportCheck.js',
    './images/wood_bg.jpg',
    './images/board_slot_dark.png',
    './images/tile_1.png',
    './images/tile_2.png',
    './images/tile_3.png',
    './images/tile_4.png',
    './images/tile_5.png',
    './images/tile_6.png',
    './images/tile_7_rainbow.png',
    './images/icon_rotate_arrows.png',
    './images/icon_trophy.png',
    './images/booster_trash.png',
    './images/booster_hammer.png',
    './images/booster_undo.png'
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(CACHE_URLS);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function (e) {
    e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (e) {
    e.respondWith(
        caches.match(e.request).then(function (response) {
            return response || fetch(e.request);
        })
    );
});

