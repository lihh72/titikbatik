import { proxyBackendRequest, safeBackendPath } from "@/lib/server-backend";

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: RouteContext) {
  const segments = (await context.params).path;
  const path = safeBackendPath(segments);
  if (!path || segments[0] !== "batiks") {
    return Response.json({ success: false, message: "Endpoint publik tidak tersedia.", errors: {} }, { status: 404 });
  }
  return proxyBackendRequest(request, `/api/v1/${path}`, false);
}
