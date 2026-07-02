export function backendUrl(path: string) {
  const base = (process.env.INTERNAL_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function adminBackendHeaders(extra?: HeadersInit): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.ADMIN_API_TOKEN ?? "dev-titikbatik-api-token-change-me"}`,
    ...extra,
  };
}
