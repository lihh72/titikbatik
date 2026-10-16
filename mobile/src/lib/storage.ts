import type { Preferences, Settings } from "./types";
export const settingsKey = "titikbatik:mobile:settings:v1";
export const preferenceKey = (settings: Settings) =>
  `titikbatik:mobile:v1:${settings.mode === "demo" ? "demo" : `backend:${settings.baseUrl.replace(/\/+$/, "")}`}`;
export function emptyPreferences(): Preferences {
  return { liked: [], saved: [], messages: [] };
}
export function parsePreferences(raw: string | null): Preferences {
  if (!raw) return emptyPreferences();
  try {
    const value = JSON.parse(raw);
    return {
      liked: Array.isArray(value.liked)
        ? value.liked.filter((id: unknown) => typeof id === "string")
        : [],
      saved: Array.isArray(value.saved)
        ? value.saved.filter(
            (item: any) =>
              typeof item?.slug === "string" &&
              typeof item?.id === "string" &&
              typeof item?.title === "string" &&
              Array.isArray(item?.media),
          )
        : [],
      messages: Array.isArray(value.messages)
        ? value.messages.filter(
            (item: any) =>
              ["user", "assistant"].includes(item?.role) &&
              typeof item?.id === "string" &&
              typeof item?.content === "string",
          )
        : [],
    };
  } catch {
    return emptyPreferences();
  }
}
