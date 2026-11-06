const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const config = require('../../config/environment');

Given('que estou na tela de login', async function () {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.open();
  await expect(this.loginPage.loginButton).toBeVisible();
});

When('informo o usuário {string}', async function (usuario) {
  await this.loginPage.fillUsername(usuario);
});

When('informo a senha {string}', async function (senha) {
  await this.loginPage.fillPassword(senha);
});

When('clico em entrar', async function () {
  await this.loginPage.submit();
});

Then('devo visualizar {string}', async function (resultado) {
  switch (resultado) {
    case 'pagina de produtos':
      await expect(this.page).toHaveURL(/\/inventory\.html$/);
      await expect(this.page.locator('[data-test="title"]')).toHaveText('Products');
      await expect(this.page.locator('[data-test="inventory-list"]')).toBeVisible();
      break;
    case 'mensagem de credenciais':
      await expect(this.page).toHaveURL(config.baseUrl);
      await expect(this.loginPage.loginButton).toBeVisible();
      await expect(this.loginPage.errorMessage).toBeVisible();
      await expect(this.loginPage.errorMessage).toHaveText(
        'Epic sadface: Username and password do not match any user in this service'
      );
      break;
    case 'campos obrigatorios':
      await expect(this.page).toHaveURL(config.baseUrl);
      await expect(this.loginPage.loginButton).toBeVisible();
      await expect(this.loginPage.errorMessage).toBeVisible();
      await expect(this.loginPage.errorMessage).toHaveText(
        'Epic sadface: Username is required'
      );
      break;
    default:
      throw new Error(`Resultado de login não suportado: "${resultado}"`);
  }
});
