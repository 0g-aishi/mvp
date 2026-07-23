/**
 * Rebuild better-sqlite3 after install. Failure must not fail the monorepo
 * `npm install` — frontend, contracts, and docs do not need native SQLite.
 */
const { spawnSync } = require('child_process');

const result = spawnSync('npm', ['rebuild', 'better-sqlite3'], {
  stdio: 'inherit',
  shell: true,
});

if (result.status !== 0) {
  console.warn(
    '[0g-compute] better-sqlite3 rebuild skipped (Python 3 + Visual Studio Build Tools required on Windows). JS packages are installed. For the compute backend, fix the toolchain then run: npm run rebuild:sqlite'
  );
}
