const express = require('express');
const generator = require('../services/generator');

const router = express.Router();

router.post('/', async (req, res) => {
  const { artes } = req.body || {};

  if (!Array.isArray(artes) || artes.length === 0) {
    return res.status(400).json({
      error: 'Payload inválido: informe "artes" como array.',
      detail: 'O corpo da requisição deve conter ao menos uma arte.',
    });
  }

  try {
    const result = await generator.run(artes);
    const hasErrors = result.logs.some((log) => log.status === 'erro');
    const status = hasErrors ? 500 : 200;
    const responseBody = {
      files: result.files,
      logs: result.logs,
    };

    if (hasErrors) {
      responseBody.error = 'Falha ao gerar uma ou mais artes';
      responseBody.detail = 'Consulte os logs para identificar os erros.';
    }

    return res.status(status).json(responseBody);
  } catch (error) {
    const status =
      error.code === 'BUSY' ? 409 : error.code === 'VALIDATION' ? 400 : 500;
    return res.status(status).json({
      error: 'Erro ao gerar artes',
      detail: error.message,
      logs: error.logs,
    });
  }
});

router.post('/download', async (req, res) => {
  const { arte } = req.body || {};

  if (!arte || typeof arte !== 'object') {
    return res.status(400).json({
      error: 'Payload inválido: informe um objeto "arte".',
      detail: 'O corpo da requisição deve conter uma arte válida.',
    });
  }

  try {
    const result = await generator.runSingleToBuffer(arte);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename || 'arte.png'}"`,
    );

    return res.send(result.buffer);
  } catch (error) {
    const status =
      error.code === 'BUSY' ? 409 : error.code === 'VALIDATION' ? 400 : 500;

    return res.status(status).json({
      error: error.code || 'Erro ao gerar arte',
      detail: error.message,
    });
  }
});

module.exports = router;
