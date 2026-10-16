import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import type { Batik } from "../lib/types";
import { feedback } from "../lib/haptics";
import { Icon } from "./ui";

export default function CatalogIntro({
  item,
  variant = 0,
}: {
  item?: Batik;
  variant?: number;
}) {
  const { fontScale } = useWindowDimensions();
  if (!item) return null;
  const images = item.media.filter((media) => media.kind === "image");
  const motif = images[0];
  const costume = images[1] ?? motif;
  const themes = [
    {
      background: "#39231f",
      accent: "#f4a28e",
      muted: "#d2bcb1",
      label: "Pilihan TitikBatik",
    },
    {
      background: "#182c38",
      accent: "#a7c9da",
      muted: "#becbd1",
      label: "Detail dalam corak",
    },
    {
      background: "#283126",
      accent: "#c9d2a7",
      muted: "#c5caba",
      label: "Eksplorasi gaya",
    },
  ];
  const theme = themes[variant % themes.length];
  return (
    <View style={{ paddingHorizontal: 16, flex: 1 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sorotan koleksi: ${item.title}. Buka detail`}
        onPress={() => {
          feedback("light");
          router.push({
            pathname: "/batik/[slug]",
            params: { slug: item.slug },
          });
        }}
        style={({ pressed }) => ({
          flexDirection: "row",
          minHeight: Math.max(260, Math.ceil(240 * fontScale)),
          flex: 1,
          borderRadius: 24,
          overflow: "hidden",
          backgroundColor: theme.background,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <View
          style={{
            width: "53%",
            padding: 20,
            gap: 12,
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              color: theme.accent,
              fontSize: 12,
              lineHeight: 17,
              fontWeight: "600",
            }}
          >
            {theme.label}
          </Text>
          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: "#f4f1e9",
                fontSize: 28,
                lineHeight: 30,
                letterSpacing: -0.8,
                fontWeight: "700",
              }}
            >
              {item.title}
            </Text>
            <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 19 }}>
              {variant === 1
                ? "Dekati motifnya.\nTemukan ritmenya."
                : images.length > 1
                  ? "Dari corak ke busana.\nTemukan penerapannya."
                  : "Temukan detail corak\ndan palet warnanya."}
            </Text>
          </View>
          <View
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
              minHeight: 42,
              borderRadius: 24,
              backgroundColor: "#f4f1e9",
            }}
          >
            <Text style={{ color: "#18201c", fontSize: 13, fontWeight: "600" }}>
              Lihat karya
            </Text>
            <Icon name="arrow-forward" color="#18201c" size={16} />
          </View>
        </View>
        <View style={{ flex: 1, backgroundColor: "#81756a" }}>
          {costume && (
            <Image
              source={(variant === 1 ? motif : costume)?.source}
              contentFit="cover"
              style={{ position: "absolute", inset: 0 }}
            />
          )}
          {variant !== 1 && images.length > 1 && motif && (
            <View
              style={{
                position: "absolute",
                right: 12,
                bottom: 12,
                width: 64,
                height: 64,
                borderRadius: 15,
                overflow: "hidden",
                borderWidth: 3,
                borderColor: "#f4f1e9",
              }}
            >
              <Image
                source={motif.source}
                contentFit="cover"
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}
