import { Image } from "expo-image";
import { feedback } from "../lib/haptics";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigation } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import LoopCarousel from "./loop-carousel";
import type { Media } from "../lib/types";
import { mediaName } from "../lib/artwork-presentation";
import { BatikVideo } from "./video";
import ArtworkViewer from "./artwork-viewer";
import { Glass, Icon, usePalette } from "./ui";

export type MediaPagerProps = {
  media: Media[];
  selected: string;
  onSelect: (id: string) => void;
  onError?: () => void;
  children?: ReactNode;
};

export default function MediaGallery({
  media,
  selected,
  onSelect,
  onError,
  children,
}: MediaPagerProps) {
  const window = useWindowDimensions();
  const [width, setWidth] = useState(window.width);
  const height = Math.min(width, window.height * 0.52, 580);
  const stageHeight = height + (media.length > 1 ? 60 : 0);
  const p = usePalette();
  const navigation = useNavigation();
  const [viewing, setViewing] = useState<Media | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);
  useEffect(
    () => navigation.addListener("blur", () => setViewing(null)),
    [navigation],
  );
  const index = Math.max(
    0,
    media.findIndex((item) => item.id === selected),
  );
  const current = media[index];
  function selectMedia(id: string) {
    if (id === selected) return;
    feedback();
    onSelect(id);
  }
  function fail(id: string) {
    setFailed((value) => (value.includes(id) ? value : [...value, id]));
    onError?.();
  }
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View style={{ position: "relative", backgroundColor: "#11110f" }}>
        <LoopCarousel
          items={media}
          initialWidth={width}
          slideHeight={stageHeight}
          selectedId={selected}
          onSelect={onSelect}
          autoplay={!viewing && current?.kind !== "video"}
          label={(item, i) =>
            `Media ${i + 1} dari ${media.length}: ${mediaName(item)}`
          }
          renderSlide={(item, _index, slideWidth, active) => (
            <View
              style={{
                width: slideWidth,
                height: stageHeight,
                backgroundColor: "#11110f",
              }}
            >
              {failed.includes(item.id) ? (
                <View style={[styles.mediaError, { height }]}>
                  <Icon name="image-outline" size={30} color={p.soft} />
                  <Text style={{ color: p.ink, fontSize: 16 }}>
                    Gambar belum bisa ditampilkan.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Muat ulang ${mediaName(item)}`}
                    onPress={() => {
                      feedback();
                      setFailed((value) =>
                        value.filter((id) => id !== item.id),
                      );
                      setAttempt((value) => value + 1);
                    }}
                    style={styles.retry}
                  >
                    <Icon name="reload-outline" size={16} color={p.accent} />
                    <Text style={{ color: p.accent, fontWeight: "600" }}>
                      Coba lagi
                    </Text>
                  </Pressable>
                </View>
              ) : item.kind === "image" ? (
                <Image
                  key={`${item.id}-${attempt}`}
                  source={item.source}
                  cachePolicy="memory-disk"
                  transition={0}
                  contentFit="contain"
                  accessibilityLabel={item.label}
                  style={{ width: slideWidth, height }}
                  onError={() => fail(item.id)}
                />
              ) : active ? (
                <BatikVideo source={item.source} height={height} />
              ) : null}
            </View>
          )}
        />
        <View pointerEvents="none" style={styles.counter}>
          <Text style={styles.counterText}>
            {String(index + 1).padStart(2, "0")}{" "}
            <Text style={{ color: "#f4f1e980" }}>
              / {String(media.length).padStart(2, "0")}
            </Text>
          </Text>
        </View>
        {current?.kind === "image" && !failed.includes(current.id) && (
          <View style={styles.expand}>
            <Glass style={{ borderRadius: 22, backgroundColor: "#000000b3" }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Lihat gambar dalam layar penuh"
                onPress={() => {
                  feedback("light");
                  setViewing(current);
                }}
                style={styles.expandButton}
              >
                <Icon name="expand-outline" size={19} color={p.ink} />
              </Pressable>
            </Glass>
          </View>
        )}
      </View>
      {children}
      {media.length > 1 && (
        <View style={styles.filmstrip}>
          <View style={styles.filmstripHeading}>
            <Text style={[styles.sectionLabel, { color: p.ink }]}>
              Tampilan karya
            </Text>
            <Text style={{ color: p.soft, fontSize: 12 }}>
              {mediaName(current)}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnails}
          >
            {media.map((item, i) => {
              const active = item.id === selected;
              const image =
                item.kind === "image"
                  ? item
                  : media
                      .slice(0, i)
                      .reverse()
                      .find((entry) => entry.kind === "image");
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Tampilkan ${mediaName(item)}`}
                  accessibilityState={{ selected: active }}
                  onPress={() => selectMedia(item.id)}
                  style={({ pressed }) => ({
                    gap: 8,
                    width: 78,
                    opacity: pressed ? 0.65 : 1,
                  })}
                >
                  <View
                    style={[
                      styles.thumbnailFrame,
                      { borderColor: active ? p.accent : "#272622" },
                    ]}
                  >
                    <View style={styles.thumbnailImage}>
                      {image && (
                        <Image
                          source={image.source}
                          contentFit="cover"
                          style={{ width: "100%", height: "100%" }}
                        />
                      )}
                      {item.kind === "video" && (
                        <View style={styles.play}>
                          <Icon name="play" color="#ffffff" size={21} />
                        </View>
                      )}
                    </View>
                  </View>
                  <Text
                    numberOfLines={2}
                    style={{
                      color: active ? p.ink : p.soft,
                      fontSize: 11,
                      lineHeight: 15,
                      fontWeight: active ? "600" : "400",
                    }}
                  >
                    {mediaName(item)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
      <ArtworkViewer media={viewing} onClose={() => setViewing(null)} />
    </View>
  );
}
const styles = StyleSheet.create({
  counter: {
    zIndex: 2,
    position: "absolute",
    top: 18,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "#000000b3",
  },
  counterText: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "600",
    color: "#f4f1e9",
    fontVariant: ["tabular-nums"],
  },
  expand: { position: "absolute", top: 12, right: 18, zIndex: 2 },
  expandButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  filmstrip: { paddingBottom: 28 },
  filmstripHeading: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 14,
    gap: 12,
  },
  sectionLabel: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  thumbnails: { paddingHorizontal: 24, gap: 12 },
  thumbnailFrame: {
    height: 88,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 3,
  },
  thumbnailImage: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#161613",
  },
  play: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000b3",
  },
  mediaError: {
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 24,
  },
  retry: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: 16,
  },
});
