const storyTemplates = [
  // PRINCIPAIS
  {
    id: 'agazeta-foto-abaixo',
    name: 'A Gazeta - Foto abaixo',
    group: 'Principais',
    preview: 'previews/stories/Marca-A-Gazeta.png',
    defaultTheme: 'azul',
    themes: [
      { id: 'azul', name: 'Azul', preview: 'previews/stories/horiz-foto-lateral-azul.png' },
      { id: 'branco', name: 'Branco', preview: 'previews/stories/horiz-conteudo-central-vermelho.png' },
      { id: 'preto', name: 'Preto', preview: 'previews/stories/horiz-foto-acima-laranja.png' }
    ]
  },
  {
    id: 'agazeta-foto-acima',
    name: 'A Gazeta - Foto acima',
    group: 'Principais',
    preview: 'previews/stories/Marca-A-Gazeta.png',
    defaultTheme: 'azul',
    themes: [
      { id: 'azul', name: 'Azul', preview: 'previews/stories/vert-foto-acima-azul.png' },
      { id: 'branco', name: 'Branco', preview: 'previews/stories/vert-conteudo-central-verde.png' },
      { id: 'preto', name: 'Preto', preview: 'previews/stories/vert-conteudo-inferior-roxo.png' }
    ]
  },
  {
    id: 'layout-hz',
    name: 'HZ Entretenimento',
    group: 'Principais',
    preview: 'previews/stories/Marca-HZ-Principal-Positivo.png',
    defaultTheme: 'rosa',
    themes: [
      { id: 'rosa', name: 'Rosa', preview: 'previews/stories/horiz-conteudo-diagonal-roxo.png' },
      { id: 'amarelo', name: 'Amarelo', preview: 'previews/stories/vert-foto-lateral-amarelo.png' }
    ]
  },

  // ESPECIAIS
  {
    id: 'colunistas',
    name: 'A Gazeta - Colunistas',
    group: 'Especiais',
    status: 'construction',
    preview: 'previews/stories/Marca-A-Gazeta-Black.png',
    themes: []
  },
  {
    id: 'opiniao',
    name: 'A Gazeta - Opiniao',
    group: 'Especiais',
    status: 'construction',
    preview: 'previews/stories/Marca-A-Gazeta-Black.png',
    themes: []
  },
  {
    id: 'layout-bbc',
    name: 'BBC News',
    group: 'Especiais',
    status: 'construction',
    preview: 'previews/stories/Marca-BBC.png',
    themes: []
  },
  {
    id: 'fonte-hub',
    name: 'Fonte Hub',
    group: 'Especiais',
    preview: 'previews/stories/Marca-Fonte-Hub.png',
    themes: []
  },
  {
    id: 'se-cuida',
    name: 'HZ - Se Cuida',
    group: 'Especiais',
    preview: 'previews/stories/Marca-Se-Cuida.png',
    themes: []
  },
  {
    id: 'rede-gazeta',
    name: 'Rede Gazeta',
    group: 'Especiais',
    preview: 'previews/stories/Marca-Rede-Gazeta.png',
    themes: []
  }
];

const templateLookup = Object.fromEntries(storyTemplates.map(template => [template.id, template]));
const storyGroups = Array.from(new Set(storyTemplates.map(template => template.group)));
const manifestCache = {};

let currentTemplate = null;
let currentTemplateMeta = null;
let currentTheme = null;
let activeStoryGroup = storyGroups[0] || null;

const modal = document.getElementById('templateModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const generateBtn = document.getElementById('generateBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');
const newsUrl = document.getElementById('newsUrl');
const customTitle = document.getElementById('customTitle');
const customSubtitle = document.getElementById('customSubtitle');
const customImageUrl = document.getElementById('customImageUrl');
const themeWrapper = document.getElementById('themeWrapper');
const customTheme = document.getElementById('customTheme');
const customTag = document.getElementById('customTag');
const modalTitle = document.getElementById('modalTitle');
const storyCategoryTabs = document.getElementById('storyCategoryTabs');
const storyTemplateGrid = document.getElementById('storyTemplateGrid');

document.addEventListener('DOMContentLoaded', () => {
  if (themeWrapper) {
    themeWrapper.style.display = 'none';
  }

  renderCategoryTabs();
  renderTemplateCards();
  setupEventListeners();
});

function setupEventListeners() {
  if (storyCategoryTabs) {
    storyCategoryTabs.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-group]');
      if (!tab) return;

      const { group } = tab.dataset;
      if (group && group !== activeStoryGroup) {
        activeStoryGroup = group;
        renderCategoryTabs();
        renderTemplateCards();
      }
    });
  }

  if (storyTemplateGrid) {
    storyTemplateGrid.addEventListener('click', (event) => {
      const card = event.target.closest('.template-card');
      if (!card) return;

      const templateId = card.dataset.template;
      if (templateId) {
        openModal(templateId);
      }
    });
  }

  document.addEventListener('click', (event) => {
    const card = event.target.closest('.template-card');
    if (!card || card.closest('#storyTemplateGrid')) return;

    const templateId = card.dataset.template;
    if (templateId) {
      openModal(templateId);
    }
  });

  closeModal.addEventListener('click', closeModalHandler);
  cancelBtn.addEventListener('click', closeModalHandler);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModalHandler();
    }
  });

  generateBtn.addEventListener('click', generateArt);

  newsUrl.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      generateArt();
    }
  });

  if (customTheme) {
    customTheme.addEventListener('change', (event) => {
      currentTheme = event.target.value || null;
      updateModalTitle();
    });
  }
}

function renderCategoryTabs() {
  if (!storyCategoryTabs) return;

  storyCategoryTabs.innerHTML = '';

  storyGroups.forEach(group => {
    const tabButton = document.createElement('button');
    tabButton.type = 'button';
    tabButton.className = `category-tab${group === activeStoryGroup ? ' active' : ''}`;
    tabButton.dataset.group = group;
    tabButton.textContent = group;
    storyCategoryTabs.appendChild(tabButton);
  });
}

function renderTemplateCards() {
  if (!storyTemplateGrid) return;

  storyTemplateGrid.innerHTML = '';

  const templatesToRender = activeStoryGroup
    ? storyTemplates.filter(template => template.group === activeStoryGroup)
    : storyTemplates;

  templatesToRender.forEach(template => {
    const card = document.createElement('div');
    card.className = 'template-card story-card';
    card.dataset.group = template.group;
    card.dataset.template = template.id;

    const themeInfo = Array.isArray(template.themes) && template.themes.length
      ? (template.themes.length === 1
        ? '<span class="template-meta">Tema unico</span>'
        : `<span class="template-meta">${template.themes.length} temas</span>`)
      : '';

    const statusPill = template.status === 'construction'
      ? '<span class="template-pill template-pill-warning">Em construção</span>'
      : '';

    card.innerHTML = `
      <div class="template-preview">
        <img src="${template.preview}" alt="${template.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="template-placeholder" style="display: none;">
          <i class="fa-solid fa-image"></i>
        </div>
      </div>
      <div class="template-info">
        <span class="template-pill">${template.group}</span>
        ${statusPill}
        <p class="template-label">${template.name}</p>
        ${themeInfo}
      </div>
    `;

    storyTemplateGrid.appendChild(card);
  });

  if (!storyTemplateGrid.children.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'Nenhum template disponivel para este agrupamento.';
    storyTemplateGrid.appendChild(emptyState);
  }
}

function updateModalTitle() {
  if (!modalTitle) return;

  if (!currentTemplateMeta) {
    modalTitle.textContent = currentTemplate ? `Gerar Arte - ${currentTemplate}` : 'Gerar Arte';
    return;
  }

  let title = `Gerar Arte - ${currentTemplateMeta.name}`;
  if (Array.isArray(currentTemplateMeta.themes) && currentTemplateMeta.themes.length) {
    const activeTheme = currentTemplateMeta.themes.find(theme => theme.id === currentTheme);
    if (activeTheme) {
      title += ` (${activeTheme.name})`;
    }
  }

  modalTitle.textContent = title;
}

function openModal(templateKey) {
  const templateData = templateLookup[templateKey];

  currentTemplateMeta = templateData || null;
  currentTemplate = templateData ? templateData.id : templateKey;

  if (templateData && Array.isArray(templateData.themes) && templateData.themes.length) {
    const defaultTheme = templateData.defaultTheme || templateData.themes[0].id;
    currentTheme = defaultTheme;

    if (customTheme) {
      customTheme.innerHTML = templateData.themes
        .map(theme => `<option value="${theme.id}">${theme.name}</option>`)
        .join('');
      customTheme.value = currentTheme;
    }

    if (themeWrapper) {
      themeWrapper.style.display = '';
    }
  } else {
    currentTheme = null;
    if (customTheme) {
      customTheme.innerHTML = '';
    }
    if (themeWrapper) {
      themeWrapper.style.display = 'none';
    }
  }

  updateModalTitle();

  newsUrl.value = '';
  customTitle.value = '';
  customSubtitle.value = '';
  customImageUrl.value = '';
  customTag.value = '';

  modal.classList.add('show');
  newsUrl.focus();
}

function closeModalHandler() {
  modal.classList.remove('show');
  currentTemplate = null;
  currentTemplateMeta = null;
  currentTheme = null;

  if (customTheme) {
    customTheme.innerHTML = '';
  }
  if (themeWrapper) {
    themeWrapper.style.display = 'none';
  }
}

async function loadManifest(template, page = 'index') {
  const cacheKey = `${template}/${page}`;
  if (manifestCache[cacheKey]) {
    return manifestCache[cacheKey];
  }

  const response = await fetch(`/api/templates/${template}/${page}`);
  if (!response.ok) {
    throw new Error('Template nao encontrado');
  }

  const data = await response.json();
  manifestCache[cacheKey] = data;
  return data;
}

async function generateArt() {
  const url = newsUrl.value.trim();
  const tag = customTag.value.trim();
  const imageOverride = customImageUrl.value.trim();

  if (!currentTemplate) {
    showToast('Escolha um template antes de gerar a arte', 'error');
    return;
  }

  if (!url) {
    showToast('Por favor, insira o link da noticia', 'error');
    newsUrl.focus();
    return;
  }

  if (!isValidUrl(url)) {
    showToast('Por favor, insira um link valido', 'error');
    newsUrl.focus();
    return;
  }

  if (!tag) {
    showToast('Por favor, insira a categoria da noticia', 'error');
    customTag.focus();
    return;
  }

  if (imageOverride && !isValidUrl(imageOverride)) {
    showToast('Informe um link de imagem valido (http ou https).', 'error');
    customImageUrl.focus();
    return;
  }

  try {
    showLoading();

    const manifestData = await loadManifest(currentTemplate, 'index');
    const logoField = manifestData.manifest?.logoField || 'logo';
    const defaultLogo = manifestData.manifest?.defaultLogo || 'logo-a-gazeta';
    const pageName = manifestData.page || 'index';

    const artData = {
      template: currentTemplate,
      page: pageName,
      h1: customTitle.value.trim() || null,
      h2: customSubtitle.value.trim() || null,
      tag: tag,
      bg: null,
      sourceUrl: url
    };

    const parameters = {};
    if (currentTheme) {
      parameters.theme = currentTheme;
    }
    if (Object.keys(parameters).length) {
      artData.parameters = parameters;
    }

    const extractedData = await extractNewsData(url);

    if (extractedData.h1 && !customTitle.value.trim()) {
      artData.h1 = extractedData.h1;
    }
    if (extractedData.h2 && !customSubtitle.value.trim()) {
      artData.h2 = extractedData.h2;
    }
    const effectiveBg = imageOverride || extractedData.bg || null;

    if (!effectiveBg) {
      showToast('Nao encontramos uma imagem valida. Informe um link de imagem ou tente novamente.', 'error');
      customImageUrl.focus();
      return;
    }

    artData.bg = effectiveBg;
    artData[logoField] = defaultLogo;

    await downloadGeneratedArtwork(artData);

    showToast('Arte gerada e download iniciado!', 'success');
    closeModalHandler();
  } catch (error) {
    console.error('Erro ao gerar arte:', error);
    showToast('Erro ao gerar arte: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function downloadGeneratedArtwork(arte) {
  let attempt = 0;
  const maxRetries = 5;

  // Tenta serializar a geração quando o servidor estiver ocupado (BUSY/409)
  // com um backoff simples entre as tentativas.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await fetch('/api/generate/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ arte })
    });

    if (response.status === 409 && attempt < maxRetries) {
      attempt += 1;
      const delay = 1500 * attempt;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, delay));
      // eslint-disable-next-line no-continue
      continue;
    }

    if (!response.ok) {
      let message = 'Erro ao gerar arte';
      try {
        // eslint-disable-next-line no-await-in-loop
        const errorBody = await response.json();
        if (errorBody && errorBody.detail) {
          message = errorBody.detail;
        }
      } catch (e) {
        // Ignora falha ao ler corpo de erro
      }
      throw new Error(message);
    }

    // eslint-disable-next-line no-await-in-loop
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'arte.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return;
  }
}

async function extractNewsData(url) {
  try {
    const response = await fetch('/api/news/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error('Erro ao extrair dados da noticia');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao extrair dados:', error);
    return {};
  }
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function showLoading() {
  loadingOverlay.classList.add('show');
  generateBtn.disabled = true;
}

function hideLoading() {
  loadingOverlay.classList.remove('show');
  generateBtn.disabled = false;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? 'check-circle'
    : type === 'error' ? 'exclamation-circle'
      : 'info-circle';

  toast.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}

function createPreviewsFolder() {
  console.log('Para adicionar previews dos templates, coloque as imagens na pasta: public/previews/');
  console.log('Nomes sugeridos: template1.jpg, template2.jpg, template3.jpg, template4.jpg');
}
