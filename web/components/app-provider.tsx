"use client";

import type { GenerationResult } from "@/lib/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AppContextValue = {
  history: GenerationResult[];
  likedIds: string[];
  bookmarkedIds: string[];
  publishedIds: string[];
  addHistory: (items: GenerationResult | GenerationResult[]) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
  toggleLike: (id: string) => void;
  toggleBookmark: (id: string) => void;
  publishResult: (id: string) => void;
  unpublishResult: (id: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE = {
  history: "titikbatik-history",
  liked: "titikbatik-liked",
  bookmarked: "titikbatik-bookmarked",
  published: "titikbatik-published",
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [publishedIds, setPublishedIds] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHistory(readJson(STORAGE.history, []));
      setLikedIds(readJson(STORAGE.liked, []));
      setBookmarkedIds(readJson(STORAGE.bookmarked, []));
      setPublishedIds(readJson(STORAGE.published, []));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => { if (hydrated) window.localStorage.setItem(STORAGE.history, JSON.stringify(history)); }, [history, hydrated]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(STORAGE.liked, JSON.stringify(likedIds)); }, [likedIds, hydrated]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(STORAGE.bookmarked, JSON.stringify(bookmarkedIds)); }, [bookmarkedIds, hydrated]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(STORAGE.published, JSON.stringify(publishedIds)); }, [publishedIds, hydrated]);

  const value = useMemo<AppContextValue>(() => ({
    history,
    likedIds,
    bookmarkedIds,
    publishedIds,
    addHistory: (items) => { const nextItems = Array.isArray(items) ? items : [items]; setHistory((current) => [...nextItems, ...current].slice(0, 100)); },
    removeHistory: (id) => { setHistory((current) => current.filter((item) => item.id !== id)); setPublishedIds((current) => current.filter((item) => item !== id)); },
    clearHistory: () => { setHistory([]); setPublishedIds([]); },
    toggleLike: (id) => setLikedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]),
    toggleBookmark: (id) => setBookmarkedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]),
    publishResult: (id) => setPublishedIds((current) => current.includes(id) ? current : [...current, id]),
    unpublishResult: (id) => setPublishedIds((current) => current.filter((item) => item !== id)),
  }), [history, likedIds, bookmarkedIds, publishedIds]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
