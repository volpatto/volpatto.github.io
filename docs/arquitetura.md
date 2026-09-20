# Organização do projeto

```text
pixi.toml / pixi.lock        Ferramentas e tarefas do ambiente de build
conteudo/                    Conteúdo editável em YAML
  site.yaml                  Identidade, contatos, interface e página 404
  paginas/                   Um arquivo por página, com pt e en
src/
  content/                   Leitura, validação, traduções e Markdown
  lib/navigation.ts          Caminhos e ordem do menu
  layouts/AcademicLayout.astro  Cabeçalho, menu, rodapé e comportamento comum
  components/pages/          Um componente de apresentação por página
  components/                Ícones, logos, referência bibliográfica e RichText
  data/brand-icons.ts        Desenhos e créditos dos ícones de marcas
  pages/                     Entradas e geração de rotas do Astro
  styles/global.css          Aparência, responsividade e temas
public/                      Arquivos servidos sem transformação
scripts/                     Validações e geração independente do CV
tests/                       Contratos de conteúdo e links
cv/                          Configuração da geração do PDF
```

## Do YAML à página

1. `src/content/index.ts` importa os arquivos YAML como texto pelo Vite. Isso
   permite atualizar a prévia quando um arquivo de conteúdo é salvo.
2. `reader.ts` lê o YAML e valida os campos com os esquemas de `schema.ts`.
   Erros indicam o arquivo e o caminho do campo. Os tipos TypeScript são derivados
   desses mesmos esquemas, evitando manter duas definições independentes.
3. O componente em `src/components/pages/` recebe o idioma e usa os dados da sua
   página. `t(campo, lang)` escolhe `pt` ou `en`. `RichText.astro` apresenta os
   parágrafos que aceitam Markdown, sem acrescentar elementos ao layout.
4. `AcademicLayout.astro` envolve o conteúdo com a estrutura comum. Astro gera
   HTML, CSS e o pequeno script de interação em `dist/`.

Não há API, consulta ao Lattes nem leitura de YAML no navegador. YAML, Zod e
Marked participam da geração. O comportamento de tema e menu permanece no layout:
o script inicial de tema deve executar antes da primeira pintura para evitar
um clarão ao abrir o site em modo escuro.

## Relação entre conteúdo e componentes

| YAML | Componente em `src/components/pages/` |
| --- | --- |
| `sobre.yaml` | `About.astro` |
| `pesquisa.yaml` | `Research.astro` |
| `publicacoes.yaml` | `Publications.astro` |
| `software.yaml` | `Software.astro` |
| `ensino.yaml` | `Teaching.astro` |
| `orientacoes.yaml` | `Supervision.astro` |
| `grupos.yaml` | `Groups.astro` |
| `parcerias.yaml` | `Collaborations.astro` |
| `curriculo.yaml` | `Curriculum.astro` |
| `contato.yaml` | `Contact.astro` |
| `licenciamento.yaml` | `Licensing.astro` |

## Acrescentar um campo ou um tipo de seção

1. Acrescente o campo ao esquema da página em `src/content/schema.ts`.
2. Preencha-o no YAML, nos dois idiomas quando for texto traduzível.
3. Apresente-o no componente correspondente, mantendo a semântica do HTML.
4. Execute `pixi run verify` e confira a prévia.

Para uma página inteiramente nova, cadastre também o arquivo em `contentFiles`,
o identificador em `pageIds`, o componente em `src/pages/[...page].astro` e, se
for uma página do menu, a entrada e o ícone em `src/lib/navigation.ts`.
As rotas das páginas existentes vêm de `page.path` nos YAMLs. Ao mudar uma rota,
atualize os links editoriais que apontem para ela; `pnpm test` detecta links
internos quebrados no HTML gerado.

## Verificações

`pixi run verify` prepara o ambiente e executa `pnpm verify`, a mesma sequência
principal do workflow:

- `pnpm check`: campos, traduções, arquivos locais, tipos e componentes Astro;
- `pnpm build`: geração estática;
- `pnpm test`: testes da camada de conteúdo e conferência das páginas geradas.

As contagens de publicações e orientações são calculadas a partir do conteúdo.
Os testes também verificam navegação, idiomas, links internos, arquivos de imagem,
download do currículo e o limite editorial de menções à ESSS somente no CV.
Não conferem a validade científica dos textos nem a disponibilidade de sites externos.

Use `pixi run format` para formatar o código. Os YAMLs editoriais são mantidos fora
dessa formatação automática para preservar seus comentários e parágrafos legíveis.

## Publicação

O workflow `pages.yml` instala o ambiente definido em `pixi.lock`, executa
`pixi run --locked verify` e publica somente o artefato `dist/`.
Pixi fornece Node.js/pnpm; pnpm instala Astro e as demais bibliotecas conforme
`pnpm-lock.yaml`.
Pull requests executam verificações e compilação sem publicar. Na configuração
do repositório, **Settings → Pages → Source** deve estar em **GitHub Actions**.
O build automático por branch usa Jekyll e não consegue compilar os arquivos Astro.
