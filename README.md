# Gerador de Artes

Este é um projeto Node.js que automatiza a geração de artes gráficas usando Puppeteer. O projeto permite criar artes personalizadas a partir de um template HTML, substituindo textos e imagens conforme especificado em um arquivo JSON.

## Estrutura do Projeto

```
.
├── input/
│   ├── data.json    # Arquivo com os dados para geração das artes
│   └── imagens/     # Pasta para armazenar imagens de fundo e logos
├── output/          # Pasta onde as artes geradas serão salvas
├── templates/
│   ├── index.html   # Template HTML base para as artes
│   └── styles.css   # Estilos CSS para o template
├── generate.js      # Script principal de geração
└── package.json     # Dependências do projeto
```

## Requisitos

- Node.js
- NPM (Node Package Manager)

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

## Como Usar

1. Prepare seu arquivo `input/data.json` com os dados das artes no seguinte formato:
```json
[
  {
    "h1": "Título Principal",
    "h2": "Subtítulo",
    "bg": "nome-da-imagem-de-fundo",
    "logo": "nome-do-logo"
  }
]
```

2. Coloque suas imagens na pasta `input/`:
   - Imagens de fundo: `input/nome-da-imagem-de-fundo.png`
   - Logos: `input/nome-do-logo.png`

3. Execute o script:
```bash
node generate.js
```

4. As artes geradas serão salvas na pasta `output/` com o nome `arte_1.png`, `arte_2.png`, etc.

## Funcionalidades

- Geração automática de artes a partir de um template HTML
- Suporte a múltiplas artes em uma única execução
- Personalização de título, subtítulo, imagem de fundo e logo
- Suporte a imagens locais e URLs
- Dimensões padrão de 1080x1350 pixels

## Dependências

- puppeteer: ^24.8.2 