const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { CheckoutPage } = require('../pages/CheckoutPage');
const config = require('../../config/environment');

const { credentials, checkoutData } = config;

async function login() {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.open();
  await this.loginPage.fillUsername(credentials.username);
  await this.loginPage.fillPassword(credentials.password);
  await this.loginPage.submit();
  await expect(this.page).toHaveURL(/\/inventory\.html$/);
  await expect(this.page.locator('[data-test="inventory-list"]')).toBeVisible();
  this.checkoutPage = new CheckoutPage(this.page);
}

async function addProductToCart() {
  await this.checkoutPage.addProductToCart();
  await expect(this.page).toHaveURL(/\/cart\.html$/);
  await expect(this.checkoutPage.cartBadge).toHaveText('1');
  await expect(this.checkoutPage.productName).toHaveCount(1);
  await expect(this.checkoutPage.productName).toHaveText('Sauce Labs Backpack');
}

Given('que estou logado', login);

When('adiciono um produto ao carrinho', addProductToCart);

Given('que estou no checkout', async function () {
  await login.call(this);
  await addProductToCart.call(this);
  await this.checkoutPage.openCheckout();
  await expect(this.page).toHaveURL(/\/checkout-step-one\.html$/);
  await expect(this.checkoutPage.firstNameInput).toBeVisible();
  await expect(this.checkoutPage.postalCodeInput).toBeVisible();
});

When('preencho os dados sem CEP', async function () {
  await this.checkoutPage.fillData(checkoutData.firstName, checkoutData.lastName, '');
  await expect(this.checkoutPage.firstNameInput).toHaveValue(checkoutData.firstName);
  await expect(this.checkoutPage.lastNameInput).toHaveValue(checkoutData.lastName);
  await expect(this.checkoutPage.postalCodeInput).toHaveValue('');
});

When('preencho os dados sem nome', async function () {
  await this.checkoutPage.fillData('', checkoutData.lastName, checkoutData.postalCode);
  await expect(this.checkoutPage.firstNameInput).toHaveValue('');
  await expect(this.checkoutPage.lastNameInput).toHaveValue(checkoutData.lastName);
  await expect(this.checkoutPage.postalCodeInput).toHaveValue(checkoutData.postalCode);
});

When('clico em continuar', async function () {
  await this.checkoutPage.continue();
});

Then('devo visualizar a mensagem {string}', async function (mensagem) {
  await expect(this.checkoutPage.errorMessage).toBeVisible();
  await expect(this.checkoutPage.errorMessage).toHaveText(`Error: ${mensagem}`);
  await expect(this.page).toHaveURL(/\/checkout-step-one\.html$/);
  await expect(this.checkoutPage.continueButton).toBeVisible();
  await expect(this.checkoutPage.finishButton).toHaveCount(0);
});

When('preencho os dados obrigatórios', async function () {
  await this.checkoutPage.fillRequiredData(
    checkoutData.firstName,
    checkoutData.lastName,
    checkoutData.postalCode
  );
  await expect(this.page).toHaveURL(/\/checkout-step-two\.html$/);
  await expect(this.checkoutPage.productName).toHaveCount(1);
  await expect(this.checkoutPage.productName).toHaveText('Sauce Labs Backpack');
  await expect(this.checkoutPage.finishButton).toBeVisible();
});

When('finalizo a compra', async function () {
  await this.checkoutPage.finish();
});

Then('devo visualizar a mensagem de sucesso', async function () {
  await expect(this.page).toHaveURL(/\/checkout-complete\.html$/);
  await expect(this.checkoutPage.successHeader).toBeVisible();
  await expect(this.checkoutPage.successHeader).toHaveText('Thank you for your order!');
  await expect(this.checkoutPage.successText).toHaveText(
    'Your order has been dispatched, and will arrive just as fast as the pony can get there!'
  );
});
