# Deploy no Servidor

Guia rápido para colocar o Maker em produção em um servidor Linux ou Windows.

---

## 1. Pré-requisitos

- Node.js 16+ instalado no servidor
- Acesso ao servidor (SSH ou RDP)
- Permissão para criar pastas e executar processos Node

---

## 2. Deploy rápido

### 2.1. Enviar o projeto para o servidor

Copie o conteúdo do repositório para o servidor, por exemplo:

```bash
# Linux
/var/www/artes/

# Windows
C:\inetpub\wwwroot\artes\
```

### 2.2. Instalar dependências

```bash
cd /caminho/para/gerador-artes
npm install
```

### 2.3. Configurar (opção simples)

Gere um `config.js` interativo:

```bash
npm run deploy
```

Ou copie e edite manualmente:

```bash
cp config.example.js config.js            # Linux
REM copy config.example.js config.js      # Windows
```

As variáveis de ambiente `PORT`, `OUTPUT_DIR` e `PUBLIC_OUTPUT_DIR` sempre têm prioridade sobre `config.js`.

### 2.4. Subir o servidor

```bash
# recomendado
npm start

# alternativa
node src/server.js
```

Por padrão o servidor roda na porta `3000` (ou na porta definida em `PORT`/`config.js`).

---

## 3. Configuração de ambiente

Você pode configurar via `.env` (se o seu gerenciador suportar) ou direto no shell.

### 3.1. Variáveis principais

```bash
# Porta do servidor
PORT=3000

# Pasta onde salvar as artes (no disco do servidor)
OUTPUT_DIR=/var/www/artes/output

# Caminho público para download das artes
PUBLIC_OUTPUT_DIR=/artes/output
```

Exemplo Linux (sem `.env`):

```bash
PORT=3000 OUTPUT_DIR=/var/www/artes/output PUBLIC_OUTPUT_DIR=/artes/output node src/server.js
```

Exemplo Windows (CMD):

```cmd
set PORT=3000
set OUTPUT_DIR=C:\inetpub\wwwroot\artes\output
set PUBLIC_OUTPUT_DIR=/artes/output
node src/server.js
```

---

## 4. Proxy reverso (opcional)

Use um proxy para expor o serviço em porta 80/443.

### 4.1. Nginx

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

### 4.2. Apache

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

---

## 5. Atualização de versão

1. Parar o servidor (se em primeiro plano, `Ctrl+C`).
2. Fazer backup opcional da pasta atual.
3. Substituir o código pela nova versão (git pull ou novo upload).
4. Rodar `npm install` se houver mudanças de dependências.
5. Subir novamente com `npm start`.

Comandos úteis:

```bash
# encontrar processo Node (Linux)
ps aux | grep node

# checar porta (Linux)
lsof -i :3000

# checar porta (Windows)
netstat -ano | findstr :3000
```

---

## 6. Estrutura típica em produção

Exemplo em `/var/www/artes` (Linux) ou `C:\inetpub\wwwroot\artes` (Windows):

```text
/var/www/artes/
  src/
    server.js          # servidor Express
  deploy.js            # assistente para gerar config.js
  config.example.js    # exemplo de configuração
  config.js            # configuração ativa (opcional)
  package.json
  package-lock.json
  public/              # interface web, previews
  templates/           # templates HTML/CSS/manifests
  input/               # assets locais
  output/              # artes geradas (PNG)
  node_modules/
```

---

## 7. Segurança básica

### 7.1. Firewall

```bash
# Exemplo: permitir apenas porta 3000 (Linux + ufw)
ufw allow 3000
```

### 7.2. Permissões

```bash
chown -R www-data:www-data /var/www/artes/
chmod -R 755 /var/www/artes/
```

### 7.3. HTTPS

Recomendado usar HTTPS via proxy reverso (Let's Encrypt, Cloudflare ou outro provedor).

---

## 8. Troubleshooting rápido

**Port 3000 already in use**

```bash
lsof -i :3000                   # Linux
netstat -ano | findstr :3000    # Windows
```

Pare o processo em conflito ou use outra porta (`PORT=3001`).

**Permission denied**

```bash
chmod -R 755 /var/www/artes/
```

**Cannot find module**

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 9. Verificações finais

- Interface web: `http://servidor:3000` ou URL configurada no proxy.
- Downloads de artes: caminho configurado em `PUBLIC_OUTPUT_DIR` (ex.: `/artes/output/`).
- Log de erros: console do Node no servidor.
- Pastas importantes: `templates/`, `input/`, `output/`.

