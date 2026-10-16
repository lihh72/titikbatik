import { useState } from "react";
import { feedback } from "../lib/haptics";
import { Pressable, Text, View } from "react-native";
import type { Batik } from "../lib/types";
import { Copy, Icon, usePalette } from "./ui";

export default function BatikInfo({ item }: { item: Batik }) {
  const [open, setOpen] = useState(false);
  const p = usePalette();
  const date = new Date(item.createdAt);
  const fields = [
    ["Gaya", item.style],
    ["Palet warna", item.color],
    [
      "Dibuat",
      Number.isNaN(date.getTime())
        ? "Belum tercatat"
        : date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
    ],
    ["Seed", item.seed == null ? "Belum tercatat" : String(item.seed)],
  ];
  return (
    <View style={{ gap: 22 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 22 }}>
        {fields.map(([label, value]) => (
          <View key={label} style={{ width: "50%", paddingRight: 16, gap: 6 }}>
            <Text style={{ color: p.soft, fontSize: 12, lineHeight: 17 }}>
              {label}
            </Text>
            <Text
              selectable
              style={{
                color: p.ink,
                fontSize: 15,
                lineHeight: 21,
                fontWeight: "500",
              }}
            >
              {value}
            </Text>
          </View>
        ))}
      </View>
      {item.prompt && (
        <View
          style={{
            backgroundColor: p.raised,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            onPress={() => {
              feedback();
              setOpen(!open);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              minHeight: 60,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Icon name="sparkles-outline" size={20} color={p.accent} />
            <Copy style={{ flex: 1, fontSize: 15, fontWeight: "600" }}>
              Di balik motif
            </Copy>
            <Icon
              name={open ? "chevron-up" : "chevron-down"}
              color={p.soft}
              size={17}
            />
          </Pressable>
          {open && (
            <Copy
              selectable
              muted
              style={{
                paddingHorizontal: 16,
                paddingBottom: 18,
                fontSize: 14,
                lineHeight: 23,
              }}
            >
              {item.prompt}
            </Copy>
          )}
        </View>
      )}
    </View>
  );
}
