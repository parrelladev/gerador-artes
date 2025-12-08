const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');
const axios = require('axios');
const { z } = require('zod');

const config = require('../config');
const { loadManifest } = require('../lib/manifestLoader');
const { applyBindings, buildBindingPayload } = require('../lib/binding');

const INPUT_DIR = path.resolve('input');
const LOGO_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
const BG_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const LOGO_CACHE = new Map();

let isGenerating = false;

class GeneratorError extends Error {
  constructor(message, code, meta = {}) {
    super(message);
    this.name = 'GeneratorError';
    this.code = code;
    Object.assign(this, meta);
  }
}

function normalizeString(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function sanitizePayload(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[key] = typeof value === 'string' ? value.trim() : value;
    return acc;
  }, {});
}

function buildArteSchema(manifest) {
  const logoField = manifest.logoField || 'logo';
  const logoSchema = manifest.defaultLogo
    ? z.string().min(1, `${logoField} é obrigatório`).optional()
    : z.string().min(1, `${logoField} é obrigatório`);

  return z
    .object({
      template: z.string().min(1, 'template é obrigatório'),
      page: z.string().min(1, 'page é obrigatório'),
      h1: z.string().optional(),
      h2: z.string().optional(),
      tag: z.string().optional(),
      text: z.string().optional(),
      bg: z.string().min(1, 'bg é obrigatório'),
      parameters: z.record(z.any()).optional(),
      logoAlt: z.string().optional(),
      [logoField]: logoSchema,
    })
    .passthrough();
}

function validateArte(arte, manifest) {
  const schema = buildArteSchema(manifest);
  const parsed = schema.parse(arte);
  const sanitized = sanitizePayload(parsed);
  const logoField = manifest.logoField || 'logo';
  const bg = normalizeString(sanitized.bg);
  const logoValue = normalizeString(sanitized[logoField]) || normalizeString(manifest.defaultLogo);

  if (!bg) {
    throw new GeneratorError('O campo "bg" é obrigatório e não pode estar vazio', 'VALIDATION');
  }

  if (!logoValue) {
    throw new GeneratorError(`O campo "${logoField}" é obrigatório para este template`, 'VALIDATION');
  }

  return {
    ...sanitized,
    bg,
    [logoField]: logoValue,
  };
}

function ensureDimensions(manifest) {
  const dims = manifest.dimensions || {};
  const width = Number(dims.width);
  const height = Number(dims.height);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new GeneratorError('Dimensões inválidas no manifest', 'VALIDATION');
  }

  return { width, height };
}

function isRemoteUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

async function resolveLogoAsset(value, altText) {
  if (!value) {
    return null;
  }

  const cached = LOGO_CACHE.get(value);
  if (cached) {
    return { ...cached, alt: altText || cached.alt };
  }

  if (isRemoteUrl(value)) {
    if (/\.svg(\?|#|$)/i.test(value)) {
      const response = await axios.get(value, { responseType: 'text' });
      const markup = String(response.data || '').trim();
      if (!markup.includes('<svg')) {
        throw new GeneratorError(`Conteúdo SVG inválido em ${value}`, 'ASSET');
      }
      const result = { kind: 'inline-svg', markup, source: value, sourceType: 'remote', alt: altText };
      LOGO_CACHE.set(value, result);
      return result;
    }

    const result = { kind: 'image', src: value, source: value, sourceType: 'remote', alt: altText };
    LOGO_CACHE.set(value, result);
    return result;
  }

  const extension = path.extname(value);
  const candidateNames = extension ? [value] : LOGO_EXTENSIONS.map((ext) => `${value}${ext}`);

  for (const candidate of candidateNames) {
    const candidatePath = path.isAbsolute(candidate) ? candidate : path.join(INPUT_DIR, candidate);
    if (!fs.existsSync(candidatePath)) continue;

    if (candidate.toLowerCase().endsWith('.svg')) {
      const markup = fs.readFileSync(candidatePath, 'utf-8');
      if (!markup.includes('<svg')) {
        throw new GeneratorError(`Conteúdo SVG inválido em ${candidatePath}`, 'ASSET');
      }
      const result = {
        kind: 'inline-svg',
        markup: markup.trim(),
        source: candidatePath,
        sourceType: 'local',
        alt: altText,
      };
      LOGO_CACHE.set(value, result);
      return result;
    }

    const result = {
      kind: 'image',
      src: pathToFileURL(candidatePath).href,
      source: candidatePath,
      sourceType: 'local',
      alt: altText,
    };
    LOGO_CACHE.set(value, result);
    return result;
  }

  throw new GeneratorError(`Logo não encontrado: ${value}`, 'ASSET');
}

function resolveBgAsset(value) {
  if (isRemoteUrl(value)) {
    return value;
  }

  const extension = path.extname(value);
  const candidates = extension ? [value] : BG_EXTENSIONS.map((ext) => `${value}${ext}`);

  for (const candidate of candidates) {
    const candidatePath = path.isAbsolute(candidate) ? candidate : path.join(INPUT_DIR, candidate);
    if (fs.existsSync(candidatePath)) {
      return pathToFileURL(candidatePath).href;
    }
  }

  throw new GeneratorError(`Background não encontrado: ${value}`, 'ASSET');
}

async function waitForImages(page) {
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error(`Timeout ao carregar imagem: ${img.src}`)), 15000);
          img.onload = () => {
            clearTimeout(timer);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timer);
            reject(new Error(`Erro ao carregar imagem: ${img.src}`));
          };
        });
      }),
    );
  });
}

function buildFileName(arte, index) {
  const slug = `${arte.template || 'arte'}-${arte.page || 'page'}`.replace(/[^\w-]/g, '-');
  return `arte_${slug}_${index + 1}.png`;
}

function resolveTheme(manifestInfo, arte) {
  const themeName = normalizeString(arte.parameters?.theme);
  if (!themeName) {
    return { themeName: null, themeStylesheet: null };
  }

  const stylesheet = `../css/theme-${themeName}.css`;
  return { themeName, themeStylesheet: stylesheet };
}

async function renderArte(browser, arte, manifestInfo, index, outputDir) {
  const { manifest, htmlPath, template, page } = manifestInfo;
  const logoField = manifest.logoField || 'logo';
  const dimensions = ensureDimensions(manifest);

  const pageInstance = await browser.newPage();
  pageInstance.setDefaultNavigationTimeout(50000);
  pageInstance.setDefaultTimeout(50000);
  await pageInstance.setViewport(dimensions);
  await pageInstance.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0' });

  const resolvedBg = resolveBgAsset(arte.bg);
  const logoAsset = await resolveLogoAsset(arte[logoField], arte.logoAlt || arte.parameters?.logoAlt);
  if (!logoAsset) {
    throw new GeneratorError('Falha ao resolver logo', 'ASSET');
  }

  const { themeName, themeStylesheet } = resolveTheme(manifestInfo, arte);

  const bindingData = {
    ...arte,
    resolvedBg,
    resolvedLogo: logoAsset,
    themeName,
    themeStylesheet,
  };

  const bindingPayload = buildBindingPayload(manifest, bindingData);
  await applyBindings(pageInstance, bindingPayload);
  await waitForImages(pageInstance);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = buildFileName({ template, page }, index);
  const outputPath = path.join(outputDir, filename);

  await pageInstance.screenshot({ path: outputPath });
  await pageInstance.close();

  return { filename, outputPath };
}

async function renderArteToBuffer(browser, arte, manifestInfo) {
  const { manifest, htmlPath, template, page } = manifestInfo;
  const logoField = manifest.logoField || 'logo';
  const dimensions = ensureDimensions(manifest);

  const pageInstance = await browser.newPage();
  pageInstance.setDefaultNavigationTimeout(50000);
  pageInstance.setDefaultTimeout(50000);
  await pageInstance.setViewport(dimensions);
  await pageInstance.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0' });

  const resolvedBg = resolveBgAsset(arte.bg);
  const logoAsset = await resolveLogoAsset(arte[logoField], arte.logoAlt || arte.parameters?.logoAlt);
  if (!logoAsset) {
    throw new GeneratorError('Falha ao resolver logo', 'ASSET');
  }

  const { themeName, themeStylesheet } = resolveTheme(manifestInfo, arte);

  const bindingData = {
    ...arte,
    resolvedBg,
    resolvedLogo: logoAsset,
    themeName,
    themeStylesheet,
  };

  const bindingPayload = buildBindingPayload(manifest, bindingData);
  await applyBindings(pageInstance, bindingPayload);
  await waitForImages(pageInstance);

  const filename = buildFileName({ template, page }, 0);
  const buffer = await pageInstance.screenshot({ type: 'png' });
  await pageInstance.close();

  return { filename, buffer };
}

async function run(artes, options = {}) {
  if (!Array.isArray(artes) || artes.length === 0) {
    throw new GeneratorError('Payload inválido: "artes" deve ser um array com ao menos um item.', 'VALIDATION');
  }

  if (isGenerating) {
    throw new GeneratorError('Já existe uma geração em andamento.', 'BUSY');
  }

  isGenerating = true;
  const files = [];
  const logs = [];
  const outputDir = options.outputDir || config.outputDir;

  let browser;

  try {
    browser = await puppeteer.launch();

    for (let i = 0; i < artes.length; i++) {
      const arteInput = artes[i];
      const template = arteInput?.template;
      const page = arteInput?.page || 'index';

      try {
        const manifestInfo = loadManifest(template, page);
        const arte = validateArte(arteInput, manifestInfo.manifest);
        const { filename, outputPath } = await renderArte(browser, arte, manifestInfo, i, outputDir);

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
    throw new GeneratorError('Nenhuma arte pôde ser gerada.', 'GENERATION_ERROR', { logs });
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
    const arte = validateArte(arteInput, manifestInfo.manifest);

    const outputDir = options.outputDir || config.outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    browser = await puppeteer.launch();
    const { filename, buffer } = await renderArteToBuffer(browser, arte, manifestInfo);

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
  buildArteSchema,
  validateArte,
  resolveLogoAsset,
  resolveBgAsset,
};
