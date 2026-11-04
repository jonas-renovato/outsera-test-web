# Testes E2E com Playwright e Cucumber

Projeto de testes end-to-end para o fluxo de login e checkout do [SauceDemo](https://www.saucedemo.com/), usando Playwright, Cucumber e Page Objects.

## Pré-requisitos

- Node.js 18 ou superior
- npm
- Acesso à internet, pois os testes acessam o SauceDemo

## Instalação

Na raiz do projeto, execute:

```bash
npm install
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

## Observações

- Os testes dependem do ambiente externo do SauceDemo e podem ser afetados por indisponibilidade da aplicação ou da rede.
- O script BDD inicia o Chromium. Para alterar esse comportamento, ajuste `features/support/hooks.js`.
