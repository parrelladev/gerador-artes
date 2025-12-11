const fs = require('fs');
const path = require('path');

const ENV_DEFAULTS = {
  port: 3000,
  outputDir: './output',
  publicOutputDir: '/output',
};

function loadFileConfig() {
  const configPath = path.resolve('config.js');
  if (!fs.existsSync(configPath)) {
    return {};
  }
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(configPath);
  } catch (error) {
    console.warn('[config] Falha ao carregar config.js, usando variáveis de ambiente', error.message);
    return {};
  }
}

function normalizeDir(value, fallback) {
  if (!value || typeof value !== 'string') {
    return path.resolve(fallback);
  }
  return path.resolve(value);
}

const fileConfig = loadFileConfig();

const port = Number(process.env.PORT || fileConfig.port || ENV_DEFAULTS.port);
const outputDir = normalizeDir(process.env.OUTPUT_DIR || fileConfig.outputDir || ENV_DEFAULTS.outputDir, ENV_DEFAULTS.outputDir);
const publicOutputDir = process.env.PUBLIC_OUTPUT_DIR || fileConfig.publicOutputDir || ENV_DEFAULTS.publicOutputDir;

module.exports = {
  port,
  outputDir,
  publicOutputDir,
};
