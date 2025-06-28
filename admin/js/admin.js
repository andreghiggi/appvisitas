// Configurações da API
const API_BASE = '../api/';

// Estado da aplicação
let currentUser = null;
let vendedores = [];
let visitas = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

// Verificar autenticação
function checkAuth() {
    let userData = sessionStorage.getItem('userData');
    if (!userData) {
        userData = localStorage.getItem('userData');
    }

    if (userData) {
        currentUser = JSON.parse(userData);
        if (currentUser.perfil !== 'administrador') {
            alert('Acesso negado. Apenas administradores podem acessar este painel.');
            logout(); // Força logout se o perfil não for administrador
            return;
        }
        document.getElementById('user-info').textContent = currentUser.nome;
        loadDashboard();
    } else {
        // Se não há dados de usuário, redireciona para o login
        window.location.replace('../login.html'); // Usar replace para evitar histórico
    }
}

// Logout
function logout() {
    if (confirm('Deseja realmente sair?')) {
        fetch(API_BASE + 'logout.php', {
            method: 'POST'
        })
        .then(() => {
            sessionStorage.removeItem('userData');
            localStorage.removeItem('userData'); // Limpa também do localStorage
            window.location.replace('../login.html?logout=true'); // Usar replace para evitar histórico e adicionar param para forçar refresh
        })
        .catch(error => {
            console.error('Erro ao fazer logout:', error);
            sessionStorage.removeItem('userData'); // Tentar limpar mesmo com erro de rede
            localStorage.removeItem('userData');
            window.location.replace('../login.html?logout=true');
        });
    }
}

// Mostrar seção
function showSection(section, event) {
    if (event) event.preventDefault(); // Previne o comportamento padrão do link

    // Esconder todas as seções
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    
    // Remover classe active de todos os links
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    // Adicionar classe active ao link clicado
    // Encontra o link correto usando o sectionId
    const targetLink = document.querySelector(`.sidebar .nav-link[onclick*=

