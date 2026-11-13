export const VISITOR_COOKIE = 'heji_visitor';
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encoder = new TextEncoder();
const dummySites = new Set(['1x00000000000000000000AA','2x00000000000000000000AB','1x00000000000000000000BB','2x00000000000000000000BB','3x00000000000000000000FF']);
const dummySecrets = new Set(['1x0000000000000000000000000000000AA','2x0000000000000000000000000000000AA','3x0000000000000000000000000000000AA']);
export const isLocalHost = hostname => ['localhost','127.0.0.1','[::1]'].includes(hostname);

export function protectionConfig(env, hostname) {
  const siteKey = env.TURNSTILE_SITE_KEY;
  const secret = env.TURNSTILE_SECRET_KEY;
  const cookieSecret = env.VISIT_COOKIE_SECRET;
  const testKeys = dummySites.has(siteKey) || dummySecrets.has(secret);
  const localTest = isLocalHost(hostname) && dummySites.has(siteKey) && dummySecrets.has(secret);
  const turnstileValid = Boolean(typeof siteKey === 'string' && siteKey && typeof secret === 'string' && secret && (!testKeys || localTest));
  const ready = Boolean(typeof cookieSecret === 'string' && cookieSecret.length >= 32 &&
    ((!siteKey && !secret) || turnstileValid));
  return { ready, siteKey: ready && turnstileValid ? siteKey : null, secret, cookieSecret, localTest };
}

async function signingKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign','verify']);
}

export async function signedHash(value, secret) {
  const signature = await crypto.subtle.sign('HMAC', await signingKey(secret), encoder.encode(value));
  return [...new Uint8Array(signature)].map(byte => byte.toString(16).padStart(2,'0')).join('');
}

export async function readVisitor(request, secret) {
  if (!secret) return null;
  const value = request.headers.get('Cookie')?.split(';').map(item => item.trim()).find(item => item.startsWith(`${VISITOR_COOKIE}=`))?.slice(VISITOR_COOKIE.length + 1);
  const [id, signature, extra] = value?.split('.') ?? [];
  if (!UUID.test(id ?? '') || !/^[0-9a-f]{64}$/.test(signature ?? '') || extra) return null;
  const bytes = new Uint8Array(signature.match(/../g).map(value => parseInt(value,16)));
  const valid = await crypto.subtle.verify('HMAC', await signingKey(secret), bytes, encoder.encode(`visitor:${id}`));
  return valid ? id : null;
}

export async function mintVisitor(secret, hostname) {
  const id = crypto.randomUUID();
  const signature = await signedHash(`visitor:${id}`, secret);
  return { id, cookie: `${VISITOR_COOKIE}=${id}.${signature}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${isLocalHost(hostname) ? '' : '; Secure'}` };
}

export async function verifyTurnstile(token, requestId, ip, hostname, config, fetcher = fetch) {
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  // A renewed challenge token is a new validation; a network retry of the same token is not.
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(`${requestId}:${token}`))).slice(0, 16);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const validationId = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  const response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: config.secret, response: token, remoteip: ip, idempotency_key: validationId }),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) return false;
  const result = await response.json();
  if (result.success !== true) return false;
  if (config.localTest) return result.hostname === 'example.com';
  return result.hostname === hostname && result.action === 'heji_visit' && result.cdata === requestId;
}

export async function readMutation(request) {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 4096) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let input;
  try { input = JSON.parse(new TextDecoder().decode(bytes)); } catch { return null; }
  if (!input || typeof input.requestId !== 'string' || !UUID.test(input.requestId) || !['record','undo'].includes(input.action)) return null;
  input.requestId = input.requestId.toLowerCase();
  if (input.action === 'record' && (typeof input.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.day))) return null;
  if (input.action === 'undo') {
    if (typeof input.recordRequestId !== 'string' || !UUID.test(input.recordRequestId)) return null;
    input.recordRequestId = input.recordRequestId.toLowerCase();
  }
  return input;
}
