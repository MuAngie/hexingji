import { DurableObject } from "cloudflare:workers";
import content from "../src/data/heji-content.json";
import { VisitStore } from "./visit-store.mjs";
import { UUID, isLocalHost, protectionConfig, readVisitor, mintVisitor, signedHash, verifyTurnstile, readMutation } from "./visit-security.mjs";

const projectIds = new Set(content.projects.map((project) => project.id));

export class ProjectVisitCounter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.store = new VisitStore(ctx.storage);
  }

  getState(visitorId, requestId) { return this.store.state(visitorId, requestId); }

  async apply(visitorId, input) {
    const result = await this.store.apply(visitorId, input);
    this.ctx.waitUntil(this.scheduleCleanup());
    return result;
  }

  async checkRate(ipHash) {
    const result = await this.store.rate(ipHash);
    this.ctx.waitUntil(this.scheduleCleanup());
    return result;
  }

  async scheduleCleanup() {
    if (await this.ctx.storage.getAlarm() === null) await this.ctx.storage.setAlarm(Date.now() + 60_000);
  }

  async alarm() {
    if (await this.store.prune()) await this.ctx.storage.setAlarm(Date.now() + 86_400_000);
  }
}

function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    const projectId = url.pathname.match(/^\/api\/visits\/(HJ-\d{3})$/)?.[1];
    if (!projectIds.has(projectId)) return json({ code: "project_not_found", message: "项目不存在" }, 404);
    if (!["GET", "POST"].includes(request.method)) {
      return json({ code: "method_not_allowed", message: "不支持的操作" }, 405, { Allow: "GET, POST" });
    }
    if (request.method === "POST" && request.headers.get("Origin") !== url.origin) {
      return json({ code: "origin_forbidden", message: "不支持的来源" }, 403);
    }

    try {
      const config = protectionConfig(env, url.hostname);
      const counter = env.PROJECT_VISITS.getByName(projectId);
      let visitorId = await readVisitor(request, config.cookieSecret);
      const publicConfig = { turnstileSiteKey: config.siteKey, protectionReady: config.ready };
      if (request.method === "GET") {
        const queryId = url.searchParams.get("requestId");
        if (queryId && !UUID.test(queryId)) return json({ code: "invalid_request", message: "操作编号无效" }, 400);
        let cookie;
        if (!visitorId && config.ready) {
          const minted = await mintVisitor(config.cookieSecret, url.hostname);
          visitorId = minted.id;
          cookie = minted.cookie;
        }
        return json({ ...await counter.getState(visitorId, queryId?.toLowerCase()), ...publicConfig }, 200, cookie ? { "Set-Cookie": cookie } : {});
      }
      if (!config.ready) return json({ code: "protection_unavailable", message: "暂时无法记录，请稍后再试" }, 503);
      if (!visitorId) return json({ code: "visitor_required", message: "请刷新页面后重试" }, 403);
      const ip = request.headers.get("CF-Connecting-IP") || (isLocalHost(url.hostname) ? "127.0.0.1" : null);
      if (!ip) return json({ code: "visitor_required", message: "暂时无法确认访问来源" }, 403);
      const rateCounter = env.PROJECT_VISITS.getByName("__visit_security__");
      const rate = await rateCounter.checkRate(await signedHash(`ip:${ip}`, config.cookieSecret));
      if (rate.limited) return json({ code: "rate_limited", message: "操作较频繁，请稍后再试" }, 429, { "Retry-After": String(rate.retryAfter) });
      const input = await readMutation(request);
      if (!input) return json({ code: "invalid_request", message: "记录请求无效" }, 400);
      const state = await counter.getState(visitorId, input.requestId);
      if (input.action === "record" && rate.challengeRequired && state.operation?.outcome === "not_found" && !state.recordedToday) {
        if (!config.siteKey) return json({ code: "rate_limited", message: "操作较频繁，请稍后再试" }, 429, { "Retry-After": String(rate.retryAfter) });
        if (!input.turnstileToken) return json({ code: "challenge_required", message: "请完成验证后再记录", ...publicConfig }, 428);
        let valid = false;
        try { valid = await verifyTurnstile(input.turnstileToken, input.requestId, ip, url.hostname, config); } catch { /* Fail closed; the operation is not submitted. */ }
        if (!valid) return json({ code: "challenge_invalid", message: "验证未通过，请重试", ...publicConfig }, 403);
      }
      const result = await counter.apply(visitorId, input);
      if (!result.ok) return json({ code: result.code, message: result.message }, result.status);
      return json({ ...result.state, ...publicConfig });
    } catch (error) {
      console.error("Project visit counter failed", error.message);
      return json({ code: "counter_unavailable", message: "计数暂不可用" }, 503);
    }
  }
};
