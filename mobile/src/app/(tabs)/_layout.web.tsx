import TabChromeShell from "../../components/tab-chrome-shell";
import { Tabs } from "expo-router";
import { Icon, usePalette } from "../../components/ui";
export const unstable_settings = { initialRouteName: "(catalog)" };
export default function WebTabs() {
  const p = usePalette();
  return (
    <TabChromeShell>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: p.accent,
          tabBarInactiveTintColor: p.soft,
          tabBarStyle: { backgroundColor: p.raised, borderTopColor: p.line },
        }}
      >
        <Tabs.Screen
          name="(catalog)"
          options={{
            title: "Koleksi",
            tabBarIcon: ({ color }) => (
              <Icon name="grid-outline" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(saved)"
          options={{
            title: "Tersimpan",
            tabBarIcon: ({ color }) => (
              <Icon name="bookmark-outline" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(assistant)"
          options={{
            title: "Asisten",
            tabBarIcon: ({ color }) => (
              <Icon name="chatbubbles-outline" color={color} />
            ),
          }}
        />
      </Tabs>
    </TabChromeShell>
  );
}
