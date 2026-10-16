import { Image } from "expo-image";
import { feedback } from "../lib/haptics";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { Media } from "../lib/types";
import { BatikVideo } from "./video";
import { Icon, useAccessibility, usePalette } from "./ui";

export type MediaPagerProps = {
  media: Media[];
  selected: string;
  onSelect: (id: string) => void;
  onError: () => void;
};

export default function MediaGallery({
  media,
  selected,
  onSelect,
  onError,
}: MediaPagerProps) {
  const window = useWindowDimensions();
  const [width, setWidth] = useState(window.width);
  const height = Math.min(width * 1.2, window.height * 0.58, 600);
  const p = usePalette();
  const { reducedMotion } = useAccessibility();
  const pager = useRef<ScrollView>(null);
  function selectMedia(id: string) {
    if (id === selected) return;
    feedback();
    onSelect(id);
  }
  const index = Math.max(
    0,
    media.findIndex((item) => item.id === selected),
  );
  useEffect(() => {
    pager.current?.scrollTo({ x: index * width, animated: !reducedMotion });
  }, [index, width, reducedMotion]);
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ gap: 16 }}
    >
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / width);
          if (media[next]) selectMedia(media[next].id);
        }}
        style={{ height, backgroundColor: p.paper }}
      >
        {media.map((item) => (
          <View
            key={item.id}
            style={{ width, height, backgroundColor: p.paper }}
          >
            {item.kind === "image" ? (
              <Image
                source={item.source}
                contentFit="contain"
                accessibilityLabel={item.label}
                style={{ width, height }}
                onError={onError}
              />
            ) : item.id === selected ? (
              <BatikVideo source={item.source} height={height} />
            ) : null}
          </View>
        ))}
      </ScrollView>
      <View
        style={{
          paddingHorizontal: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: p.ink, fontSize: 14, fontWeight: "600" }}>
          {media[index]?.label}
        </Text>
        <Text
          style={{ color: p.soft, fontSize: 13, fontVariant: ["tabular-nums"] }}
        >
          {index + 1} / {media.length}
        </Text>
      </View>
      {media.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
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
                accessibilityLabel={`Tampilkan ${item.label}`}
                accessibilityState={{ selected: active }}
                onPress={() => selectMedia(item.id)}
                style={({ pressed }) => ({
                  width: 60,
                  height: 72,
                  borderRadius: 13,
                  borderWidth: 2,
                  borderColor: active ? p.accent : "transparent",
                  padding: 3,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    overflow: "hidden",
                    backgroundColor: p.raised,
                  }}
                >
                  {image && (
                    <Image
                      source={image.source}
                      contentFit="cover"
                      style={{ width: "100%", height: "100%" }}
                    />
                  )}
                  {item.kind === "video" && (
                    <View
                      style={{
                        position: "absolute",
                        inset: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#00000055",
                      }}
                    >
                      <Icon name="play" color="#ffffff" size={22} />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
