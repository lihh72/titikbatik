"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AppContextValue = {
  likedIds: string[];
  bookmarkedIds: string[];
  toggleLike: (id: string) => void;
  toggleBookmark: (id: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);
const LIKED_KEY = "titikbatik-liked";
const BOOKMARKED_KEY = "titikbatik-bookmarked";

function readIds(key: string): string[] {
  try {
    const storage = window.localStorage;
    if (!storage || typeof storage.getItem !== "function") return [];
    const value = storage.getItem(key);
    return value ? JSON.parse(value) as string[] : [];
  } catch { return []; }
}

function writeIds(key: string, value: string[]) {
  try {
    const storage = window.localStorage;
    if (storage && typeof storage.setItem === "function") storage.setItem(key, JSON.stringify(value));
  } catch { /* Preferences remain optional when storage is unavailable. */ }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLikedIds(readIds(LIKED_KEY));
      setBookmarkedIds(readIds(BOOKMARKED_KEY));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (hydrated) writeIds(LIKED_KEY, likedIds); }, [likedIds, hydrated]);
  useEffect(() => { if (hydrated) writeIds(BOOKMARKED_KEY, bookmarkedIds); }, [bookmarkedIds, hydrated]);

  const value = useMemo<AppContextValue>(() => ({
    likedIds,
    bookmarkedIds,
    toggleLike: (id) => setLikedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]),
    toggleBookmark: (id) => setBookmarkedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]),
  }), [likedIds, bookmarkedIds]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
