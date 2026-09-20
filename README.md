# Diego Volpatto -- site acadêmico

Site pessoal estático em português e inglês, construído com Astro. Apesar de ter sido montado para o Github Pages, fiz pensando em mover facilmente para outros domínios.

Organizado em dez páginas acadêmicas por idioma: apresentação, pesquisa, publicações, software, ensino, orientações, grupos de pesquisa, parcerias e projetos, currículo e contato. Uma página adicional de licenciamento em cada idioma é acessível pelo rodapé. Inclui experiência profissional, práticas de engenharia de software, resumos de ementas e logos dos grupos e instituições. Os modos claro e escuro respeitam a preferência do sistema na primeira visita; o botão no cabeçalho salva a escolha localmente. As fontes e imagens são servidas pelo próprio site. Não há analytics, formulário, banco de dados nem chamadas ao GitHub durante a navegação.

## Licenciamento

O [escopo das licenças](LICENSE.md) distingue **textos editoriais autorais sob CC BY 4.0** e **código e documentação técnica originais sob MIT**. Textos editoriais dentro de arquivos `.astro` ou `.ts` continuam sujeitos à licença de conteúdo; isso não torna todas as partes desses arquivos intercambiavelmente MIT ou CC BY.

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
pnpm check     # Valida os componentes e os tipos
pnpm build     # Gera o site em dist/
pnpm test      # Confere o HTML gerado, páginas, links internos, idiomas e arquivos
pnpm preview  # Serve o resultado estático da última compilação
```

O site funciona sem JavaScript para leitura, navegação entre páginas, menu móvel, download do CV e orientações expansíveis. O seletor de tema e a adaptação automática do estado do menu usam JavaScript. A mudança de idioma preserva a página atual; a escolha de tema persiste entre páginas. Links antigos como `/#teaching` são encaminhados à página correspondente quando JavaScript está disponível.

## Onde atualizar o conteúdo

Nota mais para eu mesmo, já que JS não é meu forte.

| Arquivo                                   | Conteúdo                                                        |
| ----------------------------------------- | --------------------------------------------------------------- |
| `src/data/profile.ts`                     | Nome, e-mail, perfis acadêmicos e linhas de pesquisa            |
| `src/data/academic.ts`                    | Publicações, software, disciplinas, alunos, projetos e formação |
| `src/data/career.ts`                      | Experiência profissional e colaborações acadêmicas              |
| `src/data/navigation.ts`                  | Rotas, navegação e descrições das páginas                       |
| `src/components/AcademicSite.astro`       | Layout compartilhado, navegação, idiomas e temas                |
| `src/components/Icon.astro`              | Ícones de navegação, perfis e ações, acompanhados por texto      |
| `src/data/brand-icons.ts`                | Desenhos de ícones de marcas, com licenças próprias             |
| `src/components/AcademicHome.astro`       | Apresentação da página inicial                                  |
| `src/components/Collaborations.astro`     | Parcerias ALFA, LEF, UDESC e projetos                           |
| `src/components/Curriculum.astro`         | Currículo e experiência profissional                            |
| `src/components/AcademicSections.astro`   | Conteúdo das demais páginas e contato                           |
| `src/styles/global.css`                   | Tipografia, cores, layouts e modo escuro                        |
| `public/images/`                          | Foto e imagens dos grupos/instituição                           |
| `public/files/cv-diego-volpatto-2026.pdf` | Currículo acadêmico gerado do XML com lattes2pdf                 |
| `cv/`                                    | Seleção, tema e cabeçalho público usados na geração do CV       |
| `THIRD_PARTY_NOTICES.md`                  | Fontes dos materiais, créditos e condições próprias de uso     |

As rotas são geradas em `src/pages/[...page].astro`, além das duas páginas iniciais. Os campos com traduções usam `{ pt: '...', en: '...' }`. Ao acrescentar conteúdo, preencha ambos. Os títulos de artigos permanecem no idioma original. Não há importação automática do Lattes: as atualizações são editoriais, para permitir conferência antes de publicar.

Ícones e bandeiras são locais, sem bibliotecas carregadas por CDN. Os desenhos acompanham rótulos textuais e são decorativos para leitores de tela. O seletor de idiomas usa as bandeiras do Brasil e do Reino Unido junto de PT e EN, preservando os nomes acessíveis Português e English. Créditos e licenças de Academicons, Font Awesome e flag-icons constam na página de licenciamento e em `THIRD_PARTY_NOTICES.md`.

O conjunto inicial de artigos e alunos é conferido em `scripts/check-build.mjs`. Ao acrescentar ou remover registros, atualize as contagens esperadas nesse script.

## Publicar no GitHub Pages

O site está preparado para o repositório `volpatto/volpatto.github.io`, publicado na raiz de `https://volpatto.github.io/`. O workflow `.github/workflows/pages.yml` instala as dependências, executa as verificações, gera os arquivos e publica quando há um push em `main`.

1. Renomeie o repositório no GitHub para `volpatto.github.io`. Atualize o remoto local com `git remote set-url origin git@github.com:volpatto/volpatto.github.io.git`, revise o conteúdo e envie os arquivos ao repositório.
2. No GitHub, abra **Settings → Pages → Build and deployment** e escolha **GitHub Actions**.
3. Execute **Actions → Publish website to GitHub Pages → Run workflow** se o primeiro push tiver ocorrido antes de habilitar Pages.
4. Aguarde a conclusão da execução. O endereço esperado para esse repositório é `https://volpatto.github.io/`.

Esse endereço é a configuração de destino; só ficará publicado após o workflow terminar com sucesso. O workflow recebe domínio e subdiretório do próprio GitHub Pages.

A configuração local já usa `base: "/"`. O workflow adapta o caminho ao repositório detectado pelo Pages, preservando a possibilidade de hospedar em outro domínio ou subdiretório.

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

Revise o PDF, incluindo todas as páginas, antes de copiar `.cv-build/revisao.pdf` para `public/files/cv-diego-volpatto-2026.pdf`. Sem `--output`, o script substitui diretamente esse PDF do site. Atualize a data indicada em `Curriculum.astro` quando o registro Lattes mudar. O build do site usa o PDF já revisado e não depende de Python ou de acesso ao Lattes.

As figuras de pesquisa são artefatos existentes, com referências, alterações e condições de uso descritas em `THIRD_PARTY_NOTICES.md`. Ao trocar uma figura, confira também legenda, texto alternativo e dimensões em `src/data/profile.ts`, além dos créditos na página de licenciamento.
