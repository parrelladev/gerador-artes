#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const defaults = { port: 3000, outputDir: './output', publicOutputDir: '/output' };
try {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const example = require('./config.example');
  defaults.port = example.port || defaults.port;
  defaults.outputDir = example.outputDir || defaults.outputDir;
  defaults.publicOutputDir = example.publicOutputDir || defaults.publicOutputDir;
} catch (_) {
  // mant?m os defaults locais
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (label, fallback) =>
  new Promise((resolve) =>
    rl.question(`${label} (${fallback}): `, (answer) => resolve(answer || fallback)),
  );

async function main() {
  console.log('Configura??o do Gerador de Artes');

  const port = await question('Porta', String(defaults.port));
  const outputDir = await question('Pasta de sa?da', defaults.outputDir);
  const publicOutputDir = await question('Rota p?blica do output', defaults.publicOutputDir);

  const configContent = `module.exports = {\n  port: ${Number(port)},\n  outputDir: '${outputDir}',\n  publicOutputDir: '${publicOutputDir}',\n};\n`;

  fs.writeFileSync(path.resolve('config.js'), configContent);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`? Pasta criada: ${outputDir}`);
  }

  console.log('\n? Configura??o salva em config.js');
  console.log('Use PORT/OUTPUT_DIR/PUBLIC_OUTPUT_DIR para sobrescrever via ambiente.');
  rl.close();
}

main().catch((err) => {
  console.error('Erro ao configurar:', err);
  rl.close();
});
