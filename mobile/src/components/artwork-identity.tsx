import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Batik } from "../lib/types";
import { feedback } from "../lib/haptics";
import { Icon, usePalette } from "./ui";

export default function ArtworkIdentity({
  item,
  saved,
  liked,
  onSave,
  onLike,
}: {
  item: Batik;
  saved: boolean;
  liked: boolean;
  onSave: () => void;
  onLike: () => void;
}) {
  const p = usePalette();
  return (
    <View style={styles.section}>
      <Text style={[styles.style, { color: p.accent }]}>{item.style}</Text>
      <Text
        accessibilityRole="header"
        selectable
        style={[styles.title, { color: p.ink }]}
      >
        {item.title}
      </Text>
      <View style={styles.signature}>
        <Text style={[styles.byline, { color: p.soft }]}>
          Koleksi TitikBatik
        </Text>
        <View
          style={{
            width: 3,
            height: 3,
            borderRadius: 2,
            backgroundColor: p.soft,
          }}
        />
        <Text style={[styles.byline, { color: p.soft }]}>Motif digital</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? "Hapus dari tersimpan" : "Simpan karya"}
          accessibilityState={{ selected: saved }}
          onPress={() => {
            feedback("light");
            onSave();
          }}
          style={({ pressed }) => [
            styles.save,
            {
              backgroundColor: saved ? "#30231f" : p.ink,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
        >
          <Icon
            name={saved ? "bookmark" : "bookmark-outline"}
            size={19}
            color={saved ? p.accent : "#18201c"}
          />
          <Text
            style={[
              styles.actionLabel,
              { color: saved ? p.accent : "#18201c" },
            ]}
          >
            {saved ? "Tersimpan" : "Simpan karya"}
          </Text>
          {saved && <Icon name="checkmark" size={17} color={p.accent} />}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={liked ? "Batal sukai" : "Sukai motif"}
          accessibilityState={{ selected: liked }}
          onPress={() => {
            feedback("light");
            onLike();
          }}
          style={({ pressed }) => [
            styles.like,
            {
              borderColor: liked ? "#684236" : p.line,
              backgroundColor: liked ? "#251b18" : "transparent",
              opacity: pressed ? 0.65 : 1,
            },
          ]}
        >
          <Icon
            name={liked ? "heart" : "heart-outline"}
            color={liked ? p.accent : p.ink}
            size={22}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 24, paddingTop: 26, paddingBottom: 30 },
  style: { fontSize: 13, lineHeight: 20, fontWeight: "500", marginBottom: 8 },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  signature: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 9,
    marginTop: 12,
  },
  byline: { fontSize: 13, lineHeight: 20 },
  actions: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    marginTop: 26,
  },
  save: {
    flex: 1,
    minHeight: 52,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  actionLabel: { fontSize: 15, lineHeight: 22, fontWeight: "600" },
  like: {
    width: 54,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
