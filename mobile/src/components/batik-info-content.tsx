import { useState } from "react";
import { feedback } from "../lib/haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { Batik } from "../lib/types";
import { artworkDate, catalogPalette } from "../lib/artwork-presentation";
import { Copy, Icon, useAccessibility, usePalette } from "./ui";

export default function BatikInfo({ item }: { item: Batik }) {
  const [open, setOpen] = useState(false);
  const { reducedMotion } = useAccessibility();
  const rotation = useSharedValue(0);
  const p = usePalette();
  const swatches = catalogPalette(item.color);
  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  const imageCount = item.media.filter(
    (media) => media.kind === "image",
  ).length;
  const videoCount = item.media.length - imageCount;
  const records = [
    ["Gaya", item.style],
    ["Tanggal penciptaan", artworkDate(item.createdAt)],
    [
      "Dokumentasi",
      [
        imageCount ? `${imageCount} gambar` : "",
        videoCount ? `${videoCount} video` : "",
      ]
        .filter(Boolean)
        .join(" · ") || "Belum tersedia",
    ],
  ];
  return (
    <View>
      <View style={[styles.section, { borderColor: p.line }]}>
        <View style={styles.sectionTitle}>
          <Text style={[styles.number, { color: p.accent }]}>01</Text>
          <Text
            accessibilityRole="header"
            style={[styles.heading, { color: p.ink }]}
          >
            Bahasa warna
          </Text>
        </View>
        <Text style={[styles.caption, { color: p.soft }]}>
          Palet yang tercatat dalam karya ini.
        </Text>
        {swatches.length ? (
          <View style={styles.swatches}>
            {swatches.map((swatch, index) => (
              <View
                key={`${swatch.name}-${index}`}
                style={{ flexBasis: 74, flexGrow: 1, maxWidth: 140, gap: 10 }}
              >
                <View
                  accessible={false}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: swatch.color ?? "#252521",
                      borderColor: swatch.color ? "#ffffff1a" : p.line,
                    },
                  ]}
                >
                  {!swatch.color && (
                    <View
                      style={{
                        height: 1,
                        width: 25,
                        backgroundColor: p.soft,
                        transform: [{ rotate: "-45deg" }],
                      }}
                    />
                  )}
                </View>
                <Text selectable style={[styles.swatchName, { color: p.ink }]}>
                  {swatch.name}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Copy muted>Palet belum tercatat.</Copy>
        )}
      </View>
      <View style={[styles.section, { borderColor: p.line }]}>
        <View style={styles.sectionTitle}>
          <Text style={[styles.number, { color: p.accent }]}>02</Text>
          <Text
            accessibilityRole="header"
            style={[styles.heading, { color: p.ink }]}
          >
            Catatan karya
          </Text>
        </View>
        <View style={{ marginTop: 6 }}>
          {records.map(([label, value]) => (
            <View
              key={label}
              style={[styles.record, { borderBottomColor: "#ffffff0d" }]}
            >
              <Text style={[styles.recordLabel, { color: p.soft }]}>
                {label}
              </Text>
              <Text selectable style={[styles.recordValue, { color: p.ink }]}>
                {value}
              </Text>
            </View>
          ))}
        </View>
      </View>
      {(item.prompt || item.seed != null) && (
        <View
          style={[
            styles.creation,
            { backgroundColor: "#151411", borderColor: "#2c2822" },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Di balik motif"
            accessibilityState={{ expanded: open }}
            onPress={() => {
              feedback();
              setOpen(!open);
              rotation.value = withTiming(open ? 0 : 180, {
                duration: reducedMotion ? 0 : 220,
              });
            }}
            style={({ pressed }) => [
              styles.disclosure,
              { opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <View style={[styles.creationIcon, { borderColor: "#514032" }]}>
              <Icon name="scan-outline" size={21} color={p.accent} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  color: p.ink,
                  fontSize: 16,
                  fontWeight: "600",
                  lineHeight: 22,
                }}
              >
                Di balik motif
              </Text>
              <Text style={{ color: p.soft, fontSize: 12, lineHeight: 18 }}>
                Prompt & detail penciptaan
              </Text>
            </View>
            <Animated.View style={chevron}>
              <Icon name="chevron-down" color={p.soft} size={18} />
            </Animated.View>
          </Pressable>
          {open && (
            <View style={{ paddingHorizontal: 20, paddingBottom: 22, gap: 22 }}>
              {item.prompt && (
                <View style={{ gap: 9 }}>
                  <Text style={[styles.smallLabel, { color: p.accent }]}>
                    Prompt
                  </Text>
                  <Text
                    selectable
                    style={{ color: p.ink, fontSize: 14, lineHeight: 24 }}
                  >
                    {item.prompt}
                  </Text>
                </View>
              )}
              {item.seed != null && (
                <View style={{ gap: 7 }}>
                  <Text style={[styles.smallLabel, { color: p.soft }]}>
                    Seed
                  </Text>
                  <Text
                    selectable
                    style={{
                      color: p.ink,
                      fontVariant: ["tabular-nums"],
                      fontSize: 12,
                      lineHeight: 20,
                    }}
                  >
                    {String(item.seed)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 26,
    paddingBottom: 30,
  },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: 12 },
  number: {
    fontSize: 10,
    lineHeight: 16,
    fontVariant: ["tabular-nums"],
  },
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600",
  },
  caption: { fontSize: 12, lineHeight: 20, marginTop: 8 },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 18, marginTop: 22 },
  swatch: {
    height: 62,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchName: { fontSize: 12, lineHeight: 18 },
  record: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  recordLabel: { fontSize: 13, lineHeight: 21, flexShrink: 0 },
  recordValue: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
    flexShrink: 1,
    textAlign: "right",
  },
  creation: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 8,
  },
  disclosure: {
    minHeight: 88,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  creationIcon: {
    width: 42,
    height: 46,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  smallLabel: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
});
