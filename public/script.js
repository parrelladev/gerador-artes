// Estado da aplicação
let currentTemplate = null;

// Elementos DOM
const templateCards = document.querySelectorAll('.template-card');
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
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Clique nos cards de template
    templateCards.forEach(card => {
        card.addEventListener('click', () => {
            const template = card.dataset.template;
            openModal(template);
        });
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

// Abrir modal
function openModal(template) {
    currentTemplate = template;
    
    // Atualizar título do modal
    const templateNames = {
        'TemplateAGazeta': 'Feed',
        'TemplateAGazetaStories': 'Stories',
        'TemplateAGazetaFeed': 'Feed',
        'TemplateSimples': 'Simples',
        'TemplateTopicos': 'Tópicos',
        'TemplateCustom': 'Personalizado'
    };
    
    modalTitle.textContent = `Gerar Arte - ${templateNames[template]}`;
    
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