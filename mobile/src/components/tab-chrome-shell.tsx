import type { ReactNode } from "react";
import { Platform, View } from "react-native";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useAccessibility } from "./ui";
import { HeightContext } from "./tab-chrome";

/** Shared tab container; visible titles belong to their own native screen. */
export default function TabChromeShell({ children }: { children: ReactNode }) {
  const nativeHeight = useHeaderHeight();
  const { reducedTransparency } = useAccessibility();
  const height =
    Platform.OS === "ios" && !reducedTransparency ? nativeHeight : 0;
  return (
    <HeightContext.Provider value={height}>
      <View collapsable={false} style={{ flex: 1, backgroundColor: "#000000" }}>
        {children}
      </View>
    </HeightContext.Provider>
  );
}
