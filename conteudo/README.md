# Como editar o site

Os textos e os registros do site estão nesta pasta, em arquivos **YAML**.
Para atualizar uma descrição, disciplina, aluno, publicação ou parceria, não é
preciso escrever JavaScript nem TypeScript. A ordem das listas é a ordem de exibição.

## Encontre a página

| Quero alterar… | Arquivo | Campos principais |
| --- | --- | --- |
| Nome, e-mail, perfis e textos do cabeçalho/rodapé | [site.yaml](site.yaml) | `profile`, `identity`, `interface`, `footer` |
| Apresentação e foto | [sobre.yaml](paginas/sobre.yaml) | `introduction`, `portrait`, `background` |
| Linhas de pesquisa e figuras | [pesquisa.yaml](paginas/pesquisa.yaml) | `items`, `figure`, `topics` |
| Artigos | [publicacoes.yaml](paginas/publicacoes.yaml) | `items` |
| Softwares e seus links | [software.yaml](paginas/software.yaml) | `practices`, `items`, `packages` |
| Disciplinas e materiais | [ensino.yaml](paginas/ensino.yaml) | `courses`, `material` |
| Alunos e orientações concluídas | [orientacoes.yaml](paginas/orientacoes.yaml) | `students`, `alumni` |
| Grupos de pesquisa | [grupos.yaml](paginas/grupos.yaml) | `items` |
| Parcerias acadêmicas, projetos e indústria | [parcerias.yaml](paginas/parcerias.yaml) | `partners`, `projects`, `industryPartners` |
| Histórico profissional, formação e PDF | [curriculo.yaml](paginas/curriculo.yaml) | `experience`, `education`, `appointments`, `download` |
| Sala e endereço | [contato.yaml](paginas/contato.yaml) | `address` |
| Créditos e condições dos materiais | [licenciamento.yaml](paginas/licenciamento.yaml) | `sections` |

`heading` é o título exibido na página. `page.label` é o nome no menu;
`page.description` é a descrição para buscadores. `page.path` contém os caminhos
das versões em português e inglês. Mantenha `page.id`: ele liga o conteúdo ao
componente que apresenta a página.

## Edite um texto

Use dois espaços para cada nível de indentação, sem tabulações. Campos traduzidos
têm `pt` e `en`; ambos são obrigatórios. Nomes próprios, títulos de artigos e DOIs
não precisam de tradução.

```yaml
heading:
  pt: Grupos de pesquisa
  en: Research groups
```

Para parágrafos longos, `>-` permite quebrar linhas no arquivo sem criar quebras
visíveis no site:

```yaml
description:
  pt: >-
    Primeira frase da descrição.
    A segunda frase continua no mesmo parágrafo.
  en: >-
    First sentence of the description.
    The second sentence continues in the same paragraph.
```

Nos campos de parágrafos com links — como `background.paragraphs` em `sobre.yaml`,
`practices.paragraphs` e `otherProjects` em `software.yaml`, os textos de
`licenciamento.yaml` e as notas que remetem ao currículo — use Markdown:

```yaml
pt: Veja o [currículo](/curriculo/) e o [GitHub](https://github.com/volpatto).
en: See the [CV](/en/cv/) and [GitHub](https://github.com/volpatto).
```

Esses campos também aceitam `**negrito**`, `*itálico*` e crases para código.
Os demais campos são texto simples. Não insira HTML nem imagens dentro dos
parágrafos: imagens têm campos próprios, com descrição e dimensões.

Links internos começam por `/`, sem incluir o domínio ou o subdiretório de
hospedagem. O site acrescenta esse subdiretório automaticamente quando necessário.
Links externos incluem `https://` (ou `http://` para as fontes que ainda o usam).

## Acrescente uma publicação

Em `paginas/publicacoes.yaml`, copie um item inteiro da lista `items` e edite os
campos. Coloque-o na posição em que deve aparecer. Exemplo **fictício**, apenas para
mostrar o formato:

```yaml
  - year: "2027"
    title: Título do novo artigo
    authors: A. Autora, B. Autor
    journal: Nome do periódico
    citation: Volume, páginas ou número do artigo
    doi: 10.1234/substitua-pelo-doi-real
    topic:
      pt: Métodos numéricos
      en: Numerical methods
```

Informe somente o identificador no campo `doi`, sem `https://doi.org/`.
As contagens dos testes acompanham o YAML; não é preciso ajustá-las em outro arquivo.

## Acrescente ou mova um aluno

Em `paginas/orientacoes.yaml`, `students` reúne orientações em andamento;
`alumni`, as concluídas. Copie um item existente, mantendo a indentação:

```yaml
  - name: Nome do aluno
    institution: LNCC
    year: "2027"
    role:
      pt: Orientação
      en: Supervisor
```

`topic` é opcional; omita-o se o tema não estiver definido. Use `provisional: true`
para identificar um tema provisório. Em `alumni`, o campo `level` identifica
mestrado, iniciação científica etc. Ao concluir uma orientação, mova o registro
para `alumni` e atualize ano, nível e tema conforme a situação efetiva.

## Softwares, logos e parcerias

Em `software.yaml`, cada item contém `repo`, `docs` e uma lista `packages`.
Cada distribuição tem seu próprio `label` e `url`; não há regras ocultas que
dependam do nome do software. `logo` é opcional.

```yaml
packages:
  - label: PyPI
    url: https://pypi.org/project/nome-do-pacote/
  - label: Conda-Forge
    url: https://anaconda.org/conda-forge/nome-do-pacote
```

Em `parcerias.yaml`, `partners` reúne os grupos acadêmicos e seus textos, logos e
links. `projects.items` reúne os projetos. `industryPartners.items` controla os
logos e destinos da seção de indústria. Para acrescentar uma parceria, copie um
item da lista correspondente e troque seus campos, inclusive o `id` quando houver.

O logo do LEF usa `kind: lef`, que preserva a janela de recorte do arquivo original.
Para os demais, use `kind: image`, `file`, `width`, `height` e `alt`, seguindo os
exemplos existentes. Esse detalhe controla apenas a apresentação do logo.

## Imagens e currículo

Os caminhos `file` são relativos a `public/`: `images/foto.jpg` corresponde a
`public/images/foto.jpg`. `width` e `height` são as dimensões da imagem em pixels;
`alt` descreve seu conteúdo para leitores de tela. Figuras de pesquisa também
têm `caption` (legenda), `source` (fonte) e `credit` (atribuição).

Ao substituir imagens, confira seus créditos em `licenciamento.yaml` e
[`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md).

O PDF do currículo continua sendo gerado separadamente com lattes2pdf. Alterar o
YAML do site **não regenera o PDF**. Consulte as instruções no README principal;
depois da revisão, atualize `download` e `sourceNote` em `curriculo.yaml`, além das
datas de referência em `site.yaml`, quando necessário.

## Veja o resultado e confira

Com Pixi instalado, abra um terminal na pasta do repositório.
O ambiente e as dependências são preparados automaticamente:

```sh
pixi run dev
```

Abra `http://127.0.0.1:4321/`. Salve o YAML; a prévia será atualizada automaticamente.
O servidor continua em segundo plano; encerre-o com `pixi run dev-stop`.
Se aparecer `Another astro dev server is already running`, abra o endereço
informado: a prévia anterior ainda está ativa. Para reiniciá-la, execute
`pixi run --locked dev-stop` e depois `pixi run --locked dev`.
Confira as duas línguas e os dois temas. Antes de enviar as mudanças ao GitHub:

```sh
pixi run verify
```

Esse comando valida conteúdo, imagens locais, componentes, geração e links.
Um erro como `conteudo/paginas/pesquisa.yaml: items.0.description.en` indica que
o problema está na descrição em inglês do **primeiro** item (a contagem começa em
zero). Erros de sintaxe YAML também indicam linha e coluna.

Para conferir só os arquivos de conteúdo, use `pixi run check-content`.
O resultado publicado é estático; os arquivos YAML não são carregados pelo navegador.

## Quando é necessário mexer no código

Novos registros, parágrafos, links ou imagens dentro das estruturas existentes
são alterações de conteúdo. Um novo tipo de seção ou uma nova página pode exigir
um componente Astro. O mapa de arquivos e o fluxo estão em
[`docs/arquitetura.md`](../docs/arquitetura.md).
