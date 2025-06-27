// Define um nome e versão para o cache
const CACHE_NAME = 'manga-reader-cache-v1';
const IMAGE_CACHE_NAME = 'manga-images-cache-v1';

// Lista de URLs de assets estáticos para fazer o precache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    // Adicione aqui os caminhos para os seus principais bundles de JS e CSS se souber os nomes
    // Ex: '/assets/index.js', '/assets/index.css'
    // Por enquanto, deixaremos o cache dinâmico cuidar disso.
];

// Evento de instalação: abre o cache e adiciona os assets estáticos
self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cache de assets estáticos aberto.');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(err => console.error("Falha ao fazer precache de assets estáticos:", err))
    );
    self.skipWaiting();
});

// Evento de ativação: limpa caches antigos
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Ativando...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
                        console.log('Service Worker: Limpando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Evento de fetch: intercepta as requisições de rede
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Estratégia: Cache First para imagens do proxy
    if (request.url.includes('/api/proxy/')) {
        event.respondWith(
            caches.open(IMAGE_CACHE_NAME).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    // Retorna do cache se encontrado
                    if (cachedResponse) {
                        // console.log('Service Worker: Imagem encontrada no cache:', request.url);
                        return cachedResponse;
                    }

                    // Se não, busca na rede, clona e armazena no cache
                    return fetch(request).then((networkResponse) => {
                        // console.log('Service Worker: Imagem buscada na rede e cacheada:', request.url);
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // Estratégia: Network First para assets da aplicação (HTML, JS, CSS)
    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                // Se a requisição for bem-sucedida, clona e guarda no cache principal
                const cacheCopy = caches.open(CACHE_NAME);
                cacheCopy.then(cache => cache.put(request, networkResponse.clone()));
                return networkResponse;
            })
            .catch(() => {
                // Se a rede falhar, tenta servir do cache
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Se não estiver em nenhum lugar, pode-se retornar uma página offline padrão
                    // return caches.match('/offline.html'); 
                });
            })
    );
});
