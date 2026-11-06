const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ROOT = path.resolve(__dirname, '..');
const ENVIRONMENTS = ['dev', 'staging', 'production'];

// Variáveis vazias (ex.: secrets/vars não definidos no CI) são tratadas como ausentes.
for (const [key, value] of Object.entries(process.env)) {
  if (value === '') delete process.env[key];
}

const testEnv = process.env.TEST_ENV || 'dev';
if (!ENVIRONMENTS.includes(testEnv)) {
  throw new Error(`TEST_ENV inválido: "${testEnv}". Valores aceitos: ${ENVIRONMENTS.join(', ')}.`);
}

// O dotenv não sobrescreve valores já definidos, então a precedência é:
// variáveis do processo (CI/shell) > .env local > config/<TEST_ENV>.env
const envFile = path.join(__dirname, `${testEnv}.env`);
if (!fs.existsSync(envFile)) {
  throw new Error(`Arquivo de ambiente não encontrado: ${envFile}`);
}
dotenv.config({ path: path.join(ROOT, '.env'), quiet: true });
dotenv.config({ path: envFile, quiet: true });

const missing = [];

function required(name) {
  const value = process.env[name];
  if (value === undefined) missing.push(name);
  return value;
}

function requiredNumber(name) {
  const value = required(name);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Variável ${name} deve ser um número válido (recebido: "${value}").`);
  }
  return parsed;
}

function optionalNumber(name, fallback) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Variável ${name} deve ser um número válido (recebido: "${value}").`);
  }
  return parsed;
}

const rawBaseUrl = required('BASE_URL');
const username = required('TEST_USERNAME');
const password = required('TEST_PASSWORD');
const defaultTimeout = requiredNumber('DEFAULT_TIMEOUT');
const firstName = required('CHECKOUT_FIRST_NAME');
const lastName = required('CHECKOUT_LAST_NAME');
const postalCode = required('CHECKOUT_POSTAL_CODE');

if (missing.length > 0) {
  throw new Error(
    `Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}.\n` +
      `Defina-as em .env (veja .env.example) ou em config/${testEnv}.env.`
  );
}

let baseUrl;
try {
  baseUrl = new URL(rawBaseUrl).href; // normaliza com "/" final
} catch {
  throw new Error(`BASE_URL inválida: "${rawBaseUrl}".`);
}

const isDebug = !!process.env.PWDEBUG || process.env.DEBUG_BDD === 'true';

function oneOf(name, allowed, fallback) {
  const value = (process.env[name] || fallback).toLowerCase();
  if (!allowed.includes(value)) {
    throw new Error(`Variável ${name} inválida: "${value}". Valores aceitos: ${allowed.join(', ')}.`);
  }
  return value;
}

module.exports = {
  env: testEnv,
  retry: optionalNumber('RETRY', 0),
  evidence: {
    dir: path.join(ROOT, 'reports'),
    trace: oneOf('TRACE', ['off', 'on-failure', 'on'], 'on-failure'),
    video: oneOf('VIDEO', ['off', 'on-failure', 'on'], 'off'),
  },
  baseUrl,
  credentials: { username, password },
  checkoutData: { firstName, lastName, postalCode },
  timeouts: { default: isDebug ? -1 : defaultTimeout },
  browser: {
    headless: !isDebug && process.env.HEADLESS !== 'false',
    slowMo: optionalNumber('SLOWMO', 0),
  },
  a11yFailImpacts: (process.env.A11Y_FAIL_IMPACTS || 'critical,serious')
    .split(',')
    .map((impact) => impact.trim().toLowerCase())
    .filter(Boolean),
};
