function bindingRuntime(payload) {
  const toClassList = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
    if (value === undefined || value === null) return [];
    return [String(value)];
  };

  const getValue = (data, field, fallback) => {
    if (!field) return fallback;
    return field.split('.').reduce((acc, key) => {
      if (acc && typeof acc === 'object' && key in acc) {
        return acc[key];
      }
      return undefined;
    }, data);
  };

  const isNil = (val) => val === undefined || val === null;

  const shouldSkip = (entry, value) => {
    if (entry && entry.allowEmpty) return false;
    if (isNil(value)) return true;
    if (typeof value === 'string' && !value.trim().length) return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  };

  const ensureLogoA11y = (target, altText) => {
    if (!target.hasAttribute('role')) {
      target.setAttribute('role', 'img');
    }
    if (altText && !target.hasAttribute('aria-label')) {
      target.setAttribute('aria-label', altText);
    }
  };

  const applyLogo = (el, payload, binding) => {
    const fallbackAlt = binding?.alt || 'Logo';
    const altText =
      (payload && typeof payload.alt === 'string' && payload.alt.trim()) ||
      el.getAttribute('aria-label') ||
      el.getAttribute('alt') ||
      fallbackAlt;

    const tagName = el.tagName.toLowerCase();
    if (!payload) {
      if (tagName === 'img') {
        el.removeAttribute('src');
      } else {
        el.innerHTML = '';
      }
      if (binding?.required) {
        throw new Error('Valor necess?rio ausente para "logo"');
      }
      return;
    }

    if (payload.kind === 'inline-svg') {
      if (tagName === 'img') {
        const container = document.createElement('div');
        Array.from(el.attributes).forEach((attr) => {
          if (attr.name === 'src' || attr.name === 'alt') {
            return;
          }
          container.setAttribute(attr.name, attr.value);
        });
        container.innerHTML = payload.markup;
        ensureLogoA11y(container, altText);
        el.replaceWith(container);
        return;
      }
      el.innerHTML = payload.markup;
      ensureLogoA11y(el, altText);
      return;
    }

    if (payload.kind === 'image') {
      if (tagName === 'img') {
        el.src = payload.src;
        if (altText && !el.getAttribute('alt')) {
          el.alt = altText;
        }
        return;
      }
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
      return;
    }

    throw new Error(`Tipo de logo desconhecido: ${payload && payload.kind}`);
  };

  const { bindings, cssVars, classes, attributes, data } = payload;

  bindings.forEach((binding) => {
    const selector = binding.selector;
    if (!selector) {
      return;
    }
    const value = Object.prototype.hasOwnProperty.call(binding, 'value') ? binding.value : getValue(data, binding.field);
    if (shouldSkip(binding, value)) {
      if (binding.required) {
        throw new Error(`Valor necess?rio ausente para "${binding.field || selector}"`);
      }
      return;
    }
    const targets = Array.from(document.querySelectorAll(selector));
    if (!targets.length) {
      if (binding.required) {
        throw new Error(`Elemento n?o encontrado para o seletor "${selector}"`);
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
        case 'logo':
          applyLogo(el, value, binding);
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
    const value = Object.prototype.hasOwnProperty.call(entry, 'value') ? entry.value : getValue(data, entry.field);
    if (shouldSkip(entry, value)) {
      if (entry.required) {
        throw new Error(`Valor necess?rio ausente para a vari?vel CSS "${entry.name}"`);
      }
      return;
    }
    const targets = selector === ':root' ? [document.documentElement] : Array.from(document.querySelectorAll(selector));
    targets.forEach((el) => {
      el.style.setProperty(entry.name, String(value));
    });
  });

  classes.forEach((entry) => {
    const selector = entry.selector || 'body';
    const value = Object.prototype.hasOwnProperty.call(entry, 'value') ? entry.value : getValue(data, entry.field);
    if (shouldSkip(entry, value)) {
      if (entry.required) {
        throw new Error(`Classes necess?rias ausentes para o seletor "${selector}"`);
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
    const value = Object.prototype.hasOwnProperty.call(entry, 'value') ? entry.value : getValue(data, entry.field);
    if (shouldSkip(entry, value)) {
      if (entry.required) {
        throw new Error(`Valor necess?rio ausente para o atributo "${entry.name}" no seletor "${selector}"`);
      }
      return;
    }
    const targets = Array.from(document.querySelectorAll(selector));
    targets.forEach((el) => {
      el.setAttribute(entry.name, String(value));
    });
  });
}

async function applyBindings(page, payload) {
  return page.evaluate(bindingRuntime, payload);
}

function buildBindingPayload(manifest, data) {
  return {
    bindings: Array.isArray(manifest.bindings) ? manifest.bindings : [],
    cssVars: Array.isArray(manifest.cssVars) ? manifest.cssVars : [],
    classes: Array.isArray(manifest.classes) ? manifest.classes : [],
    attributes: Array.isArray(manifest.attributes) ? manifest.attributes : [],
    data,
  };
}

module.exports = {
  applyBindings,
  buildBindingPayload,
};
