/**
 * After a root `npm install`, start frontend + backend.
 * Skip in CI or when AISHI_SKIP_DEV=1 (e.g. adding a package without launching servers).
 */
const { spawnSync } = require('child_process');
const path = require('path');

if (process.env.CI || process.env.AISHI_SKIP_DEV === '1') {
  process.exit(0);
}

console.log('[aishi] install complete — starting npm run dev');
console.log('[aishi] the browser will open http://localhost:3003 when Ready. Ctrl+C to stop.');

const result = spawnSync('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..'),
  env: process.env,
});

process.exit(result.status === null ? 0 : result.status);
