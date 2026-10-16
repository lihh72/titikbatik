import { Stack } from "expo-router";
import { Platform, View } from "react-native";
import { usePalette, useAccessibility } from "./ui";
import type { HeaderMode } from "../lib/header-buttons";
export default function TabStack({
  mode = "catalog",
}: {
  mode?: Exclude<HeaderMode, "detail">;
}) {
  const p = usePalette();
  const { reducedMotion, reducedTransparency } = useAccessibility();
  return (
    <Stack
      screenOptions={{
        headerShown: Platform.OS === "ios",
        scrollEdgeEffects: {
          top: reducedTransparency ? "hidden" : "automatic",
        },
        headerTintColor: p.accent,
        // UIKit reserves the large-title/search geometry; shared chrome draws the one visible title.
        title:
          mode === "catalog"
            ? "TitikBatik"
            : mode === "saved"
              ? "Tersimpan"
              : "Asisten",
        // A null result falls back to UIKit's title; a real empty view suppresses it.
        headerTitle:
          Platform.OS === "ios"
            ? () => (
                <View
                  accessible={false}
                  accessibilityElementsHidden
                  style={{ width: 0, height: 0 }}
                />
              )
            : undefined,
        headerTitleStyle: { color: "transparent" },
        headerLargeTitleEnabled: Platform.OS === "ios" && mode === "catalog",
        headerLargeTitleStyle: {
          fontFamily: "Georgia",
          fontWeight: "700",
          color: "transparent",
        },
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        headerTransparent: Platform.OS === "ios" && !reducedTransparency,
        headerStyle: {
          backgroundColor:
            Platform.OS === "ios" && !reducedTransparency
              ? "transparent"
              : p.paper,
        },
        contentStyle: { backgroundColor: p.paper },
        animation: reducedMotion ? "none" : "default",
      }}
    />
  );
}
