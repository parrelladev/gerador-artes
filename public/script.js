const storyTemplates = [
  {
    id: 'layout-horizontal',
    name: 'Layout Horizontal',
    group: 'Principais',
    preview: 'previews/stories/horiz-foto-lateral-azul.png',
    defaultTheme: 'azul',
    themes: [
      { id: 'azul', name: 'Azul', preview: 'previews/stories/horiz-foto-lateral-azul.png' },
      { id: 'branco', name: 'Branco', preview: 'previews/stories/horiz-conteudo-central-vermelho.png' },
      { id: 'preto', name: 'Preto', preview: 'previews/stories/horiz-foto-acima-laranja.png' }
    ]
  },
  {
    id: 'layout-vertical',
    name: 'Layout Vertical',
    group: 'Principais',
    preview: 'previews/stories/vert-foto-acima-azul.png',
    defaultTheme: 'azul',
    themes: [
      { id: 'azul', name: 'Azul', preview: 'previews/stories/vert-foto-acima-azul.png' },
      { id: 'branco', name: 'Branco', preview: 'previews/stories/vert-conteudo-central-verde.png' },
      { id: 'preto', name: 'Preto', preview: 'previews/stories/vert-conteudo-inferior-roxo.png' }
    ]
  },
  {
    id: 'layout-hz',
    name: 'Layout HZ',
    group: 'Principais',
    preview: 'previews/stories/horiz-conteudo-diagonal-roxo.png',
    defaultTheme: 'rosa',
    themes: [
      { id: 'rosa', name: 'Rosa', preview: 'previews/stories/horiz-conteudo-diagonal-roxo.png' },
      { id: 'amarelo', name: 'Amarelo', preview: 'previews/stories/vert-foto-lateral-amarelo.png' }
    ]
  },
  {
    id: 'layout-bbc',
    name: 'Layout BBC',
    group: 'Especiais',
    preview: 'previews/stories/esp-eleicoes-conteudo-central-azul.png',
    themes: []
  },
  {
    id: 'opiniao',
    name: 'Layout Opiniao',
    group: 'Especiais',
    preview: 'previews/stories/esp-urgente-conteudo-destaque-vermelho.png',
    themes: []
  },
  {
    id: 'colunistas',
    name: 'Layout Colunistas',
    group: 'Especiais',
    preview: 'previews/stories/esp-cultura-foto-lateral-roxo.png',
    themes: []
  },
  {
    id: 'se-cuida',
    name: 'Layout Se Cuida',
    group: 'Especiais',
    preview: 'previews/stories/esp-esporte-foto-acima-verde.png',
    themes: []
  }
];

const templateLookup = Object.fromEntries(storyTemplates.map(template => [template.id, template]));
const storyGroups = Array.from(new Set(storyTemplates.map(template => template.group)));

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

    card.innerHTML = `
      <div class="template-preview">
        <img src="${template.preview}" alt="${template.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="template-placeholder" style="display: none;">
          <i class="fa-solid fa-image"></i>
        </div>
      </div>
      <div class="template-info">
        <span class="template-pill">${template.group}</span>
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

    const artData = {
      template: currentTemplate,
      page: 'index',
      h1: customTitle.value.trim() || null,
      h2: customSubtitle.value.trim() || null,
      tag: tag,
      bg: null,
      logo: 'logo',
      originalBg: null,
      sourceUrl: url
    };

    const parameters = {};
    if (currentTheme) {
      parameters.theme = currentTheme;
    }
    if (Object.keys(parameters).length) {
      artData.parameters = parameters;
    }

    if (imageOverride) {
      artData.customBg = imageOverride;
    }

    const extractedData = await extractNewsData(url);

    if (extractedData.h1 && !customTitle.value.trim()) {
      artData.h1 = extractedData.h1;
    }
    if (extractedData.h2 && !customSubtitle.value.trim()) {
      artData.h2 = extractedData.h2;
    }
    if (extractedData.bg) {
      artData.originalBg = extractedData.bg;
    }

    const effectiveBg = imageOverride || artData.originalBg || null;

    if (!effectiveBg) {
      showToast('Nao encontramos uma imagem valida. Informe um link de imagem ou tente novamente.', 'error');
      customImageUrl.focus();
      return;
    }

    artData.bg = effectiveBg;

    const result = await generateArtwork([artData]);

    if (result.success) {
      showToast('Arte gerada com sucesso!', 'success');
      showDownloadLink(result.filename);
      closeModalHandler();
    } else {
      showToast('Erro ao gerar arte: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('Erro ao gerar arte:', error);
    showToast('Erro ao gerar arte: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function extractNewsData(url) {
  try {
    const response = await fetch('/api/extract-news', {
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

async function generateArtwork(artes) {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ artes })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao gerar arte');
    }

    return {
      success: true,
      filename: result.files[0] || 'arte_gerada.png'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
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

function showDownloadLink(filename) {
  const downloadLink = document.createElement('a');
  downloadLink.href = `/output/${filename}`;
  downloadLink.download = filename;
  downloadLink.className = 'download-link';
  downloadLink.innerHTML = '<i class="fas fa-download"></i> Baixar Arte Gerada';

  toastContainer.appendChild(downloadLink);

  setTimeout(() => {
    downloadLink.remove();
  }, 10000);
}

function createPreviewsFolder() {
  console.log('Para adicionar previews dos templates, coloque as imagens na pasta: public/previews/');
  console.log('Nomes sugeridos: template1.jpg, template2.jpg, template3.jpg, template4.jpg');
}
