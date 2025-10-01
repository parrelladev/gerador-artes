const storyTemplates = [
    {
        id: 'TemplateStoryFotoAcimaTituloAzul',
        name: 'Foto acima · Título Azul',
        category: 'Azul',
        preview: 'previews/stories/foto-acima-titulo-azul.jpg'
    },
    {
        id: 'TemplateStoryChamadaCentroAzul',
        name: 'Chamada Central Azul',
        category: 'Azul',
        preview: 'previews/stories/chamada-centro-azul.jpg'
    },
    {
        id: 'TemplateStoryLinhaBaseAzul',
        name: 'Base Geométrica Azul',
        category: 'Azul',
        preview: 'previews/stories/linha-base-azul.jpg'
    },
    {
        id: 'TemplateStoryHzAgAmarelo',
        name: 'Faixas Horizontais Amarelas',
        category: 'Amarelo',
        preview: 'previews/stories/hz-ag-amarelo.jpg'
    },
    {
        id: 'TemplateStoryCardInformativoAmarelo',
        name: 'Card Informativo Amarelo',
        category: 'Amarelo',
        preview: 'previews/stories/card-informativo-amarelo.jpg'
    },
    {
        id: 'TemplateStoryTopoFaixaAmarelo',
        name: 'Faixa Superior Amarela',
        category: 'Amarelo',
        preview: 'previews/stories/topo-faixa-amarelo.jpg'
    },
    {
        id: 'TemplateStoryAlertaVerticalVermelho',
        name: 'Alerta Vertical Vermelho',
        category: 'Vermelho',
        preview: 'previews/stories/alerta-vertical-vermelho.jpg'
    },
    {
        id: 'TemplateStoryFotoLateralVermelho',
        name: 'Foto Lateral Vermelha',
        category: 'Vermelho',
        preview: 'previews/stories/foto-lateral-vermelho.jpg'
    },
    {
        id: 'TemplateStoryHeadlineCentroVermelho',
        name: 'Headline Central Vermelha',
        category: 'Vermelho',
        preview: 'previews/stories/headline-centro-vermelho.jpg'
    },
    {
        id: 'TemplateStoryDiagonalVerde',
        name: 'Diagonal Verde',
        category: 'Verde',
        preview: 'previews/stories/diagonal-verde.jpg'
    },
    {
        id: 'TemplateStoryTagCircularVerde',
        name: 'Tag Circular Verde',
        category: 'Verde',
        preview: 'previews/stories/tag-circular-verde.jpg'
    },
    {
        id: 'TemplateStoryListaPontuadaVerde',
        name: 'Lista Pontuada Verde',
        category: 'Verde',
        preview: 'previews/stories/lista-pontuada-verde.jpg'
    }
];

const templateLookup = new Map(storyTemplates.map(template => [template.id, template]));

let activeCategory = 'Todos';
let currentTemplate = null;

// Elementos DOM
const categoryTabsContainer = document.getElementById('categoryTabs');
const templatesList = document.getElementById('templatesList');
const modal = document.getElementById('templateModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const generateBtn = document.getElementById('generateBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');
const newsUrl = document.getElementById('newsUrl');
const customTitle = document.getElementById('customTitle');
const customSubtitle = document.getElementById('customSubtitle');
const customTag = document.getElementById('customTag');
const modalTitle = document.getElementById('modalTitle');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    renderCategoryTabs();
    renderTemplateCards();
    setupEventListeners();
});

function renderCategoryTabs() {
    if (!categoryTabsContainer) return;

    const categories = ['Todos', ...new Set(storyTemplates.map(template => template.category))];
    categoryTabsContainer.innerHTML = '';

    categories.forEach(category => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'template-tab';
        button.dataset.category = category;
        button.textContent = category;
        const isActive = category === activeCategory;
        if (isActive) {
            button.classList.add('active');
        }
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        categoryTabsContainer.appendChild(button);
    });
}

function renderTemplateCards() {
    if (!templatesList) return;

    templatesList.innerHTML = '';
    const filteredTemplates = activeCategory === 'Todos'
        ? storyTemplates
        : storyTemplates.filter(template => template.category === activeCategory);

    if (filteredTemplates.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'no-templates';
        emptyMessage.textContent = 'Nenhum template encontrado para esta categoria.';
        templatesList.appendChild(emptyMessage);
        return;
    }

    filteredTemplates.forEach(template => {
        const card = document.createElement('article');
        card.className = 'template-card';
        card.dataset.template = template.id;
        card.dataset.category = template.category;
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `${template.name} (${template.category})`);

        const preview = document.createElement('div');
        preview.className = 'template-preview';

        const img = document.createElement('img');
        img.src = template.preview;
        img.alt = `Pré-visualização do template ${template.name}`;

        const placeholder = document.createElement('div');
        placeholder.className = 'template-placeholder';
        placeholder.innerHTML = '<i class="fa-solid fa-image"></i>';
        placeholder.style.display = 'none';

        img.addEventListener('error', () => {
            img.style.display = 'none';
            placeholder.style.display = 'flex';
        });

        preview.appendChild(img);
        preview.appendChild(placeholder);

        const info = document.createElement('div');
        info.className = 'template-info';

        const categoryPill = document.createElement('span');
        categoryPill.className = 'template-category';
        categoryPill.textContent = template.category;

        const title = document.createElement('h3');
        title.textContent = template.name;

        const meta = document.createElement('p');
        meta.className = 'template-meta';
        meta.textContent = 'Stories · 1080x1920px';

        info.appendChild(categoryPill);
        info.appendChild(title);
        info.appendChild(meta);

        card.appendChild(preview);
        card.appendChild(info);

        templatesList.appendChild(card);
    });
}

// Event Listeners
function setupEventListeners() {
    if (categoryTabsContainer) {
        categoryTabsContainer.addEventListener('click', handleCategoryClick);
    }

    if (templatesList) {
        templatesList.addEventListener('click', handleTemplateSelection);
        templatesList.addEventListener('keydown', handleTemplateKeyboardSelection);
    }

    if (closeModal) {
        closeModal.addEventListener('click', closeModalHandler);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModalHandler);
    }

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModalHandler();
            }
        });
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', generateArt);
    }

    if (newsUrl) {
        newsUrl.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                generateArt();
            }
        });
    }
}

function handleCategoryClick(event) {
    const button = event.target.closest('.template-tab');
    if (!button) return;

    const { category } = button.dataset;
    if (!category || category === activeCategory) {
        return;
    }

    activeCategory = category;
    updateActiveCategoryTab();
    renderTemplateCards();
}

function updateActiveCategoryTab() {
    if (!categoryTabsContainer) return;
    const tabs = categoryTabsContainer.querySelectorAll('.template-tab');
    tabs.forEach(tab => {
        const isActive = tab.dataset.category === activeCategory;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function handleTemplateSelection(event) {
    const card = event.target.closest('.template-card');
    if (!card) return;

    const template = card.dataset.template;
    openModal(template);
}

function handleTemplateKeyboardSelection(event) {
    if (event.key !== 'Enter' && event.key !== ' ') {
        return;
    }

    const card = event.target.closest('.template-card');
    if (!card) return;

    event.preventDefault();
    const template = card.dataset.template;
    openModal(template);
}

// Abrir modal
function openModal(template) {
    currentTemplate = template;

    const templateInfo = templateLookup.get(template);
    const templateName = templateInfo ? templateInfo.name : template;
    modalTitle.textContent = `Gerar Arte - ${templateName}`;

    // Limpar campos
    newsUrl.value = '';
    customTitle.value = '';
    customSubtitle.value = '';
    customTag.value = '';

    // Mostrar modal
    modal.classList.add('show');
    newsUrl.focus();
}

// Fechar modal
function closeModalHandler() {
    modal.classList.remove('show');
    currentTemplate = null;
}

// Gerar arte
async function generateArt() {
    if (!currentTemplate) {
        showToast('Por favor, selecione um template de story', 'error');
        return;
    }

    const url = newsUrl.value.trim();
    const tag = customTag.value.trim();

    if (!url) {
        showToast('Por favor, insira o link da notícia', 'error');
        newsUrl.focus();
        return;
    }

    if (!isValidUrl(url)) {
        showToast('Por favor, insira um link válido', 'error');
        newsUrl.focus();
        return;
    }

    if (!tag) {
        showToast('Por favor, insira a categoria da notícia', 'error');
        customTag.focus();
        return;
    }

    try {
        showLoading();

        // Preparar dados
        const artData = {
            template: currentTemplate,
            page: 'pagina1',
            h1: customTitle.value.trim() || null,
            h2: customSubtitle.value.trim() || null,
            tag: tag,
            bg: null,
            logo: 'logo'
        };

        // Extrair dados da URL
        const extractedData = await extractNewsData(url);

        // Atualizar dados com informações extraídas
        if (extractedData.h1 && !customTitle.value.trim()) {
            artData.h1 = extractedData.h1;
        }
        if (extractedData.h2 && !customSubtitle.value.trim()) {
            artData.h2 = extractedData.h2;
        }
        if (extractedData.bg) {
            artData.bg = extractedData.bg;
        }

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

// Extrair dados da notícia
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
            throw new Error('Erro ao extrair dados da notícia');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao extrair dados:', error);
        return {};
    }
}

// Gerar arte
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

// Validar URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Mostrar loading
function showLoading() {
    loadingOverlay.classList.add('show');
    generateBtn.disabled = true;
}

// Esconder loading
function hideLoading() {
    loadingOverlay.classList.remove('show');
    generateBtn.disabled = false;
}

// Mostrar toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? 'check-circle' :
                 type === 'error' ? 'exclamation-circle' : 'info-circle';

    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Mostrar link de download
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

// Criar pasta de previews se não existir
function createPreviewsFolder() {
    console.log('Para adicionar previews dos templates, coloque as imagens na pasta: public/previews/stories');
}
