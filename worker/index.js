import { DurableObject } from "cloudflare:workers";
import content from "../src/data/heji-content.json";

const projectIds = new Set(content.projects.map((project) => project.id));

export class ProjectVisitCounter extends DurableObject {
  async getCount() {
    return (await this.ctx.storage.get("count")) ?? 0;
  }

  async increment() {
    const count = ((await this.ctx.storage.get("count")) ?? 0) + 1;
    await this.ctx.storage.put("count", count);
    return count;
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
    if (!projectIds.has(projectId)) return json({ error: "项目不存在" }, 404);
    if (!["GET", "POST"].includes(request.method)) {
      return json({ error: "不支持的操作" }, 405, { Allow: "GET, POST" });
    }
    const origin = request.headers.get("Origin");
    if (request.method === "POST" && origin && origin !== url.origin) {
      return json({ error: "不支持的来源" }, 403);
    }

    try {
      const counter = env.PROJECT_VISITS.getByName(projectId);
      const count = request.method === "POST" ? await counter.increment() : await counter.getCount();
      return json({ count });
    } catch (error) {
      console.error("Project visit counter failed", error);
      return json({ error: "计数暂不可用" }, 503);
    }
  }
};
