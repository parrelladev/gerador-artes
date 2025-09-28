# 🚀 Deploy no Servidor da Empresa

Este guia explica como configurar o Gerador de Artes para rodar no servidor da empresa.

## 📋 Pré-requisitos

- Node.js 16+ instalado no servidor
- Acesso ao servidor (SSH ou RDP)
- Permissões para criar pastas e executar aplicações

## 🔧 Instalação Rápida

### 1. Upload dos Arquivos
```bash
# Faça upload de todos os arquivos para o servidor
# Exemplo: /var/www/artes/ ou C:\inetpub\wwwroot\artes\
```

### 2. Instalar Dependências
```bash
cd /caminho/para/gerador-artes
npm install
```

### 3. Configurar (Automático)
```bash
node deploy.js
```

### 4. Iniciar o Servidor
```bash
# Opção 1: Direto
node server.js

# Opção 2: Com script
./start.sh  # Linux
node start.sh  # Windows
```

## ⚙️ Configuração Manual

### Variáveis de Ambiente
Crie um arquivo `.env` ou configure as variáveis:

```bash
# Porta do servidor
PORT=3000

# Pasta onde salvar as artes
OUTPUT_DIR=/var/www/artes/output

# URL pública para downloads
PUBLIC_OUTPUT_DIR=/artes/output
```

### Exemplos de Configuração

#### Linux (Apache/Nginx)
```bash
# Pasta de artes
OUTPUT_DIR=/var/www/artes/output
PUBLIC_OUTPUT_DIR=/artes/output

# Iniciar
PORT=3000 OUTPUT_DIR=/var/www/artes/output PUBLIC_OUTPUT_DIR=/artes/output node server.js
```

#### Windows (IIS)
```cmd
# Pasta de artes
set OUTPUT_DIR=C:\inetpub\wwwroot\artes\output
set PUBLIC_OUTPUT_DIR=/artes/output

# Iniciar
set PORT=3000 && node server.js
```

## 🌐 Configuração de Proxy (Opcional)

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

## 🔄 Processo de Atualização

### 1. Parar o Servidor
```bash
# Encontrar o processo
ps aux | grep node
# ou
netstat -ano | findstr :3000

# Parar
kill -9 PID  # Linux
taskkill /PID PID /F  # Windows
```

### 2. Atualizar Código
```bash
# Fazer backup
cp -r /var/www/artes /var/www/artes.backup

# Atualizar arquivos
# (fazer upload dos novos arquivos)
```

### 3. Reiniciar
```bash
node server.js
```

## 📁 Estrutura de Pastas no Servidor

```
/var/www/artes/  # ou C:\inetpub\wwwroot\artes\
├── server.js
├── generate.js
├── package.json
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── previews/
├── templates/
├── input/
├── output/  # ← Artes geradas ficam aqui
└── node_modules/
```

## 🔒 Segurança

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

### 3. HTTPS (Recomendado)
Use um proxy reverso com SSL (Let's Encrypt, Cloudflare, etc.)

## 🐛 Troubleshooting

### Problema: "Port 3000 already in use"
```bash
# Encontrar processo usando a porta
lsof -i :3000  # Linux
netstat -ano | findstr :3000  # Windows

# Parar processo ou usar outra porta
PORT=3001 node server.js
```

### Problema: "Permission denied"
```bash
# Dar permissões
chmod +x server.js
chmod +x start.sh
```

### Problema: "Cannot find module"
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

## 📞 Suporte

- **Logs**: Verifique o console do servidor
- **Artes**: Verifique a pasta `output/`
- **Templates**: Verifique a pasta `templates/`
- **Uploads**: Verifique a pasta `input/`

## 🎯 Acesso Final

Após a configuração, todos na empresa poderão acessar:
- **Interface**: `http://servidor:3000`
- **Downloads**: `http://servidor:3000/artes/output/`
