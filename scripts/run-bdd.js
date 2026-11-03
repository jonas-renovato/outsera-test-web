const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const env = { ...process.env };

// cucumber-js does not support --debug, so translate it into PWDEBUG (Playwright Inspector)
const debugIndex = args.indexOf('--debug');
if (debugIndex !== -1) {
  args.splice(debugIndex, 1);
  env.PWDEBUG = '1';
}

const child = spawn(process.execPath, [path.join(__dirname, '..', 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber-js'), ...args], {
  stdio: 'inherit',
  env,
});

child.on('exit', (code) => process.exit(code ?? 1));
