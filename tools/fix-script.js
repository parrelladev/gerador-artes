const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'script.js');

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

const loadIdx = lines.findIndex((line) => line.includes('async function loadManifest'));

if (loadIdx !== -1) {
  // Substitui o bloco existente de loadManifest por uma versão enxuta que delega ao Api.
  // Remove algumas linhas seguintes para garantir que qualquer resíduo anterior seja apagado.
  const removeCount = 12;
  lines.splice(
    loadIdx,
    removeCount,
    "async function loadManifest(template, page = 'index') {",
    "  return window.Api.loadManifest(template, page);",
    "}"
  );

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

