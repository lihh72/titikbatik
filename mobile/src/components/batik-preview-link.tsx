import { router } from "expo-router";
import { Alert, Platform, Pressable } from "react-native";
import type { ReactNode } from "react";
import type { Batik } from "../lib/types";
import { feedback } from "../lib/haptics";
import { useApp } from "../state/app";

export default function BatikPreviewLink({
  item,
  children,
}: {
  item: Batik;
  children: ReactNode;
}) {
  const { preferences, toggleSave } = useApp();
  const saved = preferences.saved.some((value) => value.id === item.id);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Lihat ${item.title}`}
      onPress={() => {
        feedback("light");
        router.push({ pathname: "/batik/[slug]", params: { slug: item.slug } });
      }}
      onLongPress={() => {
        if (Platform.OS === "web") return;
        feedback("light");
        Alert.alert(item.title, "Pilihan motif", [
          {
            text: saved ? "Hapus dari tersimpan" : "Simpan motif",
            onPress: () => toggleSave(item),
          },
          { text: "Batal", style: "cancel" },
        ]);
      }}
      style={({ pressed }) => ({
        width: "100%",
        gap: 10,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}
