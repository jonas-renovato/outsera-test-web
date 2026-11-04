# Testes E2E com Playwright e Cucumber

Projeto de testes end-to-end para o fluxo de login e checkout do [SauceDemo](https://www.saucedemo.com/), usando Playwright, Cucumber e Page Objects.

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

Para executar um arquivo ou cenário específico, passe os argumentos para o Cucumber:

```bash
npm run test:bdd -- features/login.feature
npm run test:bdd -- features/checkout.feature
npm run test:bdd -- --name "Finalizar compra com sucesso"
```

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

## Relatórios e evidências

Ao final da execução, o relatório HTML do Cucumber é gerado em:

```text
reports/cucumber-report.html
```

Em caso de falha, um screenshot da página é anexado ao cenário no relatório Cucumber.

A configuração padrão do Playwright também utiliza o reporter HTML. Caso testes Playwright sejam executados diretamente, o relatório pode ser aberto com:

```bash
npx playwright show-report
```

## Estrutura principal

```text
features/
  *.feature                  Cenários BDD
  pages/                     Page Objects
  step_definitions/          Implementação dos passos
  support/hooks.js           Abertura, encerramento e configuração do navegador
scripts/run-bdd.js           Executor do Cucumber com suporte a debug
cucumber.js                  Configuração do Cucumber
playwright.config.js         Configuração do Playwright
reports/                     Relatórios gerados
```

## CI/CD

O pipeline está em `.github/workflows/ci-cd.yml` (GitHub Actions).

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

`npm run test:bdd` é a única suíte executada: cenários Cucumber em `features/`, com o Playwright usado como biblioteca. Não há specs do Playwright Test (`tests/` não existe), então `npx playwright test` não é executado.

### Relatórios

- `reports/cucumber-report.html`: relatório do Cucumber, com screenshots de falha embutidos.

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

## Evidências de Execução

### Pipeline CI/CD

A pipeline executa automaticamente as etapas de **Quality Gate**, **E2E Tests** e **Publish Test Results**.

![Pipeline CI/CD](docs/web-pipeline-success.png)

### Relatório de Testes E2E

A suíte gera um relatório HTML do Cucumber contendo:

- Features executadas
- Cenários executados
- Passos executados
- Resultado dos testes
- Evidências de falhas

![Relatório Cucumber](docs/cucumber-report.png)

Os relatórios completos são gerados automaticamente durante a execução da suíte e podem ser publicados como artifacts da pipeline GitHub Actions.

## Observações

- Os testes dependem do ambiente externo do SauceDemo e podem ser afetados por indisponibilidade da aplicação ou da rede.
- O script BDD inicia o Chromium. Para alterar esse comportamento, ajuste `features/support/hooks.js`.
