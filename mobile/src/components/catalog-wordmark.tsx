import { View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HeaderTitle from "./header-title";

/** Switches with the native catalog screen, without waiting for route segments. */
export default function CatalogWordmark() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: insets.top + 6,
        left: 16,
        right: 16,
        zIndex: 30,
      }}
    >
      <HeaderTitle
        mode="catalog"
        collapsible
        catalogOnly
        width={Math.max(168, width - insets.left - insets.right - 128)}
      />
    </View>
  );
}
