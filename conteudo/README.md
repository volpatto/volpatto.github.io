# Editar o conteúdo do site

O site usa o pacote **SciAstro**, com o **LNCC Theme**. As edições habituais são
feitas em YAML e BibTeX; não é necessário conhecer JavaScript nem alterar componentes.

- `../sciastro.yaml`: identidade, tema, logo, compartilhamento, idiomas, rodapé e ordem das páginas.
- `paginas/`: um arquivo por página, com os textos em português (`pt`) e inglês (`en`).
- `publicacoes.bib`: dados bibliográficos compartilhados por publicações e citações.
- `alunos.yaml`: orientações, fotos e símbolos institucionais.
- `../public/`: imagens, documentos e licenças servidos pelo site.

## Visualizar e conferir

Na raiz do repositório, com [Pixi instalado](https://pixi.prefix.dev/latest/installation/):

```sh
pixi install --locked
pixi run --locked setup
pixi run --locked dev
```

Abra `http://127.0.0.1:4321/`. Salve um YAML para atualizar a prévia. Se o servidor
já estiver aberto, use o endereço informado ou reinicie com `dev-stop` e `dev`.
Depois da edição, rode `pixi run --locked verify`. O [README principal](../README.md)
explica a instalação, a publicação e a configuração de outros domínios.

## Estrutura de uma página

```yaml
id: software
title: Software
paths:
  pt: software/
  en: en/software/
icon: lucide:code-xml
sections:
  - type: prose
    text:
      pt: Projetos de software científico.
      en: Scientific software projects.
  - type: cards
    layout: rows
    items:
      - title: Meu pacote
        eyebrow: Python
        text:
          pt: Descrição do pacote e das aplicações.
          en: Package description and applications.
        links:
          - label: GitHub
            url: https://github.com/exemplo/pacote
            icon: lucide:code-xml
```

`title` é o nome curto do menu. `heading` pode fornecer um título maior para a
página, como no currículo. `description` descreve a página nos metadados.
`paths` preserva os endereços de cada idioma. Não inclua o subdiretório de
hospedagem nesses campos: ele é acrescentado automaticamente pelo SciAstro.

Os blocos de `sections` aparecem na ordem do arquivo. Para mudar a ordem, mova o
bloco inteiro, mantendo a indentação. Para adicionar um registro, copie um item
da lista correspondente. Um texto simples é compartilhado pelos dois idiomas;
um objeto com `pt` e `en` fornece traduções.

## Tipos de seção disponíveis

| Tipo | Uso |
| --- | --- |
| `profile` | Apresentação com nome, foto e links; usado na página inicial |
| `prose` | Texto em Markdown; `tone: note` destaca um bloco |
| `figure` | Texto com figura, legenda, créditos e links para a fonte |
| `cards` | Cards em grade (`layout: grid`) ou linhas (`layout: rows`) |
| `list` | Listas; pode usar `collapsible: true` e `open: true` |
| `timeline` | Experiência e formação; cada item tem `period` |
| `logos` | Logos com links, como nas parcerias industriais |
| `publications` | Cards preenchidos por BibTeX, com categorias definidas no YAML |
| `team` | Orientações estruturadas a partir de `alunos.yaml` |
| `custom` | Extensão avançada com componente Astro registrado |

Cards, listas e trajetórias aceitam `title`, `eyebrow` (linha acima do título),
`subtitle`, `text`, `meta`, `images` e `links`. O conteúdo atual exemplifica esses
campos em `software.yaml`, `parcerias.yaml` e `curriculo.yaml`.

### Textos e links

Use `|` para escrever vários parágrafos de forma legível:

```yaml
text:
  pt: |
    Um primeiro parágrafo.

    Outro parágrafo com **ênfase** e [um link](page:research).
  en: |
    A first paragraph.

    Another paragraph with **emphasis** and [a link](page:research).
```

Use `page:ID` para ligar outra página pelo seu campo `id`, independente do idioma.
Por exemplo, `research` identifica Pesquisa, `cv` identifica Currículo, `people`
identifica Orientações e `collaborations` identifica Parcerias. O SciAstro escolhe
o caminho do idioma atual e acrescenta o subdiretório de publicação automaticamente.

Para uma seção, acrescente seu `id` após `#`, como
`[SciML](page:research#sciml)`. Os mesmos destinos funcionam nos campos de links:

```yaml
links:
  - label: { pt: Contato, en: Contact }
    url: page:contact
    icon: lucide:mail
```

O build rejeita páginas e âncoras inexistentes. Preserve esses identificadores
ao renomear títulos ou mudar endereços. Imagens, PDFs e outros arquivos continuam
usando caminhos de `public/`, como `/images/figura.png` e `/files/documento.pdf`.
O rodapé ainda usa URLs explícitos por idioma, como `/licenciamento/` e
`/en/licensing/`; não use `page:` em `footer` ou `copyright`.
Links de download podem usar `download: true`. HTML bruto não é executado nos
textos Markdown das seções.

### Imagens e créditos

```yaml
image:
  src: /images/minha-figura.png
  alt: { pt: Descrição da figura, en: Figure description }
  caption: { pt: Legenda e contexto., en: Caption and context. }
  width: 1200
  height: 800
  enlarge: true
  links:
    - label: { pt: Fonte, en: Source }
      url: https://example.org/artigo
```

O arquivo deve existir em `public/images/`. Não remova os créditos e condições
de uso das figuras e logos existentes. Uma janela `viewBox` recorta apenas a
exibição do logo; o arquivo original é preservado.

As legendas ficam centralizadas por padrão. Em `../sciastro.yaml`, configure
figuras e tabelas separadamente:

```yaml
appearance:
  captions:
    figures: center
    tables: center
```

Os valores aceitos são `left`, `center`, `right` e `justify`. Para uma exceção,
acrescente `captionAlign: left` ao objeto `image` da figura desejada; omita o
campo para herdar o padrão global. Isso também vale para a foto de apresentação,
imagens de cards e logos. Os links de fonte e licença acompanham o alinhamento;
com `justify`, os links ficam à esquerda. Essas opções não movem nem recortam a
imagem e dispensam CSS adicional.

### Foto de apresentação e compartilhamento

A imagem da seção `profile` em `paginas/sobre.yaml` usa as opções nativas:

```yaml
image:
  src: /images/diego-volpatto.jpg
  alt: { pt: Diego Volpatto, en: Diego Volpatto }
  width: 460
  height: 460
  shape: circle
  position: [50, 50]
  caption: { pt: "Petrópolis, Brasil", en: "Petrópolis, Brazil" }
```

`shape: circle` exibe o retrato dentro de um círculo. `rectangle` preserva o
formato retangular. `position` define o enquadramento horizontal e vertical em
porcentagens; `[50, 50]` centraliza. Ao substituir o arquivo, atualize `width` e
`height` com suas dimensões originais. O recorte não altera a imagem em disco.

A imagem da prévia de links é configurada separadamente em `../sciastro.yaml`:

```yaml
social:
  fallback: logo
```

O site reutiliza o PNG original do LNCC, inteiro, sem o `viewBox` nem as cores
aplicadas no cabeçalho. Essa alternativa pertence a `social` e não consulta
`people.avatarFallback` ou as fotos das pessoas.

Para escolher outra imagem, coloque um PNG/JPEG em `public/images/` e acrescente
`image` ao mesmo bloco, substituindo o exemplo por um arquivo existente:

```yaml
social:
  fallback: logo
  image:
    src: /images/compartilhamento.png
    alt: { pt: "Apresentação de Diego Volpatto", en: "Diego Volpatto's website" }
    width: 1200
    height: 630
```

`social.image` tem prioridade. `width` e `height` são opcionais e descrevem as
dimensões reais do arquivo, sem redimensioná-lo. `social.fallback` também aceita
um objeto `src`/`alt` próprio, com dimensões opcionais, ou `false` para desativar
a alternativa automática. A mesma imagem serve todas as páginas; título e
descrição seguem a página e o idioma.

A prévia local permite conferir os metadados, mas WhatsApp e outros serviços só
conseguem buscar a imagem depois da publicação em um endereço público. Eles
controlam o recorte e o cache, portanto uma imagem anterior pode persistir algum
tempo após a atualização.

### Publicações e referências

Para acrescentar uma publicação:

1. Exporte o BibTeX pelo periódico ou gerenciador bibliográfico e acrescente a
   entrada em `publicacoes.bib`. Confira os metadados e escolha uma chave única.
2. Em `paginas/publicacoes.yaml`, acrescente um item à seção `type: publications`:

   ```yaml
   - bibtex:
       file: publicacoes.bib
       key: leal2025reaktoro
     topic:
       pt: Geoquímica
       en: Geochemistry
   ```

3. Substitua a chave pela da nova entrada e ajuste a categoria nos dois idiomas.
   A posição do item no YAML determina a ordem do card.
4. Execute `pixi run --locked verify` e confira a prévia.

O exemplo acima corresponde a um artigo já cadastrado; não duplique o item.
`file` é relativo a `conteudo/`, não a `conteudo/paginas/`. Como `bibliography.file`
já aponta para esse arquivo em `sciastro.yaml`, a forma curta
`bibtex: leal2025reaktoro` também funciona. Use `{ file, key }` para selecionar
entradas de outro `.bib` dentro de `conteudo/`.

Não repita `title`, `authors`, `year`, `journal`, `citation` ou `doi` no YAML:
o SciAstro os preenche durante o build. Esses campos, quando escritos manualmente,
substituem os dados do BibTeX. O campo `topic` continua sendo uma escolha editorial.
Adicionar uma entrada ao `.bib` não cria um card: é preciso selecioná-la no YAML.

No BibTeX, separe autores por `and`, proteja siglas ou títulos com chaves e use
`--` em intervalos de páginas. `number` é o número da edição; números de artigo
podem ficar em `pages`, como nas entradas existentes. O DOI deve conter somente o
identificador. O arquivo já inclui exemplos de periódicos com páginas e com
números de artigo. Os metadados iniciais foram conferidos no Crossref; para o
artigo SEIRD, `year` registra a primeira publicação online, em 29 de setembro de
2021. O volume, número e páginas correspondem à edição de 2023; essa distinção
fica registrada em `note` (esse campo não aparece no card).

**Citar uma referência em um texto:** a bibliografia padrão já está configurada
em `../sciastro.yaml`. Por exemplo, em um bloco `prose`:

```yaml
text:
  pt: "Uma aplicação em transporte reativo é apresentada em [@kyas2022reactive]."
  en: "A reactive transport application is presented in [@kyas2022reactive]."
```

O SciAstro cria a citação e a referência ao final da página. O campo
`references: [kyas2022reactive]`, no nível da página, inclui uma referência sem
citação no corpo. Essas citações usam o arquivo de `bibliography.file`; selecionar
um card de outro `.bib` não acrescenta esse arquivo à bibliografia das citações.
Os cards de publicações, sozinhos, não duplicam uma lista de referências no rodapé.
O build não busca metadados na internet: mantenha o `.bib` junto com o site no Git.

### Orientações, fotos e símbolos

O cadastro fica em `conteudo/alunos.yaml`, selecionado em `sciastro.yaml`:

```yaml
people:
  file: alunos.yaml
  # Mantenha avatarFallback neste mesmo bloco para configurar o símbolo padrão.
```

O caminho de `file` é relativo a `contentDir` (`conteudo/` neste site). O arquivo
`paginas/orientacoes.yaml` contém a introdução e a composição da página; os dados
dos alunos ficam no cadastro acima. Não é necessário manter um arquivo auxiliar.

Edite `alunos.yaml`. Cada pessoa tem `id` único, `name`, `role: student`,
`status` (`active` ou `alumni`), `level` e, quando conhecidos, `startYear` e
`endYear`. Os níveis disponíveis são `undergraduate`, `masters`, `phd` e `postdoc`.
`affiliation` identifica a instituição e a atuação como orientador ou coorientador;
`topic` contém o tema nos dois idiomas. A ordem dos registros é preservada dentro
de cada grupo. A página usa `type: team` para separar ativos por nível e egressos.

Para adicionar uma foto, coloque o arquivo em `public/images/people/` e acrescente
à pessoa (substituindo o nome do arquivo):

```yaml
photo:
  src: /images/people/nome-da-pessoa.jpg
  alt: { pt: "Retrato de Nome da Pessoa", en: "Portrait of Person Name" }
  position: [50, 35]
```

A foto será exibida em um círculo. `position` ajusta o enquadramento horizontal e
vertical, de 0 a 100; sem esse campo, o recorte fica centralizado em `[50, 50]`.
Omitir `photo` ativa o símbolo alternativo: primeiro `avatarFallback` da pessoa,
depois `people.avatarFallback` em `sciastro.yaml` (LNCC neste site).

Os alunos da UDESC e da Unicamp têm seus próprios símbolos. Em `alunos.yaml`,
`&udesc` dá um nome à configuração do símbolo e `*udesc` a reutiliza; ao mover ou
remover a primeira definição, mantenha-a antes dos usos. Você também pode copiar
o bloco completo ou definir outro `avatarFallback` para uma pessoa. `viewBox`,
`width` e `height` permitem mostrar somente o símbolo de um logo sem alterar o
arquivo original. Preserve os créditos em `THIRD_PARTY_NOTICES.md` e na página
de licenciamento ao adicionar imagens. O fundo branco de `styles/site.css`
mantém o contraste das cores originais nos modos claro e escuro.

Para concluir uma orientação, mude `status` para `alumni` e informe `endYear`.
Quando o ano inicial não for conhecido, mantenha-o ausente e inclua o ano de
conclusão também em `affiliation`, como nos exemplos existentes: atualmente o
card só exibe automaticamente o período quando há `startYear`.

### Criar uma página

1. Crie um YAML em `paginas/`, seguindo um dos exemplos existentes.
2. Escolha um `id` único e os caminhos de português e inglês.
3. Acrescente o arquivo a `pageFiles` em `../sciastro.yaml`.
4. Para incluí-la no menu, acrescente seu `id` a `navigation`, na posição desejada.
5. Execute `pixi run --locked verify` e confira os dois idiomas na prévia.

Uma página com `navigation: false` continua acessível por links, mas fica fora do
menu; é o caso de licenciamento. Na página inicial, `header: false` permite que a
seção `profile` forneça o único título principal.

## Aparência e atualização do pacote

O visual é configurado em `../sciastro.yaml`, sem editar JavaScript:

```yaml
theme: lncc
layout:
  navigation: sidebar
appearance:
  palette:
    base: slate
    accent: violet
  icons:
    style: accent
    weight: regular
  motion: subtle
  gradient:
    style: linear
    colors: [ocean, violet]
    targets: [headings]
    angle: 115
  captions:
    figures: center
    tables: center
```

- `palette.base` escolhe as superfícies e cores de texto; `accent` escolhe a cor
  dos links e destaques. Cada paleta inclui modos claro e escuro.
- `icons.style: accent` colore os ícones do menu. Logos institucionais e
  bandeiras mantêm as cores originais.
- `gradient` se aplica apenas aos títulos principais. Use `gradient: false`
  para voltar a títulos de cor sólida. Na impressão, os títulos usam cor sólida.
- `motion: subtle` ativa movimentos discretos nos controles compatíveis. Use
  `none` para desativá-los; a preferência de movimento reduzido é respeitada.
- Omitimos `typography` para preservar a combinação do LNCC Theme: títulos
  principais serifados e texto e subtítulos em Manrope.

As opções são descritas no [guia de aparência do SciAstro](https://volpatto.github.io/sciastro/guides/appearance/).
O site continua com as mesmas páginas e conteúdo. Recursos para disciplinas,
notebooks e gráficos interativos podem ser adotados quando houver material
apropriado; não são necessários para estas páginas.

O campo `theme: lncc` seleciona a apresentação. `appearance` permite ajustar a
paleta clara/escura, largura e famílias tipográficas. O [mapa do repositório](../README.md#estrutura-do-repositório)
explica a separação entre este repositório e o SciAstro. Instruções para atualizar
a dependência estão no [README](../README.md#atualizar-o-sciastro).

## Rodapé

Em `sciastro.yaml`, `copyright` contém a identificação com o ano e o nome,
mostrada à esquerda do crédito “Feito com SciAstro”. O campo `footer` contém
as mensagens de licença em português e inglês, na linha seguinte, ocupando
toda a largura disponível. No celular, os textos quebram conforme o espaço.
Ambos aceitam links em Markdown. Não repita o copyright dentro de `footer`.
Use caminhos explícitos por idioma nesses campos; os links `page:ID` ficam
restritos aos textos e links das páginas.
