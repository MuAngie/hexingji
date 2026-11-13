import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectVisitCounter } from "./ProjectVisitCounter";

const now = Date.UTC(2026, 10, 13, 4);
const snapshot = (extra: Record<string, unknown> = {}) => ({
  count: 12, revision: 0, day: "2026-11-13", serverNow: now, recordedToday: false,
  undo: null, operation: null, turnstileSiteKey: "test-site", protectionReady: true, ...extra
});
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
type Payload = { action: string; requestId: string; day?: string; recordRequestId?: string; turnstileToken?: string };

beforeEach(() => { localStorage.clear(); vi.stubGlobal("React", React); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("ProjectVisitCounter", () => {
  it("locks rapid submissions, confirms server totals, and permits an immediate single undo", async () => {
    const posts: Payload[] = [];
    let resolveRecord: ((value: Response) => void) | undefined;
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method !== "POST") return response(snapshot());
      const body: Payload = JSON.parse(String(init.body)); posts.push(body);
      if (body.action === "record") return new Promise<Response>(resolve => { resolveRecord = resolve; });
      return response(snapshot({ revision: 2, operation: { requestId: body.requestId, action: "undo", outcome: "undone" } }));
    });
    vi.stubGlobal("fetch", fetcher);
    render(<ProjectVisitCounter projectId="HJ-001" />);
    const button = await screen.findByRole("button", { name: "禾来过，累计 12 次" });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(button); fireEvent.click(button);
    expect(posts).toHaveLength(1);
    expect((screen.getByRole("button", { name: "记录中，累计 12 次" }) as HTMLButtonElement).disabled).toBe(true);
    resolveRecord!(response(snapshot({ count: 13, revision: 1, recordedToday: true,
      undo: { recordRequestId: posts[0].requestId, undoUntil: now + 10000 },
      operation: { requestId: posts[0].requestId, action: "record", outcome: "recorded" } })));
    const undo = await screen.findByRole("button", { name: /撤销本次/ });
    expect(screen.getByRole("button", { name: "今天已记录，累计 13 次" })).toBeTruthy();
    fireEvent.click(undo); fireEvent.click(undo);
    await screen.findByText("已撤销本次记录");
    expect(posts).toHaveLength(2);
    expect(posts[1].recordRequestId).toBe(posts[0].requestId);
    expect(screen.getByRole("button", { name: "禾来过，累计 12 次" })).toBeTruthy();
    expect(localStorage.getItem("heji:pending-visit:HJ-001")).toBeNull();
  });

  it("recovers a committed request after a lost response without posting another increment", async () => {
    let posted: Payload | undefined;
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST") { posted = JSON.parse(String(init.body)); throw new Error("Connection lost after commit"); }
      return response(posted ? snapshot({ count: 13, revision: 1, recordedToday: true,
        operation: { requestId: posted.requestId, action: "record", outcome: "recorded" } }) : snapshot());
    }));
    const first = render(<ProjectVisitCounter projectId="HJ-002" />);
    fireEvent.click(await screen.findByRole("button", { name: "禾来过，累计 12 次" }));
    await screen.findByText("结果待确认，请点击重试");
    const id = posted!.requestId;
    first.unmount();
    render(<ProjectVisitCounter projectId="HJ-002" />);
    await screen.findByRole("button", { name: "今天已记录，累计 13 次" });
    const calls = vi.mocked(fetch).mock.calls;
    expect(calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
    expect(calls.at(-1)![0]).toContain(`?requestId=${id}`);
    expect(localStorage.getItem("heji:pending-visit:HJ-002")).toBeNull();
  });

  it("retries an unknown unfinished action with its original ID after reopening", async () => {
    const posts: Payload[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        const body: Payload = JSON.parse(String(init.body)); posts.push(body);
        if (posts.length === 1) throw new Error("Request never arrived");
        return response(snapshot({ count: 13, revision: 1, recordedToday: true,
          operation: { requestId: body.requestId, action: "record", outcome: "recorded" } }));
      }
      return response(snapshot({ operation: posts[0] ? { requestId: posts[0].requestId, action: "record", outcome: "not_found" } : null }));
    }));
    const first = render(<ProjectVisitCounter projectId="HJ-003" />);
    fireEvent.click(await screen.findByRole("button", { name: "禾来过，累计 12 次" }));
    await screen.findByText("结果待确认，请点击重试"); first.unmount();
    render(<ProjectVisitCounter projectId="HJ-003" />);
    fireEvent.click(await screen.findByRole("button", { name: "重试记录，累计 12 次" }));
    await screen.findByRole("button", { name: "今天已记录，累计 13 次" });
    expect(posts).toHaveLength(2);
    expect(posts[0].requestId).toBe(posts[1].requestId);
  });

  it("does not replay an unknown old-day request or invent an automatic new record", async () => {
    const id = crypto.randomUUID();
    localStorage.setItem("heji:pending-visit:HJ-004", JSON.stringify({ action: "record", requestId: id, day: "2026-11-12" }));
    const fetcher = vi.fn(async () => response(snapshot({ operation: { requestId: id, action: "record", outcome: "not_found" } })));
    vi.stubGlobal("fetch", fetcher);
    render(<ProjectVisitCounter projectId="HJ-004" />);
    await screen.findByText("上次记录未计入，已进入新的一天");
    expect(fetcher.mock.calls).toHaveLength(1);
    expect(localStorage.getItem("heji:pending-visit:HJ-004")).toBeNull();
  });

  it("keeps unconfigured protection read-only and never displays technical secret names", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response(snapshot({ protectionReady: false, turnstileSiteKey: null }))));
    render(<ProjectVisitCounter projectId="HJ-005" />);
    const button = await screen.findByRole("button", { name: "禾来过，累计 12 次" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await screen.findByText("暂时无法记录，请稍后再试");
    expect(document.body.textContent).not.toContain("SECRET");
  });

  it("releases a rejected visitor operation and refreshes instead of leaving a permanent pending retry", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => init?.method === "POST"
      ? response({ code: "visitor_required", message: "Visitor required" }, 403)
      : response(snapshot())));
    render(<ProjectVisitCounter projectId="HJ-007" />);
    fireEvent.click(await screen.findByRole("button", { name: "禾来过，累计 12 次" }));
    await screen.findByText("暂时无法记录，请稍后再试");
    await waitFor(() => expect((screen.getByRole("button", { name: "禾来过，累计 12 次" }) as HTMLButtonElement).disabled).toBe(false));
    expect(localStorage.getItem("heji:pending-visit:HJ-007")).toBeNull();
    expect(vi.mocked(fetch).mock.calls.at(-1)![1]?.method).toBe("GET");
  });

  it("requests verification only when challenged and resubmits the same operation with its token", async () => {
    const posts: Payload[] = [];
    let options: Record<string, unknown> | undefined;
    const remove = vi.fn();
    vi.stubGlobal("turnstile", { render: vi.fn((_element, value) => { options = value; return "test-widget"; }), remove });
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method !== "POST") return response(snapshot());
      const body: Payload = JSON.parse(String(init.body)); posts.push(body);
      if (!body.turnstileToken) return response({ code: "challenge_required", turnstileSiteKey: "test-site" }, 428);
      return response(snapshot({ count: 13, revision: 1, recordedToday: true,
        operation: { requestId: body.requestId, action: "record", outcome: "recorded" } }));
    }));
    render(<ProjectVisitCounter projectId="HJ-006" />);
    fireEvent.click(await screen.findByRole("button", { name: "禾来过，累计 12 次" }));
    await waitFor(() => expect(options?.size).toBe("compact"));
    expect(options!.action).toBe("heji_visit");
    expect(options!.cData).toBe(posts[0].requestId);
    await act(async () => (options!.callback as (token: string) => void)("verified-token"));
    await screen.findByRole("button", { name: "今天已记录，累计 13 次" });
    expect(posts).toHaveLength(2);
    expect(posts[1].requestId).toBe(posts[0].requestId);
    expect(posts[1].turnstileToken).toBe("verified-token");
    expect(remove).toHaveBeenCalledWith("test-widget");
  });
});
