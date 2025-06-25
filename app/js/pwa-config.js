// Configurações do PWA
const PWA_CONFIG = {
    // Configurações de cache
    CACHE_VERSION: 'v1.0.0',
    CACHE_STATIC_NAME: 'visitas-static-v1',
    CACHE_DYNAMIC_NAME: 'visitas-dynamic-v1',
    
    // URLs para cache estático
    STATIC_URLS: [
        './',
        './index.html',
        './js/app.js',
        './js/offline.js',
        './manifest.json',
        './icons/icon-192x192.png',
        './icons/icon-512x512.png'
    ],
    
    // Configurações de sincronização
    SYNC_CONFIG: {
        RETRY_INTERVAL: 30000, // 30 segundos
        MAX_RETRIES: 5,
        BATCH_SIZE: 10
    },
    
    // Configurações de notificação
    NOTIFICATION_CONFIG: {
        ICON: './icons/icon-192x192.png',
        BADGE: './icons/icon-192x192.png',
        VIBRATE: [100, 50, 100],
        REQUIRE_INTERACTION: false
    },
    
    // Configurações offline
    OFFLINE_CONFIG: {
        DB_NAME: 'VisitasApp',
        DB_VERSION: 1,
        STORES: {
            VISITAS: 'visitas',
            SYNC_QUEUE: 'sync_queue',
            SETTINGS: 'settings'
        }
    }
};

// Funções utilitárias para PWA
class PWAUtils {
    static async checkOnlineStatus() {
        if (!navigator.onLine) {
            return false;
        }
        
        try {
            const response = await fetch('../api/ping.php', {
                method: 'HEAD',
                cache: 'no-cache'
            });
            return response.ok;
        } catch {
            return false;
        }
    }
    
    static async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }
    
    static async registerBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            const registration = await navigator.serviceWorker.ready;
            return registration.sync.register('background-sync');
        }
        return false;
    }
    
    static showInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Mostrar botão de instalação personalizado
            const installButton = document.getElementById('install-button');
            if (installButton) {
                installButton.style.display = 'block';
                installButton.addEventListener('click', () => {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('PWA instalado');
                        }
                        deferredPrompt = null;
                        installButton.style.display = 'none';
                    });
                });
            }
        });
    }
    
    static async updateServiceWorker() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Nova versão disponível
                            if (confirm('Nova versão disponível. Atualizar agora?')) {
                                newWorker.postMessage({ action: 'skipWaiting' });
                                window.location.reload();
                            }
                        }
                    });
                });
            }
        }
    }
    
    static trackAppUsage() {
        // Rastrear uso do app para analytics
        const startTime = Date.now();
        
        window.addEventListener('beforeunload', () => {
            const sessionTime = Date.now() - startTime;
            localStorage.setItem('lastSessionTime', sessionTime.toString());
        });
        
        // Rastrear páginas visitadas
        const pageViews = JSON.parse(localStorage.getItem('pageViews') || '{}');
        const currentPage = window.location.pathname;
        pageViews[currentPage] = (pageViews[currentPage] || 0) + 1;
        localStorage.setItem('pageViews', JSON.stringify(pageViews));
    }
}

// Inicializar PWA
document.addEventListener('DOMContentLoaded', () => {
    PWAUtils.showInstallPrompt();
    PWAUtils.updateServiceWorker();
    PWAUtils.trackAppUsage();
    PWAUtils.requestNotificationPermission();
});

// Exportar configurações
window.PWA_CONFIG = PWA_CONFIG;
window.PWAUtils = PWAUtils;

