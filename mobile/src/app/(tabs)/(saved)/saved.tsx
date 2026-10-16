import Animated from "react-native-reanimated";
import { useHeaderScroll } from "../../../components/header-scroll";
import { useTabChrome } from "../../../components/tab-chrome";
import { router, Stack } from "expo-router";
import { Platform, Pressable, View } from "react-native";
import { BatikCard, Copy, Status, usePalette } from "../../../components/ui";
import { useApp } from "../../../state/app";
import PageHeading from "../../../components/page-heading";

export default function Saved() {
  const { preferences } = useApp();
  const p = usePalette();
  const { height: headerHeight } = useTabChrome();
  const headerScroll = useHeaderScroll();
  const columns = 2;
  const items = [
    ...preferences.saved,
    ...Array<null>(
      (columns - (preferences.saved.length % columns)) % columns,
    ).fill(null),
  ];
  return (
    <>
      <Stack.Screen options={{ title: "Tersimpan" }} />
      <Animated.FlatList
        onScroll={headerScroll.onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1, backgroundColor: p.paper }}
        contentInsetAdjustmentBehavior={
          Platform.OS === "ios" ? "automatic" : "never"
        }
        data={items}
        numColumns={columns}
        keyExtractor={(item, index) => item?.id ?? `space-${index}`}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{
          gap: 22,
          paddingTop: Platform.OS === "ios" ? 0 : headerHeight,
          paddingBottom: 24,
        }}
        extraData={preferences.saved}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16 }}>
            <PageHeading
              title="Tersimpan"
              subtitle="Motif pilihanmu, dalam satu tempat."
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1, minWidth: 0 }}>
            {item && <BatikCard item={item} />}
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 24, paddingTop: 80 }}>
            <Status empty="Belum ada motif tersimpan." />
            <Copy muted style={{ textAlign: "center" }}>
              Ketuk ikon bookmark pada motif yang ingin kamu simpan.
            </Copy>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.navigate("/")}
              style={{ padding: 16, minHeight: 44 }}
            >
              <Copy style={{ color: p.accent, textAlign: "center" }}>
                Jelajahi koleksi
              </Copy>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          preferences.saved.length ? (
            <Copy
              muted
              style={{ textAlign: "center", padding: 24, fontSize: 15 }}
            >
              {preferences.saved.length} motif tersimpan
            </Copy>
          ) : null
        }
      />
    </>
  );
}
