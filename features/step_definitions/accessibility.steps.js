const { Then } = require('@cucumber/cucumber');
const { assertAccessibility } = require('../helpers/accessibility.helper');

Then('a página deve ser acessível {string}', async function (nomeDaPagina) {
  await assertAccessibility(this.page, nomeDaPagina);
});
