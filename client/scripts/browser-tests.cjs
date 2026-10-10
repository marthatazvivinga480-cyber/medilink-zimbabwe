const { spawnSync } = require('node:child_process');
const { mkdirSync } = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const cache = path.join(root, 'node_modules', '.cache', 'playwright');
const temp = path.join(cache, 'tmp');
mkdirSync(temp, { recursive: true });
const args = process.argv[2] === 'install' ? ['install', '--only-shell', 'chromium'] : ['test', ...process.argv.slice(2)];
const result = spawnSync(process.execPath, [require.resolve('@playwright/test/cli'), ...args], {
  cwd: root, stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: cache, TEMP: temp, TMP: temp },
});
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
