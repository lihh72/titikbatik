import { Stack } from "expo-router";
import { Platform, View } from "react-native";
import { usePalette, useAccessibility } from "./ui";
import { nativeHeaderAppearance } from "../lib/native-header-appearance";
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
        ...nativeHeaderAppearance(
          Platform.OS,
          Platform.Version,
          reducedTransparency,
          p.paper,
        ),
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
        contentStyle: { backgroundColor: p.paper },
        animation: reducedMotion ? "none" : "default",
      }}
    />
  );
}
