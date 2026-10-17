import { Link } from "expo-router";
import { Pressable } from "react-native";
import type { ReactNode } from "react";
import type { Batik } from "../lib/types";
import { feedback } from "../lib/haptics";
import { useSaved, useLikes } from "../state/app";

export default function BatikPreviewLink({
  item,
  children,
}: {
  item: Batik;
  children: ReactNode;
}) {
  const { saved: savedItems, toggleSave } = useSaved();
  const { liked: likedIds, toggleLike } = useLikes();
  const saved = savedItems.some((value) => value.id === item.id);
  const liked = likedIds.includes(item.id);
  return (
    <Link
      asChild
      href={{ pathname: "/batik/[slug]", params: { slug: item.slug } }}
    >
      <Link.Trigger>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Lihat ${item.title}`}
          onPress={() => feedback("light")}
          style={({ pressed }) => ({
            width: "100%",
            gap: 10,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          {children}
        </Pressable>
      </Link.Trigger>
      <Link.Preview />
      <Link.Menu>
        <Link.MenuAction
          icon={saved ? "bookmark.slash" : "bookmark"}
          onPress={() => toggleSave(item)}
        >
          {saved ? "Hapus dari tersimpan" : "Simpan motif"}
        </Link.MenuAction>
        <Link.MenuAction
          icon={liked ? "heart.slash" : "heart"}
          onPress={() => toggleLike(item.id)}
        >
          {liked ? "Batal sukai" : "Sukai motif"}
        </Link.MenuAction>
      </Link.Menu>
    </Link>
  );
}
