import { Image } from "expo-image";
import { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaFrame,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import type { Media } from "../lib/types";
import { mediaName } from "../lib/artwork-presentation";
import { feedback } from "../lib/haptics";
import { Glass, Icon, useAccessibility, usePalette } from "./ui";

export default function ArtworkViewer({
  media,
  onClose,
}: {
  media: Media | null;
  onClose: () => void;
}) {
  const frame = useSafeAreaFrame();
  const insets = useSafeAreaInsets();
  const { reducedMotion } = useAccessibility();
  // Keep the image/title throughout dismissal instead of clearing them before the fade ends.
  const [presented, setPresented] = useState(media);
  if (media && media !== presented) setPresented(media);
  const close = () => {
    feedback("light");
    onClose();
  };
  return (
    <Modal
      visible={!!media}
      animationType={reducedMotion ? "none" : "fade"}
      transparent
      presentationStyle="overFullScreen"
      onRequestClose={close}
      supportedOrientations={["portrait"]}
    >
      {/* Own inset context: presenting the viewer must not reflow the detail's UIKit header. */}
      <SafeAreaProvider
        initialMetrics={{ frame, insets }}
        style={styles.surface}
      >
        <ViewerContent media={presented} close={close} />
      </SafeAreaProvider>
    </Modal>
  );
}

function ViewerContent({
  media,
  close,
}: {
  media: Media | null;
  close: () => void;
}) {
  const p = usePalette();
  const frame = useSafeAreaFrame();
  const insets = useSafeAreaInsets();
  const [viewport, setViewport] = useState({
    width: frame.width,
    height: Math.max(1, frame.height - insets.top - insets.bottom - 132),
  });
  return (
    <SafeAreaView
      style={styles.surface}
      accessibilityViewIsModal
      onAccessibilityEscape={close}
    >
      <View style={styles.toolbar}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[styles.label, { color: p.soft }]}>Galeri karya</Text>
          <Text
            accessibilityRole="header"
            style={{ color: p.ink, fontSize: 17, fontWeight: "600" }}
          >
            {media ? mediaName(media) : ""}
          </Text>
        </View>
        <Glass style={{ borderRadius: 24 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tutup tampilan penuh"
            onPress={close}
            style={styles.close}
          >
            <Icon name="close" size={23} color={p.ink} />
          </Pressable>
        </Glass>
      </View>
      <View
        style={{ flex: 1 }}
        onLayout={({ nativeEvent: { layout } }) => {
          setViewport((previous) =>
            previous.width === layout.width && previous.height === layout.height
              ? previous
              : { width: layout.width, height: layout.height },
          );
        }}
      >
        <ScrollView
          key={media?.id}
          style={{ flex: 1 }}
          contentContainerStyle={styles.zoomContent}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          automaticallyAdjustsScrollIndicatorInsets={false}
          centerContent
          minimumZoomScale={1}
          maximumZoomScale={Platform.OS === "ios" ? 4 : 1}
          bouncesZoom
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          {media && (
            <Image
              source={media.source}
              contentFit="contain"
              transition={0}
              accessibilityLabel={media.label}
              style={{ width: viewport.width, height: viewport.height }}
            />
          )}
        </ScrollView>
      </View>
      <Text style={[styles.hint, { color: p.soft }]}>
        {Platform.OS === "ios"
          ? "Cubit gambar untuk melihat detail motif."
          : "Tampilan penuh karya."}
      </Text>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  surface: { flex: 1, backgroundColor: "#000000" },
  toolbar: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  label: { fontSize: 12, lineHeight: 18 },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomContent: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  hint: {
    textAlign: "center",
    paddingHorizontal: 24,
    paddingVertical: 22,
    fontSize: 12,
    lineHeight: 18,
  },
});
