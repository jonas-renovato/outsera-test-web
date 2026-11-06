# Testes E2E com Playwright e Cucumber

Projeto de testes automatizados do [SauceDemo](https://www.saucedemo.com/), usando Playwright, Cucumber (BDD) e Page Objects. A suíte cobre fluxos E2E de **login** e **checkout** e **acessibilidade automatizada** com Axe Core nessas mesmas jornadas.

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Executando os testes](#executando-os-testes)
  - [Tags](#tags)
- [Modo de depuração](#modo-de-depuração)
- [Configuração de Ambiente](#configuração-de-ambiente)
- [Testes de Acessibilidade](#testes-de-acessibilidade)
- [Retry e Evidências](#retry-e-evidências)
  - [Troubleshooting](#troubleshooting)
- [Relatórios de Execução](#relatórios-de-execução)
- [Estrutura principal](#estrutura-principal)
- [CI/CD](#cicd)
  - [Artifacts](#artifacts)
  - [Como visualizar os resultados](#como-visualizar-os-resultados)
- [Evidências de Execução](#evidências-de-execução)
- [Observações](#observações)
- [Uso de Inteligência Artificial](#uso-de-inteligência-artificial)

## Pré-requisitos

- Node.js 26
- npm
- Acesso à internet, pois os testes acessam o SauceDemo

## Instalação

Na raiz do projeto, execute:

```bash
npm ci
npx playwright install chromium
```

O segundo comando instala o navegador usado pelos hooks do Cucumber.

## Executando os testes

Execute todos os cenários BDD:

```bash
npm run test:bdd
```

A execução cobre:

- Tentativas de login válidas e inválidas
- Validação de campos obrigatórios no login
- Adição de produto ao carrinho
- Finalização de compra
- Validação de checkout sem nome ou CEP
- Verificações de acessibilidade (Axe Core, WCAG 2.0/2.1 A e AA) no login e nas etapas do checkout (veja "Testes de Acessibilidade")

Para executar um subconjunto, use filtros do Cucumber (lista completa de tags em [Tags](#tags)):

```bash
npm run test:bdd -- --tags @smoke
npm run test:bdd -- --name "Finalizar compra com sucesso"
```

> **Limitação:** `cucumber.js` define `paths: ['features/**/*.feature']`, e o Cucumber mescla esse valor com caminhos passados na linha de comando. Por isso `npm run test:bdd -- features/login.feature` executa a suíte inteira, não só aquele arquivo. Use `--tags` ou `--name` para filtrar.

### Tags

Os cenários são classificados com tags do Cucumber, usadas para filtrar a execução com `--tags`.

| Tag | Aplicada em | Finalidade |
|---|---|---|
| `@login` | `features/login.feature` | Todos os cenários de login |
| `@checkout` | `features/checkout.feature` | Todos os cenários de checkout |
| `@smoke` | Login válido e compra com sucesso | Verificação rápida dos fluxos críticos |
| `@negative` | Logins inválidos e erros de checkout | Validações de erro |
| `@a11y` | `features/accessibility.feature` | Testes de acessibilidade (Axe) |

```bash
npm run test:bdd -- --tags @smoke                    # fluxos críticos
npm run test:bdd -- --tags @login                    # somente login
npm run test:bdd -- --tags @checkout                 # somente checkout
npm run test:bdd -- --tags @negative                 # cenários negativos
npm run test:bdd -- --tags @a11y                     # somente acessibilidade
npm run test:bdd -- --tags "@checkout and @negative" # combinação
npm run test:bdd -- --tags "not @a11y"               # tudo, exceto acessibilidade
```

Como `cucumber.js` já lista `features/**/*.feature`, `--tags` filtra dentro da suíte completa. Tags também funcionam no modo de depuração: `npm run test:bdd:debug -- --tags @smoke`.

## Modo de depuração

Para abrir o Playwright Inspector e executar com o navegador visível:

```bash
npm run test:bdd:debug
```

Também é possível controlar a execução por variáveis de ambiente:

```bash
HEADLESS=false npm run test:bdd
SLOWMO=500 npm run test:bdd
```

- `HEADLESS=false`: mantém o navegador visível.
- `SLOWMO=500`: adiciona 500 ms de espera entre as ações.

## Configuração de Ambiente

URLs, credenciais, timeouts e dados de teste ficam centralizados em `config/environment.js`, que carrega as variáveis e as valida antes da execução. Nenhum valor de ambiente fica nos testes, steps ou Page Objects.

### Variáveis

| Variável | Obrigatória | Padrão | Finalidade e impacto |
|---|---|---|---|
| `TEST_ENV` | não | `dev` | Escolhe `config/<TEST_ENV>.env` (`dev`, `staging` ou `production`); valor inválido interrompe a execução |
| `BASE_URL` | sim | `config/<TEST_ENV>.env` | URL base usada para abrir o login e validar redirecionamentos |
| `TEST_USERNAME` | sim | `config/<TEST_ENV>.env` | Usuário válido usado no login dos cenários de checkout e acessibilidade |
| `TEST_PASSWORD` | sim | `config/<TEST_ENV>.env` | Senha do usuário acima |
| `DEFAULT_TIMEOUT` | sim | `30000` (ms, nos arquivos de ambiente) | Timeout padrão de cada step do Cucumber; é ignorado (sem limite) no modo de depuração |
| `CHECKOUT_FIRST_NAME`, `CHECKOUT_LAST_NAME`, `CHECKOUT_POSTAL_CODE` | sim | `Ana`, `Silva`, `01001-000` | Dados preenchidos no formulário de checkout |
| `RETRY` | não | `0` | Quantas vezes um cenário com falha é reexecutado; cada tentativa gera evidência própria |
| `TRACE` | não | `on-failure` | `off`, `on-failure` ou `on`: salva o trace do Playwright em `reports/traces/` |
| `VIDEO` | não | `off` | `off`, `on-failure` ou `on`: grava vídeo em `reports/videos/` (apagado se o cenário passa, exceto com `on`) |
| `PWDEBUG` | não | não definida | Definida por `npm run test:bdd:debug`; abre o Playwright Inspector, mostra o navegador e remove o timeout |
| `DEBUG_BDD` | não | `false` | Com `true`, tem o mesmo efeito de depuração do `PWDEBUG` |
| `HEADLESS` | não | `true` | Com `false`, mantém o navegador visível |
| `SLOWMO` | não | `0` | Atraso em ms entre ações do navegador |
| `A11Y_FAIL_IMPACTS` | não | `critical,serious` | Impactos do Axe que reprovam o cenário; os demais são apenas contabilizados no log |

As credenciais usam os nomes `TEST_USERNAME` e `TEST_PASSWORD` (e não `USERNAME`/`PASSWORD`) para evitar conflito com a variável `USERNAME` do Windows e com outras variáveis do sistema.

### Ordem de precedência

1. Variáveis do processo (shell ou pipeline)
2. `.env` local (não versionado)
3. `config/<TEST_ENV>.env` (versionado)

Variáveis vazias são tratadas como ausentes. Se uma obrigatória não existir ou for inválida, a execução falha imediatamente com mensagem indicando o que falta.

### Execução local

```bash
cp .env.example .env        # opcional: sobrescreve os valores do ambiente
npm run test:bdd

TEST_ENV=staging npm run test:bdd
BASE_URL=https://outro-host.com npm run test:bdd
```

Para um novo ambiente, adicione `config/<nome>.env` e inclua o nome na lista `ENVIRONMENTS` em `config/environment.js`.

### Pipeline (GitHub Actions)

O workflow define estas variáveis no nível global (`env`), valendo para todos os jobs:

| Variável | Origem no GitHub | Valor se não definida |
|---|---|---|
| `TEST_ENV` | *Repository variable* `TEST_ENV` | `dev` |
| `BASE_URL` | *Repository variable* `BASE_URL` | valor de `config/<TEST_ENV>.env` |
| `DEFAULT_TIMEOUT` | *Repository variable* `DEFAULT_TIMEOUT` | valor de `config/<TEST_ENV>.env` |
| `TEST_USERNAME` | *Secret* `TEST_USERNAME` | valor de `config/<TEST_ENV>.env` |
| `TEST_PASSWORD` | *Secret* `TEST_PASSWORD` | valor de `config/<TEST_ENV>.env` |
| `RETRY` | *Repository variable* `RETRY` | `1` |
| `TRACE` | *Repository variable* `TRACE` | `on-failure` |
| `VIDEO` | *Repository variable* `VIDEO` | `on-failure` |

Variáveis ou secrets não cadastrados chegam vazios e são ignorados pela configuração, que usa o arquivo de ambiente.

Diferenças em relação à execução local:

- `RETRY=1` na pipeline (local: `0`): um retry por cenário.
- `VIDEO=on-failure` na pipeline (local: `off`): vídeo das falhas.
- `TRACE=on-failure`: igual ao padrão local.

Todas as evidências vão para o artifact `cucumber-report`.

> Os valores de `config/*.env` são credenciais públicas do site de demonstração; em ambientes reais, mantenha-as apenas em Secrets.

## Testes de Acessibilidade

Os testes usam o [Axe Core](https://github.com/dequelabs/axe-core) via `@axe-core/playwright`, com as regras WCAG 2.0/2.1 níveis A e AA. A lógica fica centralizada em `features/helpers/accessibility.helper.js` (`assertAccessibility(page, contexto)`) e é exposta pelo passo `a página deve ser acessível "<nome>"`.

**Páginas cobertas** (`features/accessibility.feature`, tag `@a11y`):

- Login
- Checkout: carrinho, dados do cliente, resumo e conclusão

**Política de falha:** o cenário falha quando há violações com impacto `critical` ou `serious`. Violações `moderate`/`minor` são apenas contabilizadas no log. Para alterar:

```bash
A11Y_FAIL_IMPACTS=critical,serious,moderate,minor npm run test:bdd
```

**Benefício:** regressões de acessibilidade (rótulos ausentes, contraste, ARIA inválido) são detectadas automaticamente a cada execução. O Axe cobre apenas parte dos problemas; revisão manual continua necessária.

Execução local:

```bash
npm ci
npm run test:bdd -- --tags @a11y
```

Exemplo de saída (aprovado):

```text
[a11y] "Login": OK (18 regras aprovadas, 0 violação(ões) abaixo do impacto bloqueante)
```

Exemplo de saída (com violações, ilustrativo):

```text
Error: 1 violação(ões) de acessibilidade em "Login":

1. [serious] color-contrast: Elements must meet minimum color contrast ratio thresholds
   Detalhes: https://dequeuniversity.com/rules/axe/4.10/color-contrast
   - Elemento: [data-test="login-button"]
     HTML: <input class="submit-button btn_action" data-test="login-button" type="submit" value="Login">
```

## Retry e Evidências

A suíte roda via Cucumber (`npm run test:bdd`), com o Playwright usado apenas como biblioteca em `features/support/hooks.js`. Não há `playwright.config.js` nem Playwright Test: retry, trace, vídeo, screenshot e timeout são controlados por `cucumber.js`, `config/environment.js` e pelos hooks.

| Recurso | Como funciona | Controle |
|---|---|---|
| Retry | `retry` do Cucumber; cenário que falha é reexecutado | `RETRY` (padrão `0` local, `1` na pipeline) |
| Screenshot | Sempre em falha (página inteira): embutido no HTML e salvo em `reports/screenshots/` | automático |
| URL da página | Anexada ao relatório em falha | automático |
| Trace | Playwright trace (snapshots, rede, ações) em `reports/traces/*.zip` | `TRACE=off\|on-failure\|on` (padrão `on-failure`) |
| Vídeo | `.webm` em `reports/videos/`; apagado quando o cenário passa | `VIDEO=off\|on-failure\|on` (padrão `off`, `on-failure` na pipeline) |
| Artifacts | A pipeline publica `reports/` inteiro (`cucumber-report`) | sempre, mesmo com falha |

Os arquivos têm o nome `<cenário>-<id>-try<N>`, então cada tentativa de retry gera sua própria evidência.

### Validar localmente

Force uma falha com uma senha errada e abra as evidências:

```bash
TEST_PASSWORD=errada RETRY=1 VIDEO=on-failure npm run test:bdd -- --tags @checkout
ls reports/screenshots reports/traces reports/videos
```

O relatório deve mostrar a URL, o screenshot e a referência ao trace de cada tentativa (`try1`, `try2`). Para abrir o relatório e os traces, veja [Relatórios de Execução](#relatórios-de-execução).

### Troubleshooting

- **Evidências não seguem o que eu esperava:** use as variáveis `RETRY`, `TRACE` e `VIDEO`; não há arquivo de configuração do Playwright.
- **Não há trace/screenshot:** só são gerados em falha (ou `TRACE=on`). Cenários aprovados não geram evidência.
- **Falha sem evidência no CI:** confira o artifact `cucumber-report` da execução; as subpastas ficam dentro dele.
- **Retry mascarando instabilidade:** cenários que passam só na segunda tentativa deixam evidência `try1`; trate-os como flaky.
- **Pastas `test-results/` e `playwright-report/`:** são resíduos de execuções antigas do `playwright test`, não da suíte BDD.

## Relatórios de Execução

O relatório HTML do Cucumber é gerado a cada execução em `reports/cucumber-report.html` e sobrescrito na execução seguinte. Screenshots, traces e vídeos de falha ficam em subpastas de `reports/` (detalhes em [Retry e Evidências](#retry-e-evidências)).

### Visualizar localmente

```bash
npm run test:bdd                                       # gera o relatório
open reports/cucumber-report.html                      # macOS (Linux: xdg-open, Windows: start)
npx playwright show-trace reports/traces/<arquivo>.zip # trace de uma falha
npx playwright show-trace --help                       # opções do visualizador
```

As pastas `reports/screenshots`, `reports/traces` e `reports/videos` só existem após uma falha (ou com `TRACE=on`/`VIDEO=on`).

## Estrutura principal

```text
features/
  *.feature                  Cenários BDD
  pages/                     Page Objects
  helpers/                   Helpers reutilizáveis (Axe / acessibilidade)
  step_definitions/          Implementação dos passos
  support/hooks.js           Abertura, encerramento e configuração do navegador
scripts/run-bdd.js           Executor do Cucumber com suporte a debug
cucumber.js                  Configuração do Cucumber
config/                      Configuração centralizada e arquivos por ambiente
.env.example                 Modelo das variáveis de ambiente
reports/                     Relatórios e evidências gerados (não versionados)
docs/                        Capturas de tela usadas neste README
.github/workflows/ci-cd.yml  Pipeline GitHub Actions
```

## CI/CD

A pipeline está em `.github/workflows/ci-cd.yml` (GitHub Actions).

### Quando executa

- `push` nas branches `main` e `develop`
- `pull_request` direcionado a `main` e `develop`

Execuções antigas da mesma branch/PR são canceladas automaticamente (`concurrency`).

### Fluxo

```text
Quality Gate -> E2E Tests -> Publish Test Results
```

Cada job tem `timeout-minutes` próprio (10, 30 e 5 min).

### Quality Gate

Faz checkout, setup do Node 26 com cache npm, `npm ci` e `npm run typecheck`. O projeto é JavaScript, então o `typecheck` valida a sintaxe de todos os arquivos `.js` com `node --check`. Se falhar, os testes E2E não rodam.

### Instalação dos browsers

`npx playwright install --with-deps chromium` instala apenas o Chromium (o único usado em `features/support/hooks.js`) e as dependências de sistema do runner Linux.

### Execução dos testes

`npm run test:bdd` é a única suíte executada (cenários Cucumber em `features/`). O uso do Playwright como biblioteca, sem Playwright Test, está descrito em [Retry e Evidências](#retry-e-evidências).

### Relatórios

O relatório HTML e as evidências de falha estão descritos em [Relatórios de Execução](#relatórios-de-execução) e são publicados no artifact abaixo.

### Artifacts

Publicado mesmo quando os testes falham (`if: always()`):

| Artifact | Conteúdo | Retenção |
| --- | --- | --- |
| `cucumber-report` | `reports/` | 30 dias |

### Como visualizar os resultados

1. Abra a aba **Actions** do repositório e selecione a execução desejada.
2. Veja o status de cada job e o resumo (Summary) da execução.
3. Na seção **Artifacts**, baixe `cucumber-report`.
4. Descompacte e abra o `cucumber-report.html` no navegador.
5. Em caso de falha, abra o trace com `npx playwright show-trace traces/<arquivo>.zip` (ou envie o `.zip` para https://trace.playwright.dev).

## Evidências de Execução

### Pipeline CI/CD

A pipeline executa automaticamente as etapas de **Quality Gate**, **E2E Tests** e **Publish Test Results**. O resultado de cada execução fica na aba **Actions** do repositório (veja [Como visualizar os resultados](#como-visualizar-os-resultados)).

<!-- Captura esperada: docs/web-pipeline-success.png (aba Actions com os três jobs aprovados). Ao adicionar o arquivo, inserir aqui: ![Pipeline CI/CD](docs/web-pipeline-success.png) -->

### Relatório de Testes E2E

A suíte gera um relatório HTML do Cucumber contendo:

- Features executadas
- Cenários executados
- Passos executados
- Resultado dos testes
- Evidências de falhas

Para gerar e abrir o relatório, veja [Relatórios de Execução](#relatórios-de-execução).

<!-- Captura esperada: docs/cucumber-report.png (relatório com todos os cenários aprovados). Ao adicionar o arquivo, inserir aqui: ![Relatório Cucumber](docs/cucumber-report.png) -->

## Observações

- Os testes dependem do ambiente externo do SauceDemo e podem ser afetados por indisponibilidade da aplicação ou da rede.
- O script BDD inicia o Chromium. Para alterar esse comportamento, ajuste `features/support/hooks.js`.

## Uso de Inteligência Artificial

Ferramentas de IA generativa foram utilizadas como apoio durante o desenvolvimento deste projeto, da mesma forma que se consulta documentação, colegas ou revisões de código. O projeto, as decisões técnicas e a qualidade da entrega são de responsabilidade do autor.

### Como a IA foi utilizada

- Discussão de alternativas de arquitetura e organização do projeto (Features, Steps, Page Objects, helpers e configuração).
- Sugestões de estrutura para configuração por ambiente, testes de acessibilidade com Axe e estratégia de retry e evidências.
- Revisão de boas práticas de automação e de código.
- Sugestões para a pipeline de CI/CD no GitHub Actions.
- Geração de exemplos e rascunhos de código e de documentação, usados como ponto de partida.
- Apoio na análise de mensagens de erro e na investigação de falhas.

### Como os resultados foram validados

- Nenhum conteúdo gerado foi incorporado sem revisão; todo código e texto foram lidos, avaliados e, quando necessário, alterados ou descartados.
- Todo código foi validado manualmente e os testes foram executados localmente.
- O `typecheck` foi executado e os resultados dos testes foram analisados.
- As pipelines do GitHub Actions foram executadas e seus resultados validados.
- Ajustes foram feitos sempre que a sugestão não se adequava ao projeto ou apresentava problemas.

### Limitações da IA

- As sugestões podem conter erros, APIs inexistentes ou comportamentos desatualizados, e exigem verificação contra a documentação oficial e a execução real.
- Algumas recomendações são genéricas e podem não ser compatíveis com o contexto do projeto, como a versão das ferramentas, a aplicação testada ou a pipeline existente.
- A IA não conhece o ambiente de execução; só testes e pipelines confirmam que algo funciona.
- A decisão final sempre foi humana.

### Processo de Validação

1. **Execução local:** `npm run typecheck` e `npm run test:bdd` foram executados a cada alteração relevante. Alterações de configuração foram testadas também com valores inválidos ou ausentes, para confirmar a falha rápida com mensagem clara.
2. **Cenários de falha:** os mecanismos de evidência foram verificados provocando falhas controladas (por exemplo, `TEST_PASSWORD=errada`), conferindo screenshots, traces, vídeos e a geração por tentativa de retry (veja "Retry e Evidências").
3. **Relatórios:** o `reports/cucumber-report.html` foi aberto para conferir cenários, passos, resultados e anexos, e os traces foram abertos com `npx playwright show-trace`.
4. **Pipeline:** as execuções no GitHub Actions foram acompanhadas job a job (Quality Gate, E2E Tests e Publish Test Results), e o artifact `cucumber-report` foi baixado para conferir o conteúdo.
5. **Revisão manual:** resultados, diffs e documentação foram revisados antes da incorporação, e os comandos documentados neste README foram executados para confirmar que funcionam como descrito.
