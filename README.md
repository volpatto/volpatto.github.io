# Diego Volpatto -- site acadêmico

[![Build, Tests e publicação](https://github.com/volpatto/volpatto.github.io/actions/workflows/pages.yml/badge.svg?branch=main)](https://github.com/volpatto/volpatto.github.io/actions/workflows/pages.yml)
[![SciAstro](https://img.shields.io/badge/SciAstro-475569)](https://volpatto.github.io/sciastro/)
[![Astro](https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white)](https://astro.build/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js 24](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Pixi](https://img.shields.io/badge/Pixi-41B3A3)](https://pixi.sh/)

Site pessoal estático em português e inglês, construído com **[SciAstro](https://volpatto.github.io/sciastro/) e [Astro](https://astro.build/)**, usando o **LNCC Theme** e conteúdo editável em YAML e BibTeX. Apesar de ter sido montado para o GitHub Pages, foi preparado para publicação em outros domínios.

As páginas são definidas em `sciastro.yaml` e `conteudo/paginas/`. O SciAstro
fornece os componentes, estilos e interações; este repositório mantém apenas
a configuração de integração, o conteúdo, os arquivos públicos e os testes do site.
O JavaScript local se limita às configurações e aos testes. A geração opcional
do currículo usa Python, separadamente do build do site.

Os dados bibliográficos ficam em `conteudo/publicacoes.bib`; cada card seleciona
uma chave e uma categoria em `conteudo/paginas/publicacoes.yaml`. As orientações
usam `conteudo/orientacoes.yaml`, com suporte a fotos circulares e símbolos das
instituições como alternativa. O build lê esses arquivos localmente, sem consultar
DOIs ou serviços externos.

O SciAstro é instalado diretamente do [npm](https://www.npmjs.com/package/sciastro),
com versão fixa em `package.json` e dependências registradas em `pnpm-lock.yaml`.
Não é preciso clonar nem compilar o repositório do framework. A
[documentação do SciAstro](https://volpatto.github.io/sciastro/) descreve os
componentes, as opções de configuração e a API disponíveis.

Organizado em dez páginas acadêmicas por idioma: apresentação, pesquisa, publicações, software, ensino, orientações, grupos de pesquisa, parcerias e projetos, currículo e contato. Uma página adicional de licenciamento em cada idioma é acessível pelo rodapé. Inclui experiência profissional, práticas de engenharia de software, resumos de ementas e logos dos grupos e instituições. Os modos claro e escuro respeitam a preferência do sistema na primeira visita; o botão no cabeçalho salva a escolha localmente. As fontes e imagens são servidas pelo próprio site. Não há analytics, formulário, banco de dados nem chamadas ao GitHub durante a navegação.

## Guia rápido

Com Git e Pixi instalados:

```sh
git clone https://github.com/volpatto/volpatto.github.io.git
cd volpatto.github.io
pixi run --locked dev
```

Abra `http://127.0.0.1:4321/`. Edite os arquivos de `conteudo/` e salve para ver
as alterações. Antes de publicar, execute `pixi run --locked verify`.
O resultado pronto para hospedagem fica em `dist/`.

- [Instalar o Pixi e preparar o ambiente](#ambiente-e-uso-local-com-pixi)
- [Editar o conteúdo](#onde-atualizar-o-conteúdo)
- [Atualizar o SciAstro](#atualizar-o-sciastro)
- [Gerar o site para domínio próprio ou subdiretório](#gerar-o-site-para-publicação)
- [Publicar em servidor web](#publicar-em-servidor-web)
- [Atualizar e restaurar uma versão anterior](#atualizar-e-restaurar-uma-versão-anterior)
- [Publicar no GitHub Pages](#publicar-no-github-pages)
- [Resolver problemas de ambiente e hospedagem](#problemas-frequentes)
- [Gerar novamente o currículo](#gerar-novamente-o-currículo)

## Licenciamento

O [escopo das licenças](LICENSE.md) distingue **textos editoriais autorais sob CC BY 4.0** e **código e documentação técnica originais sob MIT**. Textos editoriais em YAML ou dentro de arquivos `.astro` ou `.ts` continuam sujeitos à licença de conteúdo; isso não torna todas as partes desses arquivos intercambiavelmente MIT ou CC BY.

Logos, foto, figuras científicas, currículo em PDF, fontes e materiais de terceiros estão fora dessas concessões gerais. Os créditos e as condições de cada ativo estão em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). A figura de Kyas et al. tem sua própria licença CC BY 4.0, com atribuição aos autores originais. Os textos integrais das licenças e avisos distribuídos com o site estão em `public/licenses/`.

O rodapé de todas as páginas acadêmicas liga para `/licenciamento/` ou `/en/licensing/`, respeitando o subdiretório configurado. Ao adicionar imagens ou documentos, atualize os avisos de direitos e a página de licenciamento.

## Ambiente e uso local com Pixi

### Requisitos

Na máquina que vai editar ou gerar o site, tenha:

- **Git**, para obter o repositório e suas atualizações
  ([download e instalação](https://git-scm.com/downloads/));
- **Pixi 0.72.2 ou superior**; a integração contínua usa exatamente 0.72.2;
- acesso à internet para baixar as ferramentas e dependências na primeira instalação;
- permissão de escrita na pasta do projeto e no diretório pessoal do usuário.

O projeto fornece **Node.js 24 e pnpm 11.19.0** dentro do ambiente Pixi.
Não é necessário instalá-los globalmente nem ativar um ambiente manualmente.
Pixi prepara as ferramentas; pnpm instala Astro e as bibliotecas do site.
Python só é necessário para gerar novamente o PDF do currículo, em um procedimento
separado ao final deste documento.

O ambiente está registrado para macOS Apple Silicon, macOS Intel, Linux x86-64
e Windows x86-64. O build foi executado em macOS Apple Silicon; as demais
plataformas têm dependências resolvidas no lockfile, sem execução equivalente
conferida. Linux ARM e distribuições baseadas em musl, como Alpine, não fazem
parte desse ambiente. Essa restrição se aplica à máquina de build; os arquivos
estáticos gerados podem ser servidos em outras plataformas.

### Instalar o Pixi

Links oficiais:

- **[Site do Pixi](https://pixi.sh/)**: apresentação da ferramenta e documentação;
- **[Download do Pixi](https://github.com/prefix-dev/pixi/releases)**: versões,
  instaladores e executáveis; abra **Assets** na versão desejada;
- **[Instruções oficiais de instalação](https://pixi.prefix.dev/latest/installation/)**:
  Linux, macOS, Windows e alternativas como Homebrew, Winget e instalação manual.

O passo a passo abaixo já contém os comandos necessários. Os instaladores
identificam o sistema e baixam o executável correspondente; não é preciso escolher
um arquivo manualmente. Escolha **um** dos métodos para o seu sistema.

**Linux ou macOS**, em Bash ou Zsh:

```sh
curl -fsSL https://pixi.sh/install.sh | sh
```

Para instalar especificamente a mesma versão usada no GitHub Actions, use este
comando no lugar do anterior:

```sh
curl -fsSL https://pixi.sh/install.sh | PIXI_VERSION=v0.72.2 bash
```

**Windows**, no PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -c "irm -useb https://pixi.sh/install.ps1 | iex"
```

Feche e abra o terminal após a instalação. Confira:

```sh
git --version
pixi --version
```

O instalador coloca o Pixi em `~/.pixi/bin` no Linux/macOS e em
`%USERPROFILE%\.pixi\bin` no Windows. Se o terminal não encontrar `pixi`,
verifique se essa pasta está no `PATH`. Em sessões Bash/Zsh não interativas,
como scripts de build, pode ser necessário acrescentá-la explicitamente:

```sh
export PATH="$HOME/.pixi/bin:$PATH"
```

Instale e execute o ambiente como usuário comum. As permissões administrativas
do servidor web são independentes da instalação das dependências do projeto.

### Obter o projeto e instalar as dependências

```sh
git clone https://github.com/volpatto/volpatto.github.io.git
cd volpatto.github.io
pixi install --locked
pixi run --locked setup
```

Se já tiver o repositório, apenas entre na pasta que contém `pixi.toml` e
`package.json`; não precisa cloná-lo novamente. `pixi install --locked` prepara
Node.js e pnpm em `.pixi/`; `setup` instala as bibliotecas em `node_modules/`.
Os dois diretórios são locais e não devem ser copiados entre máquinas.

Para conferir as ferramentas efetivamente usadas pelo projeto:

```sh
pixi run --locked node --version
pixi run --locked pnpm --version
```

Use sempre `pixi run …` nos comandos do projeto, mesmo que exista outra
instalação de Node.js no sistema. No VS Code, abra a pasta do repositório e use
**Terminal → Novo terminal**.

### Editar e visualizar localmente

Na raiz do repositório:

```sh
pixi run --locked dev
```

Abra `http://127.0.0.1:4321/` ou o endereço informado pelo terminal, caso a porta
esteja ocupada. As alterações salvas nos YAMLs aparecem na prévia.
As tarefas também preparam as dependências automaticamente: é possível começar
diretamente por `dev` ou `verify`, sem executar `install` e `setup` separadamente.

### Comandos disponíveis

| Comando | Resultado |
| --- | --- |
| `pixi run --locked dev` | Prévia com atualização automática ao salvar os arquivos |
| `pixi run --locked verify` | Valida configuração e conteúdo, gera o site e executa os testes |
| `pixi run --locked build` | Gera o site estático em `dist/` |
| `pixi run --locked preview` | Gera o site e serve a versão de publicação localmente |
| `pixi run --locked check-content` | Confere os YAMLs e os arquivos referenciados |
| `pixi run --locked check` | Valida configuração, conteúdo e arquivos com SciAstro |
| `pixi run --locked test-browser` | Gera o site e executa Browser Tests; instale Chromium primeiro |
| `pixi run --locked verify-all` | Validação completa, incluindo Browser Tests |
| `pixi run --locked test` | Gera o site e executa os testes |
| `pixi run --locked setup` | Instala somente as bibliotecas do site |
| `pixi run --locked format` | Formata o código, preservando a formatação dos YAMLs editoriais |
| `pixi run --locked dev-stop` | Encerra a prévia de desenvolvimento |
| `pixi run --locked preview-stop` | Encerra a prévia estática |

`--locked` exige que `pixi.toml` e `pixi.lock` estejam consistentes e impede
alterar o lockfile durante a execução. A instalação das bibliotecas também usa
`pnpm install --frozen-lockfile`, que aplica a mesma exigência a `package.json`
e `pnpm-lock.yaml`. Instalações posteriores reutilizam os pacotes disponíveis
localmente; atualizar dependências pode exigir novos downloads.

Em um terminal comum, os servidores normalmente permanecem ligados ao terminal;
use **Ctrl+C** para encerrar. Quando o Astro inicia em segundo plano, como pode
ocorrer em ferramentas de desenvolvimento automatizadas, fechar o terminal não
os encerra. Nesse caso, use as tarefas `dev-stop` ou `preview-stop`.
Os servidores de desenvolvimento e prévia atendem somente em `127.0.0.1` por padrão.

#### Mensagem “Another astro dev server is already running”

Essa mensagem significa que já existe uma prévia deste projeto em execução.
O Astro mostra seu endereço e PID e encerra a **nova tentativa** com código 1;
isso não indica falha na instalação do Pixi ou das dependências. A prévia
existente continua disponível no endereço informado.

Para continuar editando, basta abrir esse endereço. Para reiniciar o servidor,
execute, na pasta do projeto:

```sh
pixi run --locked dev-stop
pixi run --locked dev
```

Ao terminar o trabalho, use `pixi run --locked dev-stop`. Para a prévia do build,
os comandos equivalentes são `pixi run --locked preview-stop` e
`pixi run --locked preview`.

### Versões e arquivos do ambiente

- `pixi.toml`: ferramentas e tarefas disponíveis;
- `pixi.lock`: versões e arquivos exatos do Node.js, pnpm e bibliotecas do ambiente;
- `package.json`: dependências e comandos do site;
- `pnpm-lock.yaml`: versões exatas das dependências do site;
- `.pixi/` e `node_modules/`: instalações locais, ignoradas pelo Git.

**Inclua os dois lockfiles nos commits.** Eles permitem reconstruir o ambiente
com as mesmas versões das dependências. O GitHub Actions usa esse mesmo ambiente
e o comando `pixi run --locked verify`.

Para atualizar intencionalmente uma ferramenta, edite `pixi.toml` e execute
`pixi update`, revisando o novo `pixi.lock`. Ao atualizar pnpm, mantenha a mesma
versão em `packageManager` no `package.json`. Para atualizar bibliotecas do site,
use pnpm dentro do ambiente, por exemplo `pixi run pnpm update`, revise
`pnpm-lock.yaml` e rode `pixi run --locked verify`. Essas atualizações são tarefas
de manutenção; não fazem parte da publicação habitual de conteúdo.

Os scripts pnpm continuam disponíveis dentro do ambiente (`pixi run pnpm …`
ou `pixi shell`). Para o uso habitual, prefira as tarefas da tabela.

O site funciona sem JavaScript para leitura, navegação entre páginas, menu móvel e download do CV. As orientações em andamento e concluídas aparecem em seções próprias, com os cards sempre visíveis. O seletor de tema e a adaptação automática do estado do menu usam JavaScript. A mudança de idioma preserva a página atual; a escolha de tema persiste entre páginas. Links antigos como `/#teaching` são encaminhados à página correspondente quando JavaScript está disponível.

## Onde atualizar o conteúdo

Nota mais para eu mesmo, já que JS não é meu forte.

**Comece pelo [guia de edição em `conteudo/README.md`](conteudo/README.md).**
Os textos, links, imagens e listas estão em YAML. As publicações usam BibTeX,
e os alunos têm um cadastro compartilhado em `orientacoes.yaml`. Para acrescentar um
registro, siga os exemplos do guia; não é preciso alterar os componentes nem
atualizar contagens nos testes.

| Arquivo | O que editar |
| --- | --- |
| `sciastro.yaml` | Identidade, tema, idiomas, menu, rodapé e metadados |
| `conteudo/paginas/sobre.yaml` | Apresentação, foto e formação resumida |
| `conteudo/paginas/pesquisa.yaml` | Linhas de pesquisa, figuras e fontes |
| `conteudo/publicacoes.bib` | Autoria, títulos, anos, periódicos e DOIs |
| `conteudo/paginas/publicacoes.yaml` | Chaves BibTeX, categorias e ordem das publicações |
| `conteudo/paginas/software.yaml` | Softwares, práticas, documentação e pacotes |
| `conteudo/paginas/ensino.yaml` | Disciplinas e materiais |
| `conteudo/orientacoes.yaml` | Alunos, temas, situação, nível, fotos e símbolos institucionais |
| `conteudo/paginas/orientacoes.yaml` | Introdução e composição da página de orientações |
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

Para mudanças de estrutura, edite `sections` nos YAMLs. Para cores, fontes e
largura, use `appearance` em `sciastro.yaml`. O **LNCC Theme**, os componentes
e os comportamentos de navegação pertencem ao pacote SciAstro. Veja o
[mapa do repositório](#estrutura-do-repositório).

Ícones e bandeiras são locais. Os desenhos acompanham rótulos textuais e são
decorativos para leitores de tela. As bandeiras do Brasil e do Reino Unido
acompanham PT e EN; os nomes acessíveis são Português e English. Os créditos
continuam na página de licenciamento e em `THIRD_PARTY_NOTICES.md`.

## Estrutura do repositório

Este repositório contém o conteúdo e a configuração do site. O SciAstro fornece
as páginas, os componentes, o LNCC Theme, a navegação e a validação dos YAMLs.
Não é necessário manter uma pasta `src/` nem um ambiente de TypeScript aqui.

| Caminho | Responsabilidade |
| --- | --- |
| `sciastro.yaml` | Identidade, tema, idiomas, menu, rodapé e destino de publicação |
| `conteudo/` | Textos e composição das páginas; inclui o guia de edição |
| `styles/people.css` | Fundo dos símbolos institucionais para contraste nos dois temas |
| `public/` | Imagens, currículo e licenças distribuídos com o site |
| `astro.config.mjs` | Ativa o SciAstro; normalmente não precisa ser editado |
| `cv/` | Script e configurações para gerar novamente o currículo |
| `tests/` e `playwright.config.mjs` | Tests do conteúdo publicado e da navegação |
| `.github/workflows/pages.yml` | Build, Tests e publicação no GitHub Pages |
| `package.json`, `pnpm-workspace.yaml` e `pnpm-lock.yaml` | Dependências do site e política de instalação |
| `pixi.toml` e `pixi.lock` | Ferramentas e tarefas reproduzíveis |

Os testes próprios continuam úteis para conferir o conteúdo publicado, os links,
o currículo, as imagens e os idiomas deste site. O compilador TypeScript e os
testes dos componentes ficam no desenvolvimento do SciAstro. A prévia dos Browser
Tests usa o servidor oficial do Astro, sem um servidor HTTP próprio no repositório.
A verificação automática não confirma afirmações científicas nem links externos.

As pastas `dist/`, `.astro/`, `.test-output/` e `.cv-build/` são saídas locais,
ignoradas pelo Git. Podem ser removidas quando seus processos estiverem parados;
serão recriadas pelo build, pelos testes ou pela geração do currículo. Guarde à
parte relatórios de conversão do CV que queira conservar. `.pixi/` e `node_modules/`
são o ambiente de trabalho: removê-las exige instalar as dependências novamente.

## Atualizar o SciAstro

O site usa o pacote publicado no npm. A versão instalada aparece no campo
`dependencies.sciastro` de `package.json`; ela é fixa, sem `^` ou `~`.
Instalações e builds usam o lockfile e não adotam novas releases automaticamente.
Editar textos, imagens ou o currículo não exige atualizar o framework.

Para atualizar intencionalmente:

1. Leia as [notas da release](https://github.com/volpatto/sciastro/releases) e
   escolha uma versão publicada no npm; confira eventuais instruções de migração.
2. Na pasta **deste site**, substitua `VERSAO` pelo número escolhido e execute:

   ```sh
   pixi run --locked pnpm add sciastro@VERSAO --save-exact
   pixi run --locked browser-install
   pixi run --locked verify-all
   ```

   `browser-install` prepara o Chromium para os testes. Pode ser omitido quando
   a versão de navegador exigida pelo Playwright já estiver instalada.
3. Execute `pixi run --locked preview` e confira as páginas em português e
   inglês, os temas claro/escuro e a apresentação em uma tela pequena.
4. Revise e registre `package.json` e `pnpm-lock.yaml` juntos. Se o pnpm
   acrescentar uma exceção para uma release recém-publicada em
   `pnpm-workspace.yaml`, revise e inclua esse arquivo também. Envie um PR para
   `main`; o CI executa os testes antes da publicação.

Não é necessário copiar arquivos `.tgz`, manter uma pasta `vendor/` ou gerar
uma release do site no npm. O projeto do site é privado para fins de publicação
de pacotes (`private: true`); seu resultado é o conteúdo estático de `dist/`.
Uma release do SciAstro só chega a este site quando sua dependência é atualizada.

## Publicar no GitHub Pages

O destino é o repositório `volpatto/volpatto.github.io`, publicado na raiz de
`https://volpatto.github.io/`. O workflow [pages.yml](.github/workflows/pages.yml)
usa o ambiente Pixi, valida o conteúdo com SciAstro, gera o site com Astro e executa os testes
e publica em pushes para `main`. Pull requests são conferidos sem publicação.
A badge abaixo do título acompanha esse workflow na branch `main`.

1. No [repositório](https://github.com/volpatto/volpatto.github.io), abra
   **Settings → Pages → Build and deployment → Source** e selecione **GitHub Actions**.
2. Envie as alterações revisadas para `main`.
3. Se necessário, abra **Actions → Publish website to GitHub Pages → Run workflow**.
4. Aguarde a conclusão. O site estará em `https://volpatto.github.io/` após uma
   publicação bem-sucedida.

### GitHub Pages executa Jekyll em vez do build do site

Se o log executar `actions/jekyll-build-pages`, o GitHub está usando o build por
branch com **Jekyll**. Este projeto precisa instalar o SciAstro e gerar o site com
Astro antes de publicar. Os YAMLs de `conteudo/` não são páginas prontas para
hospedagem. O SciAstro é baixado do npm durante a instalação das dependências.

A correção é selecionar **GitHub Actions** em Pages, conforme o passo 1, e executar
o workflow `Publish website to GitHub Pages`. Ele publica o HTML de `dist/`.
Não selecione a pasta de código-fonte como site estático. Adicionar `.nojekyll`
ao código-fonte, sozinho, também não compila o projeto.

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

## Gerar o site para publicação

### Definir o endereço público

O endereço final é configurado **antes do build**, pelas variáveis abaixo.
Todos os domínios `example.org` desta seção são exemplos a substituir pelo
endereço público real.

| Variável | Significado | Padrão do projeto |
| --- | --- | --- |
| `SITE_URL` | Protocolo e domínio público, sem o subdiretório | `https://volpatto.github.io` |
| `BASE_PATH` | Caminho público, começando e terminando em `/` | `/` |

Para `https://pesquisa.example.org/`, em **Bash/Zsh**:

```sh
export SITE_URL="https://pesquisa.example.org"
export BASE_PATH="/"
pixi run --locked verify
```

Para `https://www.example.org/pesquisadores/diego/`, em **Bash/Zsh**:

```sh
export SITE_URL="https://www.example.org"
export BASE_PATH="/pesquisadores/diego/"
pixi run --locked verify
```

No **PowerShell**, o segundo exemplo é:

```powershell
$env:SITE_URL = "https://www.example.org"
$env:BASE_PATH = "/pesquisadores/diego/"
pixi run --locked verify
```

Defina as duas variáveis na mesma sessão em que executa o comando. Em um serviço
de integração contínua, configure-as no ambiente da etapa de build. Este projeto
lê essas opções de `process.env` pela integração SciAstro; colocar os valores apenas
em um arquivo `.env` não substitui essas instruções.

`verify` instala as dependências, valida o conteúdo, gera o site e
confere os testes e links internos. Publique somente se o comando terminar
com sucesso (código de saída zero). Os testes locais não conferem a configuração
do servidor de destino nem a disponibilidade de links externos.

### Conferir o resultado

`dist/` contém tudo o que precisa ser publicado:

```text
dist/
  index.html                 Página inicial em português
  pesquisa/index.html        Exemplo de página interna
  en/index.html              Página inicial em inglês
  en/research/index.html     Exemplo de página interna em inglês
  404.html                   Página de endereço inexistente
  _astro/                    CSS, JavaScript e fontes compilados
  images/                    Foto, logos, bandeiras e figuras
  files/                     Currículo em PDF
  licenses/                  Licenças e avisos distribuídos com o site
  ...                        Demais páginas e arquivos públicos
```

Para abrir essa versão localmente, **mantenha as mesmas variáveis** e execute:

```sh
pixi run --locked preview
```

A tarefa gera `dist/` novamente antes de iniciar a prévia. Abra o endereço
informado no terminal, incluindo `/pesquisadores/diego/` se tiver usado esse
subdiretório. Confira a navegação nos dois idiomas, tema claro/escuro, imagens e
download do currículo. Para encerrar, use `pixi run --locked preview-stop`.

Os caminhos dos arquivos em `dist/` são os mesmos com qualquer `BASE_PATH`.
O que muda são os URLs gravados no HTML, CSS e scripts. **Não é criada uma pasta
`dist/pesquisadores/diego/`**: o servidor deve disponibilizar o conteúdo de
`dist/` nesse caminho público.

Ao mudar de domínio ou subdiretório, gere e publique novamente o site inteiro.
Copiar um build antigo para outro endereço não atualiza seus links e metadados.
Para voltar aos padrões locais em Bash/Zsh, use `unset SITE_URL BASE_PATH`;
no PowerShell, abra uma nova sessão. Também é possível mudar os valores padrão
nos campos `url` e `base` de `sciastro.yaml` para tornar permanente o novo destino.

## Publicar em servidor web

O projeto usa `output: "static"`: o build produz HTML, CSS, JavaScript e arquivos
públicos, conforme o [modelo de publicação do Astro](https://docs.astro.build/en/guides/deploy/).
O ambiente de publicação precisa apenas de um servidor de arquivos estáticos,
como Nginx ou Apache, com o domínio e o HTTPS configurados.

| Etapa | O que precisa estar instalado |
| --- | --- |
| Editar, validar e gerar o site | Git, Pixi e as dependências instaladas pelas tarefas |
| Servir o site já gerado | Servidor web com suporte a arquivos estáticos |
| Gerar um novo PDF do currículo | Ambiente Python separado, descrito ao final |

Node.js, pnpm, Pixi e Python **não são necessários no servidor que apenas recebe
`dist/`**. Não é preciso manter um processo Astro, serviço de aplicação, container
ou banco de dados em execução. `dev` e `preview` são ferramentas de conferência
local; a publicação usa o servidor web.

### Transferir os arquivos

Copie **o conteúdo de `dist/`**, preservando todos os arquivos e subdiretórios,
para uma pasta exclusiva desta versão do site. A página inicial deve ficar
diretamente na raiz pública configurada, e não em uma pasta extra chamada `dist`.

Para transportar o build como um único arquivo, em Linux/macOS:

```sh
COPYFILE_DISABLE=1 tar -czf ../site-publicacao.tar.gz -C dist .
tar -tzf ../site-publicacao.tar.gz
```

`COPYFILE_DISABLE=1` evita incluir arquivos auxiliares de metadados do macOS;
o mesmo comando também funciona no Linux. O pacote é salvo fora do repositório.
Antes de reutilizar esse nome em uma
atualização, guarde o pacote anterior com um nome que identifique sua versão.
Transfira o pacote por SSH/SFTP ou pelo mecanismo disponível na hospedagem.
No servidor, um exemplo de extração é:

```sh
mkdir -p /srv/www/diego/releases/2026-09-20-01
tar -xzf /caminho/recebido/site-publicacao.tar.gz -C /srv/www/diego/releases/2026-09-20-01
```

Substitua os caminhos e o identificador `2026-09-20-01` pelos da instalação.
A pasta da versão deve estar vazia antes da extração. O usuário responsável
pela publicação precisa poder gravar nela; o usuário do servidor web precisa
poder ler os arquivos e acessar os diretórios.

Publique somente o resultado do build. O repositório, `node_modules/`, `.pixi/`,
arquivos de configuração e exportações XML do Lattes ficam fora da raiz pública.
O pacote de transferência também fica fora dela.

### Configurar os caminhos e a página 404

O servidor deve resolver diretórios para `index.html`. Exemplos:

| URL público | Arquivo dentro da pasta publicada |
| --- | --- |
| `/` | `index.html` |
| `/pesquisa/` | `pesquisa/index.html` |
| `/en/research/` | `en/research/index.html` |
| `/files/cv-diego-volpatto-2026.pdf` | `files/cv-diego-volpatto-2026.pdf` |

Com `BASE_PATH=/pesquisadores/diego/`, acrescente esse prefixo aos URLs da tabela.
Por exemplo, `/pesquisadores/diego/pesquisa/` deve resolver para o mesmo arquivo
`pesquisa/index.html` da versão publicada.

Sirva arquivos inexistentes com **status HTTP 404**, usando `404.html` como corpo
da resposta. Não redirecione todos os caminhos desconhecidos para a página inicial:
cada página deste site já possui seu próprio HTML. Preserve também os tipos MIME
usuais de CSS, JavaScript, SVG, fontes WOFF2 e PDF.

### Exemplo com Nginx

Para um domínio dedicado, este trecho fica **dentro do bloco `server` existente**,
cujo domínio, certificado e HTTPS já devem estar configurados:

```nginx
root /srv/www/diego/current;
index index.html;

location / {
    try_files $uri $uri/ =404;
}

error_page 404 /404.html;
```

Nesse exemplo, `current` é um link simbólico para a pasta da versão publicada.
A criação e a troca desse link estão descritas em
[Atualizar e restaurar uma versão anterior](#atualizar-e-restaurar-uma-versão-anterior).
A configuração `http` do Nginx deve carregar o arquivo `mime.types` fornecido
pela instalação. Confira a [referência de `root`, `try_files` e tipos MIME](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files).

Para um **subdiretório em um domínio compartilhado**, uma alternativa é fazer
`/srv/www/pesquisadores/diego` apontar para a pasta da versão e acrescentar somente
este bloco ao `server` do domínio:

```nginx
location = /pesquisadores/diego {
    return 301 /pesquisadores/diego/;
}

location /pesquisadores/diego/ {
    root /srv/www;
    index index.html;
    try_files $uri $uri/ =404;
    error_page 404 /pesquisadores/diego/404.html;
}
```

Aqui o `root` é `/srv/www`, pois o Nginx acrescenta a URI completa ao caminho.
Assim, `/pesquisadores/diego/pesquisa/` corresponde a
`/srv/www/pesquisadores/diego/pesquisa/index.html`. Preserve as configurações
dos outros sites do mesmo domínio. Antes de recarregar o serviço, valide a
configuração com `nginx -t`, usando as permissões adequadas à instalação.

Em Apache ou outra hospedagem estática, aplique o mesmo mapeamento de diretórios,
índice `index.html` e página de erro. Não é necessário proxy para uma porta Node.js.

### Conferir após a publicação

Abra a página inicial, uma página interna diretamente pelo URL, a versão em
inglês e o currículo. Confirme que imagens, fontes, estilos e scripts carregam
do domínio e subdiretório escolhidos. Uma URL inexistente deve exibir a página
de erro mantendo o status 404.

Exemplo de conferência dos status, para publicação na raiz:

```sh
curl -I https://pesquisa.example.org/
curl -I https://pesquisa.example.org/pesquisa/
curl -I https://pesquisa.example.org/en/research/
curl -I https://pesquisa.example.org/files/cv-diego-volpatto-2026.pdf
curl -I https://pesquisa.example.org/pagina-inexistente/
```

Os quatro primeiros devem terminar em HTTP 200; o último, em HTTP 404.
Se a hospedagem estiver em subdiretório, inclua-o em cada URL.

## Atualizar e restaurar uma versão anterior

Para atualizar o site em servidor próprio:

1. Na cópia de trabalho, revise as alterações locais com `git status`. Com a
   cópia sem alterações pendentes, obtenha a nova versão com `git pull --ff-only`.
2. Defina `SITE_URL` e `BASE_PATH` para o destino e execute
   `pixi run --locked verify`. Os mesmos comandos servem para mudanças de texto,
   imagens e código.
3. Registre a revisão (`git rev-parse HEAD`) e os dois valores de configuração
   junto ao pacote de publicação. Gere o pacote a partir de uma revisão salva no
   Git, para que esse registro identifique todo o conteúdo publicado.
4. Transfira o novo build para uma **nova pasta de versão**, mantendo a anterior.
   Aponte a raiz pública ou o link simbólico para a nova pasta depois da cópia
   completa. Isso evita misturar arquivos de duas compilações.
5. Confira os URLs e os arquivos públicos conforme a seção anterior. Se houver
   cache intermediário, atualize-o para que o HTML e os arquivos substituídos,
   como o PDF e as imagens, correspondam à versão publicada.

No exemplo de domínio dedicado, criar ou trocar o link simbólico pode ser feito
em **Linux**, no servidor, com:

```sh
ln -sfn /srv/www/diego/releases/2026-09-20-01 /srv/www/diego/current
```

Use esse comando somente quando `current` estiver ausente ou já for um link
simbólico; uma instalação que use diretório real deve ajustar o caminho no
servidor web. Para o exemplo em subdiretório, o link público equivalente é
`/srv/www/pesquisadores/diego`.

Para restaurar a versão anterior, aponte o link ou a raiz pública de volta para
a pasta anterior e confira o site. Não é necessário reconstruir o ambiente.
O build restaurado precisa ter sido gerado para o mesmo domínio e `BASE_PATH`.
Se houver alteração na configuração do servidor, valide-a e recarregue o serviço;
trocar apenas o destino do link normalmente dispensa essa recarga.

## Problemas frequentes

| Sintoma | O que verificar |
| --- | --- |
| `pixi: command not found` | Reabra o terminal e confira o diretório de instalação no `PATH`. |
| Versão errada de Node.js ou pnpm | Execute as tarefas por `pixi run --locked …`, dentro do repositório. |
| Pixi informa lockfile desatualizado | Confira se `pixi.toml` e `pixi.lock` vieram da mesma revisão. Gere um novo lockfile somente ao atualizar intencionalmente o ambiente. |
| pnpm informa lockfile desatualizado | Confira `package.json` e `pnpm-lock.yaml`. Em uma alteração intencional de dependências, rode `pixi run pnpm install`, revise e salve o lockfile atualizado. |
| Falha ao baixar pacotes | Confira o acesso a GitHub, conda-forge e ao registro pnpm/npm, além da configuração de proxy da rede. |
| Página abre sem estilos ou imagens | Confira `BASE_PATH`, a cópia completa de `_astro/` e `images/`, os tipos MIME e eventuais caches. Refaça o build com o endereço correto. |
| Página inicial funciona, mas abrir `/pesquisa/` diretamente falha | Confira o mapeamento de diretórios para `index.html` no servidor. |
| Links ainda apontam para o domínio anterior | Refaça o build com `SITE_URL` e `BASE_PATH` corretos e substitua toda a versão publicada. |
| `Another astro dev server is already running`, seguido de código 1 | A prévia anterior continua ativa. Abra o endereço informado ou execute `pixi run --locked dev-stop` e depois `pixi run --locked dev`. Não é preciso reinstalar o ambiente. |
| Build aponta erro em um YAML | Confira o arquivo e campo indicados, a indentação e as traduções `pt`/`en`. Veja o [guia de edição](conteudo/README.md). |

Falhas de Jekyll e de permissão no GitHub Actions estão descritas em
[Publicar no GitHub Pages](#publicar-no-github-pages).

## Conferência de conteúdo

O Lattes tem atualização em **23/08/2026**, confirmada também no XML fornecido em 18/09/2026. Disciplinas, vínculos, projetos e orientações refletem esse registro; não representam confirmação independente de oferta ou situação em cada semestre. Temas provisórios estão identificados, e temas não definidos foram omitidos. Os esclarecimentos sobre o ThermoPhase e a coorientação com o LEF desde 2024 foram fornecidos diretamente pelo autor.

O símbolo do LNCC é exibido por uma janela de recorte sobre a imagem institucional original. O arquivo completo permanece preservado. No modo escuro, o símbolo é apresentado em branco. O logotipo ThermoPhase foi fornecido pelo autor.

A redação mantém a experiência prévia na indústria de software em termos gerais. A ESSS aparece apenas no histórico do currículo; as demais páginas não atribuem à empresa as práticas ou os softwares de pesquisa.

## Gerar novamente o currículo

O PDF disponível no site foi gerado com [lattes2pdf](https://github.com/mpds/lattes2pdf) 0.3.0 e RenderCV 2.8 a partir do ZIP/XML exportado pelo autor. O tema `classic` foi ajustado às cores do site. A versão acadêmica inclui formação, experiência, pesquisa, artigos, projetos, ensino, orientações, trabalhos em eventos, software listado no Lattes, bancas, prêmio e idiomas. A seleção não é uma transcrição integral do Lattes: por exemplo, cursos de formação complementar e apresentações foram omitidos. O registro integral continua acessível pelo link do Lattes.

Com Python 3.12 ou superior, na raiz do projeto, em Linux/macOS:

```sh
python3 -m venv .venv-cv
.venv-cv/bin/python -m pip install -r cv/requirements.txt
.venv-cv/bin/python cv/generate.py /caminho/para/CV_3999178670179183.zip --output .cv-build/revisao.pdf
```

A primeira geração precisa de acesso à internet para os pacotes Typst. A exportação de entrada permanece fora do repositório. `.cv-build/` recebe o PDF, o YAML editável, o relatório de conversão e as somas de verificação. O cabeçalho usa somente os contatos públicos de `cv/header.yaml`; não se publicam XML, telefone, endereço residencial ou campos pessoais da exportação.

Revise o PDF, incluindo todas as páginas, antes de copiar `.cv-build/revisao.pdf` para `public/files/cv-diego-volpatto-2026.pdf`. Sem `--output`, o script substitui diretamente esse PDF do site. Atualize a data indicada em `conteudo/paginas/curriculo.yaml` quando o registro Lattes mudar. O build do site usa o PDF já revisado e não depende de Python ou de acesso ao Lattes.

As figuras de pesquisa são artefatos existentes, com referências, alterações e condições de uso descritas em `THIRD_PARTY_NOTICES.md`. Ao trocar uma figura, confira também legenda, texto alternativo e dimensões em `conteudo/paginas/pesquisa.yaml`, além dos créditos na página de licenciamento.

## Browser Tests

Além dos Tests das páginas estáticas, há testes em Chromium para os dois idiomas,
modos claro/escuro e larguras de desktop/celular. Eles verificam navegação,
persistência do tema, figuras, logos, PDF e ausência de transbordamento horizontal.

```sh
pixi run --locked browser-install
pixi run --locked verify-all
```

No Linux, use `pixi run --locked pnpm exec playwright install --with-deps chromium`
se as bibliotecas do navegador estiverem ausentes. O CI instala essas dependências
e roda os Browser Tests antes de publicar. Relatórios, capturas e evidências de
falhas ficam em `.test-output/`; no CI são preservados como artefato. Os testes
utilizam uma instância temporária na porta 4370, sem encerrar a prévia na 4321.
