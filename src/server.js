const express = require('express');
const path = require('path');
const config = require('./config');

const generateRouter = require('./routes/generate');
const templatesRouter = require('./routes/templates');
const newsRouter = require('./routes/news');

const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));
// expõe templates (HTML/CSS/fonts) para o preview no navegador
app.use('/templates', express.static('templates'));
app.use(config.publicOutputDir, express.static(config.outputDir));

app.use('/api/generate', generateRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/news', newsRouter);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Gerador de artes disponível',
    outputDir: path.resolve(config.outputDir),
  });
});

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('[server] erro inesperado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    detail: err.message,
  });
});

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor rodando em http://localhost:${config.port}`);
});

module.exports = app;
