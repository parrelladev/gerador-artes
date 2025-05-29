# Gerador de Artes

Este é um projeto Node.js que automatiza a geração de artes gráficas para carrosséis de posts em redes sociais usando Puppeteer. O projeto permite criar sequências de artes personalizadas, onde cada template representa uma página diferente do carrossel, cada uma com seu próprio layout e estilo.

## Estrutura do Projeto

```
.
├── input/
│   ├── data.json    # Arquivo com os dados para geração das artes
│   └── imagens/     # Pasta para armazenar imagens de fundo e logos
├── output/          # Pasta onde as artes geradas serão salvas
├── templates/
│   ├── TemplateSimples/   # Templates com layouts mais simples
│   │   ├── pagina1/      # Template para a primeira página
│   │   │   ├── index.html
│   │   │   └── styles.css
│   │   ├── pagina2/      # Template para a segunda página
│   │   │   ├── index.html
│   │   │   └── styles.css
│   │   └── ...
│   ├── TemplateTopicos/  # Templates com layouts mais elaborados
│   │   ├── pagina1/      # Template para a primeira página
│   │   │   ├── index.html
│   │   │   └── styles.css
│   │   ├── pagina2/      # Template para a segunda página
│   │   │   ├── index.html
│   │   │   └── styles.css
│   │   └── ...
│   └── TemplateAGazeta/  # Templates com estilo da A Gazeta
│       ├── pagina1/      # Template para a primeira página
│       │   ├── index.html
│       │   └── styles.css
│       ├── pagina2/      # Template para a segunda página
│       │   ├── index.html
│       │   └── styles.css
│       └── ...
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
    "template": "TemplateAGazeta",
    "page": "pagina1",
    "h1": "Título da Primeira Página",
    "h2": "Subtítulo da Primeira Página",
    "bg": "background1",
    "logo": "logo1"
  },
  {
    "template": "TemplateAGazeta",
    "page": "pagina2",
    "text": "Texto informativo que aparecerá na faixa inferior",
    "bg": "background2",
    "logo": "logo2"
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

4. As artes geradas serão salvas na pasta `output/` com o nome `arte_TemplateAGazeta_pagina1_1.png`, `arte_TemplateAGazeta_pagina2_1.png`, etc., representando cada página do carrossel.

## Templates Disponíveis

O projeto suporta três tipos de templates, cada um com suas próprias variações de página:

### TemplateSimples
Templates com layouts mais diretos e minimalistas.

#### Página 1 (pagina1)
- Layout padrão com título e subtítulo centralizados
- Elementos:
  - Título principal (h1)
  - Subtítulo (h2)
  - Logo centralizado
  - Imagem de fundo

#### Página 2 (pagina2)
- Layout informativo com faixa inferior
- Elementos:
  - Faixa inferior com texto informativo
  - Logo posicionado no canto inferior direito
  - Imagem de fundo
- Ideal para conteúdo informativo e explicativo

### TemplateTopicos
Templates com layouts mais elaborados e focados em tópicos.

#### Página 1 (pagina1)
- Layout com card verde e seta indicativa
- Elementos:
  - Card verde com título
  - Seta indicativa
  - Imagem inferior com handle
- Ideal para introdução de tópicos

#### Página 2 (pagina2)
- Layout informativo com faixa inferior
- Elementos:
  - Faixa inferior com texto informativo
  - Logo posicionado no canto inferior direito
  - Imagem de fundo
- Ideal para conteúdo informativo e explicativo

### TemplateAGazeta
Templates com estilo da A Gazeta.

#### Página 1 (pagina1)
- Layout com estilo jornalístico
- Elementos:
  - Título principal (h1)
  - Subtítulo (h2)
  - Logo posicionado
  - Imagem de fundo
- Ideal para notícias e reportagens

#### Página 2 (pagina2)
- Layout com estilo jornalístico
- Elementos:
  - Texto informativo
  - Logo posicionado
  - Imagem de fundo
- Ideal para continuação de notícias e reportagens

## Gerando o data.json com GPT

Para gerar o arquivo data.json usando GPT, use o seguinte prompt:

```
Preciso que você gere um arquivo `data.json` para um gerador de artes para carrosséis de posts em redes sociais.  
O arquivo deve conter um array de objetos, onde cada objeto representa uma página diferente do carrossel.  
Cada objeto deve seguir a seguinte estrutura:

{
  "template": "TemplateAGazeta", // "TemplateTopicos", "TemplateSimples" ou "TemplateAGazeta" - indica o tipo de template
  "page": "pagina1", // "pagina1", "pagina2", "pagina3" ou "pagina4" - indica qual página do carrossel será gerada
  "h1": "Título da Página", // texto do título principal (apenas para pagina1)
  "h2": "Subtítulo da Página", // texto do subtítulo (apenas para pagina1)
  "text": "Texto informativo", // texto para a faixa inferior (pagina2) ou coluna de texto (pagina3 e pagina4)
  "bg": link direto de imagem (terminando com .jpg ou .png, sem redirecionamento ou página de visualização, de fontes como Pixabay, Pexels, FreeImages)
  "logo": "nome_do_logo" // nome do arquivo do logo (sem extensão)
}

Importante:
    Os links de imagem no campo "bg" devem ser diretos e funcionais (terminando com .jpg ou .png) para que possam ser usados em CSS como background-image.
    Não use links de páginas de imagem ou redirecionamentos.
    O conteúdo deve seguir um tema, com narrativa coesa e textos curtos, impactantes e em português.

Regras importantes:

1. O campo "template" deve ser "TemplateTopicos", "TemplateSimples" ou "TemplateAGazeta".
2. O campo "page" deve ser "pagina1", "pagina2", "pagina3" ou "pagina4".
3. Para pagina1:
   - Incluir h1 e h2
   - Não incluir o campo text
4. Para pagina2:
   - Incluir apenas o campo text
   - Não incluir os campos h1 e h2
5. Para pagina3:
   - Incluir apenas o campo text
   - Não incluir os campos h1 e h2
   - O texto será exibido na coluna da esquerda com formatação justificada
6. Para pagina4:
   - Incluir apenas o campo text
   - Não incluir os campos h1 e h2
   - O texto será exibido na coluna da direita com formatação justificada
7. O campo "bg" deve conter um link direto para uma imagem gratuita e relevante ao conteúdo, preferencialmente de fontes como Unsplash ou Pexels.
8. O campo "logo" deve conter apenas o nome de um arquivo (sem extensão), que está localizado na pasta input/
9. Os textos devem ser em português, curtos, impactantes e adequados para redes sociais.
10. O conteúdo deve seguir uma sequência lógica e narrativa coesa entre as páginas.
11. Gere exatamente 5 objetos diferentes no array.

Tema da postagem: [INSIRA O TEMA AQUI]
```

## Funcionalidades

- Geração automática de artes para carrosséis de posts
- Suporte a múltiplos tipos de templates:
  - TemplateSimples: Layouts mais diretos e minimalistas
  - TemplateTopicos: Layouts mais elaborados e focados em tópicos
  - TemplateAGazeta: Layouts com estilo jornalístico
- Suporte a múltiplas artes em uma única execução
- Personalização de título, subtítulo, texto informativo, imagem de fundo e logo para cada página
- Suporte a imagens locais e URLs
- Dimensões padrão de 1080x1350 pixels

## Dependências

- puppeteer: ^24.8.2 