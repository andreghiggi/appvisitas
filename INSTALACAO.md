# Sistema de Visitas - Guia de Instalação

## Pré-requisitos

- Servidor web (Apache/Nginx)
- PHP 7.4 ou superior
- MySQL 5.7 ou superior
- Extensões PHP: PDO, PDO_MySQL

## Instalação

### 1. Configurar o Banco de Dados

1. Crie um banco de dados MySQL
2. Execute o script SQL fornecido (`database.sql`)
3. Configure as credenciais no arquivo `config/database.php`

```php
private $host = 'localhost';
private $db_name = 'app_visitas';
private $username = 'seu_usuario';
private $password = 'sua_senha';
```

### 2. Configurar o Servidor Web

#### Apache
Certifique-se de que o mod_rewrite está habilitado e configure o DocumentRoot para a pasta do projeto.

#### Nginx
Configure o servidor para servir arquivos PHP e definir a pasta do projeto como root.

### 3. Configurar HTTPS (Recomendado para PWA)

Para funcionalidades completas do PWA (Service Worker, notificações), é recomendado usar HTTPS.

### 4. Testar a Instalação

1. Acesse `http://seu-dominio/login.html`
2. Use as credenciais padrão:
   - Email: admin@example.com
   - Senha: admin123

## Estrutura de Arquivos

```
app_visitas/
├── api/                    # APIs PHP
│   ├── login.php
│   ├── logout.php
│   ├── usuarios.php
│   ├── visitas.php
│   ├── sincronizar.php
│   └── ping.php
├── classes/                # Classes PHP
│   ├── Auth.php
│   ├── Usuario.php
│   ├── Cliente.php
│   └── Visita.php
├── config/                 # Configurações
│   └── database.php
├── admin/                  # Painel Administrativo
│   ├── index.html
│   └── js/admin.js
├── app/                    # PWA para Vendedores
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   ├── icons/
│   └── js/
│       ├── app.js
│       ├── offline.js
│       └── pwa-config.js
├── login.html              # Página de Login
└── database.sql            # Script do Banco
```

## Funcionalidades

### Painel Administrativo
- Gerenciamento de vendedores
- Visualização de todas as visitas
- Inserção manual de visitas
- Relatórios e estatísticas

### App PWA para Vendedores
- Registro de visitas offline
- Agenda de retornos
- Notificações automáticas
- Sincronização automática
- Instalação como app nativo

## Configurações Avançadas

### Notificações Push
Para habilitar notificações push, configure um serviço como Firebase Cloud Messaging.

### Backup Automático
Configure backups regulares do banco de dados MySQL.

### Monitoramento
Implemente logs de acesso e erro para monitoramento da aplicação.

## Solução de Problemas

### Erro de Conexão com Banco
Verifique as credenciais em `config/database.php`

### Service Worker não Funciona
Certifique-se de que está usando HTTPS ou localhost

### Sincronização Falha
Verifique se as APIs estão acessíveis e se há conectividade

## Suporte

Para suporte técnico, consulte a documentação ou entre em contato com a equipe de desenvolvimento.

