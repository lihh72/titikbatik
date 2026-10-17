import CatalogTileContent from "./catalog-tile-content";
import { feedback } from "../lib/haptics";
import { router } from "expo-router";
import { Alert, Platform, Pressable } from "react-native";

import type { Batik } from "../lib/types";
import { useSaved } from "../state/app";

export default function CatalogTile({ item }: { item: Batik }) {
  const { saved: savedItems, toggleSave } = useSaved();
  const saved = savedItems.some((value) => value.id === item.id);
  const open = () =>
    router.push({ pathname: "/batik/[slug]", params: { slug: item.slug } });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Lihat ${item.title}`}
      onPress={() => {
        feedback("light");
        open();
      }}
      onLongPress={() => {
        if (Platform.OS !== "web")
          Alert.alert(item.title, undefined, [
            {
              text: saved ? "Hapus dari tersimpan" : "Simpan motif",
              onPress: () => toggleSave(item),
            },
            { text: "Batal", style: "cancel" },
          ]);
      }}
      style={({ pressed }) => ({
        gap: 8,

        opacity: pressed ? 0.7 : 1,
      })}
    >
      <CatalogTileContent item={item} saved={saved} />
    </Pressable>
  );
}
