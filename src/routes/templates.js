const express = require('express');
const fs = require('fs');
const path = require('path');
const { listTemplates, loadManifest } = require('../lib/manifestLoader');

const router = express.Router();

router.get('/', (req, res) => {
  const templates = listTemplates().map((entry) => ({
    template: entry.template,
    pages: entry.pages.map((page) => ({
      name: page.name,
      logoField: page.manifest?.logoField,
      defaultLogo: page.manifest?.defaultLogo,
      dimensions: page.manifest?.dimensions,
    })),
  }));

  res.json(templates);
});

router.get('/:template/:page', (req, res) => {
  try {
    const { template, page } = req.params;
    const manifestInfo = loadManifest(template, page);
    const html = fs.readFileSync(manifestInfo.htmlPath, 'utf-8');

    const readCssFrom = (dir) => {
      if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
        return [];
      }
      return fs
        .readdirSync(dir)
        .filter((file) => file.endsWith('.css'))
        .map((file) => ({
          name: path.join(path.basename(dir), file),
          content: fs.readFileSync(path.join(dir, file), 'utf-8'),
        }));
    };

    const cssFiles = [
      ...readCssFrom(path.join(manifestInfo.templateDir, 'css')),
      ...readCssFrom(path.join(manifestInfo.pageDir)),
    ];

    res.json({
      template,
      page,
      manifest: manifestInfo.manifest,
      html,
      css: cssFiles,
    });
  } catch (error) {
    res.status(404).json({
      error: 'Template não encontrado',
      detail: error.message,
    });
  }
});

module.exports = router;
