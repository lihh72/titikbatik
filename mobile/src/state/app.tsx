import AsyncStorage from "@react-native-async-storage/async-storage";
import { feedback } from "../lib/haptics";
import {
  createContext,
  useCallback,
  useRef,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  ActivityIndicator,
  AppState as NativeAppState,
  View,
} from "react-native";
import { backendCatalog, validateBaseUrl } from "../lib/api";
import { PreferenceWriter } from "../lib/preference-writer";
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
type CatalogState = Pick<
  AppState,
  "settings" | "changeSettings" | "catalog" | "storageError"
>;
type SavedState = { saved: Batik[]; toggleSave: AppState["toggleSave"] };
type LikesState = { liked: string[]; toggleLike: AppState["toggleLike"] };
type ChatState = {
  messages: Preferences["messages"];
  setPreferences: AppState["setPreferences"];
};
const CatalogContext = createContext<CatalogState | null>(null);
const SavedContext = createContext<SavedState | null>(null);
const LikesContext = createContext<LikesState | null>(null);
const ChatContext = createContext<ChatState | null>(null);
const preferenceWrites = new PreferenceWriter((key, value) =>
  AsyncStorage.setItem(key, value),
);
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
  const changeSettings = useCallback(async (next: Settings) => {
    const normalized = {
      ...next,
      baseUrl: next.baseUrl ? validateBaseUrl(next.baseUrl) : "",
    };
    if (next.mode === "backend" && !normalized.baseUrl)
      throw new Error("Isi alamat server terlebih dahulu.");
    await persist(settingsKey, JSON.stringify(normalized));
    setSettings(normalized);
  }, []);
  if (!settings) return <Loading />;
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
    preferenceWrites
      .flush(key)
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
  const lastPersisted = useRef<Preferences | null>(null);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    const previous = lastPersisted.current;
    const immediate =
      !previous ||
      previous.saved !== preferences.saved ||
      previous.liked !== preferences.liked;
    lastPersisted.current = preferences;
    preferenceWrites.schedule(
      key,
      () => JSON.stringify(preferences),
      () => {
        if (active) setStorageError("Perubahan belum tersimpan di perangkat.");
      },
      immediate,
    );
    return () => {
      active = false;
    };
  }, [key, preferences, ready]);
  useEffect(() => {
    const subscription = NativeAppState.addEventListener("change", (state) => {
      if (state !== "active") void preferenceWrites.flush(key);
    });
    return () => {
      subscription.remove();
      void preferenceWrites.flush(key);
    };
  }, [key]);
  const catalog = useMemo(
    () =>
      settings.mode === "demo"
        ? withCatalogCache(demoCatalog, demoBatiks)
        : withCatalogCache(backendCatalog(settings.baseUrl)),
    [settings.mode, settings.baseUrl],
  );
  const toggleLike = useCallback((id: string) => {
    feedback("light");
    setPreferences((current) => ({
      ...current,
      liked: current.liked.includes(id)
        ? current.liked.filter((value) => value !== id)
        : [...current.liked, id],
    }));
  }, []);
  const toggleSave = useCallback((item: Batik) => {
    feedback("light");
    setPreferences((current) => ({
      ...current,
      saved: current.saved.some((value) => value.id === item.id)
        ? current.saved.filter((value) => value.id !== item.id)
        : [...current.saved, item],
    }));
  }, []);
  const catalogValue = useMemo(
    () => ({ settings, changeSettings, catalog, storageError }),
    [settings, changeSettings, catalog, storageError],
  );
  const savedValue = useMemo(
    () => ({ saved: preferences.saved, toggleSave }),
    [preferences.saved, toggleSave],
  );
  const likesValue = useMemo(
    () => ({ liked: preferences.liked, toggleLike }),
    [preferences.liked, toggleLike],
  );
  const chatValue = useMemo(
    () => ({ messages: preferences.messages, setPreferences }),
    [preferences.messages],
  );
  if (!ready) return <Loading />;
  return (
    <CatalogContext.Provider value={catalogValue}>
      <SavedContext.Provider value={savedValue}>
        <LikesContext.Provider value={likesValue}>
          <ChatContext.Provider value={chatValue}>
            {children}
          </ChatContext.Provider>
        </LikesContext.Provider>
      </SavedContext.Provider>
    </CatalogContext.Provider>
  );
}
export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("AppProvider diperlukan.");
  return value;
}
export function useSaved() {
  const value = useContext(SavedContext);
  if (!value) throw new Error("AppProvider diperlukan.");
  return value;
}
export function useLikes() {
  const value = useContext(LikesContext);
  if (!value) throw new Error("AppProvider diperlukan.");
  return value;
}
export function useChat() {
  const value = useContext(ChatContext);
  if (!value) throw new Error("AppProvider diperlukan.");
  return value;
}
/** Compatibility for settings pages that display counts from several slices. */
export function useApp(): AppState {
  const catalog = useCatalog();
  const { saved, toggleSave } = useSaved();
  const { liked, toggleLike } = useLikes();
  const { messages, setPreferences } = useChat();
  return {
    ...catalog,
    preferences: { saved, liked, messages },
    setPreferences,
    toggleSave,
    toggleLike,
  };
}
