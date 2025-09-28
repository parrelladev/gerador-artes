#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 Configurando Gerador de Artes para Servidor...\n');

// Configurações padrão para servidor
const serverConfig = {
  port: 3000,
  outputDir: './output',
  publicOutputDir: '/output'
};

// Perguntar configurações
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function configureServer() {
  console.log('📋 Configuração do Servidor\n');
  
  const port = await askQuestion(`Porta do servidor (padrão: ${serverConfig.port}): `);
  const outputDir = await askQuestion(`Pasta para salvar artes (padrão: ${serverConfig.outputDir}): `);
  const publicOutputDir = await askQuestion(`URL pública para downloads (padrão: ${serverConfig.publicOutputDir}): `);
  
  // Atualizar configurações
  if (port) serverConfig.port = port;
  if (outputDir) serverConfig.outputDir = outputDir;
  if (publicOutputDir) serverConfig.publicOutputDir = publicOutputDir;
  
  // Criar arquivo de configuração
  const configContent = `// Configuração gerada automaticamente
module.exports = {
  port: ${serverConfig.port},
  outputDir: '${serverConfig.outputDir}',
  publicOutputDir: '${serverConfig.publicOutputDir}'
};
`;
  
  fs.writeFileSync('config.js', configContent);
  
  // Criar pasta de output se não existir
  if (!fs.existsSync(serverConfig.outputDir)) {
    fs.mkdirSync(serverConfig.outputDir, { recursive: true });
    console.log(`✅ Pasta criada: ${serverConfig.outputDir}`);
  }
  
  // Criar script de inicialização
  const startScript = `#!/bin/bash
# Script de inicialização do Gerador de Artes
export PORT=${serverConfig.port}
export OUTPUT_DIR="${serverConfig.outputDir}"
export PUBLIC_OUTPUT_DIR="${serverConfig.publicOutputDir}"

echo "🚀 Iniciando Gerador de Artes..."
echo "📁 Pasta de output: ${serverConfig.outputDir}"
echo "🌐 URL: http://localhost:${serverConfig.port}"
echo "📥 Downloads: http://localhost:${serverConfig.port}${serverConfig.publicOutputDir}"

node server.js
`;
  
  fs.writeFileSync('start.sh', startScript);
  
  // Tornar o script executável no Linux
  if (process.platform !== 'win32') {
    exec('chmod +x start.sh');
  }
  
  console.log('\n✅ Configuração concluída!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Instale as dependências: npm install');
  console.log('2. Inicie o servidor: node server.js');
  console.log('3. Ou use o script: ./start.sh (Linux) ou node start.sh (Windows)');
  console.log(`\n🌐 Acesse: http://localhost:${serverConfig.port}`);
  
  rl.close();
}

configureServer().catch(console.error);
