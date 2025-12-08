const fs = require('fs');
const path = require('path');

const TEMPLATE_ROOT = path.resolve('templates');

function getManifestPath(template, page) {
  return path.join(TEMPLATE_ROOT, template, page, 'manifest.json');
}

function readJson(manifestPath) {
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  return JSON.parse(raw);
}

function ensureTemplateExists(templateDir, pageDir) {
  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template não encontrado: ${templateDir}`);
  }
  if (!fs.existsSync(pageDir)) {
    throw new Error(`Página do template não encontrada: ${pageDir}`);
  }
}

function loadManifest(template, page) {
  const manifestPath = getManifestPath(template, page);
  const templateDir = path.join(TEMPLATE_ROOT, template);
  const pageDir = path.dirname(manifestPath);
  const htmlPath = path.join(pageDir, 'index.html');

  ensureTemplateExists(templateDir, pageDir);

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifesto não encontrado em ${manifestPath}`);
  }
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`index.html não encontrado para ${template}/${page}`);
  }

  const manifest = readJson(manifestPath);
  return {
    manifest,
    manifestPath,
    template,
    page,
    templateDir,
    pageDir,
    htmlPath,
  };
}

function listTemplates() {
  if (!fs.existsSync(TEMPLATE_ROOT)) {
    return [];
  }

  return fs
    .readdirSync(TEMPLATE_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .map((templateName) => {
      const templateDir = path.join(TEMPLATE_ROOT, templateName);
      const pages =
        fs
          .readdirSync(templateDir, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name)
          .map((pageName) => {
            const manifestPath = getManifestPath(templateName, pageName);
            if (!fs.existsSync(manifestPath)) {
              return null;
            }
            try {
              const manifest = readJson(manifestPath);
              return {
                name: pageName,
                manifest,
                manifestPath,
                htmlPath: path.join(templateDir, pageName, 'index.html'),
              };
            } catch (error) {
              return {
                name: pageName,
                manifestError: error.message,
                manifestPath,
                htmlPath: path.join(templateDir, pageName, 'index.html'),
              };
            }
          })
          .filter(Boolean);

      return { template: templateName, pages };
    });
}

module.exports = {
  loadManifest,
  listTemplates,
};
