const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de pastas
const OUTPUT_DIR = process.env.OUTPUT_DIR || './output';
const PUBLIC_OUTPUT_DIR = process.env.PUBLIC_OUTPUT_DIR || '/output';

// Estado de geração para evitar execuções concorrentes do Puppeteer
let isGenerating = false;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(PUBLIC_OUTPUT_DIR, express.static(OUTPUT_DIR));

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'input';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Rota para listar templates disponíveis
app.get('/api/templates', (req, res) => {
  try {
    const templatesDir = 'templates';
    const templates = [];

    if (fs.existsSync(templatesDir)) {
      const templateFolders = fs.readdirSync(templatesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      templateFolders.forEach(templateName => {
        const templatePath = path.join(templatesDir, templateName);
        const pages = fs.readdirSync(templatePath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        templates.push({
          name: templateName,
          displayName: templateName.replace('Template', ''),
          pages: pages,
          description: getTemplateDescription(templateName)
        });
      });
    }

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para obter preview de um template específico
app.get('/api/template/:templateName/:pageName', (req, res) => {
  try {
    const { templateName, pageName } = req.params;
    const templatePath = path.join('templates', templateName, pageName);
    
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    const htmlPath = path.join(templatePath, 'index.html');
    const cssPath = path.join(templatePath, 'styles.css');
    
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const css = fs.readFileSync(cssPath, 'utf-8');

    res.json({
      html,
      css,
      templateName,
      pageName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para upload de arquivos
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    res.json({
      message: 'Arquivo enviado com sucesso',
      filename: req.file.filename,
      path: req.file.path
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para gerar artes
app.post('/api/generate', (req, res) => {
  try {
    const { artes } = req.body;

    if (!Array.isArray(artes) || artes.length === 0) {
      return res.status(400).json({ error: 'Payload inválido: "artes" deve ser um array com ao menos um item.' });
    }

    const validationErrors = [];

    artes.forEach((arte, index) => {
      const position = index + 1;

      if (!arte || typeof arte !== 'object') {
        validationErrors.push(`Arte ${position}: item inválido.`);
        return;
      }

      if (typeof arte.bg !== 'string' || !arte.bg.trim().length) {
        validationErrors.push(`Arte ${position}: o campo "bg" é obrigatório e deve ser uma string não vazia.`);
      } else {
        arte.bg = arte.bg.trim();
      }

      if (typeof arte.logo !== 'string' || !arte.logo.trim().length) {
        validationErrors.push(`Arte ${position}: o campo "logo" é obrigatório e deve ser uma string não vazia.`);
      } else {
        arte.logo = arte.logo.trim();
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Dados inválidos para geração de artes.',
        details: validationErrors
      });
    }

    if (isGenerating) {
      return res.status(409).json({ error: 'Já existe uma geração em andamento. Aguarde a conclusão antes de iniciar outra.' });
    }

    // Salva o data.json
    const dataPath = './input/data.json';
    isGenerating = true;

    fs.writeFileSync(dataPath, JSON.stringify(artes, null, 2));

    // Executa o generate.js
    exec('node generate.js', (error, stdout, stderr) => {
      isGenerating = false;

      if (error) {
        console.error(`Erro ao executar generate.js: ${error.message}`);
        return res.status(500).json({ error: 'Erro ao gerar artes', details: error.message });
      }

      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }

      console.log(`Saída do generate.js: ${stdout}`);

      let generatedFiles = [];
      try {
        const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
        const lastLine = lines[lines.length - 1] || '[]';
        const parsed = JSON.parse(lastLine);

        if (!Array.isArray(parsed)) {
          throw new Error('Formato inesperado de saída: esperado array de arquivos.');
        }

        generatedFiles = parsed;
      } catch (parseError) {
        console.error('Erro ao interpretar saída do generate.js:', parseError);
        return res.status(500).json({
          error: 'Falha ao processar resposta da geração de artes',
          details: parseError.message,
          output: stdout
        });
      }

      res.json({
        message: 'Artes geradas com sucesso',
        files: generatedFiles,
        downloadPath: PUBLIC_OUTPUT_DIR
      });
    });
  } catch (error) {
    isGenerating = false;
    res.status(500).json({ error: error.message });
  }
});

// Rota para listar arquivos gerados
app.get('/api/generated-files', (req, res) => {
  try {
    const outputDir = './output';
    const files = fs.existsSync(outputDir) 
      ? fs.readdirSync(outputDir).filter(file => file.endsWith('.png'))
      : [];
    
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para extrair dados de notícias
app.post('/api/extract-news', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    const { data: html } = await axios.get(url, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      timeout: 10000
    });

    const $ = cheerio.load(html);

    const extractedData = {
      h1: $('meta[property="og:title"]').attr("content") || 
          $('title').text() || 
          $('h1').first().text() || 
          null,
      h2: $('meta[property="og:description"]').attr("content") || 
          $('meta[name="description"]').attr("content") || 
          null,
      bg: $('meta[property="og:image"]').attr("content") || 
          $('img').first().attr("src") || 
          null,
      tag: null // Tag sempre vem do usuário
    };

    // Limpar os dados
    if (extractedData.h1) {
      extractedData.h1 = extractedData.h1.trim().substring(0, 100);
    }
    if (extractedData.h2) {
      extractedData.h2 = extractedData.h2.trim().substring(0, 200);
    }

    res.json(extractedData);
  } catch (error) {
    console.error('Erro ao extrair dados da notícia:', error);
    res.status(500).json({ 
      error: 'Erro ao extrair dados da notícia: ' + error.message 
    });
  }
});


// Função para obter descrição dos templates
function getTemplateDescription(templateName) {
  const descriptions = {
    'TemplateAGazeta': 'Estilo jornalístico para posts do Instagram (1080x1350)',
    'TemplateAGazetaStories': 'Design otimizado para Stories do Instagram (1080x1920)',
    'TemplateAGazetaFeed': 'Layout quadrado para feed do Instagram (1080x1080)',
    'TemplateSimples': 'Layouts minimalistas e diretos, perfeitos para conteúdo clean',
    'TemplateTopicos': 'Designs elaborados focados em tópicos e listas'
  };
  return descriptions[templateName] || 'Template personalizado';
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📁 Interface disponível em http://localhost:${PORT}`);
});
