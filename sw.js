/* ============================================================
   MagaBeauty — Service Worker v2
   Estratégia: network-first para navegação,
               cache-first para assets estáticos.
   ============================================================ */

const CACHE_VERSION = 'magabeauty-v2';

/**
 * App Shell — todos os arquivos necessários para o app
 * funcionar offline. Dados do usuário (produtos, diário,
 * rotina) ficam no localStorage — não precisam de cache aqui.
 */
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './pages/produtos.html',
  './pages/diario.html',
  './pages/biblioteca.html',
  './pages/nutricao.html',
  './pages/perfil.html',
  './assets/logo.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
];

/* ── Install ─────────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(APP_SHELL);
    }).then(() => {
      // Ativa imediatamente sem esperar o fechamento das abas anteriores
      return self.skipWaiting();
    })
  );
});

/* ── Activate ────────────────────────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      // Remove versões antigas do cache
      return Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      );
    }).then(() => {
      // Assume controle imediato de todas as abas abertas
      return self.clients.claim();
    })
  );
});

/* ── Fetch ───────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignora requisições que não sejam GET
  if (request.method !== 'GET') return;

  // Ignora requisições de outras origens (ex: Google Fonts)
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    event.respondWith(fetchWithFallback(request));
    return;
  }

  // Requisições de navegação (HTML) → network-first
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNav(request));
    return;
  }

  // Assets estáticos (CSS, JS, imagens, SVG) → cache-first
  event.respondWith(cacheFirst(request));
});

/* ── Estratégias ─────────────────────────────────────────── */

/**
 * Network-first para navegação.
 * Tenta buscar na rede; se falhar, serve do cache.
 * Se não estiver em cache, serve o index.html como fallback.
 */
async function networkFirstNav(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback para o shell principal
    return caches.match('./index.html');
  }
}

/**
 * Cache-first para assets estáticos.
 * Serve do cache se disponível; caso contrário, busca na rede
 * e armazena em cache para a próxima vez.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Revalida em background (stale-while-revalidate)
    revalidate(request);
    return cached;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_) {
    return new Response('Recurso indisponível offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

/**
 * Tentativa de busca na rede para recursos externos
 * (ex: Google Fonts). Se falhar, retorna resposta vazia.
 */
async function fetchWithFallback(request) {
  try {
    return await fetch(request);
  } catch (_) {
    return new Response('', { status: 503 });
  }
}

/**
 * Atualiza o cache em background sem bloquear a resposta.
 */
function revalidate(request) {
  fetch(request).then(response => {
    if (response && response.ok) {
      caches.open(CACHE_VERSION).then(cache => cache.put(request, response));
    }
  }).catch(() => { /* silencioso */ });
}
