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
    "text": "Texto informativo que aparecerá na faixa inferior",
    "bg": "background2",
    "logo": "logo2"
  },
  {
    "template": "template3",
    "text": "Texto mais extenso que aparecerá na coluna da esquerda, com formatação justificada e tamanho adequado para leitura",
    "bg": "background3",
    "logo": "logo3"
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
  - Faixa inferior com texto informativo
  - Logo posicionado no canto inferior direito
  - Imagem de fundo
- Ideal para conteúdo informativo e explicativo

### Template 3
- Layout de duas colunas
- Elementos:
  - Coluna da esquerda com texto justificado
  - Coluna da direita com imagem de fundo
  - Logo posicionado no canto inferior direito da coluna da imagem
- Ideal para posts com conteúdo textual mais extenso e uma imagem de destaque

## Gerando o data.json com GPT

Para gerar o arquivo data.json usando GPT, use o seguinte prompt:

```
Preciso que você gere um arquivo data.json para um gerador de artes para carrosséis de posts em redes sociais. O arquivo deve conter um array de objetos, onde cada objeto representa uma página diferente do carrossel. Cada objeto deve seguir a seguinte estrutura:

{
  "template": "template1", // template1 ou template2 - indica qual página do carrossel será gerada
  "h1": "Título da Página", // texto do título principal (apenas para template1)
  "h2": "Subtítulo da Página", // texto do subtítulo (apenas para template1)
  "text": "Texto informativo", // texto para a faixa inferior (apenas para template2)
  "bg": "nome_do_arquivo", // nome do arquivo de background (sem extensão)
  "logo": "nome_do_logo" // nome do arquivo do logo (sem extensão)
}

Regras importantes:
1. O campo "template" deve ser "template1" ou "template2"
2. Para template1:
   - Incluir h1 e h2
   - Não incluir o campo text
3. Para template2:
   - Incluir apenas o campo text
   - Não incluir os campos h1 e h2
4. Os campos "bg" e "logo" devem ser nomes de arquivos que existem na pasta "input" (sem a extensão .png)
5. Os textos devem ser relevantes para redes sociais e seguir uma sequência lógica entre as páginas
6. Gere exatamente 5 objetos diferentes no array (uma para cada página do carrossel)
7. Mantenha os textos em português
8. Os textos devem ser curtos e impactantes, adequados para redes sociais
9. Mantenha uma narrativa coesa entre as páginas do carrossel

Exemplo de uso:
- Se você tem um arquivo "background1.png" na pasta input, use "background1" no campo "bg"
- Se você tem um arquivo "logo_empresa.png" na pasta input, use "logo_empresa" no campo "logo"
```

## Funcionalidades

- Geração automática de artes para carrosséis de posts
- Suporte a múltiplos templates com layouts diferentes:
  - Template1: Layout padrão com título e subtítulo
  - Template2: Layout informativo com faixa inferior
  - Template3: Layout de duas colunas
- Suporte a múltiplas artes em uma única execução
- Personalização de título, subtítulo, texto informativo, imagem de fundo e logo para cada página
- Suporte a imagens locais e URLs
- Dimensões padrão de 1080x1350 pixels

## Dependências

- puppeteer: ^24.8.2 