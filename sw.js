const CACHE_NAME = 'visitas-app-v14'; // Versão do cache atualizada para forçar reinstalação
const urlsToCache = [
    './login.html',
    './admin/index.html',
    './admin/js/admin.js',
    './app/index.html',
    './app/js/app.js',
    './app/js/offline.js',
    './app/js/pwa-config.js',
    './app/manifest.json',
    './app/icons/icon-192x192.png',
    './app/icons/icon-512x512.png',
    // URLs de CDN - é crucial que essas sejam acessíveis durante a primeira instalação
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Instalar Service Worker
self.addEventListener('install', function(event) {
    console.log('Service Worker: Instalando e cacheadando arquivos...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return Promise.all(urlsToCache.map(function(url) {
                    return cache.add(url).catch(function(error) {
                        console.warn('Service Worker: Falha ao cachear URL:', url, error);
                    });
                }));
            })
            .then(function() {
                console.log('Service Worker: Cache de instalação concluído.');
                self.skipWaiting(); // Ativa o novo Service Worker imediatamente
            })
            .catch(function(error) {
                console.error('Service Worker: Erro durante a instalação:', error);
            })
    );
});

// Ativar Service Worker
self.addEventListener('activate', function(event) {
    console.log('Service Worker: Ativando...');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
            .then(function() {
                console.log('Service Worker: Ativação concluída.');
                return clients.claim(); // Assume o controle de todas as páginas abertas
            })
    );
});

// Interceptar requisições
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    console.log('Service Worker: Servindo do cache:', event.request.url);
                    return response;
                }

                return fetch(event.request).then(function(response) {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        console.log('Service Worker: Resposta inválida da rede para:', event.request.url);
                        return response;
                    }

                    var responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                            console.log('Service Worker: Cacheadando:', event.request.url);
                        });

                    return response;
                }).catch(function(error) {
                    console.error('Service Worker: Falha na requisição de rede para:', event.request.url, error);
                    if (event.request.destination === 'document') {
                        console.log('Service Worker: Requisição de documento falhou, tentando fallback para login.html');
                        return caches.match('./login.html').then(fallbackResponse => {
                            if (fallbackResponse) {
                                console.log('Service Worker: Servindo login.html do cache como fallback.');
                                return fallbackResponse;
                            } else {
                                console.error('Service Worker: login.html não encontrado no cache para fallback.');
                                return new Response('<h1>Offline</h1><p>Não foi possível carregar a página e não há versão offline disponível.</p>', { headers: { 'Content-Type': 'text/html' } });
                            }
                        });
                    }
                    return new Response(null, { status: 503, statusText: 'Service Unavailable' });
                });
            })
    );
});

// Sincronização em background
self.addEventListener('sync', function(event) {
    if (event.tag === 'background-sync') {
        console.log('Service Worker: Evento de sincronização em background acionado.');
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    return new Promise(function(resolve, reject) {
        const request = indexedDB.open('VisitasDB', 1);
        
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['pendingSync'], 'readonly');
            const store = transaction.objectStore('pendingSync');
            
            store.getAll().onsuccess = function(event) {
                const pendingData = event.target.result;
                
                if (pendingData.length > 0) {
                    console.log('Service Worker: Dados pendentes para sincronização:', pendingData);
                    syncPendingData(pendingData)
                        .then(resolve)
                        .catch(reject);
                } else {
                    console.log('Service Worker: Nenhum dado pendente para sincronização.');
                    resolve();
                }
            };
        };
        
        request.onerror = function(error) {
            console.error('Service Worker: Erro ao abrir IndexedDB para sync:', error);
            reject(error);
        };
    });
}

function syncPendingData(pendingData) {
    const syncPromises = pendingData.map(data => {
        return fetch('./api/sincronizar.php', { // Caminho ajustado para a raiz
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                console.log('Service Worker: Dados sincronizados com sucesso:', data);
                return data; 
            } else {
                console.error('Service Worker: Erro ao sincronizar dados:', result.message, data);
                throw new Error('Falha na sincronização para ' + data.cliente_nome);
            }
        })
        .catch(error => {
            console.error('Service Worker: Erro de rede/API durante a sincronização:', error, data);
            throw error; 
        });
    });

    return Promise.allSettled(syncPromises).then(results => {
        const successfullySynced = results.filter(r => r.status === 'fulfilled').map(r => r.value);
        if (successfullySynced.length > 0) {
            console.log('Service Worker: Limpando dados sincronizados com sucesso do IndexedDB.');
            return clearSyncedData(successfullySynced);
        } else {
            console.log('Service Worker: Nenhum dado sincronizado com sucesso para limpar.');
            return Promise.resolve();
        }
    });
}

function clearSyncedData(syncedData) {
    return new Promise(function(resolve, reject) {
        const request = indexedDB.open('VisitasDB', 1);
        
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['pendingSync'], 'readwrite');
            const store = transaction.objectStore('pendingSync');
            
            syncedData.forEach(data => {
                if (data.id) {
                    store.delete(data.id);
                } else {
                    console.warn('Service Worker: Tentando limpar dado sem ID:', data);
                }
            });

            transaction.oncomplete = function() {
                console.log('Service Worker: Dados sincronizados removidos da fila pendingSync.');
                resolve();
            };
            transaction.onerror = function(error) {
                console.error('Service Worker: Erro ao limpar dados sincronizados:', error);
                reject(error);
            };
        };
        
        request.onerror = function(error) {
            console.error('Service Worker: Erro ao abrir IndexedDB para limpar:', error);
            reject(error);
        };
    });
}

// Notificações push
self.addEventListener('push', function(event) {
    const options = {
        body: event.data ? event.data.text() : 'Nova notificação',
        icon: './app/icons/icon-192x192.png', // Caminho ajustado
        badge: './app/icons/icon-192x192.png', // Caminho ajustado
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Abrir App',
                icon: './app/icons/icon-192x192.png' // Caminho ajustado
            },
            {
                action: 'close',
                title: 'Fechar',
                icon: './app/icons/icon-192x192.png' // Caminho ajustado
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Sistema de Visitas', options)
    );
});

// Clique em notificação
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.matchAll().then(function(clientList) {
                for (var i = 0; i < clientList.length; i++) {
                    var client = clientList[i];
                    if (client.url.endsWith('/app/') && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('./app/'); // Caminho ajustado
                }
            })
        );
    }
});

// Mensagens do cliente
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Atualização do Service Worker
self.addEventListener('message', function(event) {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});







