const DAY = 86_400_000;
const RETENTION = 7 * DAY;
export const UNDO_MS = 10_000;

export function beijingDay(now) {
  return new Date(now + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const failure = (status, code, message) => ({ ok: false, status, code, message });

export class VisitStore {
  constructor(storage, clock = Date.now) {
    this.storage = storage;
    this.clock = clock;
  }

  async stateFrom(tx, visitorId, requestId, now) {
    const day = beijingDay(now);
    const count = (await tx.get('count')) ?? 0;
    const revision = (await tx.get('revision')) ?? 0;
    let recordedToday = false, undo = null, operation = null;
    if (visitorId) {
      recordedToday = Boolean(await tx.get(`daily:${day}:${visitorId}`));
      const latest = await tx.get(`visitor:${visitorId}`);
      const record = latest && await tx.get(`op:${latest.recordRequestId}`);
      if (record && !record.undone && record.undoUntil > now) {
        undo = { recordRequestId: record.requestId, undoUntil: record.undoUntil };
      }
      if (requestId) {
        const receipt = await tx.get(`op:${requestId}`);
        if (receipt?.visitorId === visitorId) {
          const target = receipt.action === 'record' && await tx.get(`op:${receipt.recordRequestId}`);
          operation = {
            requestId, action: receipt.action,
            outcome: target?.undone ? 'undone' : receipt.outcome
          };
        }
      }
    }
    if (requestId && !operation) operation = { requestId, action: 'record', outcome: 'not_found' };
    return { count, revision, day, serverNow: now, recordedToday, undo, operation };
  }

  state(visitorId, requestId) {
    return this.storage.transaction(tx => this.stateFrom(tx, visitorId, requestId, this.clock()));
  }

  apply(visitorId, input) {
    return this.storage.transaction(async tx => {
      const now = this.clock();
      const existing = await tx.get(`op:${input.requestId}`);
      if (existing) {
        if (existing.visitorId !== visitorId) return failure(403, 'operation_forbidden', '无法操作这条记录');
        if (existing.action !== input.action ||
            (input.action === 'record' && existing.day !== input.day) ||
            (input.action === 'undo' && existing.recordRequestId !== input.recordRequestId)) {
          return failure(409, 'request_conflict', '操作编号已用于其他记录');
        }
        return { ok: true, state: await this.stateFrom(tx, visitorId, input.requestId, now) };
      }
      const receipt = {
        requestId: input.requestId, visitorId, action: input.action,
        createdAt: now, expiresAt: now + RETENTION
      };
      if (input.action === 'record') {
        const day = beijingDay(now);
        if (input.day !== day) return failure(409, 'day_expired', '日期已更新，请重新确认记录');
        const dailyKey = `daily:${day}:${visitorId}`;
        const active = await tx.get(dailyKey);
        receipt.day = day;
        receipt.recordRequestId = active?.recordRequestId ?? input.requestId;
        if (active) {
          receipt.outcome = 'already_recorded';
          await tx.put(`op:${input.requestId}`, receipt);
        } else {
          receipt.outcome = 'recorded';
          receipt.undoUntil = now + UNDO_MS;
          receipt.undone = false;
          await tx.put({
            count: ((await tx.get('count')) ?? 0) + 1,
            revision: ((await tx.get('revision')) ?? 0) + 1,
            [`op:${input.requestId}`]: receipt,
            [dailyKey]: { recordRequestId: input.requestId, expiresAt: now + RETENTION },
            [`visitor:${visitorId}`]: { recordRequestId: input.requestId, expiresAt: now + RETENTION }
          });
        }
      } else {
        const record = await tx.get(`op:${input.recordRequestId}`);
        if (!record || record.visitorId !== visitorId || record.action !== 'record' ||
            record.requestId !== record.recordRequestId) {
          return failure(403, 'operation_forbidden', '无法撤销这条记录');
        }
        if (!record.undone && now >= record.undoUntil) return failure(409, 'undo_expired', '撤销时间已过');
        receipt.recordRequestId = input.recordRequestId;
        receipt.day = record.day;
        receipt.outcome = 'undone';
        if (!record.undone) {
          const count = (await tx.get('count')) ?? 0;
          if (count < 1) throw new Error('Active record has no corresponding count');
          record.undone = true;
          await tx.put({
            count: count - 1,
            revision: ((await tx.get('revision')) ?? 0) + 1,
            [`op:${record.requestId}`]: record
          });
          const dailyKey = `daily:${record.day}:${visitorId}`;
          if ((await tx.get(dailyKey))?.recordRequestId === record.requestId) await tx.delete(dailyKey);
        }
        await tx.put(`op:${input.requestId}`, receipt);
      }
      return { ok: true, state: await this.stateFrom(tx, visitorId, input.requestId, now) };
    });
  }

  rate(ipHash) {
    return this.storage.transaction(async tx => {
      const now = this.clock();
      const minute = Math.floor(now / 60_000);
      const key = `rate:${ipHash}`;
      const previous = await tx.get(key);
      const requests = previous?.minute === minute ? previous.requests + 1 : 1;
      await tx.put(key, { minute, requests, expiresAt: (minute + 2) * 60_000 });
      return { challengeRequired: requests > 20, limited: requests > 60, retryAfter: Math.max(1, Math.ceil(((minute + 1) * 60_000 - now) / 1000)) };
    });
  }

  async prune() {
    const now = this.clock();
    let live = false;
    for (const prefix of ['op:', 'daily:', 'visitor:', 'rate:']) {
      let startAfter;
      while (true) {
        const entries = await this.storage.list({ prefix, limit: 128, ...(startAfter ? { startAfter } : {}) });
        if (!entries.size) break;
        const keys = [...entries.keys()];
        await this.storage.transaction(async tx => {
          const expired = [];
          for (const key of keys) {
            const current = await tx.get(key);
            if (current?.expiresAt <= now) expired.push(key);
            else if (current) live = true;
          }
          if (expired.length) await tx.delete(expired);
        });
        startAfter = keys.at(-1);
        if (entries.size < 128) break;
      }
    }
    return live;
  }
}
