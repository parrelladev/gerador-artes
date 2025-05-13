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
│   ├── template1/   # Template para a primeira página do carrossel
│   │   ├── index.html
│   │   └── styles.css
│   └── template2/   # Template para a segunda página do carrossel
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
    "h1": "Título da Primeira Página",
    "h2": "Subtítulo da Primeira Página",
    "bg": "background1",
    "logo": "logo1"
  },
  {
    "template": "template2",
    "h2": "Título Principal",
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

4. As artes geradas serão salvas na pasta `output/` com o nome `arte_template1_1.png`, `arte_template2_1.png`, etc., representando cada página do carrossel.

## Templates Disponíveis

O projeto suporta múltiplos templates, cada um representando uma página diferente do carrossel:

### Template 1
- Layout padrão com título e subtítulo centralizados
- Elementos:
  - Título principal (h1)
  - Subtítulo (h2)
  - Logo centralizado
  - Imagem de fundo

### Template 2
- Layout informativo com faixa inferior
- Elementos:
  - Título principal no topo (h2)
  - Faixa inferior com texto informativo
  - Logo posicionado no canto inferior direito
  - Imagem de fundo
- Ideal para conteúdo informativo e explicativo

## Gerando o data.json com GPT

Para gerar o arquivo data.json usando GPT, use o seguinte prompt:

```
Preciso que você gere um arquivo data.json para um gerador de artes para carrosséis de posts em redes sociais. O arquivo deve conter um array de objetos, onde cada objeto representa uma página diferente do carrossel. Cada objeto deve seguir a seguinte estrutura:

{
  "template": "template1", // template1 ou template2 - indica qual layout será usado
  "h1": "Título da Página", // apenas para template1
  "h2": "Subtítulo da Página", // obrigatório para ambos os templates
  "text": "Texto explicativo", // apenas para template2
  "bg": "nome_do_arquivo_ou_url", // nome do arquivo de background (sem extensão) ou URL
  "logo": "nome_do_logo_ou_url" // nome do arquivo do logo (sem extensão) ou URL
}

Regras importantes:
1. O campo "template" deve ser "template1" ou "template2"
2. Para template1:
   - Incluir os campos "h1" e "h2"
   - Não incluir o campo "text"
3. Para template2:
   - Incluir os campos "h2" e "text"
   - Não incluir o campo "h1"
4. Os campos "bg" e "logo" podem conter:
   - Um nome de arquivo que existe na pasta "input" (sem a extensão .png)
   - Ou uma URL completa válida de imagem
5. Os textos devem estar em português
6. Os textos devem ser curtos, impactantes e adequados para redes sociais
7. As páginas devem formar uma narrativa coesa, com sequência lógica entre os conteúdos
8. Gere exatamente 5 objetos no array (uma para cada página do carrossel)

Exemplo de uso:
- Se você tem um arquivo "background1.png" na pasta input, use "background1" no campo "bg"
- Se você tem um arquivo "logo_empresa.png" na pasta input, use "logo_empresa" no campo "logo"
- Se quiser usar uma imagem externa, pode usar uma URL como:
  "bg": "https://i.imgur.com/abc123.jpg"

Exemplo de entrada válida:

[
  {
    "template": "template1",
    "h1": "HPV: um vírus silencioso",
    "h2": "mas que pode deixar marcas para sempre",
    "bg": "background1",
    "logo": "redegazeta"
  },
  {
    "template": "template2",
    "h2": "Por que falar sobre HPV é urgente?",
    "text": "O HPV é a IST mais comum no mundo e, muitas vezes, não apresenta sintomas. Mas ele pode causar verrugas genitais e até câncer. A vacina gratuita pelo SUS é a melhor prevenção.",
    "bg": "https://i.pinimg.com/1200x/43/59/e8/4359e842f5938cfac8e7d38b767b8df7.jpg",
    "logo": "redegazeta"
  }
]
```

## Funcionalidades

- Geração automática de artes para carrosséis de posts
- Suporte a múltiplos templates com layouts diferentes:
  - Template1: Layout padrão com título e subtítulo
  - Template2: Layout informativo com faixa inferior
- Suporte a múltiplas artes em uma única execução
- Personalização de título, subtítulo, texto informativo, imagem de fundo e logo para cada página
- Suporte a imagens locais e URLs
- Dimensões padrão de 1080x1350 pixels

## Dependências

- puppeteer: ^24.8.2 