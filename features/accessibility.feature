@a11y
Feature: Acessibilidade

  Scenario: Tela de login sem violações de acessibilidade
    Given que estou na tela de login
    Then a página deve ser acessível "Login"

  Scenario: Etapas do checkout sem violações de acessibilidade
    Given que estou logado
    When adiciono um produto ao carrinho
    Then a página deve ser acessível "Carrinho"
    When preencho os dados obrigatórios
    Then a página deve ser acessível "Checkout - Resumo"
    When finalizo a compra
    Then a página deve ser acessível "Checkout - Conclusão"

  Scenario: Formulário de dados do checkout sem violações de acessibilidade
    Given que estou no checkout
    Then a página deve ser acessível "Checkout - Dados do cliente"
