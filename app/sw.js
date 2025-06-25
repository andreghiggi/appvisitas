const CACHE_NAME = 'visitas-app-v2';
const urlsToCache = [
    './',
    './index.html',
    '../login.html',
    './js/app.js',
    './js/offline.js',
    './js/pwa-config.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Instalar Service Worker
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Cache aberto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Ativar Service Worker
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptar requisições
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Cache hit - retornar resposta do cache
                if (response) {
                    return response;
                }

                return fetch(event.request).then(function(response) {
                    // Verificar se recebemos uma resposta válida
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clonar a resposta
                    var responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch(function() {
                    // Se a requisição falhar e for uma navegação, retornar página offline
                    if (event.request.destination === 'document') {
                        return caches.match('./index.html'); // Retorna a página principal do PWA
                    }
                });
            })
    );
});

// Sincronização em background
self.addEventListener('sync', function(event) {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    return new Promise(function(resolve, reject) {
        // Verificar se há dados para sincronizar
        const request = indexedDB.open('VisitasDB', 1); // Nome do DB corrigido
        
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['pendingSync'], 'readonly'); // Store name corrigido
            const store = transaction.objectStore('pendingSync');
            
            store.getAll().onsuccess = function(event) {
                const pendingData = event.target.result;
                
                if (pendingData.length > 0) {
                    // Tentar sincronizar dados
                    syncPendingData(pendingData)
                        .then(resolve)
                        .catch(reject);
                } else {
                    resolve();
                }
            };
        };
        
        request.onerror = function() {
            reject();
        };
    });
}

function syncPendingData(pendingData) {
    // A API de sincronização espera um array de objetos, não um objeto com uma chave 'visitas'
    // O app.js já envia o objeto completo, então aqui precisamos apenas iterar sobre os dados pendentes
    const syncPromises = pendingData.map(data => {
        return fetch('../api/sincronizar.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data) // Envia o objeto de visita diretamente
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                console.log('Dados sincronizados com sucesso:', data);
                return data; // Retorna os dados sincronizados para remoção da fila
            } else {
                console.error('Erro ao sincronizar dados:', result.message, data);
                throw new Error('Falha na sincronização para ' + data.cliente_nome);
            }
        });
    });

    return Promise.allSettled(syncPromises).then(results => {
        const successfullySynced = results.filter(r => r.status === 'fulfilled').map(r => r.value);
        // Limpar apenas os dados que foram sincronizados com sucesso
        return clearSyncedData(successfullySynced);
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
                // Remove o item do IndexedDB usando a chave primária (id)
                if (data.id) {
                    store.delete(data.id);
                }
            });

            transaction.oncomplete = function() {
                resolve();
            };
            transaction.onerror = function(event) {
                reject('Erro ao limpar dados sincronizados: ' + event.target.errorCode);
            };
        };
        
        request.onerror = function() {
            reject();
        };
    });
}

// Notificações push
self.addEventListener('push', function(event) {
    const options = {
        body: event.data ? event.data.text() : 'Nova notificação',
        icon: './icons/icon-192x192.png',
        badge: './icons/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Abrir App',
                icon: './icons/icon-192x192.png'
            },
            {
                action: 'close',
                title: 'Fechar',
                icon: './icons/icon-192x192.png'
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
        // Abrir ou focar na janela do app
        event.waitUntil(
            clients.matchAll().then(function(clientList) {
                for (var i = 0; i < clientList.length; i++) {
                    var client = clientList[i];
                    if (client.url.endsWith('/app/') && 'focus' in client) { // Corrigido para URL do PWA
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('./');
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


