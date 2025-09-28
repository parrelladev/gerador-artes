const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Configuração de dimensões por template
const templateDimensions = {
  'TemplateAGazeta': { width: 1080, height: 1350 },
  'TemplateAGazetaStories': { width: 1080, height: 1920 },
  'TemplateAGazetaFeed': { width: 1080, height: 1080 },
  'TemplateSimples': { width: 1080, height: 1350 },
  'TemplateTopicos': { width: 1080, height: 1350 },
  'default': { width: 1080, height: 1350 }
};

function getTemplateDimensions(templateName) {
  return templateDimensions[templateName] || templateDimensions['default'];
}

// Função para validar se o template existe
function validateTemplate(templateName, pageName) {
  const templatePath = path.join('templates', templateName, pageName);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template "${templateName}/${pageName}" não encontrado em ${templatePath}`);
  }
  return templatePath;
}

// Função para aguardar o carregamento de imagens
async function waitForImages(page) {
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error(`Erro ao carregar imagem: ${img.src}`));
        // Timeout de 10 segundos para cada imagem
        setTimeout(() => reject(new Error(`Timeout ao carregar imagem: ${img.src}`)), 10000);
      });
    }));
  });
}

(async () => {
  const data = JSON.parse(fs.readFileSync('./input/data.json', 'utf-8'));
  const outputDir = process.env.OUTPUT_DIR || './output';

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Configuração do viewport será definida por template

  // Configuração de timeout mais longo
  page.setDefaultNavigationTimeout(50000);
  page.setDefaultTimeout(50000);

  for (let i = 0; i < data.length; i++) {
    try {
      const item = data[i];
      const { template, page: pageName, h1, h2, bg, logo, text, tag } = item;

      console.log(`\n🔄 Processando arte ${i + 1} com template ${template}/${pageName}...`);

      // Configurar viewport baseado no template
      const dimensions = getTemplateDimensions(template);
      await page.setViewport({ width: dimensions.width, height: dimensions.height });
      console.log(`📐 Dimensões: ${dimensions.width}x${dimensions.height}`);

      const templatePath = validateTemplate(template, pageName);
      const templateURL = 'file://' + path.resolve(path.join(templatePath, 'index.html'));

      // Navega para o template
      await page.goto(templateURL, { waitUntil: 'networkidle0' });

      const bgPath = bg.startsWith('http') ? bg : 'file://' + path.resolve('./input/' + bg + '.png');
      const logoPath = logo.startsWith('http') ? logo : 'file://' + path.resolve('./input/' + logo + '.png');

      // Verifica se os arquivos de imagem existem
      if (!bg.startsWith('http') && !fs.existsSync('./input/' + bg + '.png')) {
        throw new Error(`Arquivo de background não encontrado: ${bg}.png`);
      }
      if (!logo.startsWith('http') && !fs.existsSync('./input/' + logo + '.png')) {
        throw new Error(`Arquivo de logo não encontrado: ${logo}.png`);
      }

      // Preenche os elementos de acordo com o template
      await page.evaluate(({ template, pageName, h1, h2, text, bgPath, logoPath, tag }) => {
        const setText = (id, value) => {
          const el = document.getElementById(id);
          if (el && value) el.textContent = value;
        };
        const setSrc = (id, src) => {
          const el = document.getElementById(id);
          if (el && src) el.src = src;
        };

        // Configura os elementos comuns
        setSrc('bg', bgPath);
        setSrc('logo', logoPath);

        // Configura a tag se existir
        if (tag) {
          setText('tag', tag);
        }

        // Configura os elementos específicos de cada template
        if (template === 'TemplateAGazeta') {
          if (pageName === 'pagina1') {
            setText('title', h1);
            setText('subtitle', h2);
          } else {
            setText('textBody', text);
          }
        } else {
          // Configuração padrão para outros templates
          if (pageName === 'pagina1') {
            setText('title', h1);
            setText('subtitle', h2);
          } else {
            setText('textBody', text);
          }
        }
      }, { template, pageName, h1, h2, text, bgPath, logoPath, tag });

      // Aguarda o carregamento das imagens
      console.log('⏳ Aguardando carregamento das imagens...');
      await waitForImages(page);
      console.log('✅ Imagens carregadas com sucesso');

      const outputFilePath = path.join(outputDir, `arte_${template}_${pageName}_${i + 1}.png`);
      await page.screenshot({ path: outputFilePath });
      console.log(`✅ Imagem salva: ${outputFilePath}`);

    } catch (error) {
      console.error(`❌ Erro ao processar arte ${i + 1}:`, error.message);
    }
  }

  await browser.close();
  console.log('\n✨ Processo finalizado!');
})();
