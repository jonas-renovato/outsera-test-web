@login
Feature: Login

  Scenario Outline: Tentativa de login
    Given que estou na tela de login
    When informo o usuário "<usuario>"
    And informo a senha "<senha>"
    And clico em entrar
    Then devo visualizar "<resultado>"

    @smoke
    Examples: Credenciais válidas
      | usuario       | senha        | resultado          |
      | standard_user | secret_sauce | pagina de produtos |

    @negative
    Examples: Credenciais inválidas ou ausentes
      | usuario       | senha        | resultado               |
      | standard_user | senha_errada | mensagem de credenciais |
      | usuario_fake  | secret_sauce | mensagem de credenciais |
      |               |              | campos obrigatorios     |
