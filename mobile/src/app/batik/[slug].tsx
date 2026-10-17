import { useDetailHeaderAction } from "../../components/tab-chrome";
import { Stack, useIsPreview, useLocalSearchParams } from "expo-router";
import { feedback } from "../../lib/haptics";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import {
  Copy,
  IconButton,
  Screen,
  Status,
  usePalette,
} from "../../components/ui";
import BatikInfo from "../../components/batik-info";
import MediaPager from "../../components/media-pager";
import { shareMedia } from "../../lib/share";
import type { Batik, Media } from "../../lib/types";
import { useCatalog, useSaved, useLikes } from "../../state/app";

export default function Detail() {
  const isPreview = useIsPreview();
  const p = usePalette();
  const params = useLocalSearchParams<{ slug: string; media?: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const initialMedia = Array.isArray(params.media)
    ? params.media[0]
    : params.media;
  const { catalog, settings } = useCatalog();
  const { saved: savedItems, toggleSave } = useSaved();
  const { liked: likedIds, toggleLike } = useLikes();
  const [record, setItem] = useState<Batik | null>(
    () =>
      catalog.peek?.(slug ?? "") ??
      savedItems.find((value) => value.slug === slug) ??
      null,
  );
  const item = record?.slug === slug ? record : null;
  const [selected, setSelected] = useState(initialMedia ?? "motif");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [sharing, setSharing] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        const cached = catalog.peek?.(slug ?? "");
        setLoading(!cached);
        setError(null);
        if (cached) setItem(cached);
        setSelected(initialMedia ?? "motif");
      }
    });
    catalog
      .detail(slug ?? "", controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setItem(value);
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(reason.message ?? "Motif tidak tersedia.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [catalog, slug, revision, initialMedia]);
  const media =
    item?.media.find((value) => value.id === selected) ?? item?.media[0];
  const saved = savedItems.some((value) => value.id === item?.id);
  useDetailHeaderAction(
    {
      primary: () => {
        if (media) void share(media);
      },
      secondary: () => {
        if (item) toggleSave(item);
      },
    },
    { saved, disabled: sharing || !media, loading: loading && !item },
    !isPreview,
  );
  const liked = !!item && likedIds.includes(item.id);
  async function share(selection: Media) {
    if (sharing) return;
    feedback("light");
    setSharing(true);
    try {
      await shareMedia(selection, item!.title);
    } catch (reason) {
      feedback("error");
      Alert.alert(
        "Belum bisa berbagi",
        reason instanceof Error ? reason.message : "Media gagal diunduh.",
      );
    } finally {
      setSharing(false);
    }
  }
  return (
    <Screen top={false}>
      {!isPreview && (
        <Stack.Screen
          options={{
            title: "Detail karya",
            headerTintColor: p.ink,
          }}
        />
      )}
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustsScrollIndicatorInsets
        contentContainerStyle={{ paddingBottom: 36, gap: 26 }}
      >
        {error || !item ? (
          <Status
            loading={loading}
            error={error}
            empty="Motif tidak ditemukan."
            retry={() => setRevision((value) => value + 1)}
          />
        ) : (
          <>
            {media ? (
              <MediaPager
                key={item.id}
                media={item.media}
                selected={media.id}
                onSelect={setSelected}
                onError={() =>
                  setError(
                    "Gambar gagal dimuat. Periksa koneksi lalu coba lagi.",
                  )
                }
              />
            ) : (
              <Status empty="Media belum tersedia." />
            )}
            <View style={{ paddingHorizontal: 20, gap: 26 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View style={{ flex: 1, gap: 8 }}>
                  <Copy
                    style={{ color: p.accent, fontSize: 13, fontWeight: "600" }}
                  >
                    {item.style}
                  </Copy>
                  <Text
                    accessibilityRole="header"
                    style={{
                      color: p.ink,
                      fontSize: 30,
                      lineHeight: 35,
                      fontWeight: "700",
                      letterSpacing: -0.8,
                    }}
                  >
                    {item.title}
                  </Text>
                </View>
                <View style={{ borderRadius: 28, backgroundColor: p.raised }}>
                  <IconButton
                    name={liked ? "heart" : "heart-outline"}
                    label={liked ? "Batal sukai" : "Sukai motif"}
                    selected={liked}
                    onPress={() => toggleLike(item.id)}
                  />
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: p.line }} />
              <BatikInfo item={item} />
              {settings.mode === "demo" && (
                <Copy muted style={{ fontSize: 12 }}>
                  Koleksi demo · tersimpan di perangkat ini.
                </Copy>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
