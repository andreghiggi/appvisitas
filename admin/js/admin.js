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
            sessionStorage.removeItem('userData');
            localStorage.removeItem('userData');
            window.location.replace('../login.html?logout=true'); 
            return;
        }
        document.getElementById('user-info').textContent = currentUser.nome;
        showSection('dashboard'); 
    } else {
        // Se não há userData, redireciona para login.html, mas apenas se não for um logout forçado
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('logout')) {
            window.location.replace('../login.html'); 
        }
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
            localStorage.removeItem('userData'); 
            // Redireciona para login.html com um parâmetro para evitar loop
            window.location.replace('../login.html?logout=true'); 
        })
        .catch(error => {
            console.error('Erro ao fazer logout:', error);
            sessionStorage.removeItem('userData'); 
            localStorage.removeItem('userData');
            // Redireciona mesmo em caso de erro, para garantir que o usuário saia
            window.location.replace('../login.html?logout=true');
        });
    }
}

// Mostrar seção
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    
    document.querySelectorAll('.sidebar .nav-link').forEach(link => link.classList.remove('active'));
    
    const targetLink = document.querySelector(`.sidebar .nav-link[data-section="${sectionId}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
    
    document.getElementById(sectionId + '-section').style.display = 'block';
    
    const titles = {
        'dashboard': 'Dashboard',
        'vendedores': 'Gerenciar Vendedores',
        'visitas': 'Gerenciar Visitas'
    };
    document.getElementById('page-title').textContent = titles[sectionId];
    
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'vendedores':
            loadVendedores();
            break;
        case 'visitas':
            loadVisitas();
            loadVendedoresSelect();
            break;
    }
}

// Carregar dashboard
function loadDashboard() {
    loadStats();
    loadUltimasVisitas();
}

// Carregar estatísticas
function loadStats() {
    fetch(API_BASE + 'usuarios.php')
    .then(response => response.json())
    .then(data => {
        const vendedores = data.filter(u => u.perfil === 'vendedor');
        document.getElementById('total-vendedores').textContent = vendedores.length;
    })
    .catch(error => console.error('Erro ao carregar total de vendedores:', error));
    
    const hoje = new Date().toISOString().split('T')[0];
    fetch(API_BASE + 'visitas.php?data_inicio=' + hoje + '&data_fim=' + hoje)
    .then(response => response.json())
    .then(data => {
        document.getElementById('total-visitas').textContent = data.length;
        
        const realizadas = data.filter(v => v.situacao === 'realizada').length;
        const pendentes = data.filter(v => v.situacao !== 'realizada').length;
        
        document.getElementById('visitas-realizadas').textContent = realizadas;
        document.getElementById('visitas-pendentes').textContent = pendentes;
    })
    .catch(error => console.error('Erro ao carregar visitas de hoje:', error));
}

// Carregar últimas visitas
function loadUltimasVisitas() {
    fetch(API_BASE + 'visitas.php')
    .then(response => response.json())
    .then(data => {
        const tbody = document.getElementById('ultimas-visitas');
        tbody.innerHTML = '';
        
        if (data.length > 0) {
            data.slice(0, 10).forEach(visita => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${visita.vendedor_nome}</td>
                    <td>${visita.cliente_nome}</td>
                    <td>${formatDateTime(visita.data_hora)}</td>
                    <td><span class="badge bg-${getSituacaoColor(visita.situacao)}">${formatSituacao(visita.situacao)}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhuma visita encontrada.</td></tr>';
        }
    })
    .catch(error => console.error('Erro ao carregar últimas visitas:', error));
}

// Carregar vendedores
function loadVendedores() {
    fetch(API_BASE + 'usuarios.php')
    .then(response => response.json())
    .then(data => {
        vendedores = data.filter(u => u.perfil === 'vendedor');
        const tbody = document.getElementById('lista-vendedores');
        tbody.innerHTML = '';
        
        if (vendedores.length > 0) {
            vendedores.forEach(vendedor => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${vendedor.nome}</td>
                    <td>${vendedor.email}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="showModalVendedor(${vendedor.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="excluirVendedor(${vendedor.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">Nenhum vendedor encontrado.</td></tr>';
        }
    })
    .catch(error => console.error('Erro ao carregar vendedores:', error));
}

// Carregar vendedores para select
function loadVendedoresSelect() {
    fetch(API_BASE + 'usuarios.php')
    .then(response => response.json())
    .then(data => {
        const vendedores = data.filter(u => u.perfil === 'vendedor');
        
        const filtroSelect = document.getElementById('filtro-vendedor');
        if (filtroSelect) {
            filtroSelect.innerHTML = '<option value="">Todos</option>';
            vendedores.forEach(vendedor => {
                filtroSelect.innerHTML += `<option value="${vendedor.id}">${vendedor.nome}</option>`;
            });
        }
        
        const modalSelect = document.getElementById('visita-vendedor-id');
        if (modalSelect) {
            modalSelect.innerHTML = '<option value="">Selecione um vendedor</option>';
            vendedores.forEach(vendedor => {
                modalSelect.innerHTML += `<option value="${vendedor.id}">${vendedor.nome}</option>`;
            });
        }
    })
    .catch(error => console.error('Erro ao carregar vendedores para select:', error));
}

// Carregar visitas
function loadVisitas() {
    let url = API_BASE + 'visitas.php';
    const params = new URLSearchParams();
    
    const vendedor = document.getElementById('filtro-vendedor')?.value;
    const dataInicio = document.getElementById('filtro-data-inicio')?.value;
    const dataFim = document.getElementById('filtro-data-fim')?.value;
    const situacao = document.getElementById('filtro-situacao')?.value;
    
    if (vendedor) params.append('vendedor', vendedor);
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    
    if (params.toString()) {
        url += '?' + params.toString();
    }
    
    fetch(url)
    .then(response => response.json())
    .then(data => {
        visitas = data;
        
        if (situacao) {
            visitas = visitas.filter(v => v.situacao === situacao);
        }
        
        const tbody = document.getElementById('lista-visitas');
        tbody.innerHTML = '';
        
        if (visitas.length > 0) {
            visitas.forEach(visita => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${visita.vendedor_nome}</td>
                    <td>${visita.cliente_nome}</td>
                    <td>${formatDateTime(visita.data_hora)}</td>
                    <td><span class="badge bg-${getSituacaoColor(visita.situacao)}">${formatSituacao(visita.situacao)}</span></td>
                    <td>${visita.retorno_data_hora ? formatDateTime(visita.retorno_data_hora) : '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="showModalVisita(${visita.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="excluirVisita(${visita.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma visita encontrada.</td></tr>';
        }
    })
    .catch(error => console.error('Erro ao carregar visitas:', error));
}

// Filtrar visitas
function filtrarVisitas() {
    loadVisitas();
}

// Modal vendedor
function showModalVendedor(id = null) {
    const modal = new bootstrap.Modal(document.getElementById('modalVendedor'));
    const form = document.getElementById('formVendedor');
    
    form.reset();
    document.getElementById('vendedor-id').value = '';
    document.getElementById('modalVendedorTitle').textContent = 'Novo Vendedor';
    
    if (id) {
        const vendedor = vendedores.find(v => v.id == id);
        if (vendedor) {
            document.getElementById('vendedor-id').value = vendedor.id;
            document.getElementById('vendedor-nome').value = vendedor.nome;
            document.getElementById('vendedor-email').value = vendedor.email;
            document.getElementById('modalVendedorTitle').textContent = 'Editar Vendedor';
        }
    }
    
    modal.show();
}

// Salvar vendedor
function salvarVendedor() {
    const form = document.getElementById('formVendedor');
    
    const data = {
        nome: document.getElementById('vendedor-nome').value,
        email: document.getElementById('vendedor-email').value,
        senha: document.getElementById('vendedor-senha').value,
        perfil: 'vendedor'
    };
    
    const id = document.getElementById('vendedor-id').value;
    const isEdit = id !== '';
    
    if (isEdit) {
        data.id = id;
    }
    
    const method = isEdit ? 'PUT' : 'POST';
    
    fetch(API_BASE + 'usuarios.php', {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.message) {
            alert(result.message);
            bootstrap.Modal.getInstance(document.getElementById("modalVendedor")).hide();
            loadVendedores();
            loadVendedoresSelect(); // Atualiza também o select de vendedores
        }
    })
    .catch(error => {
        alert('Erro ao salvar vendedor: ' + error.message);
        console.error('Erro ao salvar vendedor:', error);
    });
}

// Editar vendedor
function editarVendedor(id) {
    showModalVendedor(id);
}

// Excluir vendedor
function excluirVendedor(id) {
    if (confirm('Deseja realmente excluir este vendedor?')) {
        fetch(API_BASE + 'usuarios.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: id})
        })
        .then(response => response.json())
        .then(result => {
            alert(result.message);
            loadVendedores();
        })
        .catch(error => {
            alert('Erro ao excluir vendedor: ' + error.message);
            console.error('Erro ao excluir vendedor:', error);
        });
    }
}

// Modal visita
function showModalVisita(id = null) {
    const modal = new bootstrap.Modal(document.getElementById('modalVisita'));
    const form = document.getElementById('formVisita');
    
    form.reset();
    document.getElementById('visita-id').value = '';
    document.getElementById('modalVisitaTitle').textContent = 'Nova Visita';
    
    loadVendedoresSelect();

    if (id) {
        const visita = visitas.find(v => v.id == id);
        if (visita) {
            document.getElementById('visita-id').value = visita.id;
            document.getElementById('visita-vendedor-id').value = visita.id_vendedor;
            document.getElementById('visita-cliente-nome').value = visita.cliente_nome; 
            
            const dataHora = new Date(visita.data_hora);
            document.getElementById('visita-data').value = dataHora.toISOString().split('T')[0];
            document.getElementById('visita-hora').value = dataHora.toTimeString().split(' ')[0].substring(0, 5);
            
            document.getElementById('visita-situacao').value = visita.situacao;
            document.getElementById('visita-observacoes').value = visita.observacoes;
            
            const retornoNecessarioCheckbox = document.getElementById('visita-retorno-necessario');
            const retornoFieldsDiv = document.getElementById('retorno-fields');

            if (visita.retorno_data_hora) {
                retornoNecessarioCheckbox.checked = true;
                retornoFieldsDiv.style.display = 'block';
                const retornoDataHora = new Date(visita.retorno_data_hora);
                document.getElementById('visita-retorno-data').value = retornoDataHora.toISOString().split('T')[0];
                document.getElementById('visita-retorno-hora').value = retornoDataHora.toTimeString().split(' ')[0].substring(0, 5);
            } else {
                retornoNecessarioCheckbox.checked = false;
                retornoFieldsDiv.style.display = 'none';
            }
            
            document.getElementById('modalVisitaTitle').textContent = 'Editar Visita';
        }
    }
    
    modal.show();
}

// Salvar visita
function salvarVisita() {
    const data = {
        cliente_nome: document.getElementById('visita-cliente-nome').value, 
        data_hora: document.getElementById('visita-data').value + ' ' + document.getElementById('visita-hora').value + ':00',
        situacao: document.getElementById('visita-situacao').value,
        observacoes: document.getElementById('visita-observacoes').value,
        id_vendedor: document.getElementById('visita-vendedor-id').value
    };
    
    const retornoNecessario = document.getElementById('visita-retorno-necessario').checked;
    if (retornoNecessario) {
        const retornoData = document.getElementById('visita-retorno-data').value;
        const retornoHora = document.getElementById('visita-retorno-hora').value;
        if (retornoData && retornoHora) {
            data.retorno_data_hora = retornoData + ' ' + retornoHora + ':00';
        } else {
            alert('Por favor, preencha a data e hora do retorno.');
            return;
        }
    } else {
        data.retorno_data_hora = null;
    }
    
    const id = document.getElementById('visita-id').value;
    const isEdit = id !== '';
    
    if (isEdit) {
        data.id = id;
    }
    
    const method = isEdit ? 'PUT' : 'POST';
   
    fetch(API_BASE + 'visitas.php', {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.message) {
            alert(result.message);
            bootstrap.Modal.getInstance(document.getElementById('modalVisita')).hide();
            loadVisitas();
        }
    })
    .catch(error => {
        alert('Erro ao salvar visita: ' + error.message);
        console.error('Erro ao salvar visita:', error);
    });
}

// Editar visita
function editarVisita(id) {
    showModalVisita(id);
}

// Excluir visita
function excluirVisita(id) {
    if (confirm('Deseja realmente excluir esta visita?')) {
        fetch(API_BASE + 'visitas.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: id})
        })
        .then(response => response.json())
        .then(result => {
            alert(result.message);
            loadVisitas();
        })
        .catch(error => {
            alert('Erro ao excluir visita: ' + error.message);
            console.error('Erro ao excluir visita:', error);
        });
    }
}

// Funções utilitárias
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR').substring(0, 5);
}

function formatSituacao(situacao) {
    const situacoes = {
        'realizada': 'Realizada',
        'nao_atendeu': 'Não Atendeu',
        'remarcar': 'Remarcar',
        'cancelada': 'Cancelada'
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
window.showModalVendedor = showModalVendedor;
window.salvarVendedor = salvarVendedor;
window.editarVendedor = editarVendedor;
window.excluirVendedor = excluirVendedor;
window.showModalVisita = showModalVisita;
window.salvarVisita = salvarVisita;
window.editarVisita = editarVisita;
window.excluirVisita = excluirVisita;
window.filtrarVisitas = filtrarVisitas;


