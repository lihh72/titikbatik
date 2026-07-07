// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

import { proxyBackendRequest } from "@/lib/server-backend";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  delete process.env.ADMIN_API_KEY;
  delete process.env.INTERNAL_API_URL;
});

describe("server backend proxy", () => {
  it("forwards byte-range requests and keeps partial-content response headers", async () => {
    process.env.INTERNAL_API_URL = "http://127.0.0.1:8000";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 206,
        headers: {
          "Accept-Ranges": "bytes",
          "Content-Length": "3",
          "Content-Range": "bytes 0-2/100",
          "Content-Type": "video/mp4",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyBackendRequest(
      new Request("http://localhost/api/automation/public/images/video/costume.mp4", {
        headers: { Range: "bytes=0-2" },
      }),
      "/api/v1/images/video/costume.mp4",
      false,
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(new Headers(init.headers).get("Range")).toBe("bytes=0-2");
    expect(response.status).toBe(206);
    expect(response.headers.get("Accept-Ranges")).toBe("bytes");
    expect(response.headers.get("Content-Length")).toBe("3");
    expect(response.headers.get("Content-Range")).toBe("bytes 0-2/100");
    expect(response.headers.get("Content-Type")).toBe("video/mp4");
  });
});
