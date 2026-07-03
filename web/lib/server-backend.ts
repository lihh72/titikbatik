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
  if (contentType) headers.set("Content-Type", contentType);
  if (accept) headers.set("Accept", accept);
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
    if (responseContentType) responseHeaders.set("Content-Type", responseContentType);
    if (disposition) responseHeaders.set("Content-Disposition", disposition);
    return new Response(await response.arrayBuffer(), {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return proxyError("Server automation tidak dapat dihubungi.", 503);
  }
}
