// Configurações de templates
const storyTemplates = [
    {
        id: 'TemplateStoriesVerticalSuperiorAzul',
        name: 'Vertical • Foto acima • Azul',
        group: 'Gerais — Vertical',
        slug: 'vert-foto-acima-azul',
        preview: 'previews/stories/vert-foto-acima-azul.png'
    },
    {
        id: 'TemplateStoriesVerticalSuperiorBranco',
        name: 'Vertical • Foto acima • Branco',
        group: 'Gerais — Vertical',
        slug: 'vert-conteudo-central-verde',
        preview: 'previews/stories/vert-conteudo-central-verde.png'
    },
    {
        id: 'TemplateStoriesVerticalSuperiorPreto',
        name: 'Vertical • Foto acima • Preto',
        group: 'Gerais — Vertical',
        slug: 'vert-conteudo-inferior-roxo',
        preview: 'previews/stories/vert-conteudo-inferior-roxo.png'
    },
    {
        id: 'TemplateStoriesHorizontalSuperiorTituloLinhaFinaBranco',
        name: 'Horizontal • Foto acima • Título + linha fina • Branco',
        group: 'Gerais — Horizontal',
        slug: 'horiz-foto-lateral-azul',
        preview: 'previews/stories/horiz-foto-lateral-azul.png'
    },
    {
        id: 'TemplateStoriesHorizontalSuperiorTituloLinhaFinaPreto',
        name: 'Horizontal • Foto acima • Título + linha fina • Preto',
        group: 'Gerais — Horizontal',
        slug: 'horiz-foto-acima-laranja',
        preview: 'previews/stories/horiz-foto-acima-laranja.png'
    },
    {
        id: 'TemplateStoriesHorizontalSuperiorTituloLinhaFina',
        name: 'Horizontal • Foto acima • Título + linha fina',
        group: 'Gerais — Horizontal',
        slug: 'horiz-conteudo-central-vermelho',
        preview: 'previews/stories/horiz-conteudo-central-vermelho.png'
    },
    {
        id: 'TemplateStoriesHZAGAmarelo',
        name: 'HZ AG • Amarelo',
        group: 'Específicos',
        slug: 'vert-foto-lateral-amarelo',
        preview: 'previews/stories/vert-foto-lateral-amarelo.png'
    },
    {
        id: 'TemplateStoriesHZAGRosa',
        name: 'HZ AG • Rosa',
        group: 'Específicos',
        slug: 'horiz-conteudo-diagonal-roxo',
        preview: 'previews/stories/horiz-conteudo-diagonal-roxo.png'
    },
    {
        id: 'TemplateStoriesBBCComFoto',
        name: 'BBC • Com foto',
        group: 'Específicos',
        slug: 'esp-eleicoes-conteudo-central-azul',
        preview: 'previews/stories/esp-eleicoes-conteudo-central-azul.png'
    },
    {
        id: 'TemplateStoriesOpiniaoComFoto',
        name: 'Opinião • Com foto',
        group: 'Específicos',
        slug: 'esp-urgente-conteudo-destaque-vermelho',
        preview: 'previews/stories/esp-urgente-conteudo-destaque-vermelho.png'
    },
    {
        id: 'TemplateStoriesColunistas',
        name: 'Colunistas',
        group: 'Específicos',
        slug: 'esp-cultura-foto-lateral-roxo',
        preview: 'previews/stories/esp-cultura-foto-lateral-roxo.png'
    },
    {
        id: 'TemplateStoriesSeCuidaSwipeUpEditorial',
        name: 'Se Cuida • Swipe Up Editorial',
        group: 'Específicos',
        slug: 'esp-esporte-foto-acima-verde',
        preview: 'previews/stories/esp-esporte-foto-acima-verde.png'
    }
];

const templateLookup = storyTemplates.reduce((acc, template) => {
    acc[template.slug] = template;
    return acc;
}, {});

const storyGroups = Array.from(new Set(storyTemplates.map(template => template.group)));

// Estado da aplicação
let currentTemplate = null;
let activeStoryGroup = storyGroups[0] || null;

// Elementos DOM
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
const storyCategoryTabs = document.getElementById('storyCategoryTabs');
const storyTemplateGrid = document.getElementById('storyTemplateGrid');
const fallbackTemplateNames = {
    'TemplateAGazeta': 'Feed',
    'TemplateAGazetaFeed': 'Feed',
    'TemplateSimples': 'Simples',
    'TemplateTopicos': 'Tópicos',
    'TemplateCustom': 'Personalizado'
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    renderCategoryTabs();
    renderTemplateCards();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    if (storyCategoryTabs) {
        storyCategoryTabs.addEventListener('click', (event) => {
            const tab = event.target.closest('[data-group]');
            if (!tab) {
                return;
            }

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
            if (!card) {
                return;
            }

            const { slug, template: templateId } = card.dataset;
            if (slug && templateLookup[slug]) {
                openModal(slug);
                return;
            }

            if (templateId) {
                openModal(templateId);
            }
        });
    }

    document.addEventListener('click', (event) => {
        const card = event.target.closest('.template-card');
        if (!card || card.closest('#storyTemplateGrid')) {
            return;
        }

        const { slug, template } = card.dataset;
        if (slug && templateLookup[slug]) {
            openModal(slug);
        } else if (template) {
            openModal(template);
        }
    });

    // Fechar modal
    closeModal.addEventListener('click', closeModalHandler);
    cancelBtn.addEventListener('click', closeModalHandler);
    
    // Clique fora do modal para fechar
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModalHandler();
        }
    });

    // Gerar arte
    generateBtn.addEventListener('click', generateArt);

    // Enter no campo de URL
    newsUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateArt();
        }
    });
}

function renderCategoryTabs() {
    if (!storyCategoryTabs) {
        return;
    }

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
    if (!storyTemplateGrid) {
        return;
    }

    storyTemplateGrid.innerHTML = '';

    const templatesToRender = activeStoryGroup ?
        storyTemplates.filter(template => template.group === activeStoryGroup) :
        storyTemplates;

    templatesToRender.forEach(template => {
        const card = document.createElement('div');
        card.className = 'template-card story-card';
        card.dataset.slug = template.slug;
        card.dataset.group = template.group;
        card.dataset.template = template.id;

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
            </div>
        `;

        storyTemplateGrid.appendChild(card);
    });

    if (!storyTemplateGrid.children.length) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'Nenhum template disponível para este agrupamento.';
        storyTemplateGrid.appendChild(emptyState);
    }
}

// Abrir modal
function openModal(templateKey) {
    const templateData = templateLookup[templateKey];

    if (templateData) {
        currentTemplate = templateData.id;
        modalTitle.textContent = `Gerar Arte - ${templateData.name}`;
    } else {
        currentTemplate = templateKey;
        const displayName = fallbackTemplateNames[templateKey] || templateKey;
        modalTitle.textContent = `Gerar Arte - ${displayName}`;
    }

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
    const url = newsUrl.value.trim();
    const tag = customTag.value.trim();

    if (!currentTemplate) {
        showToast('Escolha um template antes de gerar a arte', 'error');
        return;
    }
    
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
            tag: tag, // Tag obrigatória
            bg: null, // Será preenchido pelo servidor
            logo: 'logo' // Logo padrão
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
        // Tag sempre vem do usuário, não da extração automática

        // Gerar arte
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
    
    // Remover após 5 segundos
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
    
    // Adicionar ao container de toast
    toastContainer.appendChild(downloadLink);
    
    // Remover após 10 segundos
    setTimeout(() => {
        downloadLink.remove();
    }, 10000);
}

// Criar pasta de previews se não existir
function createPreviewsFolder() {
    // Esta função pode ser chamada para criar a pasta previews
    // onde você pode colocar as imagens de preview dos templates
    console.log('Para adicionar previews dos templates, coloque as imagens na pasta: public/previews/');
    console.log('Nomes sugeridos: template1.jpg, template2.jpg, template3.jpg, template4.jpg');
}