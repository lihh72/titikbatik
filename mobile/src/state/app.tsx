import AsyncStorage from "@react-native-async-storage/async-storage";
import { feedback } from "../lib/haptics";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { ActivityIndicator, View } from "react-native";
import { backendCatalog, validateBaseUrl } from "../lib/api";
import { withCatalogCache } from "../lib/catalog-cache";
import { demoBatiks, demoCatalog } from "../lib/demo";
import {
  emptyPreferences,
  parsePreferences,
  preferenceKey,
  settingsKey,
} from "../lib/storage";
import type { Batik, Catalog, Preferences, Settings } from "../lib/types";

type AppState = {
  settings: Settings;
  changeSettings: (next: Settings) => Promise<void>;
  catalog: Catalog;
  preferences: Preferences;
  setPreferences: Dispatch<SetStateAction<Preferences>>;
  toggleLike: (id: string) => void;
  toggleSave: (item: Batik) => void;
  storageError: string | null;
};
const Context = createContext<AppState | null>(null);
const initialSettings: Settings = {
  mode: "demo",
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
};
const writes = new Map<string, Promise<void>>();
function persist(key: string, value: string) {
  const task = (writes.get(key) ?? Promise.resolve())
    .catch(() => {})
    .then(() => AsyncStorage.setItem(key, value));
  writes.set(key, task);
  return task;
}
function Loading() {
  return (
    <View
      style={{ flex: 1, backgroundColor: "#000000", justifyContent: "center" }}
    >
      <ActivityIndicator
        color="#f7f7f8"
        accessibilityLabel="Memuat TitikBatik"
      />
    </View>
  );
}
export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(settingsKey)
      .then((raw) => {
        let next = initialSettings;
        try {
          const value = raw ? JSON.parse(raw) : null;
          if (
            value &&
            ["demo", "backend"].includes(value.mode) &&
            typeof value.baseUrl === "string"
          ) {
            next = {
              mode: value.mode,
              baseUrl: value.baseUrl ? validateBaseUrl(value.baseUrl) : "",
            };
            if (next.mode === "backend" && !next.baseUrl)
              next = initialSettings;
          }
        } catch {
          /* Invalid stored settings return to demo. */
        }
        if (active) setSettings(next);
      })
      .catch(() => {
        if (active) setSettings(initialSettings);
      });
    return () => {
      active = false;
    };
  }, []);
  if (!settings) return <Loading />;
  async function changeSettings(next: Settings) {
    const normalized = {
      ...next,
      baseUrl: next.baseUrl ? validateBaseUrl(next.baseUrl) : "",
    };
    if (next.mode === "backend" && !normalized.baseUrl)
      throw new Error("Isi alamat server terlebih dahulu.");
    await persist(settingsKey, JSON.stringify(normalized));
    setSettings(normalized);
  }
  return (
    <ScopedProvider
      key={preferenceKey(settings)}
      settings={settings}
      changeSettings={changeSettings}
    >
      {children}
    </ScopedProvider>
  );
}
function ScopedProvider({
  settings,
  changeSettings,
  children,
}: {
  settings: Settings;
  changeSettings: AppState["changeSettings"];
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState(emptyPreferences);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const key = preferenceKey(settings);
  useEffect(() => {
    let active = true;
    (writes.get(key) ?? Promise.resolve())
      .catch(() => {})
      .then(() => AsyncStorage.getItem(key))
      .then((raw) => {
        if (active) {
          const parsed = parsePreferences(raw);
          // Metro asset numbers can change between bundles: refresh demo references by slug.
          if (settings.mode === "demo")
            parsed.saved = parsed.saved.flatMap((saved) =>
              demoBatiks.filter((item) => item.slug === saved.slug),
            );
          setPreferences(parsed);
        }
      })
      .catch(() => {
        if (active) setStorageError("Penyimpanan lokal tidak dapat dibaca.");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [key, settings.mode]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    persist(key, JSON.stringify(preferences)).catch(() => {
      if (active) setStorageError("Perubahan belum tersimpan di perangkat.");
    });
    return () => {
      active = false;
    };
  }, [key, preferences, ready]);
  const catalog = useMemo(
    () =>
      settings.mode === "demo"
        ? withCatalogCache(demoCatalog, demoBatiks)
        : withCatalogCache(backendCatalog(settings.baseUrl)),
    [settings.mode, settings.baseUrl],
  );
  const value: AppState = {
    settings,
    changeSettings,
    preferences,
    setPreferences,
    catalog,
    storageError,
    toggleLike(id) {
      feedback("light");
      setPreferences((current) => ({
        ...current,
        liked: current.liked.includes(id)
          ? current.liked.filter((value) => value !== id)
          : [...current.liked, id],
      }));
    },
    toggleSave(item) {
      feedback("light");
      setPreferences((current) => ({
        ...current,
        saved: current.saved.some((value) => value.id === item.id)
          ? current.saved.filter((value) => value.id !== item.id)
          : [...current.saved, item],
      }));
    },
  };
  if (!ready) return <Loading />;
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("AppProvider diperlukan.");
  return value;
}
