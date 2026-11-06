const { AxeBuilder } = require('@axe-core/playwright');
const config = require('../../config/environment');

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

function formatViolations(violations, context) {
  const lines = [`${violations.length} violação(ões) de acessibilidade em "${context}":`];
  violations.forEach((violation, index) => {
    lines.push(
      '',
      `${index + 1}. [${violation.impact}] ${violation.id}: ${violation.help}`,
      `   Detalhes: ${violation.helpUrl}`
    );
    violation.nodes.forEach((node) => {
      lines.push(`   - Elemento: ${node.target.join(' ')}`, `     HTML: ${node.html}`);
    });
  });
  return lines.join('\n');
}

/**
 * Executa o Axe na página atual e falha se houver violações com impacto
 * dentro de A11Y_FAIL_IMPACTS (padrão: critical,serious).
 */
async function assertAccessibility(page, context) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const blocking = config.a11yFailImpacts;
  const relevant = results.violations.filter((violation) => blocking.includes(violation.impact));
  const ignored = results.violations.length - relevant.length;

  if (relevant.length > 0) {
    throw new Error(formatViolations(relevant, context));
  }

  console.log(
    `[a11y] "${context}": OK (${results.passes.length} regras aprovadas, ${ignored} violação(ões) abaixo do impacto bloqueante)`
  );
}

module.exports = { assertAccessibility };
