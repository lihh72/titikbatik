import TabChromeShell from "../../components/tab-chrome-shell";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { feedback } from "../../lib/haptics";
import { useAccessibility, usePalette } from "../../components/ui";
export const unstable_settings = { initialRouteName: "(catalog)" };

export default function Tabs() {
  const p = usePalette();
  const { reducedTransparency } = useAccessibility();
  return (
    <TabChromeShell>
      <NativeTabs
        tintColor={p.accent}
        backgroundColor={p.paper}
        disableTransparentOnScrollEdge
        blurEffect={reducedTransparency ? "none" : "systemMaterial"}
      >
        <NativeTabs.Trigger
          name="(catalog)"
          disableAutomaticContentInsets
          listeners={{ tabPress: () => feedback() }}
        >
          <NativeTabs.Trigger.Label>Koleksi</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{
              default: "square.grid.2x2",
              selected: "square.grid.2x2.fill",
            }}
            md="grid_view"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger
          name="(saved)"
          disableAutomaticContentInsets
          listeners={{ tabPress: () => feedback() }}
        >
          <NativeTabs.Trigger.Label>Tersimpan</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "bookmark", selected: "bookmark.fill" }}
            md="bookmark"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger
          name="(assistant)"
          disableAutomaticContentInsets
          listeners={{ tabPress: () => feedback() }}
        >
          <NativeTabs.Trigger.Label>Asisten</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{
              default: "bubble.left.and.bubble.right",
              selected: "bubble.left.and.bubble.right.fill",
            }}
            md="chat"
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </TabChromeShell>
  );
}
