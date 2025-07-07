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
    let userData = sessionStorage.getItem('userData');
    if (!userData) {
        userData = localStorage.getItem('userData');
    }

    if (userData) {
        currentUser = JSON.parse(userData);
        if (currentUser.perfil !== 'vendedor') {
            alert('Acesso negado. Esta área é exclusiva para vendedores.');
            logout(); // Força logout se o perfil não for vendedor
            return;
        }
        document.getElementById('user-info').textContent = currentUser.nome;
        document.getElementById('perfil-nome').textContent = currentUser.nome;
        document.getElementById('perfil-email').textContent = currentUser.email;
        loadDashboard();
    } else {
        // Se não há dados de usuário, redireciona para o login
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
    const indicator = document.getElementById('offline-indicator');
    if (indicator) { // Verifica se o elemento existe
        if (isOnline) {
            indicator.style.display = 'none';
        } else {
            indicator.style.display = 'block';
        }
    }
}

// Logout
function logout() {
    sessionStorage.removeItem('userData');
    localStorage.removeItem('userData');
    // Redireciona para a página de login e força um refresh para limpar o estado
    window.location.href = '../login.html?logout=true'; 
}

// Mostrar seção
function showSection(sectionId, event) {
    // Remove a classe 'active' de todos os links de navegação
    document.querySelectorAll('.bottom-nav .nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Adiciona a classe 'active' ao link clicado
    if (event && event.target) {
        event.target.closest('.nav-link').classList.add('active');
    }

    // Esconde todas as seções
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });

    // Mostra a seção desejada
    document.getElementById(sectionId + '-section').style.display = 'block';
    document.getElementById('page-title').textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

    // Carrega dados específicos da seção
    if (sectionId === 'dashboard') {
        loadDashboard();
    } else if (sectionId === 'visitas') {
        loadVisitas();
    } else if (sectionId === 'agenda') {
        loadAgenda();
    } else if (sectionId === 'perfil') {
        loadPerfil();
    }
}

// Carregar Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(API_BASE + 'visitas.php?action=dashboard&id_vendedor=' + currentUser.id);
        const data = await response.json();

        document.getElementById('total-visitas-hoje').textContent = data.totalVisitasHoje;
        document.getElementById('total-retornos').textContent = data.totalRetornosAgendados;

        // Próximos Retornos
        const proximosRetornosDiv = document.getElementById('proximos-retornos');
        proximosRetornosDiv.innerHTML = '';
        if (data.proximosRetornos.length > 0) {
            data.proximosRetornos.forEach(retorno => {
                proximosRetornosDiv.innerHTML += `
                    <div class="card mb-2 retorno-card">
                        <div class="card-body">
                            <h6 class="card-title mb-1">${retorno.cliente_nome}</h6>
                            <p class="card-text mb-1"><i class="fas fa-calendar-alt me-1"></i> ${formatDateTime(retorno.data_retorno)}</p>
                            <p class="card-text mb-0"><i class="fas fa-info-circle me-1"></i> ${retorno.observacoes || 'Sem observações'}</p>
                        </div>
                    </div>
                `;
            });
        } else {
            proximosRetornosDiv.innerHTML = '<p class="text-muted text-center">Nenhum retorno agendado.</p>';
        }

        // Últimas Visitas
        const ultimasVisitasDiv = document.getElementById('ultimas-visitas');
        ultimasVisitasDiv.innerHTML = '';
        if (data.ultimasVisitas.length > 0) {
            data.ultimasVisitas.forEach(visita => {
                ultimasVisitasDiv.innerHTML += `
                    <div class="card mb-2 visita-card">
                        <div class="card-body">
                            <h6 class="card-title mb-1">${visita.cliente_nome}</h6>
                            <p class="card-text mb-1"><i class="fas fa-calendar-check me-1"></i> ${formatDateTime(visita.data_visita)}</p>
                            <span class="status-badge status-${visita.situacao}">${formatSituacao(visita.situacao)}</span>
                        </div>
                    </div>
                `;
            });
        } else {
            ultimasVisitasDiv.innerHTML = '<p class="text-muted text-center">Nenhuma visita registrada.</p>';
        }

    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        // Em caso de erro de rede, tenta carregar do IndexedDB
        loadDashboardFromIndexedDB();
    }
}

// Carregar Visitas
async function loadVisitas() {
    try {
        const filtroData = document.getElementById('filtro-data').value;
        let url = API_BASE + 'visitas.php?action=list&id_vendedor=' + currentUser.id;
        if (filtroData) {
            url += '&data=' + filtroData;
        }
        const response = await fetch(url);
        const data = await response.json();

        visitas = data.visitas || [];
        displayVisitas();
    } catch (error) {
        console.error('Erro ao carregar visitas:', error);
        // Em caso de erro de rede, tenta carregar do IndexedDB
        loadVisitasFromIndexedDB();
    }
}

function displayVisitas() {
    const listaVisitasDiv = document.getElementById('lista-visitas-vendedor');
    listaVisitasDiv.innerHTML = '';
    if (visitas.length > 0) {
        visitas.forEach(visita => {
            listaVisitasDiv.innerHTML += `
                <div class="card mb-2 visita-card">
                    <div class="card-body">
                        <h6 class="card-title mb-1">${visita.cliente_nome}</h6>
                        <p class="card-text mb-1"><i class="fas fa-calendar-check me-1"></i> ${formatDateTime(visita.data_visita)}</p>
                        <span class="status-badge status-${visita.situacao}">${formatSituacao(visita.situacao)}</span>
                        <p class="card-text mb-0"><i class="fas fa-comment-dots me-1"></i> ${visita.observacoes || 'Sem observações'}</p>
                        ${visita.data_retorno ? `<p class="card-text mb-0 text-warning"><i class="fas fa-redo me-1"></i> Retorno: ${formatDateTime(visita.data_retorno)}</p>` : ''}
                    </div>
                </div>
            `;
        });
    } else {
        listaVisitasDiv.innerHTML = '<p class="text-muted text-center">Nenhuma visita encontrada.</p>';
    }
}

function filtrarVisitas() {
    loadVisitas();
}

// Carregar Agenda
async function loadAgenda() {
    try {
        const filtroData = document.getElementById('filtro-agenda').value;
        let url = API_BASE + 'visitas.php?action=retornos&id_vendedor=' + currentUser.id;
        if (filtroData) {
            url += '&data=' + filtroData;
        }
        const response = await fetch(url);
        const data = await response.json();

        retornos = data.retornos || [];
        displayAgenda();
    } catch (error) {
        console.error('Erro ao carregar agenda:', error);
        // Em caso de erro de rede, tenta carregar do IndexedDB
        loadAgendaFromIndexedDB();
    }
}

function displayAgenda() {
    const listaAgendaDiv = document.getElementById('lista-agenda');
    listaAgendaDiv.innerHTML = '';
    if (retornos.length > 0) {
        retornos.forEach(retorno => {
            listaAgendaDiv.innerHTML += `
                <div class="card mb-2 retorno-card">
                    <div class="card-body">
                        <h6 class="card-title mb-1">${retorno.cliente_nome}</h6>
                        <p class="card-text mb-1"><i class="fas fa-calendar-alt me-1"></i> ${formatDateTime(retorno.data_retorno)}</p>
                        <p class="card-text mb-0"><i class="fas fa-info-circle me-1"></i> ${retorno.observacoes || 'Sem observações'}</p>
                    </div>
                </div>
            `;
        });
    } else {
        listaAgendaDiv.innerHTML = '<p class="text-muted text-center">Nenhum retorno agendado.</p>';
    }
}

function filtrarAgenda() {
    loadAgenda();
}

// Carregar Perfil
async function loadPerfil() {
    try {
        // Dados do perfil já estão em currentUser
        document.getElementById('perfil-nome').textContent = currentUser.nome;
        document.getElementById('perfil-email').textContent = currentUser.email;

        const response = await fetch(API_BASE + 'visitas.php?action=stats&id_vendedor=' + currentUser.id);
        const data = await response.json();

        document.getElementById('total-visitas-mes').textContent = data.totalVisitasMes;
        document.getElementById('total-clientes').textContent = data.totalClientesAtendidos;

        // Status de sincronização
        updateSyncStatus();

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        // Em caso de erro de rede, tenta carregar do IndexedDB
        loadPerfilFromIndexedDB();
    }
}

// Salvar Visita (nova ou edição)
async function salvarVisita() {
    const clienteNome = document.getElementById('cliente-nome').value;
    const visitaData = document.getElementById('visita-data').value;
    const visitaHora = document.getElementById('visita-hora').value;
    const visitaSituacao = document.getElementById('visita-situacao').value;
    const visitaObservacoes = document.getElementById('visita-observacoes').value;
    const agendarRetorno = document.getElementById('agendar-retorno').checked;
    const retornoData = document.getElementById('retorno-data').value;
    const retornoHora = document.getElementById('retorno-hora').value;

    const visita = {
        id_vendedor: currentUser.id,
        cliente_nome: clienteNome,
        data_visita: `${visitaData} ${visitaHora}`,
        situacao: visitaSituacao,
        observacoes: visitaObservacoes,
        data_retorno: agendarRetorno ? `${retornoData} ${retornoHora}` : null
    };

    try {
        if (isOnline) {
            const response = await fetch(API_BASE + 'visitas.php?action=add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(visita)
            });
            const data = await response.json();
            if (data.success) {
                alert('Visita salva com sucesso!');
                // Limpa o formulário e recarrega os dados
                document.getElementById('formVisita').reset();
                bootstrap.Modal.getInstance(document.getElementById('modalVisita')).hide();
                loadDashboard();
                loadVisitas();
                loadAgenda();
            } else {
                alert('Erro ao salvar visita online: ' + data.message);
                // Se falhar online, tenta salvar offline
                saveVisitaOffline(visita);
            }
        } else {
            // Salva offline se não houver conexão
            saveVisitaOffline(visita);
        }
    } catch (error) {
        console.error('Erro de rede ao salvar visita:', error);
        // Salva offline em caso de erro de rede
        saveVisitaOffline(visita);
    }
}

// Salvar Visita Offline (IndexedDB)
async function saveVisitaOffline(visita) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction('pendingSync', 'readwrite');
        const store = transaction.objectStore('pendingSync');
        await store.add(visita);
        alert('Visita salva offline. Será sincronizada quando a conexão for restabelecida.');
        document.getElementById('formVisita').reset();
        bootstrap.Modal.getInstance(document.getElementById('modalVisita')).hide();
        updateSyncStatus();
    } catch (error) {
        console.error('Erro ao salvar visita no IndexedDB:', error);
        alert('Erro ao salvar visita offline. Tente novamente.');
    }
}

// Sincronizar dados pendentes
async function syncData() {
    if (!isOnline) {
        alert('Você está offline. A sincronização ocorrerá automaticamente quando a conexão for restabelecida.');
        return;
    }

    const syncIndicator = document.getElementById('sync-indicator');
    if (syncIndicator) syncIndicator.style.display = 'block';

    try {
        const db = await openDatabase();
        const transaction = db.transaction('pendingSync', 'readwrite');
        const store = transaction.objectStore('pendingSync');
        const pendingItems = await store.getAll();

        if (pendingItems.length === 0) {
            alert('Nenhum dado pendente para sincronizar.');
            if (syncIndicator) syncIndicator.style.display = 'none';
            updateSyncStatus();
            return;
        }

        for (const item of pendingItems) {
            try {
                const response = await fetch(API_BASE + 'visitas.php?action=add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(item)
                });
                const data = await response.json();
                if (data.success) {
                    // Remove o item do IndexedDB após a sincronização bem-sucedida
                    await store.delete(item.id || item.cliente_nome); // Assumindo que id ou cliente_nome é único
                } else {
                    console.error('Erro ao sincronizar item:', item, data.message);
                }
            } catch (itemError) {
                console.error('Erro de rede ao sincronizar item:', item, itemError);
            }
        }
        alert('Sincronização concluída!');
        loadDashboard();
        loadVisitas();
        loadAgenda();
        loadPerfil();
    } catch (error) {
        console.error('Erro durante a sincronização:', error);
        alert('Erro durante a sincronização. Verifique o console para detalhes.');
    } finally {
        if (syncIndicator) syncIndicator.style.display = 'none';
        updateSyncStatus();
    }
}

// Atualizar status de sincronização
async function updateSyncStatus() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction('pendingSync', 'readonly');
        const store = transaction.objectStore('pendingSync');
        const count = await store.count();
        document.getElementById('dados-pendentes').textContent = count;

        const lastSync = localStorage.getItem('lastSync');
        if (lastSync) {
            document.getElementById('ultima-sync').textContent = formatDateTime(lastSync);
        } else {
            document.getElementById('ultima-sync').textContent = 'Nunca';
        }
    } catch (error) {
        console.error('Erro ao atualizar status de sincronização:', error);
    }
}

// Funções para carregar dados do IndexedDB em modo offline
async function loadDashboardFromIndexedDB() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction('visitas', 'readonly');
        const store = transaction.objectStore('visitas');
        const allVisitas = await store.getAll();

        // Implementar lógica para calcular dashboard a partir de allVisitas
        // Por simplicidade, apenas mostra uma mensagem
        document.getElementById('proximos-retornos').innerHTML = '<p class="text-muted text-center">Dados offline (dashboard limitado).</p>';
        document.getElementById('ultimas-visitas').innerHTML = '<p class="text-muted text-center">Dados offline (dashboard limitado).</p>';
    } catch (error) {
        console.error('Erro ao carregar dashboard do IndexedDB:', error);
    }
}

async function loadVisitasFromIndexedDB() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction('visitas', 'readonly');
        const store = transaction.objectStore('visitas');
        visitas = await store.getAll();
        displayVisitas();
    } catch (error) {
        console.error('Erro ao carregar visitas do IndexedDB:', error);
    }
}

async function loadAgendaFromIndexedDB() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction('visitas', 'readonly');
        const store = transaction.objectStore('visitas');
        retornos = (await store.getAll()).filter(v => v.data_retorno !== null);
        displayAgenda();
    } catch (error) {
        console.error('Erro ao carregar agenda do IndexedDB:', error);
    }
}

async function loadPerfilFromIndexedDB() {
    try {
        // Dados do perfil já estão em currentUser (do localStorage)
        document.getElementById('perfil-nome').textContent = currentUser.nome;
        document.getElementById('perfil-email').textContent = currentUser.email;

        // Estatísticas offline (simplificado)
        document.getElementById('total-visitas-mes').textContent = 'N/A';
        document.getElementById('total-clientes').textContent = 'N/A';

        updateSyncStatus();
    } catch (error) {
        console.error('Erro ao carregar perfil do IndexedDB:', error);
    }
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
window.login = login; // Expondo a função de login


