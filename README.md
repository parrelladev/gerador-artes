# Gerador de Artes

Ferramenta Node.js para automatizar artes jornalisticas a partir de HTML/CSS. A base usa manifests por pagina, servicos desacoplados e evita arquivos temporarios.

## Como usar (rapido)
- Instale dependencias: `npm install`.
- Configure (opcional): `npm run deploy` gera `config.js` (ou copie `config.example.js`). Variaveis `PORT`, `OUTPUT_DIR`, `PUBLIC_OUTPUT_DIR` sempre prevalecem.
- Servidor/API: `npm start` (ou `npm run dev`).

Rotas expostas:
- `POST /api/generate` com `{ artes: [...] }` -> `{ files, logs }` (409 se gerando).
- `GET /api/templates` e `GET /api/templates/:template/:page` -> dados do manifest/HTML/CSS.
- `POST /api/news/extract` -> `{ h1, h2, bg }` via scraper.

## Estrutura e responsabilidades
- `src/server.js` + `src/routes/*`: API enxuta (generate/templates/news).
- `src/services/generator.js`: valida artes via manifest, resolve assets (bg local/remoto, logo com cache), controla concorrencia e renderiza com Puppeteer.
- `src/services/newsScraper.js`: extrai titulo/subtitulo/imagem.
- `src/lib/{binding,manifestLoader}.js`: aplica bindings no DOM e carrega manifests/templates.
- `templates/<template>/<page>/`: `index.html` + `manifest.json` + pastas de CSS/fonts compartilhadas no nivel do template.
- `input/`: assets locais (backgrounds/logos). `output/`: PNGs gerados.
- **Removido**: `template-config.js` e servidor raiz antigo; manifests são a unica fonte de configuracao de templates.

## Criar ou ajustar templates
1) Estrutura: crie `templates/<template>/<page>/index.html`. CSS/fonts permanecem em `templates/<template>/css` (ou subpastas) referenciados com `../css/...` a partir do `index.html`.
2) Manifesto em `templates/<template>/<page>/manifest.json`:
```
{
  "dimensions": { "width": 1080, "height": 1920 },
  "logoField": "logo",           // nome do campo exigido
  "defaultLogo": "logo.svg",     // opcional (fallback)
  "bindings": [
    { "selector": "#bg", "type": "image", "field": "resolvedBg", "required": true },
    { "selector": "#logo", "type": "logo", "field": "resolvedLogo", "required": true },
    { "selector": "#title", "type": "text", "field": "h1" },
    { "selector": "#subtitle", "type": "text", "field": "h2" },
    { "selector": "#tag", "type": "text", "field": "tag" }
  ],
  "cssVars": [],
  "classes": [],
  "attributes": []
}
```
   - Tipos de binding: `text`, `html`, `image`, `logo`, `attribute` (`name`/`attribute`), `class` (`mode` add/replace/toggle), `style` (`property`), `dataset` (`datasetKey`).
   - `cssVars`, `classes`, `attributes` usam o mesmo esquema de `field`/`value`, `selector` e `required`.
   - Use `logoField` para diferenciar logos; `defaultLogo` aplica fallback se o campo nao vier.
3) Validacao: o gerador deriva o schema a partir do manifest (exige `bg` e o `logoField`). Erros retornam com `[erro] template/pagina` nos logs.
4) Assets: backgrounds/logos podem ser URL ou arquivos em `input/`. PNG/JPEG/WEBP para bg; logo aceita SVG inline ou imagens (extensoes testadas em cascata quando sem sufixo).

## Fluxos de geracao
- API: envie `artes` para `/api/generate`. Se alguma falhar, `logs` apontam o motivo; se nenhuma for bem-sucedida retorna 500.
- CLI: coleta URL, sugere titulo/subtitulo/bg via scraper, pergunta pelo `logoField` definido no manifest e executa `generator.run` em memoria, exibindo caminhos salvos em `OUTPUT_DIR`.

## Manutencao e operacao
- Confiabilidade: `generator.run` bloqueia concorrencia; chamadas simultaneas recebem 409.
- Logs: cada arte retorna `[ok]/[erro] template/pagina` com detalhe tecnico separado.
- Limpeza: esvazie `output/` conforme a politica interna; mantenha `input/` apenas com assets relevantes.
- Testes: `npm test` (unitarios de assets/validacao + integracao gerando PNG real).

## Dicas rapidas para novos devs
- Sempre criar/editar manifests junto ao HTML da pagina.
- Para temas, carregue CSS via atributo `href` no manifest (`attributes` em `#themeStylesheet`) e use `parameters.theme` para alternar.
- Nunca grave em `input/data.json`; use API/CLI em memoria.
