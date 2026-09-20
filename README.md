# Diego Volpatto -- site acadêmico

[![Build e publicação](https://github.com/volpatto/volpatto.github.io/actions/workflows/pages.yml/badge.svg?branch=main)](https://github.com/volpatto/volpatto.github.io/actions/workflows/pages.yml)
[![Astro](https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js 24](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

Site pessoal estático em português e inglês, construído com Astro e TypeScript, com conteúdo editável em YAML. Apesar de ter sido montado para o Github Pages, fiz pensando em mover facilmente para outros domínios.

Organizado em dez páginas acadêmicas por idioma: apresentação, pesquisa, publicações, software, ensino, orientações, grupos de pesquisa, parcerias e projetos, currículo e contato. Uma página adicional de licenciamento em cada idioma é acessível pelo rodapé. Inclui experiência profissional, práticas de engenharia de software, resumos de ementas e logos dos grupos e instituições. Os modos claro e escuro respeitam a preferência do sistema na primeira visita; o botão no cabeçalho salva a escolha localmente. As fontes e imagens são servidas pelo próprio site. Não há analytics, formulário, banco de dados nem chamadas ao GitHub durante a navegação.

## Licenciamento

O [escopo das licenças](LICENSE.md) distingue **textos editoriais autorais sob CC BY 4.0** e **código e documentação técnica originais sob MIT**. Textos editoriais em YAML ou dentro de arquivos `.astro` ou `.ts` continuam sujeitos à licença de conteúdo; isso não torna todas as partes desses arquivos intercambiavelmente MIT ou CC BY.

Logos, foto, figuras científicas, currículo em PDF, fontes e materiais de terceiros estão fora dessas concessões gerais. Os créditos e as condições de cada ativo estão em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). A figura de Kyas et al. tem sua própria licença CC BY 4.0, com atribuição aos autores originais. Os textos integrais das licenças e avisos distribuídos com o site estão em `public/licenses/`.

O rodapé de todas as páginas acadêmicas liga para `/licenciamento/` ou `/en/licensing/`, respeitando o subdiretório configurado. Ao adicionar imagens ou documentos, atualize os avisos de direitos e a página de licenciamento.

## Rodar localmente

Requisitos: Node.js 24 e pnpm 11.19.0 (versão declarada em `package.json`).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Acesse `http://127.0.0.1:4321/`.

```sh
pnpm verify         # Valida o conteúdo, confere o código, gera e testa o site
pnpm check:content  # Confere somente os YAMLs e seus arquivos locais
pnpm preview        # Abre o resultado estático da última compilação
```

Os comandos também podem ser executados separadamente: `pnpm check`,
`pnpm build` e `pnpm test`, nessa ordem. Os testes usam o suporte a TypeScript do
Node.js 24; não é preciso compilar os arquivos de teste manualmente.

O site funciona sem JavaScript para leitura, navegação entre páginas, menu móvel, download do CV e orientações expansíveis. O seletor de tema e a adaptação automática do estado do menu usam JavaScript. A mudança de idioma preserva a página atual; a escolha de tema persiste entre páginas. Links antigos como `/#teaching` são encaminhados à página correspondente quando JavaScript está disponível.

## Onde atualizar o conteúdo

Nota mais para eu mesmo, já que JS não é meu forte.

**Comece pelo [guia de edição em `conteudo/README.md`](conteudo/README.md).**
Os textos, links, imagens e listas estão em YAML, com um arquivo por página.
Para acrescentar um artigo, aluno, software ou parceria, copie um registro da
lista correspondente e edite seus campos; não é preciso alterar os componentes
nem atualizar contagens nos testes.

| Arquivo | O que editar |
| --- | --- |
| `conteudo/site.yaml` | Nome, e-mail, perfis e textos compartilhados |
| `conteudo/paginas/sobre.yaml` | Apresentação, foto e formação resumida |
| `conteudo/paginas/pesquisa.yaml` | Linhas de pesquisa, figuras e fontes |
| `conteudo/paginas/publicacoes.yaml` | Artigos e DOIs |
| `conteudo/paginas/software.yaml` | Softwares, práticas, documentação e pacotes |
| `conteudo/paginas/ensino.yaml` | Disciplinas e materiais |
| `conteudo/paginas/orientacoes.yaml` | Alunos atuais e orientações concluídas |
| `conteudo/paginas/grupos.yaml` | Grupos de pesquisa |
| `conteudo/paginas/parcerias.yaml` | Parcerias acadêmicas, projetos e indústria |
| `conteudo/paginas/curriculo.yaml` | Experiência, formação e download do CV |
| `conteudo/paginas/contato.yaml` | Sala e endereço |
| `conteudo/paginas/licenciamento.yaml` | Créditos e condições dos materiais |
| `public/images/` | Imagens, logos e bandeiras |
| `public/files/cv-diego-volpatto-2026.pdf` | PDF do currículo já revisado |
| `cv/` | Configuração para gerar novamente o PDF |

Os campos traduzidos têm `pt` e `en`. Não há importação automática do Lattes;
as atualizações continuam editoriais e devem ser conferidas antes de publicar.
O guia inclui exemplos de parágrafos, links, publicações e alunos.

Para mudanças de estrutura ou aparência, veja o
[mapa da arquitetura](docs/arquitetura.md). Cada página tem seu próprio componente
em `src/components/pages/`. Cores, fontes e responsividade continuam em
`src/styles/global.css`. `src/layouts/AcademicLayout.astro` reúne cabeçalho,
navegação, rodapé e comportamento de tema/menu.

Ícones e bandeiras são locais. Os desenhos acompanham rótulos textuais e são
decorativos para leitores de tela. As bandeiras do Brasil e do Reino Unido
acompanham PT e EN; os nomes acessíveis são Português e English. Os créditos
continuam na página de licenciamento e em `THIRD_PARTY_NOTICES.md`.

## Publicar no GitHub Pages

O destino é o repositório `volpatto/volpatto.github.io`, publicado na raiz de
`https://volpatto.github.io/`. O workflow [pages.yml](.github/workflows/pages.yml)
valida o conteúdo, confere os componentes, gera o site com Astro, executa os testes
e publica em pushes para `main`. Pull requests são conferidos sem publicação.
A badge abaixo do título acompanha esse workflow na branch `main`.

1. No [repositório](https://github.com/volpatto/volpatto.github.io), abra
   **Settings → Pages → Build and deployment → Source** e selecione **GitHub Actions**.
2. Envie as alterações revisadas para `main`.
3. Se necessário, abra **Actions → Publish website to GitHub Pages → Run workflow**.
4. Aguarde a conclusão. O site estará em `https://volpatto.github.io/` após uma
   publicação bem-sucedida.

Se o remoto local ainda apontar para o nome antigo, atualize-o:

```sh
git remote set-url origin git@github.com:volpatto/volpatto.github.io.git
```

### Erro “Invalid YAML front matter” nos arquivos Astro

Se o log executar `actions/jekyll-build-pages`, o GitHub está usando o build por
branch com **Jekyll**. O cabeçalho de um arquivo `.astro` contém código e não é
um cabeçalho YAML de Jekyll. Isso não é um erro dos arquivos em `conteudo/`.

A correção é selecionar **GitHub Actions** em Pages, conforme o passo 1, e executar
o workflow `Publish website to GitHub Pages`. Ele publica o HTML de `dist/`.
Não selecione a pasta de código-fonte como site estático nem tente corrigir esse
erro editando os cabeçalhos Astro. Adicionar `.nojekyll` ao código-fonte, sozinho,
também não compila o projeto.

Essa configuração fica no GitHub e não é alterada por editar o workflow localmente.
O procedimento segue a [documentação oficial de configuração da fonte de publicação](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

O domínio e o subdiretório usados no deploy vêm do próprio GitHub Pages. A
configuração local mantém `base: "/"`, com possibilidade de hospedar depois em
outro domínio ou subdiretório.

### Erro “Resource not accessible by integration” em Configure Pages

O job de build precisa de `pages: read` para consultar a configuração do site.
Essa permissão está declarada no workflow, junto de `contents: read`.
As permissões de publicação (`pages: write` e `id-token: write`) ficam no job de
deploy. Habilitar Pages e escolher **GitHub Actions** continua sendo necessário;
a permissão de leitura não altera essa configuração.

## Migrar para o LNCC

Defina o domínio e o subdiretório finais antes da compilação. Exemplo para um subdiretório (substitua os valores pelo endereço efetivamente atribuído):

```sh
SITE_URL=https://seu-dominio.lncc.br BASE_PATH=/seu-subdiretorio pnpm build
BASE_PATH=/seu-subdiretorio pnpm test
```

Para publicar na raiz de um domínio:

```sh
SITE_URL=https://seu-dominio.lncc.br BASE_PATH=/ pnpm build
BASE_PATH=/ pnpm test
```

Copie **o conteúdo de `dist/`** para o diretório público do servidor, preservando a estrutura de arquivos. Não é necessário executar Node.js no servidor. Configure a página de erro do servidor para usar `404.html`, se desejar. Os links internos, imagens, scripts, folhas de estilo e URLs canônicas são gerados com a nova configuração.

Você também pode alterar os valores padrão em `astro.config.mjs`. O domínio e a pasta do LNCC ainda não foram informados e não estão predefinidos como se já existissem.

## Conferência de conteúdo

O Lattes tem atualização em **23/08/2026**, confirmada também no XML fornecido em 18/09/2026. Disciplinas, vínculos, projetos e orientações refletem esse registro; não representam confirmação independente de oferta ou situação em cada semestre. Temas provisórios estão identificados, e temas não definidos foram omitidos. Os esclarecimentos sobre o ThermoPhase e a coorientação com o LEF desde 2024 foram fornecidos diretamente pelo autor.

O símbolo do LNCC é exibido por uma janela de recorte sobre a imagem institucional original. O arquivo completo permanece preservado. No modo escuro, o símbolo é apresentado em branco. O logotipo ThermoPhase foi fornecido pelo autor.

A redação mantém a experiência prévia na indústria de software em termos gerais. A ESSS aparece apenas no histórico do currículo; as demais páginas não atribuem à empresa as práticas ou os softwares de pesquisa.

## Gerar novamente o currículo

O PDF disponível no site foi gerado com [lattes2pdf](https://github.com/mpds/lattes2pdf) 0.3.0 e RenderCV 2.8 a partir do ZIP/XML exportado pelo autor. O tema `classic` foi ajustado às cores do site. A versão acadêmica inclui formação, experiência, pesquisa, artigos, projetos, ensino, orientações, trabalhos em eventos, software listado no Lattes, bancas, prêmio e idiomas. A seleção não é uma transcrição integral do Lattes: por exemplo, cursos de formação complementar e apresentações foram omitidos. O registro integral continua acessível pelo link do Lattes.

Com Python 3.12 ou superior, na raiz do projeto:

```sh
python3 -m venv .venv-cv
.venv-cv/bin/python -m pip install -r cv/requirements.txt
.venv-cv/bin/python scripts/generate-cv.py /caminho/para/CV_3999178670179183.zip --output .cv-build/revisao.pdf
```

A primeira geração precisa de acesso à internet para os pacotes Typst. A exportação de entrada permanece fora do repositório. `.cv-build/` recebe o PDF, o YAML editável, o relatório de conversão e as somas de verificação. O cabeçalho usa somente os contatos públicos de `cv/header.yaml`; não se publicam XML, telefone, endereço residencial ou campos pessoais da exportação.

Revise o PDF, incluindo todas as páginas, antes de copiar `.cv-build/revisao.pdf` para `public/files/cv-diego-volpatto-2026.pdf`. Sem `--output`, o script substitui diretamente esse PDF do site. Atualize a data indicada em `conteudo/paginas/curriculo.yaml` quando o registro Lattes mudar. O build do site usa o PDF já revisado e não depende de Python ou de acesso ao Lattes.

As figuras de pesquisa são artefatos existentes, com referências, alterações e condições de uso descritas em `THIRD_PARTY_NOTICES.md`. Ao trocar uma figura, confira também legenda, texto alternativo e dimensões em `conteudo/paginas/pesquisa.yaml`, além dos créditos na página de licenciamento.
