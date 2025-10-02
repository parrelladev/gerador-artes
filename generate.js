const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const templateConfig = require('./template-config');
const axios = require('axios');
const { pathToFileURL } = require('url');

const FALLBACK_DIMENSIONS = { width: 1080, height: 1350 };
const LOGO_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
const logoCache = new Map();

const cloneItem = (item) => (item ? { ...item } : item);

function cloneArray(list) {
  if (!Array.isArray(list)) return [];
  return list.map(cloneItem).filter(Boolean);
}

function mergeConfigArrays(...arrays) {
  return arrays.flatMap(cloneArray).filter(Boolean);
}

function pickFirstString(...values) {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length) {
        return trimmed;
      }
    }
  }
  return null;
}


function sanitizeSvgMarkup(svgContent) {
  if (typeof svgContent !== 'string') {
    return '';
  }
  return svgContent
    .replace(/<\?xml[^>]*\?>\s*/i, '')
    .replace(/<!DOCTYPE[^>]*>\s*/i, '')
    .trim();
}

function ensureSvgMarkup(svgContent, sourceLabel) {
  const cleaned = sanitizeSvgMarkup(svgContent);
  if (!cleaned.includes('<svg')) {
    throw new Error(`Conteudo SVG invalido para logo: ${sourceLabel}`);
  }
  return cleaned;
}

const LOGO_ALT_TEXT = 'Logo';
const REMOTE_SVG_PATTERN = /\.svg(\?|#|$)/i;

function isRemoteUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

async function resolveLogoAsset(value, altText = LOGO_ALT_TEXT) {
  if (!value) {
    return null;
  }

  const cached = logoCache.get(value);
  if (cached) {
    return { ...cached, alt: altText || cached.alt || LOGO_ALT_TEXT };
  }

  if (isRemoteUrl(value)) {
    if (REMOTE_SVG_PATTERN.test(value)) {
      const response = await axios.get(value, { responseType: 'text' });
      const markup = ensureSvgMarkup(response.data, value);
      const result = { kind: 'inline-svg', markup, source: value, sourceType: 'remote' };
      logoCache.set(value, result);
      return { ...result, alt: altText || LOGO_ALT_TEXT };
    }

    const result = { kind: 'image', src: value, source: value, sourceType: 'remote' };
    logoCache.set(value, result);
    return { ...result, alt: altText || LOGO_ALT_TEXT };
  }

  const extension = path.extname(value);
  const candidateNames = extension ? [value] : LOGO_EXTENSIONS.map((ext) => `${value}${ext}`);

  for (const candidateName of candidateNames) {
    const filePath = path.resolve('./input', candidateName);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    if (candidateName.toLowerCase().endsWith('.svg')) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const markup = ensureSvgMarkup(fileContent, candidateName);
      const result = { kind: 'inline-svg', markup, source: filePath, sourceType: 'local' };
      logoCache.set(value, result);
      return { ...result, alt: altText || LOGO_ALT_TEXT };
    }

    const result = { kind: 'image', src: pathToFileURL(filePath).href, source: filePath, sourceType: 'local' };
    logoCache.set(value, result);
    return { ...result, alt: altText || LOGO_ALT_TEXT };
  }

  throw new Error(`Arquivo de logo nao encontrado: ${value}`);
}

function resolveTemplateSetup(templateName, pageName) {
  const defaults = templateConfig.defaults || {};
  const templateEntry = (templateConfig.templates && templateConfig.templates[templateName]) || {};
  const pageEntry = (templateEntry.pages && templateEntry.pages[pageName]) || {};

  const dimensions =
    pageEntry.dimensions ||
    templateEntry.dimensions ||
    defaults.dimensions ||
    FALLBACK_DIMENSIONS;

  return {
    dimensions,
    bindings: mergeConfigArrays(defaults.bindings, templateEntry.bindings, pageEntry.bindings),
    cssVars: mergeConfigArrays(defaults.cssVars, templateEntry.cssVars, pageEntry.cssVars),
    classes: mergeConfigArrays(defaults.classes, templateEntry.classes, pageEntry.classes),
    attributes: mergeConfigArrays(defaults.attributes, templateEntry.attributes, pageEntry.attributes),
  };
}

function validateTemplate(templateName, pageName) {
  const nestedPath = path.join('templates', templateName, pageName);
  if (fs.existsSync(nestedPath)) {
    return nestedPath;
  }

  const directPath = path.join('templates', templateName);
  const directIndex = path.join(directPath, 'index.html');
  if (fs.existsSync(directIndex)) {
    return directPath;
  }

  throw new Error(`Template "${templateName}/${pageName}" nao encontrado.`);
}

async function waitForImages(page) {
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error(`Timeout ao carregar imagem: ${img.src}`)), 10000);
          img.onload = () => {
            clearTimeout(timer);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timer);
            reject(new Error(`Erro ao carregar imagem: ${img.src}`));
          };
        });
      })
    );
  });
}

(async () => {
  const data = JSON.parse(fs.readFileSync('./input/data.json', 'utf-8'));
  const outputDir = process.env.OUTPUT_DIR || './output';
  const processedFiles = [];

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.setDefaultNavigationTimeout(50000);
  page.setDefaultTimeout(50000);

  for (let i = 0; i < data.length; i++) {
    try {
      const item = data[i];
      const { template, page: pageName, h1, h2, bg, logo, text, tag } = item;

      console.log(`\n[info] Processando arte ${i + 1} com template ${template}/${pageName}...`);

      const setup = resolveTemplateSetup(template, pageName);
      const { bindings, cssVars, classes, attributes, dimensions } = setup;

      await page.setViewport({ width: dimensions.width, height: dimensions.height });
      console.log(`[info] Dimensoes configuradas para ${dimensions.width}x${dimensions.height}`);

      const templatePath = validateTemplate(template, pageName);
      const templateURL = 'file://' + path.resolve(path.join(templatePath, 'index.html'));

      await page.goto(templateURL, { waitUntil: 'networkidle0' });

      const selectedBg = pickFirstString(
        item.customBg,
        item.userBg,
        item.manualBg,
        item.overrideBg,
        item.parameters?.bgOverride,
        bg,
        item.originalBg
      );

      if (!selectedBg) {
        throw new Error('Parametro "bg" eh obrigatorio e deve ser uma string nao vazia.');
      }

      const selectedLogo = pickFirstString(logo);

      if (!selectedLogo) {
        throw new Error('Parametro "logo" eh obrigatorio e deve ser uma string nao vazia.');
      }

      const normalizedBg = selectedBg;
      const normalizedLogo = selectedLogo;

      const bgPath = normalizedBg.startsWith('http')
        ? normalizedBg
        : 'file://' + path.resolve('./input/' + normalizedBg + '.png');

      if (!normalizedBg.startsWith('http') && !fs.existsSync('./input/' + normalizedBg + '.png')) {
        throw new Error(`Arquivo de background nao encontrado: ${normalizedBg}.png`);
      }

      const logoAsset = await resolveLogoAsset(normalizedLogo, pickFirstString(item.logoAlt, item.parameters?.logoAlt));

      if (!logoAsset) {
        throw new Error('Falha ao resolver o logo para a arte.');
      }

      console.log(`[info] Logo resolvido como ${logoAsset.kind} (${logoAsset.sourceType})`);


      const themeName = item.parameters?.theme ? String(item.parameters.theme) : null;
      const themeStylesheet = themeName ? `css/theme-${themeName}.css` : null;

      const bindingData = {
        ...item,
        selectedBg: normalizedBg,
        selectedLogo: normalizedLogo,
        resolvedBg: bgPath,
        resolvedLogo: logoAsset,
        themeName,
        themeStylesheet,
        parameters: item.parameters || {},
      };

      await page.evaluate((payload) => {
        const { bindings, cssVars, classes, attributes, data } = payload;

        const getValue = (field, fallback) => {
          if (!field) return fallback;
          return field.split('.').reduce((acc, key) => {
            if (acc && typeof acc === 'object' && key in acc) {
              return acc[key];
            }
            return undefined;
          }, data);
        };

        const isNil = (val) => val === undefined || val === null;
        const isEmptyString = (val) => typeof val === 'string' && val.trim().length === 0;
        const isEmptyArray = (val) => Array.isArray(val) && val.length === 0;

        const shouldSkip = (entry, value) => {
          if (entry && entry.allowEmpty) return false;
          if (isNil(value)) return true;
          if (isEmptyString(value)) return true;
          if (isEmptyArray(value)) return true;
          return false;
        };

        const toClassList = (value) => {
          if (Array.isArray(value)) return value.filter(Boolean);
          if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
          return [String(value)];
        };

        bindings.forEach((binding) => {
          const selector = binding.selector;
          if (!selector) {
            return;
          }
          const value = Object.prototype.hasOwnProperty.call(binding, 'value')
            ? binding.value
            : getValue(binding.field);
          if (shouldSkip(binding, value)) {
            if (binding.required) {
              throw new Error(`Valor necessario ausente para "${binding.field || selector}"`);
            }
            return;
          }
          const targets = Array.from(document.querySelectorAll(selector));
          if (!targets.length) {
            if (binding.required) {
              throw new Error(`Elemento nao encontrado para o seletor "${selector}"`);
            }
            return;
          }
          targets.forEach((el) => {
            switch (binding.type) {
              case 'html':
                el.innerHTML = String(value);
                break;
              case 'attribute': {
                const name = binding.attribute || binding.name;
                if (!name) {
                  throw new Error(`Binding de atributo sem "name" para o seletor "${selector}"`);
                }
                el.setAttribute(name, String(value));
                break;
              }
              case 'class': {
                const classesToApply = toClassList(value);
                if (binding.mode === 'replace') {
                  el.className = classesToApply.join(' ');
                } else if (binding.mode === 'toggle') {
                  classesToApply.forEach((cls) => el.classList.toggle(cls));
                } else {
                  classesToApply.forEach((cls) => el.classList.add(cls));
                }
                break;
              }
              case 'style': {
                if (!binding.property) {
                  throw new Error(`Binding de estilo sem "property" para o seletor "${selector}"`);
                }
                el.style[binding.property] = String(value);
                break;
              }
              case 'dataset': {
                if (!binding.datasetKey) {
                  throw new Error(`Binding de dataset sem "datasetKey" para o seletor "${selector}"`);
                }
                el.dataset[binding.datasetKey] = String(value);
                break;
              }
              case 'image':
                el.src = String(value);
                break;

              case 'logo': {
                const payload = value;
                const fallbackAlt = binding.alt || 'Logo';
                const getAltText = () => {
                  if (payload && typeof payload.alt === 'string' && payload.alt.trim().length) {
                    return payload.alt;
                  }
                  const ariaLabel = el.getAttribute('aria-label');
                  if (ariaLabel && ariaLabel.trim().length) {
                    return ariaLabel;
                  }
                  const altAttr = el.getAttribute('alt');
                  if (altAttr && altAttr.trim().length) {
                    return altAttr;
                  }
                  return fallbackAlt;
                };
                const altText = getAltText();
                const tagName = el.tagName.toLowerCase();

                if (!payload) {
                  if (tagName === 'img') {
                    el.removeAttribute('src');
                  } else {
                    el.innerHTML = '';
                  }
                  if (binding.required) {
                    throw new Error('Valor necessario ausente para "logo"');
                  }
                  break;
                }

                if (payload.kind === 'inline-svg') {
                  const ensureA11y = (target) => {
                    if (!target.hasAttribute('role')) {
                      target.setAttribute('role', 'img');
                    }
                    if (altText && !target.hasAttribute('aria-label')) {
                      target.setAttribute('aria-label', altText);
                    }
                  };

                  if (tagName === 'img') {
                    const container = document.createElement('div');
                    Array.from(el.attributes).forEach((attr) => {
                      if (attr.name === 'src' || attr.name === 'alt') {
                        return;
                      }
                      container.setAttribute(attr.name, attr.value);
                    });
                    container.innerHTML = payload.markup;
                    ensureA11y(container);
                    el.replaceWith(container);
                  } else {
                    el.innerHTML = payload.markup;
                    ensureA11y(el);
                  }
                  break;
                }

                if (payload.kind === 'image') {
                  if (tagName === 'img') {
                    el.src = payload.src;
                    if (altText && !el.getAttribute('alt')) {
                      el.alt = altText;
                    }
                  } else {
                    const imgEl = document.createElement('img');
                    imgEl.src = payload.src;
                    if (altText) {
                      imgEl.alt = altText;
                    }
                    imgEl.decoding = 'async';
                    imgEl.loading = 'lazy';
                    imgEl.style.width = '100%';
                    imgEl.style.height = 'auto';
                    el.innerHTML = '';
                    el.appendChild(imgEl);
                  }
                  break;
                }

                throw new Error(`Tipo de logo desconhecido: ${payload && payload.kind}`);
              }

          case 'image':
            el.src = String(value);
            break;
              case 'text':
              default:
                el.textContent = String(value);
                break;
            }
          });
        });

        cssVars.forEach((entry) => {
          const selector = entry.selector || ':root';
          const value = Object.prototype.hasOwnProperty.call(entry, 'value')
            ? entry.value
            : getValue(entry.field);
          if (shouldSkip(entry, value)) {
            if (entry.required) {
              throw new Error(`Valor necessario ausente para a variavel CSS "${entry.name}"`);
            }
            return;
          }
          const targets = selector === ':root'
            ? [document.documentElement]
            : Array.from(document.querySelectorAll(selector));
          targets.forEach((el) => {
            el.style.setProperty(entry.name, String(value));
          });
        });

        classes.forEach((entry) => {
          const selector = entry.selector || 'body';
          const value = Object.prototype.hasOwnProperty.call(entry, 'value')
            ? entry.value
            : getValue(entry.field);
          if (shouldSkip(entry, value)) {
            if (entry.required) {
              throw new Error(`Classes necessarias ausentes para o seletor "${selector}"`);
            }
            return;
          }
          const targets = Array.from(document.querySelectorAll(selector));
          const classesToApply = toClassList(value);
          targets.forEach((el) => {
            if (entry.mode === 'replace') {
              el.className = classesToApply.join(' ');
            } else if (entry.mode === 'toggle') {
              classesToApply.forEach((cls) => el.classList.toggle(cls));
            } else {
              classesToApply.forEach((cls) => el.classList.add(cls));
            }
          });
        });

        attributes.forEach((entry) => {
          const selector = entry.selector;
          if (!selector) {
            return;
          }
          const value = Object.prototype.hasOwnProperty.call(entry, 'value')
            ? entry.value
            : getValue(entry.field);
          if (shouldSkip(entry, value)) {
            if (entry.required) {
              throw new Error(`Valor necessario ausente para o atributo "${entry.name}" no seletor "${selector}"`);
            }
            return;
          }
          const targets = Array.from(document.querySelectorAll(selector));
          targets.forEach((el) => {
            el.setAttribute(entry.name, String(value));
          });
        });
      }, { bindings, cssVars, classes, attributes, data: bindingData });

      console.log('[info] Aguardando carregamento das imagens...');
      await waitForImages(page);
      console.log('[info] Imagens carregadas com sucesso.');

      const fileName = `arte_${template}_${pageName}_${i + 1}.png`;
      const outputFilePath = path.join(outputDir, fileName);
      await page.screenshot({ path: outputFilePath });
      processedFiles.push(fileName);
      console.log(`[ok] Imagem salva em ${outputFilePath}`);
    } catch (error) {
      console.error(`[erro] Falha ao processar arte ${i + 1}:`, error.message);
    }
  }

  await browser.close();
  console.log('\n[ok] Processo finalizado!');
  console.log(JSON.stringify(processedFiles));
})();

