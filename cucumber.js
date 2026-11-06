const config = require('./config/environment');

module.exports = {
  default: {
    retry: config.retry,
    paths: ['features/**/*.feature'],
    require: ['features/step_definitions/**/*.js', 'features/support/**/*.js'],
    format: ['progress', 'html:reports/cucumber-report.html'],
  },
};
