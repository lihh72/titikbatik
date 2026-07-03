// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasAdminSession: vi.fn(),
}));

vi.mock("@/lib/server-auth", () => ({
  hasAdminSession: mocks.hasAdminSession,
}));

import { GET, POST } from "./route";

const context = (path: string[]) => ({ params: Promise.resolve({ path }) });

describe("automation admin proxy", () => {
  beforeEach(() => {
    process.env.INTERNAL_API_URL = "http://127.0.0.1:8000";
    process.env.ADMIN_API_KEY = "secret";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("rejects requests without an admin session", async () => {
    mocks.hasAdminSession.mockResolvedValue(false);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(new Request("http://localhost/api/automation/admin/dashboard"), context(["dashboard"]));

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards the admin key only in the server request", async () => {
    mocks.hasAdminSession.mockResolvedValue(true);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: "ok", data: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(new Request("http://localhost/api/automation/admin/dashboard"), context(["dashboard"]));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(response.status).toBe(200);
    expect(url).toBe("http://127.0.0.1:8000/api/admin/dashboard");
    expect(new Headers(init.headers).get("X-Admin-Key")).toBe("secret");
    expect(await response.text()).not.toContain("secret");
  });

  it("forwards request content and query parameters", async () => {
    mocks.hasAdminSession.mockResolvedValue(true);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: "saved", data: {} }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request("http://localhost/api/automation/admin/wordlist-items?category_id=2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: "kawung" }),
    });

    await POST(request, context(["wordlist-items"]));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe("http://127.0.0.1:8000/api/admin/wordlist-items?category_id=2");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe('{"value":"kawung"}');
  });
});
