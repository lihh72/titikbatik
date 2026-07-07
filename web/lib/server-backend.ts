export function backendUrl(path: string) {
  const base = (process.env.INTERNAL_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function adminBackendHeaders(extra?: HeadersInit): HeadersInit {
  return {
    "X-Admin-Key": process.env.ADMIN_API_KEY ?? "",
    ...extra,
  };
}

function proxyError(message: string, status: number) {
  return Response.json({ success: false, message, errors: {} }, { status });
}

export function safeBackendPath(segments: string[]): string | null {
  if (!segments.length) return null;
  if (segments.some((segment) => !segment || segment === "." || segment === ".." || /[\\/]/.test(segment))) {
    return null;
  }
  return segments.map((segment) => encodeURIComponent(segment)).join("/");
}

export async function proxyBackendRequest(request: Request, path: string, admin: boolean): Promise<Response> {
  const adminKey = process.env.ADMIN_API_KEY;
  if (admin && !adminKey) {
    return proxyError("ADMIN_API_KEY belum dikonfigurasi pada server web.", 500);
  }

  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(backendUrl(path));
  targetUrl.search = sourceUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get("Content-Type");
  const accept = request.headers.get("Accept");
  const range = request.headers.get("Range");
  if (contentType) headers.set("Content-Type", contentType);
  if (accept) headers.set("Accept", accept);
  if (range) headers.set("Range", range);
  if (adminKey && admin) headers.set("X-Admin-Key", adminKey);

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  try {
    const response = await fetch(targetUrl.toString(), {
      method,
      headers,
      body,
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    const responseContentType = response.headers.get("Content-Type");
    const disposition = response.headers.get("Content-Disposition");
    const etag = response.headers.get("ETag");
    const lastModified = response.headers.get("Last-Modified");
    const contentLength = response.headers.get("Content-Length");
    const contentRange = response.headers.get("Content-Range");
    const acceptRanges = response.headers.get("Accept-Ranges");
    if (responseContentType) responseHeaders.set("Content-Type", responseContentType);
    if (disposition) responseHeaders.set("Content-Disposition", disposition);
    if (etag) responseHeaders.set("ETag", etag);
    if (lastModified) responseHeaders.set("Last-Modified", lastModified);
    if (contentLength) responseHeaders.set("Content-Length", contentLength);
    if (contentRange) responseHeaders.set("Content-Range", contentRange);
    if (acceptRanges) responseHeaders.set("Accept-Ranges", acceptRanges);
    if (method === "GET" && path.includes("/images/")) {
      responseHeaders.set("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800");
    }
    return new Response(await response.arrayBuffer(), {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return proxyError("Server automation tidak dapat dihubungi.", 503);
  }
}
