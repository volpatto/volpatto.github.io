# Editar o conteúdo do site

O site usa o pacote **SciAstro**, com o **LNCC Theme**. As edições habituais são
feitas em YAML; não é necessário conhecer JavaScript nem alterar componentes.

- `../sciastro.yaml`: identidade, tema, logo, idiomas, rodapé e ordem das páginas.
- `paginas/`: um arquivo por página, com os textos em português (`pt`) e inglês (`en`).
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
| `publications` | Publicações com autoria, ano, periódico e DOI |
| `team` | Equipe estruturada a partir de `team.yaml`, quando utilizada |
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

Em `publicacoes.yaml`, adicione registros na seção `type: publications`, mantendo
`title`, `authors`, `year`, `journal`, `citation`, `doi` e `topic`. O DOI deve ser
somente o identificador, como `10.1234/exemplo`, sem `https://doi.org/`.

Também é possível adicionar `bibliography: { file: references.bib, style: apa }`
em `sciastro.yaml`, criar `conteudo/references.bib` e usar `[@chave]` nos textos.
O campo `references: [chave1, chave2]` de uma página lista referências sem exigir
citações no corpo. As publicações atuais mantêm o texto editorial da versão
anterior; elas não são convertidas automaticamente em registros BibTeX.

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
