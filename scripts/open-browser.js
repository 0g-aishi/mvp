/**
 * Wait until aishiOS is listening, then open it in the default browser.
 */
const http = require('http');
const { exec } = require('child_process');

const URL = process.env.AISHI_OPEN_URL || 'http://localhost:3003';
const TIMEOUT_MS = 180000;
const INTERVAL_MS = 500;

function ping() {
  return new Promise((resolve) => {
    const req = http.get(URL, { timeout: 2000 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function openBrowser(target) {
  const command =
    process.platform === 'win32'
      ? `cmd /c start "" "${target}"`
      : process.platform === 'darwin'
        ? `open "${target}"`
        : `xdg-open "${target}"`;

  exec(command, (error) => {
    if (error) {
      console.log(`[aishi] could not open browser — visit ${target}`);
      return;
    }
    console.log(`[aishi] opened ${target}`);
  });
}

async function main() {
  if (process.env.CI || process.env.AISHI_SKIP_BROWSER === '1') {
    return;
  }

  const start = Date.now();
  while (Date.now() - start < TIMEOUT_MS) {
    if (await ping()) {
      openBrowser(URL);
      return;
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
  console.log(`[aishi] timed out waiting for ${URL} — open it manually`);
}

main();
