const express = require('express');
const newsScraper = require('../services/newsScraper');

const router = express.Router();

router.post('/extract', async (req, res) => {
  const { url } = req.body || {};

  if (!url) {
    return res.status(400).json({ error: 'URL é obrigatória' });
  }

  try {
    const data = await newsScraper.fetch(url);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao extrair dados da notícia',
      detail: error.message,
    });
  }
});

module.exports = router;
