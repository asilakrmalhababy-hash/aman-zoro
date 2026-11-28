const CACHE_NAME = 'zoro-security-pwa-v1';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/static/style.css',
  '/static/zoro_design7.css',
  '/static/logo.png',
  '/static/js/core.js',
  '/static/js/text_crypto.js',
  '/static/js/file_crypto.js',
  '/static/js/hashing_tool.js',
  '/static/js/security_tools.js',
  '/static/js/security_scanner.js',
  '/static/js/cyber_roadmap.js',
  '/static/js/guide_encyclopedia.js',
  '/static/js/platform_settings.js',
  '/static/js/admin_panel.js',
  '/static/js/zoro_design7.js',
  '/static/js/zoro_i18n_topbar.js',
  '/static/js/zoro_files_pro.js',
  '/static/js/zoro_pwa.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() =>
        new Response(
          JSON.stringify({ ok: false, offline: true, error: 'أنت الآن بدون إنترنت — الأدوات المحلية تعمل بالكامل.' }),
          { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        )
      )
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((cached) => {
          if (cached) return cached;
          if (req.mode === 'navigate') return caches.match('/', { ignoreSearch: true });
          return new Response('', { status: 504 });
        })
      )
  );
});
