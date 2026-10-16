# Manual de imagens (Visual Studio Code)

Todas as imagens ficam em `public/assets/images/`. Para substituir: no VS Code, arraste a nova imagem para a pasta indicada **com o nome exato** da tabela (substitua o ficheiro antigo) e atualize a página no navegador (Ctrl+F5). Nomes simples, sem espaços nem acentos; não repita extensões (`foto.jpg.jpg`).

| Pasta | Ficheiro esperado | Aparece em | Estado |
|---|---|---|---|
| `marca/` | `logotipo.jpg` | cabeçalho e rodapé | **já colocado** (o seu logótipo, só com as margens brancas recortadas). O original está em `logotipo-original.jpg` |
| `marca/` | `favicon.png` (quadrado, ex. 256×256) | separador do navegador | por fornecer |
| `banners/` | `banner-principal.jpg` (ex. 1600×900) | fundo da página inicial | por fornecer (sem ficheiro, o fundo fica preto) |
| `categorias/` | `virgens.jpg`, `personalizadas.jpg`, `marca-propria.jpg` (ex. 800×600) | cartões de categorias, página inicial | por fornecer |
| `produtos/` | qualquer nome, ex. `camiseta-virgem-preta-frente.jpg` (proporção 4:5) | página da loja e do produto | por fornecer |

**Fotografias de produtos:** copie os ficheiros para `public/assets/images/produtos/` e, no painel (`/admin`), escreva o caminho no campo *Fotografias*, um por linha (a primeira é a principal), por exemplo `assets/images/produtos/camiseta-virgem-preta-frente.jpg`.

Se uma imagem não existir, aparece um espaço cinzento reservado e nada fica quebrado. Não usamos imagens de outros sites.
