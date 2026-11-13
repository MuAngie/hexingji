"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Action = { action: "record"; requestId: string; day: string } | { action: "undo"; requestId: string; recordRequestId: string };
type VisitState = {
  count: number;
  revision: number;
  day: string;
  serverNow: number;
  recordedToday: boolean;
  undo: { recordRequestId: string; undoUntil: number } | null;
  operation: { requestId: string; outcome: "recorded" | "undone" | "already_recorded" | "not_found" } | null;
  turnstileSiteKey: string | null;
  protectionReady: boolean;
};
type Challenge = { siteKey: string; requestId: string; attempt: number };
type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
const pendingMemory = new Map<string, Action>();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let verificationScript: Promise<Turnstile> | null = null;

function readPending(key: string): Action | null {
  try {
    const action = JSON.parse(localStorage.getItem(key) ?? "null");
    if (action && uuid.test(action.requestId) && (
      (action.action === "record" && /^\d{4}-\d{2}-\d{2}$/.test(action.day)) ||
      (action.action === "undo" && uuid.test(action.recordRequestId))
    )) return action;
  } catch { /* Keep the in-memory operation if browser storage is unavailable. */ }
  return pendingMemory.get(key) ?? null;
}

function savePending(key: string, action: Action | null, expectedId?: string) {
  if (!action && expectedId && readPending(key)?.requestId !== expectedId) return;
  if (action) pendingMemory.set(key, action); else pendingMemory.delete(key);
  try {
    if (action) localStorage.setItem(key, JSON.stringify(action)); else localStorage.removeItem(key);
  } catch { /* The submission lock and server quota still protect this page. */ }
}

class VisitError extends Error {
  constructor(public code: string, message: string, public siteKey?: string) { super(message); }
}

async function requestState(url: string, action?: Action, token?: string, signal?: AbortSignal): Promise<VisitState> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, 8000);
  try {
    const response = await fetch(url, {
      method: action ? "POST" : "GET", credentials: "same-origin", cache: "no-store", signal: controller.signal,
      ...(action ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...action, ...(token ? { turnstileToken: token } : {}) }) } : {})
    });
    const data = await response.json();
    if (!response.ok) throw new VisitError(data.code ?? "unavailable", data.message ?? "暂时无法记录，请稍后再试", data.turnstileSiteKey);
    if (!Number.isSafeInteger(data.count) || data.count < 0 || !Number.isSafeInteger(data.revision) || data.revision < 0 ||
      !Number.isFinite(data.serverNow) || !/^\d{4}-\d{2}-\d{2}$/.test(data.day) ||
      typeof data.recordedToday !== "boolean" || typeof data.protectionReady !== "boolean") throw new Error("Invalid visit response");
    if (action && (data.operation?.requestId !== action.requestId || !["recorded", "undone", "already_recorded"].includes(data.operation?.outcome))) throw new Error("Unconfirmed visit operation");
    return data;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

function loadVerification() {
  const api = (window as Window & { turnstile?: Turnstile }).turnstile;
  if (api) return Promise.resolve(api);
  if (!verificationScript) verificationScript = new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement("script");
    let settled = false;
    const unavailable = () => { if (settled) return; settled = true; clearTimeout(timeout); verificationScript = null; script.remove(); reject(new Error("Verification unavailable")); };
    const timeout = setTimeout(unavailable, 8000);
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      const loaded = (window as Window & { turnstile?: Turnstile }).turnstile;
      if (settled) return;
      if (loaded) { settled = true; clearTimeout(timeout); resolve(loaded); } else unavailable();
    };
    script.onerror = unavailable;
    document.head.append(script);
  });
  return verificationScript;
}

function Verification({ challenge, onToken, onError }: { challenge: Challenge; onToken: (token: string) => void; onError: () => void }) {
  const element = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onToken, onError });
  callbacks.current = { onToken, onError };
  useEffect(() => {
    let alive = true, id: string | undefined, api: Turnstile | undefined;
    loadVerification().then((loaded) => {
      if (!alive || !element.current) return;
      api = loaded;
      id = api.render(element.current, {
        sitekey: challenge.siteKey, size: "compact", action: "heji_visit", cData: challenge.requestId,
        callback: (token: string) => { if (alive) callbacks.current.onToken(token); },
        "error-callback": () => { if (alive) callbacks.current.onError(); },
        "expired-callback": () => { if (alive) callbacks.current.onError(); }
      });
    }).catch(() => { if (alive) callbacks.current.onError(); });
    return () => { alive = false; if (id && api) api.remove(id); };
  }, [challenge.siteKey, challenge.requestId, challenge.attempt]);
  return <div className="visit-verification" ref={element} aria-label="人机验证" />;
}

export function ProjectVisitCounter({ projectId }: { projectId: string }) {
  const url = `/api/visits/${projectId}`;
  const key = `heji:pending-visit:${projectId}`;
  const [state, setState] = useState<VisitState | null>(null);
  const [pending, setPending] = useState<Action | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [clock, setClock] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const mounted = useRef(false), locked = useRef(false);
  const latest = useRef<VisitState | null>(null);
  const serverClock = useRef({ now: 0, received: 0 });

  const applyState = useCallback((next: VisitState) => {
    const current = latest.current;
    if (current && (next.revision < current.revision || (next.revision === current.revision && next.serverNow < current.serverNow))) return;
    latest.current = next;
    serverClock.current = { now: next.serverNow, received: performance.now() };
    if (mounted.current) { setState(next); setClock(performance.now()); }
  }, []);

  const finishPending = useCallback((action: Action) => {
    savePending(key, null, action.requestId);
    if (mounted.current) { setPending(null); setChallenge(null); }
  }, [key]);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const action = readPending(key);
    const next = await requestState(`${url}${action ? `?requestId=${encodeURIComponent(action.requestId)}` : ""}`, undefined, undefined, signal);
    if (signal?.aborted) return;
    applyState(next);
    if (action && next.operation?.requestId === action.requestId && next.operation.outcome !== "not_found") {
      finishPending(action);
      if (mounted.current) setMessage(next.operation.outcome === "undone" ? "已撤销本次记录" : "已确认记录结果");
    } else if (action?.action === "record" && action.day !== next.day) {
      finishPending(action);
      if (mounted.current) setMessage("上次记录未计入，已进入新的一天");
    } else if (mounted.current) setPending(action);
    return next;
  }, [url, key, applyState, finishPending]);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    refresh(controller.signal).catch(() => { if (!controller.signal.aborted) setMessage("暂时无法读取次数，请重试"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { mounted.current = false; controller.abort(); };
  }, [refresh]);

  useEffect(() => {
    const deadline = Math.max(cooldown, state?.undo ? serverClock.current.received + state.undo.undoUntil - serverClock.current.now : 0);
    if (performance.now() >= deadline) return;
    const timer = setTimeout(() => setClock(performance.now()), 250);
    return () => clearTimeout(timer);
  }, [state?.undo, cooldown, clock]);

  useEffect(() => {
    if (!state) return;
    const midnight = Date.parse(`${state.day}T00:00:00+08:00`) + 86400000;
    const timer = setTimeout(() => { if (!locked.current) refresh().catch(() => {}); }, Math.max(100, midnight - state.serverNow));
    return () => clearTimeout(timer);
  }, [state, refresh]);

  async function submit(action: Action, token?: string) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setMessage("");
    savePending(key, action);
    setPending(action);
    try {
      const next = await requestState(url, action, token);
      applyState(next);
      finishPending(action);
      if (mounted.current) {
        setCooldown(performance.now() + 2000);
        setMessage(next.operation?.outcome === "undone" ? "已撤销本次记录" : next.operation?.outcome === "already_recorded" ? "今天已记录" : "已记录");
      }
    } catch (error) {
      if (!mounted.current) return;
      if (error instanceof VisitError) {
        const siteKey = error.siteKey ?? latest.current?.turnstileSiteKey;
        if (error.code === "challenge_required" || (token && error.siteKey)) {
          if (siteKey) setChallenge({ siteKey, requestId: action.requestId, attempt: performance.now() });
          setMessage("请完成验证后继续");
        } else if (["invalid_request", "invalid_origin", "origin_forbidden", "invalid_cookie", "visitor_required", "ownership_mismatch", "operation_forbidden", "request_conflict", "day_expired", "undo_expired", "protection_unavailable"].includes(error.code)) {
          finishPending(action);
          setMessage(error.code === "undo_expired" ? "撤销时间已过" : error.code === "day_expired" ? "已进入新的一天，请重新记录" : "暂时无法记录，请稍后再试");
          await refresh().catch(() => {});
        } else setMessage(error.code === "rate_limited" ? "操作较频繁，请稍后重试" : "结果待确认，请点击重试");
      } else setMessage("结果待确认，请点击重试");
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function record() {
    if (locked.current) return;
    const unfinished = readPending(key);
    if (unfinished || !latest.current) {
      locked.current = true;
      setBusy(true);
      try {
        await refresh();
      } catch {
        setMessage("暂时无法确认结果，请重试");
        return;
      } finally { locked.current = false; if (mounted.current) setBusy(false); }
      const remaining = readPending(key);
      if (remaining) await submit(remaining);
      return;
    }
    const current = latest.current;
    if (!current.protectionReady || current.recordedToday || performance.now() < cooldown) return;
    await submit({ action: "record", requestId: crypto.randomUUID(), day: current.day });
  }

  const serverNow = serverClock.current.now + Math.max(0, clock - serverClock.current.received);
  const undoSeconds = state?.undo ? Math.max(0, Math.ceil((state.undo.undoUntil - serverNow) / 1000)) : 0;
  const cooling = clock < cooldown;
  const disabled = loading || busy || cooling || (!!state && (!state.protectionReady || (state.recordedToday && !pending)));
  const label = busy ? pending?.action === "undo" ? "撤销中" : "记录中" : loading ? "读取中" : pending ? pending.action === "undo" ? "重试撤销" : "重试记录" : state?.recordedToday ? "今天已记录" : "禾来过";
  return <div className="project-visit-counter">
    <button className="primary-button visit-counter-button" disabled={disabled} onClick={record} aria-label={`${label}，${state ? `累计 ${state.count} 次` : "累计次数待确认"}`}>
      <span>{label}</span><span className="tabular-nums" aria-live="polite" aria-atomic="true">{state?.count ?? "..."}</span>
    </button>
    {undoSeconds > 0 && state?.undo ? <button className="visit-undo" disabled={busy || !!pending} onClick={() => submit({ action: "undo", requestId: crypto.randomUUID(), recordRequestId: state.undo!.recordRequestId })}>
      撤销本次<span aria-hidden="true">（{undoSeconds}秒）</span>
    </button> : null}
    <span className="visit-counter-message" role="status">{!loading && state && !state.protectionReady ? "暂时无法记录，请稍后再试" : message}</span>
    {challenge ? <Verification challenge={challenge} onToken={(token) => { const action = readPending(key); if (action?.requestId === challenge.requestId) void submit(action, token); }} onError={() => setMessage("验证暂不可用，请点击重试")} /> : null}
  </div>;
}
