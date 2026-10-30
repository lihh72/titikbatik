import { useDetailHeaderAction } from "../../components/tab-chrome";
import { Stack, useIsPreview, useLocalSearchParams } from "expo-router";
import { feedback } from "../../lib/haptics";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Copy, Screen, Status, usePalette } from "../../components/ui";
import ArtworkIdentity from "../../components/artwork-identity";
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
    { saved, disabled: sharing || !media, loading: !item },
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
  const identity = item ? (
    <ArtworkIdentity
      item={item}
      saved={saved}
      liked={liked}
      onSave={() => toggleSave(item)}
      onLike={() => toggleLike(item.id)}
    />
  ) : null;
  return (
    <Screen top={false}>
      {!isPreview && (
        <Stack.Screen
          options={{ title: "Detail karya", headerTintColor: p.ink }}
        />
      )}
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustsScrollIndicatorInsets
        contentContainerStyle={{ paddingBottom: 42 }}
      >
        {!item ? (
          loading ? (
            <DetailSkeleton />
          ) : (
            <Status
              error={error}
              empty="Motif tidak ditemukan."
              retry={() => setRevision((value) => value + 1)}
            />
          )
        ) : (
          <>
            {media ? (
              <MediaPager
                key={item.id}
                media={item.media}
                selected={media.id}
                onSelect={setSelected}
              >
                {identity}
              </MediaPager>
            ) : (
              <>
                <Status empty="Media belum tersedia." />
                {identity}
              </>
            )}
            <View style={{ paddingHorizontal: 24 }}>
              {error && (
                <View style={detailStyles.error}>
                  <Copy style={{ color: p.accent, fontSize: 13 }}>{error}</Copy>
                  <Text
                    accessibilityRole="button"
                    onPress={() => {
                      feedback();
                      setRevision((value) => value + 1);
                    }}
                    style={{
                      color: p.ink,
                      fontSize: 13,
                      paddingVertical: 12,
                      fontWeight: "600",
                    }}
                  >
                    Coba lagi
                  </Text>
                </View>
              )}
              <BatikInfo item={item} />
              {settings.mode === "demo" && (
                <View style={detailStyles.demo}>
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      marginTop: 7,
                      backgroundColor: p.accent,
                    }}
                  />
                  <Copy muted style={{ fontSize: 11, lineHeight: 18, flex: 1 }}>
                    Koleksi demo · tersimpan di perangkat ini. Tanggal
                    penciptaan bersifat ilustratif.
                  </Copy>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function DetailSkeleton() {
  return (
    <View
      accessibilityLabel="Memuat karya"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
    >
      <View
        style={{
          width: "100%",
          aspectRatio: 0.93,
          maxHeight: 480,
          backgroundColor: "#141411",
        }}
      />
      <View style={{ padding: 24, gap: 17 }}>
        <View
          style={{
            width: 90,
            height: 10,
            borderRadius: 3,
            backgroundColor: "#30231e",
          }}
        />
        <View
          style={{
            width: "76%",
            height: 38,
            borderRadius: 5,
            backgroundColor: "#1b1b18",
          }}
        />
        <View
          style={{
            width: "48%",
            height: 12,
            borderRadius: 3,
            backgroundColor: "#171714",
          }}
        />
        <View
          style={{
            width: "100%",
            height: 52,
            borderRadius: 26,
            marginTop: 12,
            backgroundColor: "#24231e",
          }}
        />
      </View>
    </View>
  );
}
const detailStyles = StyleSheet.create({
  error: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#2c1e19",
    marginBottom: 24,
  },
  demo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#292822",
  },
});
