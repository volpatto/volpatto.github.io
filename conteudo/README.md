# Editar o conteúdo do site

O site usa o pacote **SciAstro**, com o **LNCC Theme**. As edições habituais são
feitas em YAML e BibTeX; não é necessário conhecer JavaScript nem alterar componentes.

- `../sciastro.yaml`: identidade, tema, logo, idiomas, rodapé e ordem das páginas.
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

    Outro parágrafo com **ênfase** e [um link](/pesquisa/).
  en: |
    A first paragraph.

    Another paragraph with **emphasis** and [a link](/en/research/).
```

Links internos começam por `/`. Nas traduções inglesas, use o caminho inglês.
Links de download podem usar `download: true`. Markdown é tratado como conteúdo;
HTML bruto não é executado.

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
de licenciamento ao adicionar imagens. O fundo branco de `styles/people.css`
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
