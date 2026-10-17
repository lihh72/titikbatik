import { memo } from "react";
import { Image } from "expo-image";
import { Text, View } from "react-native";
import type { Batik } from "../lib/types";
import { Icon, usePalette } from "./ui";

function CatalogTileContent({ item, saved }: { item: Batik; saved: boolean }) {
  const p = usePalette();
  const preview = item.media.find((media) => media.kind === "image");
  const video = item.media.some((media) => media.kind === "video");
  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          aspectRatio: 0.94,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: p.tint,
        }}
      >
        {preview && (
          <Image
            source={preview.source}
            contentFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        )}
        {(saved || video) && (
          <View
            style={{
              position: "absolute",
              right: 6,
              bottom: 6,
              flexDirection: "row",
              gap: 5,
              padding: 5,
              borderRadius: 8,
              backgroundColor: "#18201ccc",
            }}
          >
            {saved && <Icon name="bookmark" color="#f4f1e9" size={13} />}
            {video && <Icon name="videocam" color="#f4f1e9" size={14} />}
          </View>
        )}
      </View>
      <Text
        numberOfLines={2}
        style={{
          color: p.ink,
          fontSize: 13,
          lineHeight: 18,
          fontWeight: "600",
          letterSpacing: -0.2,
        }}
      >
        {item.title}
      </Text>
    </View>
  );
}

export default memo(CatalogTileContent);
