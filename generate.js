const fs = require('fs');
const path = require('path');
const { run } = require('./src/services/generator');

(async () => {
  const dataPath = path.resolve('input/data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('Arquivo input/data.json nao encontrado.');
    process.exit(1);
  }

  try {
    const artes = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const { files, logs } = await run(artes);
    console.log(JSON.stringify({ files, logs }, null, 2));
  } catch (error) {
    console.error('Erro ao gerar artes:', error.message);
    process.exit(1);
  }
})();
