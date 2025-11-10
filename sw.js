// Service Worker para VendaNinja
const CACHE_NAME = 'vendaninja-v2';
const CHART_JS_URL = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';

// List of files to cache
const filesToCache = [
    './',
    './index.html',
    './landing.html',
    './styles.css',
    './styles-landing.css',
    './script-db.js',
    './script.js',
    './script-landing.js',
    './script-charts-coupons.js',
    './manifest.json',
    './assets/shuriken.mp3',
    './assets/logo-ninja.png',
    './assets/logo-ninja.svg',
    './assets/icon-192.png',
    './data/sample-products.json',
    CHART_JS_URL
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cache aberto');
                // Cache files relative to the service worker location
                return Promise.all(
                    filesToCache.map(file => {
                        return cache.add(file).catch(err => {
                            console.log(`Service Worker: Erro ao cachear ${file}:`, err);
                            // Continue even if some files fail to cache
                            return null;
                        });
                    })
                );
            })
            .catch((err) => {
                console.log('Service Worker: Erro ao abrir cache:', err);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);
    const isChartJS = url.href.includes('chart.js') || url.href.includes('cdn.jsdelivr.net/npm/chart.js');
    const isSameOrigin = url.origin === self.location.origin;
    
    // Handle Chart.js CDN requests
    if (isChartJS) {
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    return fetch(event.request)
                        .then((response) => {
                            if (response && response.status === 200) {
                                const responseToCache = response.clone();
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                            }
                            return response;
                        })
                        .catch(() => {
                            // If offline and Chart.js is not cached, return error
                            return new Response('Chart.js não disponível offline. Conecte-se à internet na primeira carga.', {
                                status: 503,
                                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                            });
                        });
                })
        );
        return;
    }
    
    // Skip other cross-origin requests
    if (!isSameOrigin) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not a successful response
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache the response
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // If offline and requesting a page, try to return index.html or landing.html
                        if (event.request.destination === 'document') {
                            if (url.pathname.includes('landing')) {
                                return caches.match('./landing.html') || caches.match('./index.html');
                            }
                            return caches.match('./index.html') || caches.match('./landing.html');
                        }
                        // For other requests, try to return from cache or fail gracefully
                        return caches.match(event.request) || new Response('Offline', { 
                            status: 503,
                            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                        });
                    });
            })
    );
});
