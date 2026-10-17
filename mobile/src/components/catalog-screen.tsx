import { useHeaderScroll } from "./header-scroll";
import { useEffect, useMemo, useRef, useState } from "react";
import { feedback } from "../lib/haptics";
import { Platform, RefreshControl, View } from "react-native";
import { BatikCard, Copy, Status, useAccessibility, usePalette } from "./ui";
import CatalogChrome from "./catalog-chrome";
import CatalogWordmark from "./catalog-wordmark";
import CatalogTile from "./catalog-tile";
import CatalogCarousel from "./catalog-carousel";
import CatalogCategories from "./catalog-categories";
import CostumeCollection from "./costume-collection";
import type { Batik, Catalog } from "../lib/types";
import { useApp } from "../state/app";
import { SafeAreaView } from "react-native-screens/experimental";
import { catalogRows } from "../lib/catalog-rows";
import { categoryCatalog } from "../lib/catalog-filter";
import { useTabChrome } from "./tab-chrome";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

export default function CatalogScreen() {
  const p = usePalette();
  const { height: headerHeight, catalogScroll } = useTabChrome();
  const headerScroll = useHeaderScroll(undefined, catalogScroll);
  const { reducedMotion } = useAccessibility();
  const transition = reducedMotion ? undefined : LinearTransition.duration(280);
  const { catalog, settings } = useApp();
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [category, setCategory] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [discovery, setDiscovery] = useState<{
    source: Catalog;
    items: Batik[];
  } | null>(null);
  const [detailed, setDetailed] = useState(true);
  const columns = detailed ? 2 : 3;
  const [items, setItems] = useState<Batik[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const refreshStarted = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const filteredCatalog = useMemo(() => {
    // Refresh also invalidates the cached intersection of search and category.
    void revision;
    return categoryCatalog(catalog, activeCategory);
  }, [catalog, activeCategory, revision]);
  const busyRef = useRef(true);
  const loadedSource = useRef<{ catalog: Catalog; query: string } | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveQuery(query.trim());
      setActiveCategory(category);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, category]);
  useEffect(() => {
    const controller = new AbortController();
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    busyRef.current = true;
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setLoading(true);
        setError(null);
        if (page === 1 && loadedSource.current?.catalog !== catalog)
          setItems([]);
      }
    });
    filteredCatalog
      .list(activeQuery, page, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (page === 1) loadedSource.current = { catalog, query: activeQuery };
        if (!activeQuery && !activeCategory && page === 1)
          setDiscovery({ source: catalog, items: result.items });
        setItems((current) =>
          page === 1
            ? result.items
            : [
                ...current,
                ...result.items.filter(
                  (item) => !current.some((value) => value.id === item.id),
                ),
              ],
        );
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(reason.message ?? "Koleksi tidak dapat dimuat.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          busyRef.current = false;
          setLoading(false);
          if (refreshStarted.current !== null) {
            // Give UIKit time to show its active rotation even for instant demo results.
            const remaining = Math.max(
              0,
              600 - (Date.now() - refreshStarted.current),
            );
            refreshTimer = setTimeout(() => {
              refreshStarted.current = null;
              setRefreshing(false);
            }, remaining);
          }
        }
      });
    return () => {
      controller.abort();
      clearTimeout(refreshTimer);
    };
  }, [catalog, filteredCatalog, activeQuery, activeCategory, page, revision]);
  function refresh() {
    if (refreshStarted.current !== null) return;
    refreshStarted.current = Date.now();
    setRefreshing(true);
    busyRef.current = true;
    feedback("light");
    setPage(1);
    setRevision((value) => value + 1);
  }
  function loadNext() {
    if (refreshing || busyRef.current || error || page >= totalPages) return;
    busyRef.current = true;
    setPage((value) => value + 1);
  }
  const rows = catalogRows(items, columns);
  const discoveryItems = discovery?.source === catalog ? discovery.items : [];
  const featured =
    discoveryItems.find(
      (item) =>
        item.media.some((media) => media.kind === "video") &&
        item.media.filter((media) => media.kind === "image").length > 1,
    ) ??
    discoveryItems.find(
      (item) => item.media.filter((media) => media.kind === "image").length > 1,
    ) ??
    discoveryItems[0];
  const chromeProps = {
    query,
    onQueryChange: setQuery,
    detailed,
    onDetailedChange: setDetailed,
  };
  return (
    <SafeAreaView
      edges={{ top: false, bottom: false, left: true, right: true }}
      style={{ flex: 1, backgroundColor: p.paper }}
    >
      <Animated.FlatList
        showsVerticalScrollIndicator={false}
        onScroll={headerScroll.onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1, backgroundColor: p.paper }}
        contentInsetAdjustmentBehavior={
          Platform.OS === "ios" ? "automatic" : "never"
        }
        automaticallyAdjustsScrollIndicatorInsets
        itemLayoutAnimation={transition}
        data={rows}
        keyExtractor={(_, index) => `row-${index}`}
        contentContainerStyle={{
          gap: 22,
          paddingBottom: 20,
          paddingTop: Platform.OS === "ios" ? 12 : headerHeight + 64,
        }}
        ListHeaderComponent={
          <Animated.View layout={transition} style={{ gap: 24 }}>
            {!activeQuery && !activeCategory && (
              <Animated.View
                entering={reducedMotion ? undefined : FadeIn.duration(220)}
                exiting={reducedMotion ? undefined : FadeOut.duration(160)}
              >
                <CatalogCarousel
                  key={discoveryItems.map((item) => item.id).join("|")}
                  items={
                    featured
                      ? [
                          featured,
                          ...discoveryItems.filter(
                            (item) =>
                              item.id !== featured.id &&
                              item.media.some(
                                (media) => media.kind === "image",
                              ),
                          ),
                        ].slice(0, 3)
                      : []
                  }
                />
              </Animated.View>
            )}
            <CatalogCategories
              items={discoveryItems}
              selected={category}
              onSelect={setCategory}
            />
            {items.length > 0 && (
              <View
                style={{
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Copy
                  accessibilityRole="header"
                  style={{
                    fontSize: 21,
                    fontWeight: "700",
                    letterSpacing: -0.5,
                  }}
                >
                  {query.trim()
                    ? "Hasil pencarian"
                    : category || "Koleksi motif"}
                </Copy>
                <Copy muted style={{ fontSize: 13 }}>
                  {total} motif
                </Copy>
              </View>
            )}
          </Animated.View>
        }
        renderItem={({ item: row }) => (
          <Animated.View
            layout={transition}
            style={{
              flexDirection: "row",
              gap: detailed ? 12 : 8,
              paddingHorizontal: 16,
            }}
          >
            {row.map((item, index) => (
              <Animated.View
                layout={transition}
                entering={reducedMotion ? undefined : FadeIn.duration(220)}
                exiting={reducedMotion ? undefined : FadeOut.duration(160)}
                key={item?.id ?? `space-${index}`}
                style={{ flex: 1 }}
              >
                {item &&
                  (detailed ? (
                    <BatikCard item={item} />
                  ) : (
                    <CatalogTile item={item} />
                  ))}
              </Animated.View>
            ))}
          </Animated.View>
        )}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={p.soft}
            progressViewOffset={Platform.OS === "ios" ? 24 : 0}
          />
        }
        onEndReached={loadNext}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          loading ? (
            <View
              accessibilityLabel="Memuat motif"
              accessibilityState={{ busy: true }}
              style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}
            >
              {Array.from({ length: columns }, (_, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    aspectRatio: 0.82,
                    borderRadius: 19,
                    backgroundColor: p.raised,
                  }}
                />
              ))}
            </View>
          ) : (
            <Status
              error={error}
              empty="Tidak ada motif yang cocok."
              retry={() => setRevision((value) => value + 1)}
            />
          )
        }
        ListFooterComponent={
          items.length > 0 ? (
            <View
              style={{
                paddingTop: 22,
                paddingHorizontal: 0,
                paddingBottom: 16,
                gap: 4,
              }}
            >
              {!activeQuery && !activeCategory && (
                <CostumeCollection items={discoveryItems} />
              )}
              {loading && <Status loading />}
              {error ? (
                <Status
                  error={error}
                  retry={() => setRevision((value) => value + 1)}
                />
              ) : (
                <>
                  <Copy style={{ textAlign: "center", fontSize: 15 }}>
                    {total} motif
                    {activeQuery || activeCategory ? " ditemukan" : ""}
                  </Copy>
                  <Copy muted style={{ textAlign: "center", fontSize: 12 }}>
                    {settings.mode === "demo"
                      ? "Demo offline"
                      : "Koleksi TitikBatik"}
                    {page < totalPages
                      ? " · Gulir untuk memuat berikutnya"
                      : ""}
                  </Copy>
                </>
              )}
            </View>
          ) : null
        }
      />
      <CatalogChrome {...chromeProps} />
      {Platform.OS === "ios" && <CatalogWordmark />}
    </SafeAreaView>
  );
}
