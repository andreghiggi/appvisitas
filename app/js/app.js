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
        // Se não há dados de usuário, redireciona para o login
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
    window.addEventListener('online', () => {
        isOnline = true;
        updateOnlineStatus();
        syncData();
    });

    window.addEventListener('offline', () => {
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
    const chkRetorno = document.getElementById('retorno-necessario');
    if (chkRetorno) {
        chkRetorno.addEventListener('change', (e) => {
            document.getElementById('retorno-fields').style.display = e.target.checked ? 'block' : 'none';
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
function showSection(sectionId, event) {
    if (event) event.preventDefault();

    document.querySelectorAll('.bottom-nav .nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`.bottom-nav .nav-link[onclick*="${sectionId}"]`).classList.add('active');

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
    // Implementação de loadDashboard...
}

// Carregar Visitas
async function loadVisitas() {
    // Implementação de loadVisitas...
}

// Carregar Agenda
async function loadAgenda() {
    // Implementação de loadAgenda...
}

// Carregar Perfil
async function loadPerfil() {
    // Implementação de loadPerfil...
}

// Salvar Visita
async function salvarVisita() {
    // Implementação de salvarVisita...
}

// Sincronizar Dados
async function syncData() {
    // Implementação de syncData...
}

// Funções de formatação e utilitários
function formatDateTime(dateTimeString) {
    const [date, time] = dateTimeString.split(' ');
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year} ${time || ''}`.trim();
}

function formatSituacao(situacao) {
    return situacao.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Mostrar Modal de Visita
function showModalVisita() {
    if (myModal) {
        document.getElementById('formVisita').reset();
        document.getElementById('retorno-fields').style.display = 'none';
        myModal.show();
    }
}

// Expor funções ao objeto window para serem acessíveis no HTML
window.logout = logout;
window.showSection = showSection;
window.showModalVisita = showModalVisita;
window.syncData = syncData;
window.filtrarVisitas = () => loadVisitas();
window.filtrarAgenda = () => loadAgenda();

// Ponto de entrada principal
document.addEventListener('DOMContentLoaded', checkAuth);


