// Funcionalidades offline usando IndexedDB
class OfflineManager {
    constructor() {
        this.dbName = 'VisitasApp';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    async init() {
        try {
            this.db = await this.openDB();
        } catch (error) {
            console.error('Erro ao inicializar IndexedDB:', error);
            // Fallback para localStorage
            this.useLocalStorage = true;
        }
    }

    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store para visitas
                if (!db.objectStoreNames.contains('visitas')) {
                    const visitasStore = db.createObjectStore('visitas', { keyPath: 'id', autoIncrement: true });
                    visitasStore.createIndex('cliente_nome', 'cliente_nome', { unique: false });
                    visitasStore.createIndex('data_hora', 'data_hora', { unique: false });
                    visitasStore.createIndex('sync_status', 'sync_status', { unique: false });
                }

                // Store para dados de sincronização
                if (!db.objectStoreNames.contains('sync_queue')) {
                    db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
                }

                // Store para configurações
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    async saveVisita(visita) {
        if (this.useLocalStorage) {
            return this.saveVisitaLocalStorage(visita);
        }

        try {
            const transaction = this.db.transaction(['visitas'], 'readwrite');
            const store = transaction.objectStore('visitas');
            
            visita.sync_status = 'pending';
            visita.created_at = new Date().toISOString();
            
            const result = await new Promise((resolve, reject) => {
                const request = store.add(visita);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            // Adicionar à fila de sincronização
            await this.addToSyncQueue(visita);
            
            return result;
        } catch (error) {
            console.error('Erro ao salvar visita no IndexedDB:', error);
            return this.saveVisitaLocalStorage(visita);
        }
    }

    saveVisitaLocalStorage(visita) {
        const visitas = JSON.parse(localStorage.getItem('visitas_offline') || '[]');
        visita.id = 'temp_' + Date.now();
        visita.sync_status = 'pending';
        visita.created_at = new Date().toISOString();
        
        visitas.push(visita);
        localStorage.setItem('visitas_offline', JSON.stringify(visitas));
        
        // Adicionar à fila de sincronização
        const syncQueue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
        syncQueue.push(visita);
        localStorage.setItem('sync_queue', JSON.stringify(syncQueue));
        
        return visita.id;
    }

    async getVisitas(filters = {}) {
        if (this.useLocalStorage) {
            return this.getVisitasLocalStorage(filters);
        }

        try {
            const transaction = this.db.transaction(['visitas'], 'readonly');
            const store = transaction.objectStore('visitas');
            
            const visitas = await new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            return this.filterVisitas(visitas, filters);
        } catch (error) {
            console.error('Erro ao buscar visitas no IndexedDB:', error);
            return this.getVisitasLocalStorage(filters);
        }
    }

    getVisitasLocalStorage(filters = {}) {
        const visitas = JSON.parse(localStorage.getItem('visitas_offline') || '[]');
        return this.filterVisitas(visitas, filters);
    }

    filterVisitas(visitas, filters) {
        let filtered = [...visitas];

        if (filters.data_inicio && filters.data_fim) {
            filtered = filtered.filter(v => {
                const dataVisita = v.data_hora.split(' ')[0];
                return dataVisita >= filters.data_inicio && dataVisita <= filters.data_fim;
            });
        }

        if (filters.situacao) {
            filtered = filtered.filter(v => v.situacao === filters.situacao);
        }

        if (filters.retornos) {
            filtered = filtered.filter(v => v.retorno_data_hora);
        }

        return filtered.sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));
    }

    async addToSyncQueue(data) {
        if (this.useLocalStorage) {
            const syncQueue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
            syncQueue.push(data);
            localStorage.setItem('sync_queue', JSON.stringify(syncQueue));
            return;
        }

        try {
            const transaction = this.db.transaction(['sync_queue'], 'readwrite');
            const store = transaction.objectStore('sync_queue');
            
            await new Promise((resolve, reject) => {
                const request = store.add({
                    data: data,
                    created_at: new Date().toISOString(),
                    type: 'visita'
                });
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Erro ao adicionar à fila de sincronização:', error);
        }
    }

    async getSyncQueue() {
        if (this.useLocalStorage) {
            return JSON.parse(localStorage.getItem('sync_queue') || '[]');
        }

        try {
            const transaction = this.db.transaction(['sync_queue'], 'readonly');
            const store = transaction.objectStore('sync_queue');
            
            const items = await new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            return items.map(item => item.data);
        } catch (error) {
            console.error('Erro ao buscar fila de sincronização:', error);
            return JSON.parse(localStorage.getItem('sync_queue') || '[]');
        }
    }

    async clearSyncQueue() {
        if (this.useLocalStorage) {
            localStorage.setItem('sync_queue', '[]');
            return;
        }

        try {
            const transaction = this.db.transaction(['sync_queue'], 'readwrite');
            const store = transaction.objectStore('sync_queue');
            
            await new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Erro ao limpar fila de sincronização:', error);
        }
    }

    async updateSyncStatus(visitaId, status) {
        if (this.useLocalStorage) {
            const visitas = JSON.parse(localStorage.getItem('visitas_offline') || '[]');
            const index = visitas.findIndex(v => v.id === visitaId);
            if (index !== -1) {
                visitas[index].sync_status = status;
                localStorage.setItem('visitas_offline', JSON.stringify(visitas));
            }
            return;
        }

        try {
            const transaction = this.db.transaction(['visitas'], 'readwrite');
            const store = transaction.objectStore('visitas');
            
            const visita = await new Promise((resolve, reject) => {
                const request = store.get(visitaId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            if (visita) {
                visita.sync_status = status;
                visita.synced_at = new Date().toISOString();
                
                await new Promise((resolve, reject) => {
                    const request = store.put(visita);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            }
        } catch (error) {
            console.error('Erro ao atualizar status de sincronização:', error);
        }
    }

    async getSetting(key) {
        if (this.useLocalStorage) {
            return localStorage.getItem(key);
        }

        try {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            
            const result = await new Promise((resolve, reject) => {
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            return result ? result.value : null;
        } catch (error) {
            console.error('Erro ao buscar configuração:', error);
            return localStorage.getItem(key);
        }
    }

    async setSetting(key, value) {
        if (this.useLocalStorage) {
            localStorage.setItem(key, value);
            return;
        }

        try {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            
            await new Promise((resolve, reject) => {
                const request = store.put({ key: key, value: value });
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
            localStorage.setItem(key, value);
        }
    }

    async getStats() {
        const visitas = await this.getVisitas();
        const hoje = new Date().toISOString().split('T')[0];
        
        const visitasHoje = visitas.filter(v => v.data_hora.startsWith(hoje));
        const retornos = visitas.filter(v => v.retorno_data_hora);
        const pendentes = await this.getSyncQueue();
        
        return {
            visitasHoje: visitasHoje.length,
            retornos: retornos.length,
            pendentes: pendentes.length,
            totalVisitas: visitas.length
        };
    }
}

// Instância global do gerenciador offline
const offlineManager = new OfflineManager();

// Funções de compatibilidade com o código existente
function getOfflineData(key) {
    if (key === 'visitas') {
        return offlineManager.getVisitas();
    } else if (key === 'pendingSync') {
        return offlineManager.getSyncQueue();
    } else {
        return JSON.parse(localStorage.getItem(key) || 'null');
    }
}

function saveOfflineData(key, data) {
    if (key === 'visitas') {
        // Não usado diretamente, visitas são salvas via saveVisita
        return;
    } else if (key === 'pendingSync') {
        // Gerenciado automaticamente pelo OfflineManager
        return;
    } else {
        localStorage.setItem(key, JSON.stringify(data));
    }
}

// Detectar mudanças de conectividade
window.addEventListener('online', async function() {
    console.log('Conexão restabelecida');
    
    // Verificar se há dados para sincronizar
    const pendentes = await offlineManager.getSyncQueue();
    if (pendentes.length > 0) {
        // Mostrar notificação de sincronização disponível
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Sincronização Disponível', {
                body: `${pendentes.length} visitas pendentes para sincronização`,
                icon: 'icons/icon-192x192.png'
            });
        }
    }
});

window.addEventListener('offline', function() {
    console.log('Conexão perdida - modo offline ativado');
});

// Exportar para uso global
window.offlineManager = offlineManager;

