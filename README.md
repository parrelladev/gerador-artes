# Gerador de Artes

Ferramenta Node.js para gerar imagens PNG a partir de HTML/CSS e metadados de notícias.  
O sistema recebe dados (título, subtítulo, imagem, logo etc.), aplica em templates versionados com manifests por página e usa um navegador headless (Puppeteer/Chromium) rodando em segundo plano para renderizar a arte como imagem.

---

## 1. Começando rápido

### Requisitos
- Node.js 16+  
- npm

### Passo a passo
1. Instalar dependências:
   ```bash
   npm install
   ```
2. (Opcional) Gerar `config.js` interativo:
   ```bash
   npm run deploy
   # ou copie config.example.js para config.js
   ```
3. Subir o servidor em modo desenvolvimento:
   ```bash
   npm run dev
   # ou
   npm start
   ```
4. Acessar no navegador:
   - `http://localhost:3000`

> Para deploy em servidor (produção), veja `DEPLOY.md`.

---

## 2. Configuração

A aplicação lê variáveis de ambiente e/ou `config.js`.

- `PORT`: porta do servidor (padrão `3000`)
- `OUTPUT_DIR`: pasta onde os PNGs são salvos
- `PUBLIC_OUTPUT_DIR`: caminho público para servir os arquivos gerados

Prioridade:
1. Variáveis de ambiente (`PORT`, `OUTPUT_DIR`, `PUBLIC_OUTPUT_DIR`)
2. Valores em `config.js`
3. Defaults internos

Para gerar `config.js`:
```bash
npm run deploy
```

---

## 3. Uso via API

Servidor expõe uma API REST simples.

### `POST /api/generate`
Gera artes com base em templates cadastrados **salvando os PNGs em disco** (pasta `OUTPUT_DIR`).

Body (exemplo):
```json
{
  "artes": [
    {
      "template": "nome-do-template",
      "page": "slug-da-pagina",
      "bg": "https://url.da.imagem/bg.jpg",
      "logo": "logo-a-gazeta.svg",
      "h1": "Título da matéria",
      "h2": "Subtítulo",
      "tag": "Política"
    }
  ]
}
```

Resposta (exemplo):
```json
{
  "files": [
    "/caminho/para/output/arquivo.png"
  ],
  "logs": [
    "[ok] template/pagina"
  ]
}
```

Comportamento:
- 409 se já houver geração em andamento.
- 500 se todas as artes falharem (detalhes em `logs`). Os arquivos gerados (quando houver) ficam em `OUTPUT_DIR`.

### `POST /api/generate/download`
Gera **uma** arte e devolve o PNG direto na resposta HTTP (sem persistir o arquivo).

Body (exemplo):
```json
{
  "arte": {
    "template": "nome-do-template",
    "page": "slug-da-pagina",
    "bg": "https://url.da.imagem/bg.jpg",
    "logo": "logo-a-gazeta.svg",
    "h1": "Título da matéria",
    "h2": "Subtítulo"
  }
}
```

Resposta:
- `Content-Type: image/png`
- `Content-Disposition: attachment; filename="nome-gerado.png"`

Esse endpoint é útil para fluxos de download imediato (por exemplo, integração com outra ferramenta que faz upload do PNG para redes sociais).

### `GET /api/templates`
Lista templates/páginas disponíveis (baseado nos manifests).

### `GET /api/templates/:template/:page`
Retorna detalhes do manifest, HTML e CSS daquela página.

### `POST /api/news/extract`
Extrai dados de uma notícia a partir de uma URL (usado para montar posts a partir de matérias).

Body:
```json
{ "url": "https://exemplo.com/materia" }
```

Resposta (exemplo):
```json
{
  "h1": "Título",
  "h2": "Subtítulo",
  "bg": "https://imagem-da-materia.jpg",
  "chapeu": "Categoria ou chapeu da materia (null quando ausente)"
}
```

Esses campos podem ser usados diretamente no payload de `/api/generate` ou `/api/generate/download` para transformar a notícia em arte/post para redes sociais.

---

## 4. Como funciona por baixo dos panos

Fluxo simplificado:
- A API valida o payload recebido contra o `manifest.json` da página (campos obrigatórios, tipos etc.).
- O serviço de templates carrega o `index.html` e os CSS do template.
- O serviço de bindings aplica os dados (título, subtítulo, imagem, logo, tags) nos elementos HTML, conforme o manifest.
- O `generator.js` inicia um navegador headless via Puppeteer (Chromium em modo oculto), abre a página já montada e gera um screenshot no tamanho configurado, salvando em PNG.

Implica em:
- O processo Node roda um navegador em segundo plano durante a geração.
- Servidores precisam suportar a execução do Chromium headless (bibliotecas de sistema padrão em Linux/Windows).

---

## 5. Templates e manifests

Cada template é organizado por pasta, com HTML/CSS/manifest.

Estrutura básica:
```text
templates/
  <template>/
    css/              # CSS e fontes compartilhadas
    fonts/            # (opcional)
    <page>/
      index.html      # layout específico da página
      manifest.json   # definição de campos/bindings
```

No `index.html`, o CSS do template é referenciado, por exemplo:
```html
<link rel="stylesheet" href="../css/base.css">
```

O `manifest.json` define:
- Dimensões da arte (`width`, `height`)
- Campo de logo obrigatório (`logoField`) e fallback (`defaultLogo`)
- Bindings de elementos (`text`, `html`, `image`, `logo`, `class`, `style`, `dataset`, `attribute`)

Erros de binding/validação aparecem nos logs da geração com o formato:
- `[erro] template/pagina`

> Para uma visão prática dos templates de stories e seus previews, veja `public/previews/stories/README.md`.

---

## 6. Estrutura de pastas (resumo)

```text
src/
  server.js          # servidor Express e rotas
  routes/            # /api/generate, /api/templates, /api/news
  services/
    generator.js     # orquestra geração, valida, resolve assets e chama Puppeteer
    newsScraper.js   # extrai título/subtítulo/imagem/chapéu de notícias
  lib/
    binding.js       # aplica bindings no DOM
    manifestLoader.js# carrega manifests/templates

templates/           # HTML/CSS/fonts + manifests por página
input/               # assets locais (backgrounds/logos)
output/              # PNGs gerados
public/              # interface web, previews etc.
config.example.js    # exemplo de configuração
config.js            # configuração ativa (opcional)
```

---

## 7. Operação e manutenção

- Concorrência: `generator.run` evita execuções simultâneas; novas chamadas recebem 409 se houver job em andamento.
- Limpeza: esvazie periodicamente a pasta `output/` conforme política interna.
- Logs: erros e avisos são retornados na resposta da API (`logs`) e no console do servidor.
- Testes:
  ```bash
  npm test
  ```

---

## 8. Documentação complementar

Para detalhes específicos:
- `DEPLOY.md` — passo a passo de deploy em Linux/Windows, exemplos de proxy (Nginx/Apache), variáveis de ambiente e troubleshooting em produção.
- `public/previews/stories/README.md` — lista de templates de stories, slugs e nomes de arquivo de preview (`.png`) para exibir as miniaturas na interface.
