class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.addProductButton = page.locator('[data-test="add-to-cart-sauce-labs-backpack"]');
    this.cartLink = page.locator('[data-test="shopping-cart-link"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.productName = page.locator('[data-test="inventory-item-name"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.successHeader = page.locator('[data-test="complete-header"]');
    this.successText = page.locator('[data-test="complete-text"]');
  }

  async addProductToCart() {
    await this.addProductButton.click();
    await this.cartLink.click();
  }

  async fillRequiredData(firstName, lastName, postalCode) {
    await this.openCheckout();
    await this.fillData(firstName, lastName, postalCode);
    await this.continue();
  }

  async openCheckout() {
    await this.checkoutButton.click();
  }

  async fillData(firstName, lastName, postalCode) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
  }

  async continue() {
    await this.continueButton.click();
  }

  async finish() {
    await this.finishButton.click();
  }
}

module.exports = { CheckoutPage };
