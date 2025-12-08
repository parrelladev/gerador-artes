# Deploy no Servidor da Empresa

Este guia explica como configurar o Gerador de Artes para rodar em um servidor (Linux ou Windows), usando a versão atual do projeto.

## Pré-requisitos

- Node.js 16+ instalado no servidor
- Acesso ao servidor (SSH ou RDP)
- Permissões para criar pastas e executar aplicações

## Instalação Rápida

### 1. Upload dos arquivos

Copie todo o conteúdo do repositório para o servidor, por exemplo:

```bash
/var/www/artes/              # Linux
C:\inetpub\wwwroot\artes\    # Windows
```

### 2. Instalar dependências

```bash
cd /caminho/para/gerador-artes
npm install
```

### 3. Configurar (automático)

Opcionalmente, gere um `config.js` interativo:

```bash
node deploy.js
```

Você também pode copiar e ajustar `config.example.js` manualmente.
As variáveis de ambiente `PORT`, `OUTPUT_DIR` e `PUBLIC_OUTPUT_DIR` sempre têm prioridade.

### 4. Iniciar o servidor

```bash
# Opção 1: via npm (recomendado)
npm start

# Opção 2: direto com Node
node src/server.js
```

O servidor sobe, por padrão, na porta `3000` (ou na porta definida em `PORT`/`config.js`).

## Configuração Manual

### Variáveis de ambiente

Você pode configurar via `.env` (se usar algum gerenciador) ou diretamente no shell:

```bash
# Porta do servidor
PORT=3000

# Pasta onde salvar as artes
OUTPUT_DIR=/var/www/artes/output

# URL pública para downloads
PUBLIC_OUTPUT_DIR=/artes/output
```

### Exemplos de configuração

#### Linux (Apache/Nginx)

```bash
# Pasta de artes
OUTPUT_DIR=/var/www/artes/output
PUBLIC_OUTPUT_DIR=/artes/output

# Iniciar
PORT=3000 OUTPUT_DIR=/var/www/artes/output PUBLIC_OUTPUT_DIR=/artes/output node src/server.js
```

#### Windows (IIS ou serviço)

```cmd
REM Pasta de artes
set OUTPUT_DIR=C:\inetpub\wwwroot\artes\output
set PUBLIC_OUTPUT_DIR=/artes/output

REM Iniciar
set PORT=3000 && node src/server.js
```

## Configuração de Proxy (Opcional)

### Nginx

```nginx
server {
    listen 80;
    server_name artes.empresa.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /artes/output/ {
        alias /var/www/artes/output/;
        expires 1h;
    }
}
```

### Apache

```apache
<VirtualHost *:80>
    ServerName artes.empresa.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    Alias /artes/output /var/www/artes/output
    <Directory "/var/www/artes/output">
        Options Indexes
        AllowOverride None
        Require all granted
    </Directory>
</VirtualHost>
```

## Processo de Atualização

### 1. Parar o servidor

Se estiver rodando em primeiro plano, pare com `Ctrl+C`.
Para localizar processos em background:

```bash
# Encontrar o processo (Linux)
ps aux | grep node

# Windows
netstat -ano | findstr :3000
```

E então matar o processo, se necessário:

```bash
kill -9 PID             # Linux
taskkill /PID PID /F    # Windows
```

### 2. Atualizar código

```bash
# Fazer backup
cp -r /var/www/artes /var/www/artes.backup

# Atualizar arquivos (novo deploy via git ou upload)
```

### 3. Reiniciar

```bash
npm start
```

## Estrutura de Pastas no Servidor

Exemplo em `/var/www/artes` (Linux) ou `C:\inetpub\wwwroot\artes` (Windows):

```text
/var/www/artes/
├── src/
│   └── server.js          # Servidor Express
├── cli.js                 # CLI interativo (npm run cli)
├── deploy.js              # Assistente para gerar config.js
├── config.example.js      # Exemplo de configuração
├── package.json
├── package-lock.json
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── previews/
├── templates/
├── input/
├── output/                # Artes geradas
└── node_modules/
```

## CLI (opcional)

Além da interface web, é possível usar o CLI para gerar uma arte diretamente pelo terminal:

```bash
npm run cli
```

O CLI (`cli.js`) vai:

- Perguntar a URL da notícia
- Extrair título, subtítulo e imagem
- Permitir escolher o template/página
- Perguntar logo/tag e campos adicionais
- Gerar a arte em PNG na pasta configurada (`OUTPUT_DIR`)

## Segurança

### 1. Firewall

```bash
# Permitir apenas a porta 3000
ufw allow 3000
```

### 2. Permissões

```bash
# Apenas o usuário do servidor web
chown -R www-data:www-data /var/www/artes/
chmod -R 755 /var/www/artes/
```

### 3. HTTPS (recomendado)

Use um proxy reverso com SSL (Let's Encrypt, Cloudflare, etc.).

## Troubleshooting

### Problema: "Port 3000 already in use"

```bash
# Encontrar processo usando a porta
lsof -i :3000          # Linux
netstat -ano | findstr :3000  # Windows

# Parar processo ou usar outra porta
PORT=3001 node src/server.js
```

### Problema: "Permission denied"

```bash
# Ajustar permissões
chmod -R 755 /var/www/artes/
```

### Problema: "Cannot find module"

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

## Suporte e Verificações

- **Logs de execução**: verifique o console onde o Node está rodando.
- **Artes geradas**: confira a pasta `output/`.
- **Templates**: veja a pasta `templates/`.
- **Uploads locais**: pasta `input/`.

## Acesso Final

Depois de configurado:

- Interface: `http://servidor:3000`
- Downloads de artes: `http://servidor:3000/artes/output/` (ou a rota configurada em `PUBLIC_OUTPUT_DIR`)

