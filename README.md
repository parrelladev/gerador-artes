# Gerador de Artes

Este é um projeto Node.js que automatiza a geração de artes gráficas usando Puppeteer. O projeto permite criar artes personalizadas a partir de templates HTML, substituindo textos e imagens conforme especificado em um arquivo JSON.

## Estrutura do Projeto

```
.
├── input/
│   ├── data.json    # Arquivo com os dados para geração das artes
│   └── imagens/     # Pasta para armazenar imagens de fundo e logos
├── output/          # Pasta onde as artes geradas serão salvas
├── templates/
│   ├── template1/   # Template padrão
│   │   ├── index.html
│   │   └── styles.css
│   └── template2/   # Template alternativo
│       ├── index.html
│       └── styles.css
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
    "template": "template1",
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

4. As artes geradas serão salvas na pasta `output/` com o nome `arte_template1_1.png`, `arte_template2_1.png`, etc.

## Templates Disponíveis

O projeto suporta múltiplos templates, cada um com seu próprio layout e estilo:

- **template1**: Layout padrão
- **template2**: Layout alternativo com design diferente

## Gerando o data.json com GPT

Para gerar o arquivo data.json usando GPT, use o seguinte prompt:

```
Preciso que você gere um arquivo data.json para um gerador de artes para redes sociais. O arquivo deve conter um array de objetos, onde cada objeto representa uma arte diferente. Cada objeto deve seguir a seguinte estrutura:

{
  "template": "template1", // ou "template2" - indica qual template será usado
  "h1": "Título Principal", // texto do título principal
  "h2": "Subtítulo", // texto do subtítulo
  "bg": "nome_do_arquivo", // nome do arquivo de background (sem extensão)
  "logo": "nome_do_logo" // nome do arquivo do logo (sem extensão)
}

Regras importantes:
1. O campo "template" deve ser "template1" ou "template2"
2. Os campos "bg" e "logo" devem ser nomes de arquivos que existem na pasta "input" (sem a extensão .png)
3. Os textos em h1 e h2 devem ser relevantes para redes sociais
4. Gere pelo menos 5 objetos diferentes no array
5. Mantenha os textos em português
6. Os textos devem ser curtos e impactantes, adequados para redes sociais

Exemplo de uso:
- Se você tem um arquivo "background1.png" na pasta input, use "background1" no campo "bg"
- Se você tem um arquivo "logo_empresa.png" na pasta input, use "logo_empresa" no campo "logo"
```

## Funcionalidades

- Geração automática de artes a partir de templates HTML
- Suporte a múltiplos templates com layouts diferentes
- Suporte a múltiplas artes em uma única execução
- Personalização de título, subtítulo, imagem de fundo e logo
- Suporte a imagens locais e URLs
- Dimensões padrão de 1080x1350 pixels

## Dependências

- puppeteer: ^24.8.2 