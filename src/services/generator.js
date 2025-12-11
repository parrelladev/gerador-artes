const fs = require('fs');
const puppeteer = require('puppeteer');

const config = require('../appConfig');
const { loadManifest } = require('../lib/manifestLoader');
const { GeneratorError } = require('../modules/generation/errors');
const arteValidator = require('../modules/generation/arteValidator');
const assetResolver = require('../modules/generation/assetResolver');
const renderService = require('../modules/generation/renderService');

let isGenerating = false;

async function run(artes, options = {}) {
  if (!Array.isArray(artes) || artes.length === 0) {
    throw new GeneratorError('Payload invÇ­lido: "artes" deve ser um array com ao menos um item.', 'VALIDATION');
  }

  if (isGenerating) {
    throw new GeneratorError('JÇ­ existe uma geraÇõÇœo em andamento.', 'BUSY');
  }

  isGenerating = true;
  const files = [];
  const logs = [];
  const outputDir = options.outputDir || config.outputDir;

  let browser;

  try {
    browser = await puppeteer.launch();

    for (let i = 0; i < artes.length; i += 1) {
      const arteInput = artes[i];
      const template = arteInput?.template;
      const page = arteInput?.page || 'index';

      try {
        const manifestInfo = loadManifest(template, page);
        const arte = arteValidator.validateArte(arteInput, manifestInfo.manifest);
        const { filename, outputPath } = await renderService.renderArte(browser, arte, manifestInfo, i, outputDir);

        files.push(filename);
        logs.push({
          status: 'ok',
          template,
          page,
          file: filename,
          message: `[ok] ${template}/${page} gerado: ${outputPath}`,
        });
      } catch (error) {
        logs.push({
          status: 'erro',
          template,
          page,
          message: `[erro] ${template}/${page}: ${error.message}`,
          detail: error.stack,
        });
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
    isGenerating = false;
  }

  const hasErrors = logs.some((log) => log.status === 'erro');
  if (hasErrors && !files.length) {
    throw new GeneratorError('Nenhuma arte pÇïde ser gerada.', 'GENERATION_ERROR', { logs });
  }

  return { files, logs };
}

async function runSingleToBuffer(arteInput, options = {}) {
  if (!arteInput || typeof arteInput !== 'object') {
    throw new GeneratorError('Payload invÇ­lido: arte deve ser um objeto.', 'VALIDATION');
  }

  if (isGenerating) {
    throw new GeneratorError('JÇ­ existe uma geraÇõÇœo em andamento.', 'BUSY');
  }

  isGenerating = true;
  let browser;

  try {
    const template = arteInput.template;
    const page = arteInput.page || 'index';

    const manifestInfo = loadManifest(template, page);
    const arte = arteValidator.validateArte(arteInput, manifestInfo.manifest);

    const outputDir = options.outputDir || config.outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    browser = await puppeteer.launch();
    const { filename, buffer } = await renderService.renderArteToBuffer(browser, arte, manifestInfo);

    const logs = [
      {
        status: 'ok',
        template,
        page,
        file: filename,
        message: `[ok] ${template}/${page} gerado em buffer para download imediato`,
      },
    ];

    return { filename, buffer, logs };
  } finally {
    if (browser) {
      await browser.close();
    }
    isGenerating = false;
  }
}

module.exports = {
  run,
  runSingleToBuffer,
  isGenerating: () => isGenerating,
  buildArteSchema: arteValidator.buildArteSchema,
  validateArte: arteValidator.validateArte,
  resolveLogoAsset: assetResolver.resolveLogoAsset,
  resolveBgAsset: assetResolver.resolveBgAsset,
};
