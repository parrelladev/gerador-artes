// Configurações do Gerador de Artes
// Copie este arquivo para config.js e ajuste conforme necessário

module.exports = {
  // Porta do servidor
  port: process.env.PORT || 3000,
  
  // Pasta onde as artes serão salvas
  outputDir: process.env.OUTPUT_DIR || './output',
  
  // URL pública para acessar as artes (para download)
  publicOutputDir: process.env.PUBLIC_OUTPUT_DIR || '/output',
  
  // Configurações para servidor de produção
  production: {
    // Exemplo para servidor Linux
    outputDir: '/var/www/artes/output',
    publicOutputDir: '/artes/output',
    
    // Exemplo para servidor Windows
    // outputDir: 'C:\\inetpub\\wwwroot\\artes\\output',
    // publicOutputDir: '/artes/output',
  }
};
