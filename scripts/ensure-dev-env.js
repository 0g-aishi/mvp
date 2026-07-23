/**
 * Creates local .env files so `npm run dev` from the repo root can start
 * without a manual copy step. Existing files are left untouched.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function ensureEnv(filePath, contents) {
  if (fs.existsSync(filePath)) {
    return;
  }
  fs.writeFileSync(filePath, contents, 'utf8');
  console.log('[aishi] created', path.relative(root, filePath));
}

ensureEnv(
  path.join(root, '0g-compute', '.env'),
  [
    'FRONTEND_URL=http://localhost:3003',
    'RPC_URL=https://evmrpc-testnet.0g.ai',
    'CHAIN_ID=16602',
    'PORT=3001',
    '',
    '# Optional — 0G compute payments (64 hex chars, no 0x prefix):',
    '# MASTER_WALLET_KEY=',
    '',
    '# Optional — Gemini / Vertex:',
    '# GOOGLE_APPLICATION_CREDENTIALS=',
    '# VERTEX_AI_PROJECT=',
    '# VERTEX_AI_LOCATION=us-central1',
    '',
  ].join('\n')
);

ensureEnv(
  path.join(root, 'app', '.env'),
  [
    'NEXT_PUBLIC_COMPUTE_API_URL=http://localhost:3001/api',
    'NEXT_PUBLIC_DREAM_TEST=true',
    'NEXT_PUBLIC_SITE_URL=http://localhost:3003',
    '',
  ].join('\n')
);
