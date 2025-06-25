// Configurações da API
const API_BASE = '../api/';

// Estado da aplicação
let currentUser = null;
let visitas = [];
let retornos = [];
let isOnline = navigator.onLine;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupNetworkListeners();
    updateOnlineStatus();
});

// Verificar autenticação
function checkAuth() {
    const userData = sessionStorage.getItem('userData');
    if (userData) {
        currentUser = JSON.parse(userData);
        if (currentUser.perfil !== 'vendedor') {
            alert('Acesso negado. Esta área é exclusiva para vendedores.');
            window.location.href = '../login.html';
            return;
        }
        document.getElementById('user-info').textContent = currentUser.nome;
        document.getElementById('perfil-nome').textContent = currentUser.nome;
        document.getElementById('perfil-email').textContent = currentUser.email;
        loadDashboard();
    } else {
        window.location.href = '../login.html';
    }
}

// Configurar listeners de rede
function setupNetworkListeners() {
    window.addEventListener('online', function() {
        isOnline = true;
        updateOnlineStatus();
        syncData();
    });

    window.addEventListener('offline', function() {
        isOnline = false;
        updateOnlineStatus();
    });
}

// Atualizar status online/offline
function updateOnlineStatus() {
    const offlineIndicator = document.getElementById('offline-indicator');
    if (isOnline) {
        offlineIndicator.style.display = 'none';
    } else {
        offlineIndicator.style.display = 'block';
    }
}

// Logout
function logout() {
    if (confirm('Deseja realmente sair?')) {
        if (isOnline) {
            fetch(API_BASE + 'logout.php', {
                method: 'POST'
            })
            .then(() => {
                sessionStorage.removeItem('userData');
                window.location.href = '../login.html';
            });
        } else {
            sessionStorage.removeItem('userData');
            window.location.href = '../login.html';
        }
    }
}

// Mostrar seção
function showSection(section) {
    // Esconder todas as seções
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    
    // Remover classe active de todos os links
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    // Mostrar seção selecionada
    document.getElementById(section + '-section').style.display = 'block';
    
    // Adicionar classe active ao link
    event.target.closest('.nav-link').classList.add('active');
    
    // Atualizar título da página
    const titles = {
        'dashboard': 'Dashboard',
        'visitas': 'Minhas Visitas',
        'agenda': 'Agenda de Retornos',
        'perfil': 'Meu Perfil'
    };
    document.getElementById('page-title').textContent = titles[section];
    
    // Carregar dados da seção
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'visitas':
            loadVisitas();
            break;
        case 'agenda':
            loadAgenda();
            break;
        case 'perfil':
            loadPerfil();
            break;
    }
}

// Carregar dashboard
function loadDashboard() {
    loadStats();
    loadProximosRetornos();
    loadUltimasVisitas();
}

// Carregar estatísticas
function loadStats() {
    const hoje = new Date().toISOString().split('T')[0];
    
    if (isOnline) {
        // Carregar visitas de hoje
        fetch(API_BASE + 'visitas.php?data_inicio=' + hoje + '&data_fim=' + hoje)
        .then(response => response.json())
        .then(data => {
            document.getElementById('total-visitas-hoje').textContent = data.length;
        })
        .catch(() => {
            loadStatsOffline();
        });
        
        // Carregar retornos agendados
        fetch(API_BASE + 'visitas.php?retornos=1')
        .then(response => response.json())
        .then(data => {
            document.getElementById('total-retornos').textContent = data.length;
        })
        .catch(() => {
            loadStatsOffline();
        });
    } else {
        loadStatsOffline();
    }
}

// Carregar estatísticas offline
function loadStatsOffline() {
    const visitasOffline = getOfflineData('visitas') || [];
    const hoje = new Date().toISOString().split('T')[0];
    
    const visitasHoje = visitasOffline.filter(v => v.data_hora.startsWith(hoje));
    const retornos = visitasOffline.filter(v => v.retorno_data_hora);
    
    document.getElementById('total-visitas-hoje').textContent = visitasHoje.length;
    document.getElementById('total-retornos').textContent = retornos.length;
}

// Carregar próximos retornos
function loadProximosRetornos() {
    const container = document.getElementById('proximos-retornos');
    
    if (isOnline) {
        fetch(API_BASE + 'visitas.php?retornos=1')
        .then(response => response.json())
        .then(data => {
            displayRetornos(data.slice(0, 3), container);
        })
        .catch(() => {
            loadProximosRetornosOffline(container);
        });
    } else {
        loadProximosRetornosOffline(container);
    }
}

// Carregar próximos retornos offline
function loadProximosRetornosOffline(container) {
    const visitasOffline = getOfflineData('visitas') || [];
    const retornos = visitasOffline
        .filter(v => v.retorno_data_hora)
        .sort((a, b) => new Date(a.retorno_data_hora) - new Date(b.retorno_data_hora))
        .slice(0, 3);
    
    displayRetornos(retornos, container);
}

// Exibir retornos
function displayRetornos(retornos, container) {
    if (retornos.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Nenhum retorno agendado</p>';
        return;
    }
    
    container.innerHTML = '';
    retornos.forEach(retorno => {
        const div = document.createElement('div');
        div.className = 'card retorno-card mb-2';
        div.innerHTML = `
            <div class="card-body py-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${retorno.cliente_nome}</strong>
                        <br>
                        <small class="text-muted">${formatDateTime(retorno.retorno_data_hora)}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" onclick="criarVisitaRetorno('${retorno.cliente_nome}', '${retorno.retorno_data_hora}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// Carregar últimas visitas
function loadUltimasVisitas() {
    const container = document.getElementById('ultimas-visitas');
    
    if (isOnline) {
        fetch(API_BASE + 'visitas.php')
        .then(response => response.json())
        .then(data => {
            displayVisitas(data.slice(0, 5), container);
        })
        .catch(() => {
            loadUltimasVisitasOffline(container);
        });
    } else {
        loadUltimasVisitasOffline(container);
    }
}

// Carregar últimas visitas offline
function loadUltimasVisitasOffline(container) {
    const visitasOffline = getOfflineData('visitas') || [];
    const ultimasVisitas = visitasOffline
        .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora))
        .slice(0, 5);
    
    displayVisitas(ultimasVisitas, container);
}

// Exibir visitas
function displayVisitas(visitas, container) {
    if (visitas.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Nenhuma visita registrada</p>';
        return;
    }
    
    container.innerHTML = '';
    visitas.forEach(visita => {
        const div = document.createElement('div');
        div.className = 'card visita-card mb-2';
        div.innerHTML = `
            <div class="card-body py-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${visita.cliente_nome}</strong>
                        <br>
                        <small class="text-muted">${formatDateTime(visita.data_hora)}</small>
                    </div>
                    <span class="status-badge status-${visita.situacao}">
                        ${formatSituacao(visita.situacao)}
                    </span>
                </div>
                ${visita.observacoes ? `<p class="mb-0 mt-2 small">${visita.observacoes}</p>` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

// Carregar visitas
function loadVisitas() {
    const container = document.getElementById('lista-visitas-vendedor');
    const dataFiltro = document.getElementById('filtro-data').value;
    
    if (isOnline) {
        let url = API_BASE + 'visitas.php';
        if (dataFiltro) {
            url += `?data_inicio=${dataFiltro}&data_fim=${dataFiltro}`;
        }
        
        fetch(url)
        .then(response => response.json())
        .then(data => {
            visitas = data;
            displayVisitasCompletas(visitas, container);
        })
        .catch(() => {
            loadVisitasOffline(container, dataFiltro);
        });
    } else {
        loadVisitasOffline(container, dataFiltro);
    }
}

// Carregar visitas offline
function loadVisitasOffline(container, dataFiltro) {
    let visitasOffline = getOfflineData('visitas') || [];
    
    if (dataFiltro) {
        visitasOffline = visitasOffline.filter(v => v.data_hora.startsWith(dataFiltro));
    }
    
    visitas = visitasOffline.sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));
    displayVisitasCompletas(visitas, container);
}

// Exibir visitas completas
function displayVisitasCompletas(visitas, container) {
    if (visitas.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Nenhuma visita encontrada</p>';
        return;
    }
    
    container.innerHTML = '';
    visitas.forEach(visita => {
        const div = document.createElement('div');
        div.className = 'card visita-card mb-3';
        div.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="mb-0">${visita.cliente_nome}</h6>
                    <span class="status-badge status-${visita.situacao}">
                        ${formatSituacao(visita.situacao)}
                    </span>
                </div>
                <p class="mb-1"><i class="fas fa-clock me-2"></i>${formatDateTime(visita.data_hora)}</p>
                ${visita.retorno_data_hora ? `<p class="mb-1"><i class="fas fa-redo me-2"></i>Retorno: ${formatDateTime(visita.retorno_data_hora)}</p>` : ''}
                ${visita.observacoes ? `<p class="mb-0 mt-2">${visita.observacoes}</p>` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

// Filtrar visitas
function filtrarVisitas() {
    loadVisitas();
}

// Carregar agenda
function loadAgenda() {
    const container = document.getElementById('lista-agenda');
    const dataFiltro = document.getElementById('filtro-agenda').value;
    
    if (isOnline) {
        let url = API_BASE + 'visitas.php?retornos=1';
        if (dataFiltro) {
            url += `&data=${dataFiltro}`;
        }
        
        fetch(url)
        .then(response => response.json())
        .then(data => {
            retornos = data;
            displayAgenda(retornos, container);
        })
        .catch(() => {
            loadAgendaOffline(container, dataFiltro);
        });
    } else {
        loadAgendaOffline(container, dataFiltro);
    }
}

// Carregar agenda offline
function loadAgendaOffline(container, dataFiltro) {
    let visitasOffline = getOfflineData('visitas') || [];
    let retornosOffline = visitasOffline.filter(v => v.retorno_data_hora);
    
    if (dataFiltro) {
        retornosOffline = retornosOffline.filter(v => v.retorno_data_hora.startsWith(dataFiltro));
    }
    
    retornos = retornosOffline.sort((a, b) => new Date(a.retorno_data_hora) - new Date(b.retorno_data_hora));
    displayAgenda(retornos, container);
}

// Exibir agenda
function displayAgenda(retornos, container) {
    if (retornos.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Nenhum retorno agendado</p>';
        return;
    }
    
    container.innerHTML = '';
    retornos.forEach(retorno => {
        const div = document.createElement('div');
        div.className = 'card retorno-card mb-3';
        div.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="mb-0">${retorno.cliente_nome}</h6>
                    <button class="btn btn-sm btn-primary" onclick="criarVisitaRetorno('${retorno.cliente_nome}', '${retorno.retorno_data_hora}')">
                        <i class="fas fa-plus me-1"></i>Nova Visita
                    </button>
                </div>
                <p class="mb-1"><i class="fas fa-clock me-2"></i>${formatDateTime(retorno.retorno_data_hora)}</p>
                <p class="mb-1"><i class="fas fa-calendar me-2"></i>Visita original: ${formatDateTime(retorno.data_hora)}</p>
                ${retorno.observacoes ? `<p class="mb-0 mt-2">${retorno.observacoes}</p>` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

// Filtrar agenda
function filtrarAgenda() {
    loadAgenda();
}

// Carregar perfil
function loadPerfil() {
    if (isOnline) {
        // Carregar estatísticas do mês
        const inicioMes = new Date();
        inicioMes.setDate(1);
        const fimMes = new Date();
        
        const dataInicio = inicioMes.toISOString().split('T')[0];
        const dataFim = fimMes.toISOString().split('T')[0];
        
        fetch(API_BASE + `visitas.php?data_inicio=${dataInicio}&data_fim=${dataFim}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('total-visitas-mes').textContent = data.length;
            
            const clientesUnicos = [...new Set(data.map(v => v.cliente_nome))];
            document.getElementById('total-clientes').textContent = clientesUnicos.length;
        })
        .catch(() => {
            loadPerfilOffline();
        });
    } else {
        loadPerfilOffline();
    }
    
    // Atualizar status de sincronização
    updateSyncStatus();
}

// Carregar perfil offline
function loadPerfilOffline() {
    const visitasOffline = getOfflineData('visitas') || [];
    
    // Filtrar visitas do mês atual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    const visitasMes = visitasOffline.filter(v => new Date(v.data_hora) >= inicioMes);
    
    document.getElementById('total-visitas-mes').textContent = visitasMes.length;
    
    const clientesUnicos = [...new Set(visitasMes.map(v => v.cliente_nome))];
    document.getElementById('total-clientes').textContent = clientesUnicos.length;
}

// Atualizar status de sincronização
function updateSyncStatus() {
    const dadosPendentes = getOfflineData('pendingSync') || [];
    document.getElementById('dados-pendentes').textContent = dadosPendentes.length;
    
    const ultimaSync = localStorage.getItem('lastSync');
    if (ultimaSync) {
        const data = new Date(ultimaSync);
        document.getElementById('ultima-sync').textContent = data.toLocaleString('pt-BR');
    }
}

// Modal nova visita
function showModalVisita() {
    const modal = new bootstrap.Modal(document.getElementById('modalVisita'));
    const form = document.getElementById('formVisita');
    
    form.reset();
    
    // Definir data e hora atual
    const agora = new Date();
    document.getElementById('visita-data').value = agora.toISOString().split('T')[0];
    document.getElementById('visita-hora').value = agora.toTimeString().split(' ')[0].substring(0, 5);
    
    modal.show();
}

// Criar visita a partir de retorno agendado
function criarVisitaRetorno(clienteNome, retornoDataHora) {
    showModalVisita();
    document.getElementById('cliente-nome').value = clienteNome;
    
    if (retornoDataHora) {
        const data = new Date(retornoDataHora);
        document.getElementById('visita-data').value = data.toISOString().split('T')[0];
        document.getElementById('visita-hora').value = data.toTimeString().split(' ')[0].substring(0, 5);
    }
}

// Salvar visita
async function salvarVisita() {
    const clienteNome = document.getElementById('cliente-nome').value;
    const visitaData = document.getElementById('visita-data').value;
    const visitaHora = document.getElementById('visita-hora').value;
    const visitaSituacao = document.getElementById('visita-situacao').value;
    const visitaObservacoes = document.getElementById('visita-observacoes').value;
    const agendarRetorno = document.getElementById('agendar-retorno').checked;
    const retornoData = document.getElementById('retorno-data').value;
    const retornoHora = document.getElementById('retorno-hora').value;

    if (!clienteNome || !visitaData || !visitaHora || !visitaSituacao) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    const visita = {
        cliente_nome: clienteNome,
        data_hora: `${visitaData} ${visitaHora}:00`,
        situacao: visitaSituacao,
        observacoes: visitaObservacoes,
        retorno_data_hora: agendarRetorno ? `${retornoData} ${retornoHora}:00` : null,
        id_usuario: currentUser.id,
        sync_status: 'pending' // Adiciona status de sincronização
    };

    // Salvar localmente (IndexedDB)
    await saveOfflineData('visitas', visita);
    await saveOfflineData('pendingSync', visita);

    alert('Visita registrada com sucesso! Será sincronizada em breve.');
    bootstrap.Modal.getInstance(document.getElementById('modalVisita')).hide();
    loadDashboard();
    updateSyncStatus();

    // Tentar sincronizar imediatamente se online
    if (isOnline) {
        syncData();
    }
}

// Sincronizar dados
async function syncData() {
    if (!isOnline) {
        console.log('Offline. Sincronização adiada.');
        return;
    }

    const syncIndicator = document.getElementById('sync-indicator');
    syncIndicator.style.display = 'block';

    let pendingData = await getOfflineData('pendingSync') || [];
    console.log('Dados pendentes para sincronização:', pendingData);

    if (pendingData.length === 0) {
        console.log('Nenhum dado pendente para sincronização.');
        syncIndicator.style.display = 'none';
        localStorage.setItem('lastSync', new Date().toISOString());
        updateSyncStatus();
        return;
    }

    for (const data of pendingData) {
        try {
            const response = await fetch(API_BASE + 'sincronizar.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                console.log('Dados sincronizados com sucesso:', data);
                // Remover da fila de pendentes
                pendingData = pendingData.filter(item => item !== data);
                await saveOfflineData('pendingSync', pendingData, true); // Sobrescrever a lista
            } else {
                console.error('Erro ao sincronizar dados:', result.message, data);
            }
        } catch (error) {
            console.error('Erro de rede durante a sincronização:', error, data);
            // Manter na fila para tentar novamente mais tarde
        }
    }

    syncIndicator.style.display = 'none';
    localStorage.setItem('lastSync', new Date().toISOString());
    updateSyncStatus();
    loadDashboard(); // Recarregar dados após sincronização
    alert('Sincronização concluída!');
}

// Funções de utilidade para IndexedDB (do offline.js)
async function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('VisitasDB', 1);

        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('visitas')) {
                db.createObjectStore('visitas', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('pendingSync')) {
                db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject('Erro ao abrir o banco de dados: ' + event.target.errorCode);
        };
    });
}

async function saveOfflineData(storeName, data, overwrite = false) {
    const db = await openDatabase();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
        if (overwrite) {
            store.clear().onsuccess = () => {
                if (Array.isArray(data)) {
                    let count = 0;
                    if (data.length === 0) {
                        resolve();
                        return;
                    }
                    data.forEach(item => {
                        store.add(item).onsuccess = () => {
                            count++;
                            if (count === data.length) {
                                resolve();
                            }
                        };
                    });
                } else {
                    store.add(data).onsuccess = () => resolve();
                }
            };
        } else {
            store.add(data).onsuccess = () => resolve();
        }

        transaction.oncomplete = () => console.log(`${storeName} transaction complete.`);
        transaction.onerror = (event) => reject(`Erro na transação ${storeName}: ` + event.target.errorCode);
    });
}

async function getOfflineData(storeName) {
    const db = await openDatabase();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = function() {
            resolve(request.result);
        };

        request.onerror = function(event) {
            reject('Erro ao obter dados: ' + event.target.errorCode);
        };
    });
}

// Funções de formatação
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatSituacao(situacao) {
    switch (situacao) {
        case 'realizada': return 'Realizada';
        case 'nao_atendeu': return 'Não Atendeu';
        case 'remarcar': return 'Remarcar';
        case 'cancelada': return 'Cancelada';
        default: return situacao;
    }
}

// Expor funções globalmente para uso no HTML
window.logout = logout;
window.showSection = showSection;
window.showModalVisita = showModalVisita;
window.filtrarVisitas = filtrarVisitas;
window.filtrarAgenda = filtrarAgenda;
window.criarVisitaRetorno = criarVisitaRetorno;
window.salvarVisita = salvarVisita;
window.syncData = syncData;
window.updateSyncStatus = updateSyncStatus;
