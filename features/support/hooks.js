const fs = require('fs');
const path = require('path');
const { Before, After, BeforeAll, AfterAll, setDefaultTimeout, Status } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');
const config = require('../../config/environment');

setDefaultTimeout(config.timeouts.default);

const { dir, trace, video } = config.evidence;
const attempts = new Map();

let browser;

function slug(text) {
  return text.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function ensureDir(name) {
  const target = path.join(dir, name);
  fs.mkdirSync(target, { recursive: true });
  return target;
}

BeforeAll(async () => {
  browser = await chromium.launch({
    headless: config.browser.headless,
    slowMo: config.browser.slowMo,
  });
});

AfterAll(async () => {
  await browser?.close();
});

Before(async function ({ pickle }) {
  const attempt = (attempts.get(pickle.id) || 0) + 1;
  attempts.set(pickle.id, attempt);
  this.evidenceName = `${slug(pickle.name)}-${pickle.id.slice(0, 8)}-try${attempt}`;

  const videoDir = video === 'off' ? undefined : ensureDir('videos');
  this.context = await browser.newContext(videoDir ? { recordVideo: { dir: videoDir } } : {});
  if (trace !== 'off') {
    await this.context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  }
  this.page = await this.context.newPage();
});

After(async function ({ result }) {
  const failed = result?.status === Status.FAILED;
  const name = this.evidenceName;
  const videoFile = video === 'off' ? undefined : await this.page.video()?.path();

  if (failed) {
    this.attach(`URL: ${this.page.url()}`, 'text/plain');
    const screenshot = await this.page.screenshot({ fullPage: true });
    fs.writeFileSync(path.join(ensureDir('screenshots'), `${name}.png`), screenshot);
    this.attach(screenshot, 'image/png');
  }

  if (trace !== 'off') {
    if (failed || trace === 'on') {
      const tracePath = path.join(ensureDir('traces'), `${name}.zip`);
      await this.context.tracing.stop({ path: tracePath });
      this.attach(`Trace: reports/traces/${name}.zip (npx playwright show-trace)`, 'text/plain');
    } else {
      await this.context.tracing.stop();
    }
  }

  await this.context?.close();

  if (videoFile) {
    if (failed || video === 'on') {
      this.attach(`Vídeo: ${path.relative(path.join(dir, '..'), videoFile)}`, 'text/plain');
    } else {
      fs.rmSync(videoFile, { force: true });
    }
  }
});
