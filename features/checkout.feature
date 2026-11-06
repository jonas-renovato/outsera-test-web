@checkout
Feature: Checkout

  @smoke
  Scenario: Finalizar compra com sucesso
    Given que estou logado
    When adiciono um produto ao carrinho
    And preencho os dados obrigatórios
    And finalizo a compra
    Then devo visualizar a mensagem de sucesso

  @negative
  Scenario: Não permitir checkout sem CEP
    Given que estou no checkout
    When preencho os dados sem CEP
    And clico em continuar
    Then devo visualizar a mensagem "Postal Code is required"

  @negative
  Scenario: Não permitir checkout sem nome
    Given que estou no checkout
    When preencho os dados sem nome
    And clico em continuar
    Then devo visualizar a mensagem "First Name is required"
