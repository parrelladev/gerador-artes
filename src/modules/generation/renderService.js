const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { buildBindingPayload, applyBindings } = require('../../lib/binding');
const { resolveBgAsset, resolveLogoAsset } = require('./assetResolver');
const { GeneratorError } = require('./errors');

function ensureDimensions(manifest) {
  const dims = manifest.dimensions || {};
  const width = Number(dims.width);
  const height = Number(dims.height);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new GeneratorError('Dimensões inválidas no manifest', 'VALIDATION');
  }

  return { width, height };
}

async function waitForImages(pageInstance) {
  await pageInstance.evaluate(
    async () =>
      new Promise((resolve) => {
        const images = Array.from(document.images || []);

        if (!images.length) {
          resolve();
          return;
        }

        let pending = images.length;

        function done() {
          pending -= 1;
          if (pending <= 0) {
            resolve();
          }
        }

        images.forEach((img) => {
          if (img.complete && img.naturalWidth > 0) {
            done();
          } else {
            img.addEventListener('load', done);
            img.addEventListener('error', done);
          }
        });
      }),
  );
}

function buildFileName(arte, index) {
  const safeTemplate = String(arte.template || 'template').replace(/[^a-z0-9-_]+/gi, '-');
  const safePage = String(arte.page || 'index').replace(/[^a-z0-9-_]+/gi, '-');
  const suffix = String(index + 1).padStart(3, '0');
  return `${safeTemplate}-${safePage}-${suffix}.png`;
}

function resolveTheme(manifestInfo, arte) {
  const themeParam = arte.parameters && typeof arte.parameters.theme === 'string' ? arte.parameters.theme.trim() : null;
  const themeName = themeParam || null;
  const themeStylesheet = themeName ? `../css/theme-${themeName}.css` : null;
  return { themeName, themeStylesheet };
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

  const bgAsset = resolveBgAsset(arte.bg);
  const logoAsset = await resolveLogoAsset(arte[logoField], arte.logoAlt || arte.parameters?.logoAlt);
  if (!logoAsset) {
    throw new GeneratorError('Falha ao resolver logo', 'ASSET');
  }

  const { themeName, themeStylesheet } = resolveTheme(manifestInfo, arte);

  const bindingData = {
    ...arte,
    resolvedBg: bgAsset ? bgAsset.src : null,
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

  const bgAsset = resolveBgAsset(arte.bg);
  const logoAsset = await resolveLogoAsset(arte[logoField], arte.logoAlt || arte.parameters?.logoAlt);
  if (!logoAsset) {
    throw new GeneratorError('Falha ao resolver logo', 'ASSET');
  }

  const { themeName, themeStylesheet } = resolveTheme(manifestInfo, arte);

  const bindingData = {
    ...arte,
    resolvedBg: bgAsset ? bgAsset.src : null,
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

module.exports = {
  ensureDimensions,
  renderArte,
  renderArteToBuffer,
};
