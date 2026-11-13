import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { VisitStore, beijingDay, UNDO_MS } from './visit-store.mjs';
import { UUID, protectionConfig, mintVisitor, readVisitor, verifyTurnstile, readMutation } from './visit-security.mjs';

class MemoryStorage {
  data = new Map();
  queue = Promise.resolve();
  view(data = this.data) {
    return {
      get: async key => structuredClone(data.get(key)),
      put: async (key, value) => {
        if (typeof key === 'string') data.set(key, structuredClone(value));
        else for (const [name, item] of Object.entries(key)) data.set(name, structuredClone(item));
      },
      delete: async keys => (Array.isArray(keys) ? keys : [keys]).forEach(key => data.delete(key))
    };
  }
  transaction(callback) {
    const pending = this.queue.then(async () => {
      const next = structuredClone(this.data);
      const result = await callback(this.view(next));
      this.data = next;
      return result;
    });
    this.queue = pending.catch(() => {});
    return pending;
  }
  async list({ prefix, startAfter = '', limit }) {
    return new Map([...this.data].filter(([key]) => key.startsWith(prefix) && key > startAfter).sort(([a], [b]) => a.localeCompare(b)).slice(0, limit));
  }
}

function setup(start = Date.UTC(2026, 10, 13, 1)) {
  const storage = new MemoryStorage();
  storage.data.set('count', 42);
  let now = start;
  return { storage, store: new VisitStore(storage, () => now), now: () => now, advance: ms => now += ms };
}
const record = (day, requestId = randomUUID()) => ({ action: 'record', day, requestId });
const undo = recordRequestId => ({ action: 'undo', requestId: randomUUID(), recordRequestId });

test('preserves the previous total and counts one active record per visitor per Beijing day', async () => {
  const s = setup();
  const visitor = randomUUID();
  const attempts = Array.from({ length: 20 }, () => record(beijingDay(s.now())));
  const results = await Promise.all(attempts.map(input => s.store.apply(visitor, input)));
  assert.equal(results.filter(result => result.state.operation.outcome === 'recorded').length, 1);
  assert.equal((await s.store.state(visitor)).count, 43);
  assert.equal((await s.store.state(visitor)).revision, 1);
  assert.equal((await s.store.state(visitor)).recordedToday, true);
  assert.equal((await s.store.state(randomUUID())).recordedToday, false);
});

test('concurrent new visitors count independently; repeating one request counts only once', async () => {
  const s = setup();
  const day = beijingDay(s.now());
  await Promise.all(Array.from({ length: 15 }, () => s.store.apply(randomUUID(), record(day))));
  const visitor = randomUUID(), input = record(day);
  await Promise.all(Array.from({ length: 10 }, () => s.store.apply(visitor, input)));
  assert.equal((await s.store.state(visitor)).count, 58);
  assert.equal((await s.store.state(visitor)).revision, 16);
  assert.equal((await s.store.state(randomUUID(), input.requestId)).operation.outcome, 'not_found');
  assert.equal((await s.store.apply(randomUUID(), input)).code, 'operation_forbidden');
  assert.equal((await s.store.apply(visitor, { ...input, day: '2026-11-14' })).code, 'request_conflict');
});

test('undo is owned, idempotent and cannot undo a later replacement record', async () => {
  const s = setup();
  const visitor = randomUUID(), input = record(beijingDay(s.now()));
  await s.store.apply(visitor, input);
  const duplicate = record(input.day);
  await s.store.apply(visitor, duplicate);
  assert.equal((await s.store.apply(randomUUID(), undo(input.requestId))).code, 'operation_forbidden');
  assert.equal((await s.store.apply(visitor, undo(duplicate.requestId))).code, 'operation_forbidden');
  const cancel = undo(input.requestId);
  await s.store.apply(visitor, cancel);
  assert.equal((await s.store.apply(visitor, cancel)).state.count, 42);
  assert.equal((await s.store.apply(visitor, undo(input.requestId))).state.count, 42);
  assert.equal((await s.store.apply(visitor, input)).state.operation.outcome, 'undone');
  assert.equal((await s.store.apply(visitor, duplicate)).state.operation.outcome, 'undone');
  const replacement = record(input.day);
  assert.equal((await s.store.apply(visitor, replacement)).state.count, 43);
  assert.equal((await s.store.apply(visitor, cancel)).state.count, 43);
  assert.equal((await s.store.state(visitor)).undo.recordRequestId, replacement.requestId);
});

test('the server enforces the exact 10-second undo deadline', async () => {
  for (const [elapsed, expected] of [[UNDO_MS - 1, true], [UNDO_MS, false]]) {
    const s = setup(), visitor = randomUUID(), input = record(beijingDay(s.now()));
    await s.store.apply(visitor, input);
    s.advance(elapsed);
    const result = await s.store.apply(visitor, undo(input.requestId));
    assert.equal(result.ok, expected);
    assert.equal((await s.store.state(visitor)).count, expected ? 42 : 43);
    if (!expected) assert.equal(result.code, 'undo_expired');
  }
});

test('Beijing midnight opens a new quota while a fresh previous-day undo remains owned', async () => {
  const s = setup(Date.UTC(2026, 10, 13, 15, 59, 59)), visitor = randomUUID();
  assert.equal(beijingDay(s.now()), '2026-11-13');
  const yesterday = record(beijingDay(s.now()));
  await s.store.apply(visitor, yesterday);
  s.advance(2000);
  assert.equal((await s.store.state(visitor)).day, '2026-11-14');
  assert.equal((await s.store.state(visitor)).recordedToday, false);
  assert.equal((await s.store.state(visitor)).undo.recordRequestId, yesterday.requestId);
  assert.equal((await s.store.apply(visitor, record('2026-11-13'))).code, 'day_expired');
  const today = record(beijingDay(s.now()));
  assert.equal((await s.store.apply(visitor, today)).state.count, 44);
  assert.equal((await s.store.apply(visitor, undo(yesterday.requestId))).state.count, 43);
  const state = await s.store.state(visitor);
  assert.equal(state.recordedToday, true);
  assert.equal(state.undo.recordRequestId, today.requestId);
});

test('expired receipts are pruned without deleting totals or permitting old-day replay', async () => {
  const s = setup(), visitor = randomUUID(), input = record(beijingDay(s.now()));
  await s.store.apply(visitor, input);
  s.advance(7 * 86_400_000 - 1);
  await s.store.prune();
  assert.equal((await s.store.state(visitor, input.requestId)).operation.outcome, 'recorded');
  s.advance(2);
  await s.store.prune();
  assert.equal((await s.store.state(visitor, input.requestId)).operation.outcome, 'not_found');
  assert.equal((await s.store.apply(visitor, input)).code, 'day_expired');
  assert.equal((await s.store.state(visitor)).count, 43);
});

test('the fixed-minute IP budget has independent soft/hard limits and resets only with time', async () => {
  const s = setup();
  let result;
  for (let i = 1; i <= 61; i++) {
    result = await s.store.rate('hashed-ip');
    assert.equal(result.challengeRequired, i > 20);
    assert.equal(result.limited, i > 60);
  }
  assert.ok(result.retryAfter > 0 && result.retryAfter <= 60);
  assert.equal((await s.store.rate('other-hash')).challengeRequired, false);
  s.advance(60_000);
  assert.equal((await s.store.rate('hashed-ip')).challengeRequired, false);
});

const siteKey = '1x00000000000000000000AA';
const secretKey = '1x0000000000000000000000000000000AA';
const cookieSecret = 'test-only-cookie-secret-with-at-least-32-characters';

test('cookies are HMAC authenticated; missing cookie secret or public dummy keys disable writes', async () => {
  const minted = await mintVisitor(cookieSecret, 'example.org');
  assert.match(minted.cookie, /HttpOnly; SameSite=Lax; Secure$/);
  const request = new Request('https://example.org', { headers: { Cookie: minted.cookie } });
  assert.equal(await readVisitor(request, cookieSecret), minted.id);
  assert.equal(await readVisitor(request, cookieSecret + 'changed'), null);
  const forged = new Request('https://example.org', { headers: { Cookie: minted.cookie.replace(minted.id, randomUUID()) } });
  assert.equal(await readVisitor(forged, cookieSecret), null);
  assert.ok(!(await mintVisitor(cookieSecret, '127.0.0.1')).cookie.includes('; Secure'));
  const env = {TURNSTILE_SITE_KEY:siteKey,TURNSTILE_SECRET_KEY:secretKey,VISIT_COOKIE_SECRET:cookieSecret};
  assert.equal(protectionConfig(env,'127.0.0.1').ready,true);
  assert.equal(protectionConfig(env,'example.org').ready,false);
  assert.equal(protectionConfig({...env,VISIT_COOKIE_SECRET:''},'127.0.0.1').ready,false);
});

test('Turnstile is optional, but partial configuration never silently bypasses verification', () => {
  const env = { VISIT_COOKIE_SECRET: cookieSecret };
  for (const hostname of ['127.0.0.1', 'example.org']) {
    const disabled = protectionConfig(env, hostname);
    assert.equal(disabled.ready, true);
    assert.equal(disabled.siteKey, null);
    assert.equal(protectionConfig({...env,TURNSTILE_SITE_KEY:'',TURNSTILE_SECRET_KEY:''},hostname).ready,true);
    assert.equal(protectionConfig({...env,TURNSTILE_SITE_KEY:'real-site'},hostname).ready,false);
    assert.equal(protectionConfig({...env,TURNSTILE_SECRET_KEY:'real-secret'},hostname).ready,false);
    const enabled = protectionConfig({...env,TURNSTILE_SITE_KEY:'real-site',TURNSTILE_SECRET_KEY:'real-secret'},hostname);
    assert.equal(enabled.ready,true);
    assert.equal(enabled.siteKey,'real-site');
  }
  assert.equal(protectionConfig({},'example.org').ready,false);
  assert.equal(protectionConfig({VISIT_COOKIE_SECRET:'short'},'example.org').ready,false);
});

test('Turnstile production validation binds hostname, action and operation, with a local-only dummy exception', async () => {
  const requestId = randomUUID();
  const config = {secret:'real-secret',localTest:false};
  const valid = {success:true,hostname:'example.org',action:'heji_visit',cdata:requestId};
  const mock = data => async (_url, init) => {
    assert.ok(UUID.test(init.body.get('idempotency_key')));
    assert.notEqual(init.body.get('idempotency_key'), requestId);
    return Response.json(data);
  };
  assert.equal(await verifyTurnstile('token',requestId,'192.0.2.1','example.org',config,mock(valid)),true);
  for(const invalid of [{hostname:'other.org'},{action:'other'},{cdata:randomUUID()},{success:'true'}]) {
    assert.equal(await verifyTurnstile('token',requestId,'192.0.2.1','example.org',config,mock({...valid,...invalid})),false);
  }
  assert.equal(await verifyTurnstile('token',requestId,'127.0.0.1','localhost',{secret:secretKey,localTest:true},mock({success:true,hostname:'example.com'})),true);
  assert.equal(await verifyTurnstile('',requestId,'127.0.0.1','localhost',config,mock(valid)),false);
});

test('Turnstile retries reuse a validation key only while the business ID and challenge token both match', async () => {
  const requestId = randomUUID(), keys = [];
  const config = { secret: 'real-secret', localTest: false };
  const mock = async (_url, init) => {
    keys.push(init.body.get('idempotency_key'));
    return Response.json({ success: true, hostname: 'example.org', action: 'heji_visit', cdata: requestId });
  };
  for (const token of ['first-token','first-token','renewed-token']) {
    assert.equal(await verifyTurnstile(token,requestId,'192.0.2.1','example.org',config,mock),true);
  }
  assert.equal(keys[0],keys[1]);
  assert.notEqual(keys[1],keys[2]);
});

test('mutation parsing rejects malformed identities, oversized bodies and invalid content types', async () => {
  const input = record('2026-11-13');
  const request = value => new Request('http://localhost/api/visits/HJ-001',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
  assert.deepEqual(await readMutation(request(input)),input);
  for(const value of [null,{}, {...input,requestId:[input.requestId]}, {...input,day:[input.day]}, {...undo(input.requestId),recordRequestId:[input.requestId]}]) {
    assert.equal(await readMutation(request(value)),null);
  }
  assert.equal(await readMutation(request({...input,turnstileToken:'x'.repeat(5000)})),null);
  assert.equal(await readMutation(new Request('http://localhost',{method:'POST',body:JSON.stringify(input)})),null);
});
