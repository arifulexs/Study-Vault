// ═══════════════════════════════════════════════════
// StudyVault — Service Worker
// Relative paths for GitHub Pages subdirectory support
// ═══════════════════════════════════════════════════

const CACHE_NAME    = 'studyvault-v3';
const OFFLINE_URL   = './index.html';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ── INSTALL: pre-cache all static assets ──────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => {
        console.warn('[SW] Install cache failed:', err);
        // Still skip waiting even if some assets fail
        return self.skipWaiting();
      })
  );
});

// ── ACTIVATE: clean up old caches ────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH: smart caching strategy ─────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Never intercept — let browser handle natively:
  // blob: URLs (file export/download), Firebase, Google APIs, extensions
  if (
    url.startsWith('blob:')           ||
    url.startsWith('data:')           ||
    url.startsWith('chrome-extension') ||
    url.includes('firebasejs')        ||
    url.includes('googleapis.com')    ||
    url.includes('gstatic.com')       ||
    url.includes('firebaseapp.com')
  ) {
    return;
  }

  // For navigation requests (HTML pages) — network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache the fresh response
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // For static assets (CSS, JS, images) — cache first, fallback to network
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
      .catch(() => {
        // Fallback for document requests
        if (request.destination === 'document') {
          return caches.match(OFFLINE_URL);
        }
      })
  );
});

// ── PUSH NOTIFICATIONS (future use) ──────────────
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'StudyVault', {
      body: data.body || 'You have a new notification',
      icon: './icon-192.png',
      badge: './icon-192.png'
    })
  );
});