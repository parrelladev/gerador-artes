# Gerador de Artes

Este projeto Node.js automatiza a criação de artes jornalísticas para redes sociais a partir de templates HTML/CSS e dados estruturados. Ele disponibiliza uma interface web responsiva para operação por equipes de conteúdo e uma API/CLI pensada para integrações automáticas.

## Visão geral da arquitetura

O fluxo de geração é composto pelos seguintes componentes principais:

| Componente | Função | Arquivo de referência |
|------------|--------|-----------------------|
| Servidor Express | Expõe a interface web, API REST e rotinas de upload e geração. | [`server.js`](server.js) |
| Interface Web | Consome a API para capturar dados de notícias e acionar a geração das artes. | [`public/index.html`](public/index.html), [`public/script.js`](public/script.js), [`public/styles.css`](public/styles.css) |
| Motor de renderização | Lê `input/data.json`, aplica os valores nos templates e exporta PNGs via Puppeteer. | [`generate.js`](generate.js) |
| Templates | Conjunto de HTML/CSS parametrizados por IDs para cada página/formato disponível. | [`templates/`](templates) |
| Utilitários de implantação | Automatizam criação de `config.js`, pastas de saída e script de inicialização. | [`deploy.js`](deploy.js), [`config.example.js`](config.example.js) |

Os endpoints expostos incluem listagem de templates, preview de HTML/CSS, upload de ativos, extração de metadados de notícias (via Axios + Cheerio) e disparo da geração de artes.【F:server.js†L1-L196】

## Pré-requisitos

- Node.js 18 ou superior (recomendado) e npm.
- Navegador moderno para utilizar a interface web.
- Pacotes do sistema necessários pelo Puppeteer (Chromium headless). Em servidores Linux, siga os requisitos listados na [documentação oficial](https://pptr.dev/troubleshooting#chrome-gets-downloaded) antes de executar `npm install`.

## Configuração inicial

1. Instale dependências:
   ```bash
   npm install
   ```
2. (Opcional) Execute o assistente de implantação para gerar `config.js` e `start.sh` customizados:
   ```bash
   npm run deploy
   ```
   Responda às perguntas sobre porta e diretórios. O script cria `start.sh` (Linux/macOS) com as variáveis de ambiente adequadas e garante a existência da pasta de saída.【F:deploy.js†L1-L83】
3. Se preferir configurar manualmente, copie [`config.example.js`](config.example.js) para `config.js` e ajuste as propriedades `port`, `outputDir` e `publicOutputDir`. Você também pode definir `PORT`, `OUTPUT_DIR` e `PUBLIC_OUTPUT_DIR` diretamente no ambiente.【F:config.example.js†L1-L21】

## Executando em desenvolvimento

- Interface web + API:
  ```bash
  npm start
  ```
  O servidor estará em `http://localhost:3000` (ou na porta definida pelas variáveis/`config.js`). A interface permite informar a URL da notícia, editar título/subtítulo/tag e dispara automaticamente a extração de metadados e geração do material.【F:public/index.html†L1-L120】【F:public/script.js†L1-L199】

- Reload automático durante ajustes no servidor (necessário `nodemon` já presente em `devDependencies`):
  ```bash
  npm run dev
  ```

## Gerando artes via CLI/API

### Uso pela interface
1. Clique em um dos formatos disponíveis (Feed, Stories etc.).
2. Informe a URL da notícia. O front-end solicitará `/api/extract-news` para coletar título, descrição e imagem de destaque da página.【F:public/script.js†L116-L161】【F:server.js†L165-L214】
3. Ajuste os campos opcionais e confirme. O navegador envia os dados para `/api/generate`, que valida a presença de `bg` e `logo`, grava `input/data.json`, executa `generate.js` e retorna os arquivos PNG gerados. Em caso de erro de validação a API responde com HTTP 400 e detalhes dos campos ausentes.【F:server.js†L91-L170】
4. Faça o download pelo link exibido na notificação.

### Uso por linha de comando

Prepare `input/data.json` com um array de objetos contendo os campos esperados por `generate.js`:
```json
[
  {
    "template": "TemplateStoriesVertFotoAcimaAzul",
    "page": "pagina1",
    "h1": "Título principal",
    "h2": "Subtítulo opcional",
    "text": null,
    "tag": "Categoria",
    "bg": "https://exemplo.com/imagem.jpg", // obrigatório, URL ou nome de arquivo presente em input/
    "logo": "nome_do_arquivo_sem_extensao"   // obrigatório, URL ou nome de arquivo presente em input/
  }
]
```
Depois execute:
```bash
npm run generate
```
O script valida a presença do template, certifica-se de que `bg` e `logo` são strings não vazias (evitando erros ao montar os caminhos das imagens), injeta os valores nos elementos com IDs correspondentes e exporta `arte_<template>_<pagina>_<n>.png` para a pasta configurada (por padrão `./output`). Ele aguarda explicitamente o carregamento das imagens para evitar artefatos parciais.【F:generate.js†L1-L118】【F:generate.js†L119-L162】

## Estrutura de diretórios

```
.
├── public/                 # Front-end estático servido pelo Express
├── templates/              # Templates organizados por formato/página
├── input/
│   └── data.json           # Dados usados na geração atual
├── output/                 # PNGs gerados (criada automaticamente)
├── server.js               # API HTTP + orquestração de geração
├── generate.js             # Renderização headless com Puppeteer
├── deploy.js               # Assistente de configuração para servidores
└── config.example.js       # Modelo de configuração para ambientes
```

## Mantendo e evoluindo o projeto

### Atualização de dependências
- Use `npm outdated` para inspecionar novas versões.
- Teste localmente com `npm install <pacote>@latest` e valide geração web/CLI antes de atualizar o `package-lock.json`.
- Puppeteer acompanha uma versão específica do Chromium. Ao atualizar, revise requisitos de sistema em servidores de produção.

### Criação ou ajuste de templates
1. Crie uma pasta em `templates/NomeDoTemplate/paginaX/` contendo `index.html` e `styles.css`.
2. Garanta que os elementos a serem preenchidos programaticamente tenham IDs (`title`, `subtitle`, `textBody`, `bg`, `logo`, `tag`, etc.). O `generate.js` manipula esses IDs ao executar `page.evaluate`.
3. Se um formato exigir dimensões diferentes, adicione-as ao objeto `templateDimensions` em `generate.js`.
4. Atualize `getTemplateDescription` em `server.js` e, se desejado, ajuste a interface em `public/index.html` para exibir o novo template.

### Monitoramento e logs
- `generate.js` registra no console o progresso de cada arte e falhas de carregamento de imagens. Em produção, execute o servidor com um gerenciador de processos (PM2, systemd) para persistir logs e reiniciar automaticamente.
- As rotas Express retornam mensagens de erro detalhadas em JSON; ao integrar via API, trate o campo `error` para exibir feedback amigável ao usuário.【F:server.js†L91-L214】

### Limpeza e armazenamento
- Os arquivos gerados permanecem na pasta `output`. Agende rotinas (cron, scripts PowerShell) para arquivar ou limpar periodicamente conforme a política da equipe.
- A API `/api/generated-files` lista os PNGs existentes, útil para dashboards ou integrações externas.【F:server.js†L139-L158】

## Implantação

Consulte [`DEPLOY.md`](DEPLOY.md) para instruções detalhadas sobre servidores Linux/Windows, configuração de proxy reverso e troubleshooting. Em ambientes containerizados, exponha `PORT` e monte volumes para `input/` e `output/` para preservar arquivos entre reinicializações.

---

Sinta-se à vontade para adaptar o projeto às necessidades da redação. Mantenha `input/data.json` versionado apenas se contiver exemplos genéricos; para dados sensíveis, utilize armazenamento externo ou automatize a geração de JSON via integrações.
