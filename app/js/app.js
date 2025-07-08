// Configurações da API
const API_BASE = '../api/';

// Estado da aplicação
let currentUser = null;
let visitas = [];
let retornos = [];
let isOnline = navigator.onLine;
let myModal;

// Funções de Autenticação
function checkAuth() {
    let userData = sessionStorage.getItem('userData') || localStorage.getItem('userData');

    if (userData) {
        currentUser = JSON.parse(userData);
        if (currentUser.perfil === 'vendedor') {
            // Se o usuário é um vendedor, inicializa o app
            initializeApp();
          } else {
            // Se for admin, redireciona para o painel de admin
            alert('Acesso incorreto. Redirecionando para o painel de administrador.');
            window.location.replace('../admin/index.html');
        }
    } else {
        // Se não há dados de usuário, redireciona para login
        window.location.replace('../login.html');
    }
}

// Inicialização do App (só é chamada se o usuário for um vendedor autenticado)
function initializeApp() {
    document.getElementById('user-info').textContent = currentUser.nome;
    document.getElementById('perfil-nome').textContent = currentUser.nome;
    document.getElementById('perfil-email').textContent = currentUser.email;

    setupEventListeners();
    updateOnlineStatus();
    showSection('dashboard'); // Mostra a seção inicial
}

// Configurar listeners de eventos
function setupEventListeners() {
    window.addEventListener(\'online\', () => {
        isOnline = true;
        updateOnlineStatus();
        syncData();
    });

    window.addEventListener(\'offline\', () => {
        isOnline = false;
        updateOnlineStatus();
    });

    // Modal
    const modalElement = document.getElementById('modalVisita');
    if (modalElement) {
        myModal = new bootstrap.Modal(modalElement);
    }

    // Formulário de visita
    const formVisita = document.getElementById('formVisita');
    if (formVisita) {
        formVisita.addEventListener('submit', (e) => {
            e.preventDefault();
            salvarVisita();
        });
    }

    // Checkbox de retorno
    const chkRetorno = document.getElementById('visita-retorno-necessario');
    if (chkRetorno) {
        chkRetorno.addEventListener('change', (e) => {
            document.getElementById('retorno-fields').style.display = e.target.checked ? 'block' : 'none';
        });
    }

    // Event listeners para os links de navegação
    document.querySelectorAll('.bottom-nav .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section'); // Usar data-section
            showSection(sectionId);
        });
    });

    // Event listeners para botões do cabeçalho
    const logoutBtn = document.querySelector('button[onclick="logout()"]');
    if (logoutBtn) {
        logoutBtn.removeAttribute('onclick');
        logoutBtn.addEventListener('click', logout);
    }

    const syncBtn = document.querySelector('button[onclick="syncData()"]');
    if (syncBtn) {
        syncBtn.removeAttribute('onclick');
        syncBtn.addEventListener('click', () => {
            if (typeof syncData === 'function') {
                syncData();
            } else {
                console.log('Função syncData não disponível');
            }
        });
    }

    // Event listener para o botão FAB
    const fabBtn = document.querySelector('.fab');
    if (fabBtn) {
        fabBtn.addEventListener('click', () => {
            if (typeof showModalVisita === 'function') {
                showModalVisita();
            } else {
                console.log('Função showModalVisita não disponível');
            }
        });
    }
}

// Atualizar status online/offline
function updateOnlineStatus() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
        indicator.style.display = isOnline ? 'none' : 'block';
    }
}

// Logout
function logout() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.replace('../login.html?logout=true');
}

// Mostrar seção
function showSection(sectionId) {
    document.querySelectorAll('.bottom-nav .nav-link').forEach(link => link.classList.remove('active'));
    const targetLink = document.querySelector(`.bottom-nav .nav-link[data-section="${sectionId}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }

    document.querySelectorAll('.section').forEach(section => section.style.display = 'none');
    document.getElementById(`${sectionId}-section`).style.display = 'block';
    document.getElementById('page-title').textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

    switch (sectionId) {
        case 'dashboard': loadDashboard(); break;
        case 'visitas': loadVisitas(); break;
        case 'agenda': loadAgenda(); break;
        case 'perfil': loadPerfil(); break;
    }
}

// Carregar Dashboard
async function loadDashboard() {
    document.getElementById('total-visitas-hoje').textContent = '0';
    document.getElementById('total-retornos').textContent = '0';
    document.getElementById('proximos-retornos').innerHTML = '<p class="text-muted text-center">Carregando...</p>';
    document.getElementById('ultimas-visitas').innerHTML = '<p class="text-muted text-center">Carregando...</p>';

    try {
        const response = await fetch(`${API_BASE}visitas.php?vendedor_id=${currentUser.id}`);
        const data = await response.json();

        if (data.success) {
            const hoje = new Date().toISOString().split('T')[0];
            const visitasHoje = data.visitas.filter(v => v.data_hora.startsWith(hoje));
            document.getElementById('total-visitas-hoje').textContent = visitasHoje.length;

            const retornosAgendados = data.visitas.filter(v => v.retorno_data_hora && new Date(v.retorno_data_hora) >= new Date());
            document.getElementById('total-retornos').textContent = retornosAgendados.length;

            // Renderizar próximos retornos
            if (retornosAgendados.length > 0) {
                document.getElementById('proximos-retornos').innerHTML = retornosAgendados.map(visita => `
                    <div class="card mb-2 retorno-card">
                        <div class="card-body">
                            <h6 class="card-title">${visita.cliente_nome}</h6>
                            <p class="card-text"><i class="far fa-calendar-alt me-2"></i>${formatDateTime(visita.retorno_data_hora)}</p>
                            <p class="card-text">Situação: <span class="status-badge status-${visita.situacao}">${formatSituacao(visita.situacao)}</span></p>
                        </div>
                    </div>
                `).join('');
            } else {
                document.getElementById('proximos-retornos').innerHTML = '<p class="text-muted text-center">Nenhum retorno agendado.</p>';
            }

            // Renderizar últimas visitas
            const ultimasVisitas = data.visitas.sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora)).slice(0, 5);
            if (ultimasVisitas.length > 0) {
                document.getElementById('ultimas-visitas').innerHTML = ultimasVisitas.map(visita => `
                    <div class="card mb-2 visita-card">
                        <div class="card-body">
                            <h6 class="card-title">${visita.cliente_nome}</h6>
                            <p class="card-text"><i class="far fa-calendar-alt me-2"></i>${formatDateTime(visita.data_hora)}</p>
                            <p class="card-text">Situação: <span class="status-badge status-${visita.situacao}">${formatSituacao(visita.situacao)}</span></p>
                        </div>
                    </div>
                `).join('');
            } else {
                document.getElementById('ultimas-visitas').innerHTML = '<p class="text-muted text-center">Nenhuma visita registrada.</p>';
            }

        } else {
            console.error('Erro ao carregar dashboard:', data.message);
            document.getElementById('proximos-retornos').innerHTML = `<p class="text-danger text-center">${data.message}</p>`;
            document.getElementById('ultimas-visitas').innerHTML = `<p class="text-danger text-center">${data.message}</p>`;
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        document.getElementById('proximos-retornos').innerHTML = '<p class="text-danger text-center">Erro ao carregar dashboard. Verifique sua conexão.</p>';
        document.getElementById('ultimas-visitas').innerHTML = '<p class="text-danger text-center">Erro ao carregar dashboard. Verifique sua conexão.</p>';
    }
}

// Carregar Visitas
async function loadVisitas() {
    const listaVisitas = document.getElementById('lista-visitas-vendedor');
    listaVisitas.innerHTML = '<p class="text-muted text-center">Carregando...</p>';

    const filtroData = document.getElementById('filtro-data').value;
    let url = `${API_BASE}visitas.php?vendedor_id=${currentUser.id}`;
    if (filtroData) {
        url += `&data_inicio=${filtroData}&data_fim=${filtroData}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            visitas = data.visitas;
            renderVisitas(visitas);
        } else {
            listaVisitas.innerHTML = `<p class="text-danger text-center">${data.message}</p>`;
        }
    } catch (error) {
        console.error('Erro ao carregar visitas:', error);
        listaVisitas.innerHTML = '<p class="text-danger text-center">Erro ao carregar visitas. Verifique sua conexão.</p>';
    }
}

function renderVisitas(visitasToRender) {
    const listaVisitas = document.getElementById('lista-visitas-vendedor');
    if (visitasToRender.length === 0) {
        listaVisitas.innerHTML = '<p class="text-muted text-center">Nenhuma visita encontrada para o filtro atual.</p>';
        return;
    }

    listaVisitas.innerHTML = visitasToRender.map(visita => `
        <div class="card mb-3 visita-card">
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <h6 class="card-title">${visita.cliente_nome}</h6>
                    <span class="status-badge status-${visita.situacao}">${formatSituacao(visita.situacao)}</span>
                </div>
                <p class="card-text"><i class="far fa-calendar-alt me-2"></i>${formatDateTime(visita.data_hora)}</p>
                <p class="card-text"><strong>Observações:</strong> ${visita.observacoes || 'N/A'}</p>
                ${visita.retorno_data_hora ? `<p class="card-text text-warning"><strong>Retorno:</strong> ${formatDateTime(visita.retorno_data_hora)}</p>` : ''}
                <div class="d-flex justify-content-end mt-2">
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="window.editarVisita(${visita.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.excluirVisita(${visita.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Carregar Agenda
async function loadAgenda() {
    const listaAgenda = document.getElementById('lista-agenda');
    listaAgenda.innerHTML = '<p class="text-muted text-center">Carregando...</p>';

    const filtroAgenda = document.getElementById('filtro-agenda').value;
    let url = `${API_BASE}visitas.php?vendedor_id=${currentUser.id}&retorno_necessario=true`;
    if (filtroAgenda) {
        url += `&data_retorno=${filtroAgenda}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            retornos = data.visitas.filter(v => v.retorno_data_hora);
            renderAgenda(retornos);
        } else {
            listaAgenda.innerHTML = `<p class="text-danger text-center">${data.message}</p>`;
        }
    } catch (error) {
        console.error('Erro ao carregar agenda:', error);
        listaAgenda.innerHTML = '<p class="text-danger text-center">Erro ao carregar agenda. Verifique sua conexão.</p>';
    }
}

function renderAgenda(retornosToRender) {
    const listaAgenda = document.getElementById('lista-agenda');
    if (retornosToRender.length === 0) {
        listaAgenda.innerHTML = '<p class="text-muted text-center">Nenhum retorno agendado para o filtro atual.</p>';
        return;
    }

    listaAgenda.innerHTML = retornosToRender.map(visita => `
        <div class="card mb-3 retorno-card">
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <h6 class="card-title">${visita.cliente_nome}</h6>
                    <span class="status-badge status-${visita.situacao}">${formatSituacao(visita.situacao)}</span>
                </div>
                <p class="card-text"><i class="far fa-calendar-alt me-2"></i>${formatDateTime(visita.retorno_data_hora)}</p>
                <p class="card-text"><strong>Observações:</strong> ${visita.observacoes || 'N/A'}</p>
                <div class="d-flex justify-content-end mt-2">
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="window.editarVisita(${visita.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.excluirVisita(${visita.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Carregar Perfil
async function loadPerfil() {
    document.getElementById('total-visitas-mes').textContent = '0';
    document.getElementById('total-clientes').textContent = '0';
    document.getElementById('dados-pendentes').textContent = '0';
    document.getElementById('ultima-sync').textContent = 'Nunca';

    try {
        const response = await fetch(`${API_BASE}visitas.php?vendedor_id=${currentUser.id}`);
        const data = await response.json();

        if (data.success) {
            const visitasMes = data.visitas.filter(v => {
                const dataVisita = new Date(v.data_hora);
                const hoje = new Date();
                return dataVisita.getMonth() === hoje.getMonth() && dataVisita.getFullYear() === hoje.getFullYear();
            });
            document.getElementById('total-visitas-mes').textContent = visitasMes.length;

            const clientesAtendidos = new Set(data.visitas.map(v => v.cliente_nome)).size;
            document.getElementById('total-clientes').textContent = clientesAtendidos;
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }

    // Carregar dados pendentes do IndexedDB
    const request = indexedDB.open('VisitasDB', 1);
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['pendingSync'], 'readonly');
        const store = transaction.objectStore('pendingSync');
        store.count().onsuccess = function(event) {
            document.getElementById('dados-pendentes').textContent = event.target.result;
        };
    };
    request.onerror = function(event) {
        console.error('Erro ao abrir IndexedDB para perfil:', event.target.errorCode);
    };

    // Última sincronização (simulado, pois não há um registro real)
    const lastSync = localStorage.getItem('lastSync');
    if (lastSync) {
        document.getElementById('ultima-sync').textContent = new Date(lastSync).toLocaleString();
    }
}

// Mostrar modal de visita
function showModalVisita() {
    // Limpar formulário
    document.getElementById('formVisita').reset();
    document.getElementById('visita-id').value = '';
    document.getElementById('retorno-fields').style.display = 'none';
    
    // Mostrar modal
    if (myModal) {
        myModal.show();
    }
}

// Salvar Visita
async function salvarVisita() {
    const clienteNome = document.getElementById('cliente-nome').value;
    const visitaData = document.getElementById('visita-data').value;
    const visitaHora = document.getElementById('visita-hora').value;
    const visitaSituacao = document.getElementById('visita-situacao').value;
    const visitaObservacoes = document.getElementById('visita-observacoes').value;
    const retornoNecessario = document.getElementById('visita-retorno-necessario').checked;
    const retornoData = document.getElementById('retorno-data').value;
    const retornoHora = document.getElementById('retorno-hora').value;

    if (!clienteNome || !visitaData || !visitaHora || !visitaSituacao) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    let dataToSave = {
        cliente_nome: clienteNome,
        data_hora: `${visitaData} ${visitaHora}:00`,
        situacao: visitaSituacao,
        observacoes: visitaObservacoes,
        id_vendedor: currentUser.id
    };

    if (retornoNecessario) {
        if (!retornoData || !retornoHora) {
            alert(\'Por favor, preencha a data e hora do retorno.\');
            return;
        }
        dataToSave.retorno_data_hora = `${retornoData} ${retornoHora}:00`;
    } else {
        dataToSave.retorno_data_hora = null;
    }

    const isEdit = document.getElementById(\'visita-id\').value !== \'\';
    if (isEdit) {
        dataToSave.id = document.getElementById(\'visita-id\').value;
    }

    if (isOnline) {
        try {
            const response = await fetch(API_BASE + \'visitas.php\', {
                method: isEdit ? \'PUT\' : \'POST\',
                headers: {
                    \'Content-Type\': \'application/json\'
                },
                body: JSON.stringify(dataToSave)
            });
            const result = await response.json();
            if (result.message) {
                alert(result.message);
            myModal.hide();
            loadVisitas();
            loadDashboard();
            loadAgenda();
            }
        } catch (error) {
            console.error(\'Erro ao salvar visita online:\', error);
            alert(\'Erro ao salvar visita online. Salvando offline...\');
            saveVisitaOffline(dataToSave, isEdit);
        }
    } else {
        saveVisitaOffline(dataToSave, isEdit);
    }
}

async function saveVisitaOffline(data, isEdit) {
    const db = await openDatabase();
    const transaction = db.transaction([\'pendingSync\'], \'readwrite\');
    const store = transaction.objectStore(\'pendingSync\');

    const record = {
        id: data.id || Date.now(), // Use existing ID or generate new one
        action: isEdit ? \'put\' : \'post\',
        data: data
    };

    store.put(record);

    transaction.oncomplete = () => {
        alert(\'Visita salva offline e será sincronizada quando a conexão for restabelecida.\');
        myModal.hide();
        loadVisitas();
        loadDashboard();
        loadAgenda();
        loadPerfil(); // Atualiza o contador de dados pendentes
    };

    transaction.onerror = (event) => {
        console.error(\'Erro ao salvar visita offline:\', event.target.error);
        alert(\'Erro ao salvar visita offline.\');
    };
}

// Editar visita
async function editarVisita(id) {
    if (isOnline) {
        try {
            const response = await fetch(`${API_BASE}visitas.php?id=${id}`);
            const result = await response.json();
            if (result.success && result.visita) {
                const visita = result.visita;
                document.getElementById(\'visita-id\').value = visita.id;
                document.getElementById(\'cliente-nome\').value = visita.cliente_nome;
                document.getElementById(\'visita-data\').value = visita.data_hora.split(\' \')[0];
                document.getElementById(\'visita-hora\').value = visita.data_hora.split(\' \')[1].substring(0, 5);
                document.getElementById(\'visita-situacao\').value = visita.situacao;
                document.getElementById(\'visita-observacoes\').value = visita.observacoes;

                const retornoNecessarioCheckbox = document.getElementById(\'visita-retorno-necessario\');
                const retornoFieldsDiv = document.getElementById(\'retorno-fields\');

                if (visita.retorno_data_hora) {
                    retornoNecessarioCheckbox.checked = true;
                    retornoFieldsDiv.style.display = \'block\';
                    document.getElementById(\'retorno-data\').value = visita.retorno_data_hora.split(\' \')[0];
                    document.getElementById(\'retorno-hora\').value = visita.retorno_data_hora.split(\' \')[1].substring(0, 5);
                } else {
                    retornoNecessarioCheckbox.checked = false;
                    retornoFieldsDiv.style.display = \'none\';
                    document.getElementById(\'retorno-data\').value = \'\';
                    document.getElementById(\'retorno-hora\').value = \'\';
                }
                myModal.show();
            } else {
                alert(\'Visita não encontrada ou erro ao carregar.\');
            }
        } catch (error) {
            console.error(\'Erro ao carregar visita para edição online:\', error);
            alert(\'Erro ao carregar visita para edição online. Tente novamente offline.\');
            // Tentar carregar do IndexedDB se offline
            const db = await openDatabase();
            const transaction = db.transaction([\'visitas\'], \'readonly\');
            const store = transaction.objectStore(\'visitas\');
            const request = store.get(id);
            request.onsuccess = function() {
                const visita = request.result;
                if (visita) {
                    document.getElementById(\'visita-id\').value = visita.id;
                    document.getElementById(\'cliente-nome\').value = visita.cliente_nome;
                    document.getElementById(\'visita-data\').value = visita.data_hora.split(\' \')[0];
                    document.getElementById(\'visita-hora\').value = visita.data_hora.split(\' \')[1].substring(0, 5);
                    document.getElementById(\'visita-situacao\').value = visita.situacao;
                    document.getElementById(\'visita-observacoes\').value = visita.observacoes;

                    const retornoNecessarioCheckbox = document.getElementById(\'visita-retorno-necessario\');
                    const retornoFieldsDiv = document.getElementById(\'retorno-fields\');

                    if (visita.retorno_data_hora) {
                        retornoNecessarioCheckbox.checked = true;
                        retornoFieldsDiv.style.display = \'block\';
                        document.getElementById(\'retorno-data\').value = visita.retorno_data_hora.split(\' \')[0];
                        document.getElementById(\'retorno-hora\').value = visita.retorno_data_hora.split(\' \')[1].substring(0, 5);
                    } else {
                        retornoNecessarioCheckbox.checked = false;
                        retornoFieldsDiv.style.display = \'none\';
                        document.getElementById(\'retorno-data\').value = \'\';
                        document.getElementById(\'retorno-hora\').value = \'\';
                    }
                    myModal.show();
                } else {
                    alert(\'Visita não encontrada no cache offline.\');
                }
            };
            request.onerror = function(event) {
                console.error(\'Erro ao carregar visita do IndexedDB:\', event.target.errorCode);
                alert(\'Erro ao carregar visita do cache offline.\');
            };
        }
    } else {
        // Se offline, tenta carregar do IndexedDB
        const db = await openDatabase();
        const transaction = db.transaction([\'visitas\'], \'readonly\');
        const store = transaction.objectStore(\'visitas\');
        const request = store.get(id);
        request.onsuccess = function() {
            const visita = request.result;
            if (visita) {
                document.getElementById(\'visita-id\').value = visita.id;
                document.getElementById(\'cliente-nome\').value = visita.cliente_nome;
                document.getElementById(\'visita-data\').value = visita.data_hora.split(\' \')[0];
                document.getElementById(\'visita-hora\').value = visita.data_hora.split(\' \')[1].substring(0, 5);
                document.getElementById(\'visita-situacao\').value = visita.situacao;
                document.getElementById(\'visita-observacoes\').value = visita.observacoes;

                const retornoNecessarioCheckbox = document.getElementById(\'visita-retorno-necessario\');
                const retornoFieldsDiv = document.getElementById(\'retorno-fields\');

                if (visita.retorno_data_hora) {
                    retornoNecessarioCheckbox.checked = true;
                    retornoFieldsDiv.style.display = \'block\';
                    document.getElementById(\'retorno-data\').value = visita.retorno_data_hora.split(\' \')[0];
                    document.getElementById(\'retorno-hora\').value = visita.retorno_data_hora.split(\' \')[1].substring(0, 5);
                } else {
                    retornoNecessarioCheckbox.checked = false;
                    retornoFieldsDiv.style.display = \'none\';
                    document.getElementById(\'retorno-data\').value = \'\';
                    document.getElementById(\'retorno-hora\').value = \'\';
                }
                myModal.show();
            } else {
                alert(\'Visita não encontrada no cache offline.\');
            }
        };
        request.onerror = function(event) {
            console.error(\'Erro ao carregar visita do IndexedDB:\', event.target.errorCode);
            alert(\'Erro ao carregar visita do cache offline.\');
        };
    }
}

// Excluir visita
async function excluirVisita(id) {
    if (confirm(\'Deseja realmente excluir esta visita?\')) {
        if (isOnline) {
            try {
                const response = await fetch(API_BASE + \'visitas.php\', {
                    method: \'DELETE\',
                    headers: {
                        \'Content-Type\': \'application/json\'
                    },
                    body: JSON.stringify({ id: id })
                });
                const result = await response.json();
                if (result.message) {
                    alert(result.message);
                    loadVisitas();
                    loadDashboard();
                    loadAgenda();
                }
            } catch (error) {
                console.error(\'Erro ao excluir visita online:\', error);
                alert(\'Erro ao excluir visita online. Excluindo offline...\');
                deleteVisitaOffline(id);
            }
        } else {
            deleteVisitaOffline(id);
        }
    }
}

async function deleteVisitaOffline(id) {
    const db = await openDatabase();
    const transaction = db.transaction([\'pendingSync\'], \'readwrite\');
    const store = transaction.objectStore(\'pendingSync\');

    const record = {
        id: id,
        action: \'delete\',
        data: { id: id }
    };

    store.put(record);

    transaction.oncomplete = () => {
        alert(\'Visita marcada para exclusão offline e será sincronizada quando a conexão for restabelecida.\');
        loadVisitas();
        loadDashboard();
        loadAgenda();
        loadPerfil();
    };

    transaction.onerror = (event) => {
        console.error(\'Erro ao marcar visita para exclusão offline:\', event.target.error);
        alert(\'Erro ao marcar visita para exclusão offline.\');
    };
}

// Funções utilitárias
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return \'\';
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString(\'pt-BR\') + \' \' + date.toLocaleTimeString(\'pt-BR\').substring(0, 5);
}

function formatSituacao(situacao) {
    const situacoes = {
        \'realizada\': \'Realizada\',
        \'nao_atendeu\': \'Não Atendeu\',
        \'remarcar\': \'Remarcar\',
        \'cancelada\': \'Cancelada\'
    };
    return situacoes[situacao] || situacao;
}

function getSituacaoColor(situacao) {
    const colors = {
        'realizada': 'success',
        'nao_atendeu': 'warning',
        'remarcar': 'info',
        'cancelada': 'danger'
    };
    return colors[situacao] || 'secondary';
}

// Expor funções globalmente para o HTML
window.showSection = showSection;
window.logout = logout;
window.showModalVisita = showModalVisita;
window.salvarVisita = salvarVisita;
window.editarVisita = editarVisita;
window.excluirVisita = excluirVisita;
window.loadVisitas = loadVisitas; // Expor para o filtro de data
window.loadAgenda = loadAgenda; // Expor para o filtro de data
window.loadPerfil = loadPerfil; // Expor para o filtro de data
window.loadDashboard = loadDashboard; // Expor para o filtro de data

// Funções de sincronização (offline.js)
// Estas funções são definidas em offline.js e expostas globalmente lá
// window.openDatabase
// window.syncData

// Chamar checkAuth ao carregar a página
document.addEventListener('DOMContentLoaded', checkAuth);




