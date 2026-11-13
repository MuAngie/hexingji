import assert from 'node:assert/strict';
import { randomUUID, randomInt } from 'node:crypto';

// This test intentionally writes counters. A production URL is never accepted.
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:8787');
assert.ok(['localhost', '127.0.0.1'].includes(base.hostname), 'Only localhost or 127.0.0.1 may be tested');
assert.ok(['http:', 'https:'].includes(base.protocol));
assert.ok(!base.username && !base.password && base.pathname === '/' && !base.search && !base.hash);
const expectedFlag = process.argv.slice(3).find(value => value.startsWith('--expected-count='));
assert.ok(process.argv.slice(3).every(value => value === expectedFlag), 'Unknown test argument');
const expectedInitial = expectedFlag ? Number(expectedFlag.split('=')[1]) : null;
assert.ok(expectedInitial === null || (Number.isSafeInteger(expectedInitial) && expectedInitial >= 0));

const seed = randomInt(1, 250);
let nextAddress = 1;
const passed = [];
function client(ip = `198.19.${seed}.${nextAddress++}`) {
  const cookies = new Map();
  return {
    ip,
    cookie: () => [...cookies].map(([name, value]) => `${name}=${value}`).join('; '),
    async request(project, { method = 'GET', body, origin = base.origin, cookie, requestId } = {}) {
      const url = new URL(`/api/visits/${project}`, base);
      if (requestId) url.searchParams.set('requestId', requestId);
      const headers = { 'CF-Connecting-IP': ip };
      const cookieValue = cookie === undefined ? this.cookie() : cookie;
      if (cookieValue) headers.Cookie = cookieValue;
      if (method !== 'GET' && origin !== null) headers.Origin = origin;
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      const response = await fetch(url, {
        method, headers, body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'error', signal: AbortSignal.timeout(20000)
      });
      for (const value of response.headers.getSetCookie()) {
        const match = value.match(/^([^=]+)=([^;]*)/);
        if (match) cookies.set(match[1], match[2]);
      }
      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw); } catch { throw new Error(`${method} ${url.pathname}: expected JSON, received ${response.status} ${raw.slice(0, 120)}`); }
      return { status: response.status, data, headers: response.headers };
    }
  };
}
async function state(visitor, project, requestId) {
  const result = await visitor.request(project, { requestId });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.ok(Number.isSafeInteger(result.data.count) && result.data.count >= 0);
  assert.ok(result.data.protectionReady, 'Configure VISIT_COOKIE_SECRET; if enabling Turnstile locally, supply both official dummy keys');
  return result.data;
}
const record = (requestId, day, extra = {}) => ({ action: 'record', requestId, day, ...extra });
const undo = (recordRequestId, requestId = randomUUID()) => ({ action: 'undo', requestId, recordRequestId });
async function post(visitor, project, body) {
  const response = await visitor.request(project, { method: 'POST', body });
  assert.equal(response.status, 200, JSON.stringify(response.data));
  assert.equal(response.headers.get('cache-control'), 'no-store');
  return response.data;
}

const owner = client();
const initial = await state(owner, 'HJ-001');
if (expectedInitial !== null) assert.equal(initial.count, expectedInitial, 'Existing total must survive server restart or upgrade');
const firstId = randomUUID();
const first = await post(owner, 'HJ-001', record(firstId, initial.day));
assert.equal(first.count, initial.count + 1);
assert.equal(first.recordedToday, true);
assert.equal(first.operation.outcome, 'recorded');
assert.equal(first.undo.recordRequestId, firstId);
assert.ok(first.undo.undoUntil > first.serverNow && first.undo.undoUntil <= first.serverNow + 10000);
assert.ok(first.revision > initial.revision);
const repeated = await post(owner, 'HJ-001', record(firstId, initial.day));
assert.equal(repeated.count, first.count);
const dailyDuplicate = await post(owner, 'HJ-001', record(randomUUID(), initial.day));
assert.equal(dailyDuplicate.count, first.count);
assert.equal(dailyDuplicate.operation.outcome, 'already_recorded');
assert.equal((await state(owner, 'HJ-001', firstId)).operation.outcome, 'recorded');
passed.push('existing total, daily quota, request replay and operation lookup');

const stranger = client();
await state(stranger, 'HJ-001');
const forbidden = await stranger.request('HJ-001', { method: 'POST', body: undo(firstId) });
assert.equal(forbidden.status, 403);
assert.equal((await state(stranger, 'HJ-001', firstId)).operation.outcome, 'not_found');
const undoBody = undo(firstId);
const undone = await post(owner, 'HJ-001', undoBody);
assert.equal(undone.count, initial.count);
assert.equal(undone.recordedToday, false);
assert.equal(undone.operation.outcome, 'undone');
assert.equal((await post(owner, 'HJ-001', undoBody)).count, initial.count);
const secondUndo = await owner.request('HJ-001', { method: 'POST', body: undo(firstId) });
assert.ok([200, 409].includes(secondUndo.status));
assert.equal((await state(owner, 'HJ-001')).count, initial.count);
const replayAfterUndo = await post(owner, 'HJ-001', record(firstId, initial.day));
assert.equal(replayAfterUndo.count, initial.count);
assert.equal(replayAfterUndo.operation.outcome, 'undone');
const replacement = await post(owner, 'HJ-001', record(randomUUID(), initial.day));
assert.equal(replacement.count, initial.count + 1);
assert.equal(replacement.recordedToday, true);
passed.push('owned undo, repeated undo, old request stays undone, daily slot released');

const concurrent = client();
const beforeConcurrent = await state(concurrent, 'HJ-002');
const attempts = await Promise.all(Array.from({ length: 16 }, () =>
  post(concurrent, 'HJ-002', record(randomUUID(), beforeConcurrent.day))));
assert.equal(attempts.filter(result => result.operation.outcome === 'recorded').length, 1);
assert.ok(attempts.every(result => result.count === beforeConcurrent.count + 1));
const winning = attempts.find(result => result.operation.outcome === 'recorded');
await post(concurrent, 'HJ-002', undo(winning.operation.requestId));
assert.equal((await state(concurrent, 'HJ-002')).count, beforeConcurrent.count);
const left = client(), right = client(left.ip);
const [leftState, rightState] = await Promise.all([state(left, 'HJ-002'), state(right, 'HJ-002')]);
assert.equal(leftState.count, rightState.count);
const independent = await Promise.all([left, right].map(visitor => post(visitor, 'HJ-002', record(randomUUID(), leftState.day))));
assert.ok(independent.every(result => result.operation.outcome === 'recorded'));
assert.ok(independent.every(result => result.count >= leftState.count + 1 && result.count <= leftState.count + 2));
assert.equal((await state(left, 'HJ-002')).count, leftState.count + 2);
await Promise.all([left, right].map((visitor, index) => post(visitor, 'HJ-002', undo(independent[index].operation.requestId))));
assert.equal((await state(left, 'HJ-002')).count, beforeConcurrent.count);
passed.push('concurrent same-browser quota and independent visitors on one IP');

const secure = client();
const beforeSecurity = await state(secure, 'HJ-003');
for (const origin of [null, 'https://example.invalid']) {
  const response = await secure.request('HJ-003', { method: 'POST', origin, body: record(randomUUID(), beforeSecurity.day) });
  assert.equal(response.status, 403);
}
assert.equal((await secure.request('HJ-003', { method: 'POST', cookie: '', body: record(randomUUID(), beforeSecurity.day) })).status, 403);
const tampered = secure.cookie().split('');
const signatureIndex = Math.floor(tampered.length * 0.8);
tampered[signatureIndex] = tampered[signatureIndex] === 'a' ? 'b' : 'a';
assert.equal((await secure.request('HJ-003', { method: 'POST', cookie: tampered.join(''), body: record(randomUUID(), beforeSecurity.day) })).status, 403);
assert.equal((await secure.request('HJ-003', { method: 'POST', body: record('not-a-uuid', beforeSecurity.day) })).status, 400);
assert.equal((await secure.request('HJ-003', { method: 'POST', body: record(randomUUID(), '2000-01-01') })).status, 409);
assert.equal((await secure.request('HJ-003', { method: 'DELETE' })).status, 405);
assert.equal((await secure.request('HJ-999')).status, 404);
assert.equal((await state(secure, 'HJ-003')).count, beforeSecurity.count);
passed.push('origin, cookie signature, request ID, expired day and project validation');

const limited = client();
const beforeRate = await state(limited, 'HJ-004');
// Avoid crossing a fixed-minute boundary while checking its soft/hard thresholds.
const minutePhase = Date.now() % 60000;
if (minutePhase > 40000) await new Promise(resolve => setTimeout(resolve, 60100 - minutePhase));
let lastRate;
for (let index = 0; index < 20; index++) lastRate = await post(limited, 'HJ-004', record(randomUUID(), beforeRate.day));
const challengedId = randomUUID();
// An already-recorded visitor cannot increase the total; challenge a fresh visitor on the same IP.
const challenger = client(limited.ip);
await state(challenger, 'HJ-004');
const challenged = await challenger.request('HJ-004', { method: 'POST', body: record(challengedId, beforeRate.day) });
const turnstileEnabled = Boolean(beforeRate.turnstileSiteKey);
assert.equal(challenged.status, turnstileEnabled ? 428 : 429);
assert.equal(challenged.data.code, turnstileEnabled ? 'challenge_required' : 'rate_limited');
const fakeApproval = await challenger.request('HJ-004', { method: 'POST', body: record(challengedId, beforeRate.day, { verified: true }) });
assert.ok((turnstileEnabled ? [400, 428] : [429]).includes(fakeApproval.status), 'Client-side verification flags must not authorize a write');
const tokenBody = record(challengedId, beforeRate.day, { turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' });
if (turnstileEnabled) {
  assert.ok(challenged.data.turnstileSiteKey);
  const verified = await post(challenger, 'HJ-004', tokenBody);
  assert.equal(verified.count, beforeRate.count + 2);
  assert.equal(verified.operation.outcome, 'recorded');
  await post(challenger, 'HJ-004', undo(challengedId));
} else {
  assert.equal((await challenger.request('HJ-004', { method: 'POST', body: tokenBody })).status, 429);
  assert.ok(Number(challenged.headers.get('retry-after')) > 0);
  assert.equal((await state(challenger, 'HJ-004')).count, beforeRate.count + 1);
}
const cancellation = undo(lastRate.undo.recordRequestId);
await post(limited, 'HJ-004', cancellation);
assert.equal((await state(limited, 'HJ-004')).count, beforeRate.count);
let hardLimit;
for (let index = 0; index < 65; index++) {
  const result = turnstileEnabled
    ? await challenger.request('HJ-004', { method: 'POST', body: record(randomUUID(), beforeRate.day) })
    : await limited.request('HJ-004', { method: 'POST', body: cancellation });
  assert.ok((turnstileEnabled ? [428, 429] : [200, 429]).includes(result.status));
  if (result.status === 429) { hardLimit = result; break; }
}
assert.ok(hardLimit, 'The hard request cap must also cover retries and undo');
assert.equal(hardLimit.data.code, 'rate_limited');
assert.ok(Number(hardLimit.headers.get('retry-after')) > 0);
assert.equal((await state(limited, 'HJ-004')).count, beforeRate.count);
passed.push(turnstileEnabled
  ? 'soft challenge threshold, server verification, owned undo and hard rate cap'
  : 'Turnstile disabled: high-frequency new records blocked, token cannot bypass, owned undo and hard cap preserved');

const finalCount = (await state(owner, 'HJ-001')).count;
assert.equal(finalCount, initial.count + 1);
console.log(JSON.stringify({ ok: true, base: base.origin, initialCount: initial.count, finalCount, passed }, null, 2));
