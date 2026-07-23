/**
 * Frees Aishi dev ports so a second `npm run dev` can start.
 * Windows: netstat + taskkill. Unix: lsof/fuser if present.
 */
const { execSync } = require('child_process');

const PORTS = [3001, 3003];

function listeningPids(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync('netstat -ano', { encoding: 'utf8', windowsHide: true });
      const pids = new Set();
      const re = new RegExp(`:${port}\\s+\\S+\\s+LISTENING\\s+(\\d+)`, 'i');
      for (const line of out.split(/\r?\n/)) {
        const match = line.match(re);
        if (match) pids.add(match[1]);
      }
      return [...pids];
    }

    const out = execSync(`lsof -ti tcp:${port} || true`, { encoding: 'utf8' });
    return out
      .split(/\s+/)
      .map((pid) => pid.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function killPid(pid) {
  if (!pid || pid === String(process.pid)) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore', windowsHide: true });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    }
  } catch {
    // already gone
  }
}

for (const port of PORTS) {
  const pids = listeningPids(port);
  if (pids.length === 0) continue;
  console.log(`[aishi] port ${port} in use — stopping PID ${pids.join(', ')}`);
  for (const pid of pids) killPid(pid);
}
