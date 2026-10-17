import { memo } from "react";
import CategoryChip from "./category-chip";
import { Image } from "expo-image";
import { Pressable, ScrollView, View } from "react-native";
import type { Batik } from "../lib/types";
import { feedback } from "../lib/haptics";
import { Copy, usePalette } from "./ui";

function CatalogCategories({
  items,
  selected,
  onSelect,
}: {
  items: Batik[];
  selected: string;
  onSelect: (style: string) => void;
}) {
  const p = usePalette();
  const styles = [
    ...new Set([...items.map((item) => item.style), selected].filter(Boolean)),
  ];
  if (!styles.length) return null;
  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Copy
          accessibilityRole="header"
          style={{ fontSize: 20, fontWeight: "700", letterSpacing: -0.5 }}
        >
          Jelajahi gaya
        </Copy>
        {
          <Pressable
            accessibilityRole="button"
            disabled={!selected}
            accessibilityLabel="Lihat semua gaya"
            onPress={() => {
              feedback();
              onSelect("");
            }}
            style={{
              minHeight: 44,
              justifyContent: "center",
              opacity: selected ? 1 : 0,
            }}
          >
            <Copy style={{ fontSize: 13, color: p.accent }}>Lihat semua</Copy>
          </Pressable>
        }
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {["", ...styles].map((style) => {
          const active = selected === style;
          const image = items
            .find((item) => item.style === style)
            ?.media.find((media) => media.kind === "image");
          return (
            <CategoryChip
              key={style}
              active={active}
              label={style || "Semua"}
              onPress={() => {
                if (selected !== style) {
                  feedback();
                  onSelect(style);
                }
              }}
            >
              {image && (
                <Image
                  source={image.source}
                  contentFit="cover"
                  style={{ width: 24, height: 24, borderRadius: 12 }}
                />
              )}
            </CategoryChip>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default memo(CatalogCategories);
