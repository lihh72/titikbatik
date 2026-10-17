import { memo } from "react";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import type { Batik } from "../lib/types";
import { feedback } from "../lib/haptics";
import { Copy, Icon, usePalette } from "./ui";

function CostumeCollection({ items }: { items: Batik[] }) {
  const p = usePalette();
  const costumes = items
    .flatMap((item) => {
      const image = item.media.filter((media) => media.kind === "image")[1];
      return image ? [{ item, image }] : [];
    })
    .slice(0, 5);
  if (!costumes.length) return null;
  return (
    <View style={{ gap: 16, paddingTop: 16, paddingBottom: 18 }}>
      <View style={{ paddingHorizontal: 16, gap: 5 }}>
        <Copy
          accessibilityRole="header"
          style={{ fontSize: 22, fontWeight: "700", letterSpacing: -0.6 }}
        >
          Motif jadi busana
        </Copy>
        <Copy muted style={{ fontSize: 14, lineHeight: 20 }}>
          Lihat corak dalam bentuk yang berbeda.
        </Copy>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {costumes.map(({ item, image }) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Lihat busana ${item.title}`}
            onPress={() => {
              feedback("light");
              router.push({
                pathname: "/batik/[slug]",
                params: { slug: item.slug, media: image.id },
              });
            }}
            style={({ pressed }) => ({
              width: 196,
              opacity: pressed ? 0.8 : 1,
              gap: 10,
            })}
          >
            <Image
              source={image.source}
              contentFit="cover"
              style={{
                width: 196,
                height: 246,
                borderRadius: 20,
                backgroundColor: p.raised,
              }}
            />
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Copy style={{ flex: 1, fontSize: 15, fontWeight: "600" }}>
                {item.title}
              </Copy>
              <Icon name="arrow-forward" size={18} color={p.accent} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default memo(CostumeCollection);
