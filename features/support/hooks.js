const { Before, After, BeforeAll, AfterAll, setDefaultTimeout, Status } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');

const isDebug = !!process.env.PWDEBUG || process.env.DEBUG_BDD === 'true';

setDefaultTimeout(isDebug ? -1 : 30 * 1000);

let browser;

BeforeAll(async () => {
  browser = await chromium.launch({
    headless: !isDebug && process.env.HEADLESS !== 'false',
    slowMo: Number(process.env.SLOWMO) || 0,
  });
});

AfterAll(async () => {
  await browser?.close();
});

Before(async function () {
  this.context = await browser.newContext();
  this.page = await this.context.newPage();
});

After(async function ({ result }) {
  if (result?.status === Status.FAILED) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    this.attach(screenshot, 'image/png');
  }
  await this.context?.close();
});
