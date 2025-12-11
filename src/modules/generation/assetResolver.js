const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const axios = require('axios');
const { GeneratorError } = require('./errors');

const INPUT_DIR = path.resolve('input');
const LOGO_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
const BG_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const LOGO_CACHE = new Map();

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

  throw new GeneratorError(`Logo não encontrada: ${value}`, 'ASSET');
}

function resolveBgAsset(value) {
  if (!value) {
    return null;
  }

  if (isRemoteUrl(value)) {
    return { kind: 'image', src: value, source: value, sourceType: 'remote' };
  }

  const extension = path.extname(value);
  const candidateNames = extension ? [value] : BG_EXTENSIONS.map((ext) => `${value}${ext}`);

  for (const candidate of candidateNames) {
    const candidatePath = path.isAbsolute(candidate) ? candidate : path.join(INPUT_DIR, candidate);
    if (!fs.existsSync(candidatePath)) continue;

    return {
      kind: 'image',
      src: pathToFileURL(candidatePath).href,
      source: candidatePath,
      sourceType: 'local',
    };
  }

  throw new GeneratorError(`Imagem de fundo não encontrada: ${value}`, 'ASSET');
}

module.exports = {
  resolveLogoAsset,
  resolveBgAsset,
};

