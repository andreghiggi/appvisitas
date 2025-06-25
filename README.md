# Sistema de Visitas PWA

Uma aplicação web progressiva (PWA) completa para gerenciamento de visitas de vendedores, desenvolvida com PHP, MySQL e funcionalidades offline avançadas.

## 🚀 Características Principais

### 📱 Progressive Web App (PWA)
- **Instalação nativa**: Pode ser instalada como app nativo no celular
- **Funcionamento offline**: Registra visitas mesmo sem internet
- **Sincronização automática**: Dados são sincronizados quando a conexão é restabelecida
- **Notificações**: Lembretes automáticos para retornos agendados

### 👥 Dois Perfis de Usuário

#### 🔧 Administrador (Painel Web)
- Cadastrar, editar e excluir vendedores
- Visualizar e gerenciar todas as visitas
- Inserir novas visitas manualmente
- Dashboard com estatísticas em tempo real
- Relatórios e filtros avançados

#### 📱 Vendedor (App PWA)
- Registrar visitas a clientes
- Agendar retornos automáticos
- Agenda de compromissos
- Funcionamento 100% offline
- Interface otimizada para mobile

### 🔄 Funcionalidades Offline
- **IndexedDB**: Armazenamento local robusto
- **Service Worker**: Cache inteligente de recursos
- **Detecção de conectividade**: Status online/offline em tempo real
- **Fila de sincronização**: Dados são enviados automaticamente quando possível

## 📋 Requisitos do Sistema

- **Servidor Web**: Apache ou Nginx
- **PHP**: 7.4 ou superior
- **MySQL**: 5.7 ou superior
- **Extensões PHP**: PDO, PDO_MySQL

## 🛠️ Instalação Rápida

### 1. Configurar Banco de Dados
```sql
CREATE DATABASE app_visitas;
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'app_password';
GRANT ALL PRIVILEGES ON app_visitas.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Importar Estrutura
```bash
mysql -u app_user -p app_visitas < database_clean.sql
```

### 3. Configurar Conexão
Edite `config/database.php` com suas credenciais do MySQL.

### 4. Acessar Sistema
- **Login**: http://seu-dominio/login.html
- **Admin**: admin@example.com / admin123

## 📁 Estrutura do Projeto

```
app_visitas/
├── 📂 api/                    # APIs REST em PHP
│   ├── login.php              # Autenticação
│   ├── usuarios.php           # CRUD de usuários
│   ├── visitas.php            # CRUD de visitas
│   ├── sincronizar.php        # Sincronização offline
│   └── ping.php               # Verificação de conectividade
├── 📂 classes/                # Classes PHP
│   ├── Auth.php               # Sistema de autenticação
│   ├── Usuario.php            # Gerenciamento de usuários
│   ├── Cliente.php            # Gerenciamento de clientes
│   └── Visita.php             # Gerenciamento de visitas
├── 📂 config/                 # Configurações
│   └── database.php           # Conexão com MySQL
├── 📂 admin/                  # Painel Administrativo
│   ├── index.html             # Interface principal
│   └── js/admin.js            # Lógica do painel
├── 📂 app/                    # PWA para Vendedores
│   ├── index.html             # Interface do app
│   ├── manifest.json          # Configurações PWA
│   ├── sw.js                  # Service Worker
│   ├── 📂 icons/              # Ícones do app
│   └── 📂 js/                 # Scripts JavaScript
│       ├── app.js             # Lógica principal
│       ├── offline.js         # Funcionalidades offline
│       └── pwa-config.js      # Configurações PWA
├── login.html                 # Página de login
├── database_clean.sql         # Script do banco
├── INSTALACAO.md              # Guia de instalação
├── RELATORIO_TESTES.md        # Relatório de testes
└── README.md                  # Este arquivo
```

## 🎯 Funcionalidades Detalhadas

### Para Administradores
- ✅ **Gerenciamento de Vendedores**: CRUD completo
- ✅ **Visualização de Visitas**: Todas as visitas em tempo real
- ✅ **Inserção Manual**: Adicionar visitas pelo painel
- ✅ **Dashboard**: Estatísticas e métricas
- ✅ **Filtros Avançados**: Por vendedor, data, situação
- ✅ **Relatórios**: Exportação e análises

### Para Vendedores
- ✅ **Registro de Visitas**: Interface simples e rápida
- ✅ **Informações Capturadas**:
  - Nome/identificação do cliente
  - Data e hora da visita
  - Situação (realizada, não atendeu, remarcar, cancelada)
  - Observações detalhadas
  - Agendamento de retorno
- ✅ **Notificações**: Lembretes automáticos
- ✅ **Agenda**: Visualização de retornos programados
- ✅ **Offline First**: Funciona sem internet

### Sistema de Sincronização
- ✅ **Detecção Automática**: Identifica quando volta online
- ✅ **Envio em Lote**: Sincroniza múltiplas visitas
- ✅ **Retry Automático**: Tenta novamente em caso de falha
- ✅ **Feedback Visual**: Mostra status da sincronização
- ✅ **Log de Atividades**: Histórico de sincronizações

## 🔐 Credenciais de Acesso

### Administrador Padrão
- **Email**: admin@example.com
- **Senha**: admin123

*Recomenda-se alterar essas credenciais após a instalação.*

## 🌐 Tecnologias Utilizadas

### Backend
- **PHP 8.1**: Linguagem principal
- **MySQL 8.0**: Banco de dados
- **PDO**: Abstração de banco
- **REST APIs**: Comunicação frontend/backend

### Frontend
- **HTML5**: Estrutura semântica
- **CSS3**: Estilização moderna
- **JavaScript ES6+**: Lógica interativa
- **Bootstrap 5.1**: Framework CSS
- **Font Awesome 6.0**: Ícones

### PWA
- **Service Worker**: Cache e offline
- **Web App Manifest**: Configurações de instalação
- **IndexedDB**: Armazenamento local
- **Push Notifications**: Notificações nativas

## 📱 Instalação como App

### Android
1. Abra o site no Chrome
2. Toque no menu (⋮)
3. Selecione "Instalar app"
4. Confirme a instalação

### iOS
1. Abra o site no Safari
2. Toque no botão de compartilhar
3. Selecione "Adicionar à Tela Inicial"
4. Confirme a adição

## 🔧 Configurações Avançadas

### HTTPS (Recomendado)
Para funcionalidades completas do PWA, configure HTTPS:
```nginx
server {
    listen 443 ssl;
    server_name seu-dominio.com;
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    root /path/to/app_visitas;
    index login.html;
}
```

### Notificações Push
Para notificações avançadas, configure Firebase Cloud Messaging:
1. Crie projeto no Firebase Console
2. Configure as credenciais no Service Worker
3. Implemente o backend de notificações

## 🐛 Solução de Problemas

### Erro de Conexão com Banco
```php
// Verifique config/database.php
private $host = 'localhost';
private $db_name = 'app_visitas';
private $username = 'seu_usuario';
private $password = 'sua_senha';
```

### Service Worker não Funciona
- Certifique-se de usar HTTPS ou localhost
- Verifique se o arquivo sw.js está acessível
- Limpe o cache do navegador

### Sincronização Falha
- Verifique conectividade de rede
- Confirme se as APIs estão funcionando
- Verifique logs do servidor PHP

## 📊 Métricas e Analytics

O sistema inclui rastreamento básico de uso:
- Tempo de sessão
- Páginas mais visitadas
- Frequência de sincronização
- Estatísticas de visitas

## 🔄 Atualizações

### Versão 1.0.0 (Atual)
- ✅ Sistema completo implementado
- ✅ PWA funcional
- ✅ Sincronização offline
- ✅ Painel administrativo
- ✅ App para vendedores

### Roadmap Futuro
- 🔄 Relatórios avançados
- 🔄 Integração com CRM
- 🔄 Geolocalização
- 🔄 Assinatura digital
- 🔄 Fotos de visitas

## 📞 Suporte

Para suporte técnico ou dúvidas:
- 📧 Email: suporte@exemplo.com
- 📱 WhatsApp: (11) 99999-9999
- 🌐 Site: https://exemplo.com

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo LICENSE para detalhes.

---

**Desenvolvido com ❤️ para otimizar o trabalho de vendedores e gestores.**

