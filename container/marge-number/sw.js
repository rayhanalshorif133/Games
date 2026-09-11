'use strict';

const CACHE_NAME = 'c3-drop-merge-v1';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return fetch('offline.json')
        .then(res => res.json())
        .then(data => {
          return cache.addAll(data.fileList || []);
        })
        .catch(err => {
          console.warn('[SW] Offline cache preload warning:', err);
        });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) {
            return caches.delete(k);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});
