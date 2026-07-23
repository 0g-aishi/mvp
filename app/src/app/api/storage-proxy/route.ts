// Route handler runs on the server by default in Next.js App Router

// HTTPS JSON-RPC proxy for 0G storage nodes that expose only HTTP endpoints.
// This avoids browser Mixed Content by tunneling requests via our HTTPS origin.
//
// Security notes:
// - Only POST is allowed.
// - Only numeric IPv4 hosts are allowed as targets (http://A.B.C.D:port).
// - Content-Type must be application/json.
// - You may further harden with an allowlist via STORAGE_PROXY_ALLOWLIST_REGEX.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAllowedTarget(target: string): boolean {
  try {
    const url = new URL(target);
    if (url.protocol !== 'http:') return false; // only forward plaintext http
    // Allow only IPv4 + optional port
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    const host = url.hostname;
    if (!ipv4.test(host)) return false;
    // Optional: env-based allowlist regex
    const regexEnv = process.env.STORAGE_PROXY_ALLOWLIST_REGEX;
    if (regexEnv) {
      try {
        const re = new RegExp(regexEnv);
        if (!re.test(target)) return false;
      } catch {
        // ignore invalid regex, default to block
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get('target');
  if (!target || !isAllowedTarget(target)) {
    return new Response(
      JSON.stringify({ error: 'Invalid or disallowed target' }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return new Response(
      JSON.stringify({ error: 'Content-Type must be application/json' }),
      { status: 415, headers: { 'content-type': 'application/json' } }
    );
  }

  const body = await req.text();

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });

    // Pass through JSON response
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Upstream request failed', details: String(error).slice(0, 200) }),
      { status: 502, headers: { 'content-type': 'application/json' } }
    );
  }
}
