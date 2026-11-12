/*
  luciopuccio.com Worker.
  - Everything is served from the static files in this repo (env.ASSETS).
  - /private/* is locked by Cloudflare Access (only Lucio can sign in).
  - /private/api/* is answered here: it double-checks the Access login token,
    then talks to the Cycling Google Sheet through its Apps Script web app.
  Secrets (set in the Cloudflare dashboard, never in this public repo):
    SHEET_API_URL  – the Apps Script web app URL
*/

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

// ---------- Cloudflare Access token check ----------
let certCache = { at: 0, keys: null };

async function accessKeys(team) {
  if (certCache.keys && Date.now() - certCache.at < 3600e3) return certCache.keys;
  const r = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error('certs');
  certCache = { at: Date.now(), keys: (await r.json()).keys };
  return certCache.keys;
}

const b64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

async function verifyAccess(request, env) {
  const token =
    request.headers.get('cf-access-jwt-assertion') ||
    (request.headers.get('cookie') || '').match(/(?:^|;\s*)CF_Authorization=([^;]+)/)?.[1];
  if (!token) return false;
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) return false;
  try {
    const header = JSON.parse(new TextDecoder().decode(b64u(h)));
    const payload = JSON.parse(new TextDecoder().decode(b64u(p)));
    const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!auds.includes(env.ACCESS_AUD)) return false;
    if (payload.iss !== `https://${env.ACCESS_TEAM}`) return false;
    if (!payload.exp || payload.exp * 1000 < Date.now()) return false;
    const jwk = (await accessKeys(env.ACCESS_TEAM)).find((k) => k.kid === header.kid);
    if (!jwk) return false;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(s), new TextEncoder().encode(`${h}.${p}`));
  } catch {
    return false;
  }
}

// ---------- Cycling sheet ----------
async function sheet(env, init) {
  if (!env.SHEET_API_URL) return json({ ok: false, error: 'not-connected' }, 503);
  const r = await fetch(env.SHEET_API_URL, { redirect: 'follow', ...init });
  const text = await r.text();
  try {
    return json(JSON.parse(text), r.ok ? 200 : 502);
  } catch {
    return json({ ok: false, error: 'The sheet did not answer with data' }, 502);
  }
}

async function rides(request, env) {
  if (request.method === 'GET') return sheet(env);
  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, error: 'Bad JSON' }, 400); }
    const pick = ({ date, distance, time, speed, cal, temp, route }) => ({ date, distance, time, speed, cal, temp, route });
    return sheet(env, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(pick(body)) });
  }
  return json({ ok: false, error: 'Method not allowed' }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/private/api/')) {
      if (!(await verifyAccess(request, env))) return json({ ok: false, error: 'Not signed in' }, 401);
      if (url.pathname === '/private/api/rides') return rides(request, env);
      return json({ ok: false, error: 'Not found' }, 404);
    }
    return env.ASSETS.fetch(request);
  },
};
