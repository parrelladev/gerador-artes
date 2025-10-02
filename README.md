# Gerador de Artes

Projeto Node.js para automatizar a criacao de artes jornalisticas a partir de templates HTML/CSS. O pipeline combina uma interface web para as equipes de conteudo, uma API REST e um motor headless (Puppeteer) que renderiza os layouts em PNG.

## Visao geral da arquitetura

| Componente | Funcao | Arquivo de referencia |
|------------|--------|-----------------------|
| Servidor Express | Exibe a interface web, API REST e rotinas de upload/geracao. | `server.js` |
| Interface Web | Consome a API para capturar dados da noticia e acionar a geracao. | `public/index.html`, `public/script.js`, `public/styles.css` |
| Motor de renderizacao | Le `input/data.json`, aplica parametros e exporta PNGs via Puppeteer. | `generate.js` |
| Templates | Layouts HTML com CSS modularizado por tema em `templates/`. | `templates/` |
| Configuracao de templates | Define dimensoes, bindings e atributos dinamicos. | `template-config.js` |
| Utilitarios de deploy | Automatizam criacao de pastas/config e scripts auxiliares. | `deploy.js`, `config.example.js` |

## Pre-requisitos

- Node.js 18 ou superior (recomendado) e npm.
- Dependencias de sistema exigidas pelo Puppeteer (Chromium). Em Linux, siga a [documentacao oficial](https://pptr.dev/troubleshooting#chrome-gets-downloaded) antes de `npm install`.

## Configuracao inicial

1. Instale dependencias:
   ```bash
   npm install
   ```
2. Opcional: execute o assistente de deploy para gerar `config.js` e scripts de inicializacao adaptados ao ambiente.
   ```bash
   npm run deploy
   ```
   O script pergunta por porta, caminhos de output e cria `start.sh` (Linux/macOS) com as variaveis de ambiente apropriadas.
3. Configuracao manual: copie `config.example.js` para `config.js` e ajuste `port`, `outputDir` e `publicOutputDir`. As mesmas chaves podem ser definidas via `PORT`, `OUTPUT_DIR` e `PUBLIC_OUTPUT_DIR`.
4. Revise `template-config.js` (veja a sessao dedicada abaixo) para confirmar que os templates disponiveis possuem as definicoes e bindings esperados.

## Executando em desenvolvimento

Interface web + API:
```bash
npm start
```
O servidor fica disponivel em `http://localhost:3000` (ou na porta escolhida). A interface coleta dados da noticia, permite ajustes de titulo/subtitulo/tag e dispara a geracao.

Reload automatico durante desenvolvimento (usa `nodemon`):
```bash
npm run dev
```

## Gerando artes via CLI ou API

`generate.js` trabalha sobre um array de entradas em `input/data.json`. Exemplo minimo:
```json
[
  {
    "template": "layout-vertical",
    "page": "index",
    "h1": "Titulo principal",
    "h2": "Subtitulo opcional",
    "tag": "Categoria",
    "bg": "https://exemplo.com/imagem.jpg",
    "logo": "logo",
    "parameters": {
      "theme": "azul"
    }
  }
]
```
- `bg` e `logo` aceitam URL completa ou nome de arquivo presente em `input/` (PNG sem extensao).
- Use `parameters.theme` para selecionar a variante de cor quando o layout oferecer temas (`azul`, `branco`, `preto`, `rosa`, `amarelo`).
- `customBg` continua disponivel para forcar uma imagem especifica, ignorando a coletada automaticamente.

Para gerar via CLI:
```bash
npm run generate
```
O script valida a existencia do template, ajusta o viewport conforme `template-config.js`, injeta textos/imagens/estilos declarados e salva `arte_<template>_<pagina>_<n>.png` em `./output` (ou no diretorio definido por `OUTPUT_DIR`).

## Controlando templates com `template-config.js`

O arquivo `template-config.js` centraliza toda a configuracao dinamica:

- `defaults`: bindings basicos (`bg`, `logo`, `title`, `subtitle`, `tag`, `text`).
- `templates`: objeto cujas chaves sao as pastas em `templates/`. Cada entrada pode definir:
  - `dimensions`: `{ width, height }` para configurar o viewport do Puppeteer.
  - `bindings`: instrucoes adicionais. Para layouts com tema, o config injeta `themeStylesheet` e `data-theme` automaticamente a partir de `parameters.theme`.
  - `cssVars`, `classes`, `attributes`: opcionais para personalizacoes especificas.

Bindings adicionais expostos por padrao:

| Campo em `data.json` | Alvo | Tipo | Observacoes |
|----------------------|------|------|-------------|
| `bg` / `logo` | `#bg`, `#logo` | `image` | URL ou arquivo local (`input/*.png`) |
| `customBg` | `#bg` | `image` | Substitui `bg` quando informado |
| `h1` | `#title` | `text` | Opcional |
| `h2` | `#subtitle` | `text` | Opcional |
| `tag` | `#tag` | `text` | Opcional |
| `text` | `#textBody` | `text` | Opcional |
| `parameters.theme` | `#themeStylesheet` / `html[data-theme]` | `attribute` | Define o arquivo `css/theme-<tema>.css` carregado no layout |

## Estrutura de diretorios

```
.
+- public/                     # Front-end estatico
+- templates/
|  +- layout-horizontal/
|  |  +- index.html            # Estrutura unica para o layout
|  |  +- css/
|  |     +- base.css           # Estilos compartilhados
|  |     +- theme-azul.css     # Variantes de cor (tema)
|  |     +- theme-branco.css
|  |     +- theme-preto.css
|  +- layout-vertical/
|  +- layout-hz/
|  +- layout-bbc/
|  +- opiniao/
|  +- colunistas/
|  +- se-cuida/
|  +- TemplateAGazeta/         # Templates de feed mantidos no formato original
|  +- TemplateAGazetaFeed/
+- input/
|  +- data.json                # Dados usados na geracao atual
+- output/                     # PNGs gerados (criada automaticamente)
+- server.js                   # API HTTP + orquestracao de geracao
+- generate.js                 # Renderizacao headless com Puppeteer
+- template-config.js          # Configuracao de dimensoes/bindings
+- deploy.js                   # Assistente de configuracao
+- config.example.js           # Modelo de configuracao
```

## Criacao ou ajuste de templates

1. Estruturas reutilizaveis ficam em `templates/<layout>/index.html` e usam CSS modular (`css/base.css` + temas opcionais).
2. Adicione o HTML com placeholders (`{{BG}}`, `{{LOGO}}`, `{{TITLE}}`, etc.).
3. Em layouts com variações de cor, defina as variaveis `--brand-*` em `css/base.css` e sobrescreva-as nos arquivos `css/theme-*.css`.
4. Registre o novo layout (ou tema extra) em `template-config.js` e, se necessario, exponha-o na interface web (`public/script.js`).
5. Sempre mantenha os IDs esperados (`bg`, `logo`, `title`, `subtitle`, `tag`, `textBody`) para que o motor consiga preencher os dados.

## Manutencao

- Dependencias: use `npm outdated` periodicamente. Teste o fluxo completo antes de commitar o `package-lock.json` atualizado.
- Logs: `generate.js` imprime `[info]`, `[ok]` e `[erro]`. Em producao, execute o servidor com um gerenciador (PM2, systemd) para persistir logs e reiniciar em caso de falhas.
- Limpeza: a pasta `output/` acumula artes antigas; agende rotinas de limpeza ou mova os arquivos para armazenamento externo conforme a politica da equipe.

## Implantacao

Consulte `DEPLOY.md` para instrucoes de servidores Linux/Windows, configuracao de proxy reverso e troubleshooting. Em conteineres, exponha `PORT` e monte volumes para `input/` e `output/`.

---

Personalize o projeto de acordo com as necessidades da redacao. Para dados sensiveis, mantenha-os fora do versionamento e integre automacoes que gerem `input/data.json` sob demanda.

