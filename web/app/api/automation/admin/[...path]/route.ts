import { hasAdminSession } from "@/lib/server-auth";
import { proxyBackendRequest, safeBackendPath } from "@/lib/server-backend";

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: RouteContext) {
  if (!(await hasAdminSession())) {
    return Response.json({ success: false, message: "Sesi admin diperlukan.", errors: {} }, { status: 401 });
  }
  const path = safeBackendPath((await context.params).path);
  if (!path) {
    return Response.json({ success: false, message: "Path API tidak valid.", errors: {} }, { status: 400 });
  }
  return proxyBackendRequest(request, `/api/admin/${path}`, true);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
