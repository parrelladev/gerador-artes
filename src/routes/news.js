const express = require('express');
const newsScraper = require('../services/newsScraper');

const router = express.Router();

router.post('/extract', async (req, res) => {
  const { url } = req.body || {};

  if (!url) {
    return res.status(400).json({ error: 'URL é obrigatória' });
  }

  try {
    const { h1, h2, bg, chapeu } = await newsScraper.fetch(url);

    if (chapeu) {
      // eslint-disable-next-line no-console
      console.debug('[scraper] Chapéu extraído:', chapeu);
    }

    return res.json({ h1, h2, bg, chapeu });
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao extrair dados da notícia',
      detail: error.message,
    });
  }
});

module.exports = router;
