// Configurações do Maker
// Copie este arquivo para config.js e ajuste conforme necess?rio.
// PORT, OUTPUT_DIR e PUBLIC_OUTPUT_DIR tamb?m podem ser definidos via ambiente.

module.exports = {
  port: process.env.PORT || 3000,
  outputDir: process.env.OUTPUT_DIR || './output',
  publicOutputDir: process.env.PUBLIC_OUTPUT_DIR || '/output',
};
