import TabChromeShell from "../../components/tab-chrome-shell";
import { Tabs } from "expo-router";
import { Icon, usePalette } from "../../components/ui";
export const unstable_settings = { anchor: "(catalog)" };
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
            tabBarIcon: ({ focused }) => (
              <Icon name="grid-outline" color={focused ? p.accent : p.soft} />
            ),
          }}
        />
        <Tabs.Screen
          name="(saved)"
          options={{
            title: "Tersimpan",
            tabBarIcon: ({ focused }) => (
              <Icon name="bookmark-outline" color={focused ? p.accent : p.soft} />
            ),
          }}
        />
        <Tabs.Screen
          name="(assistant)"
          options={{
            title: "Asisten",
            tabBarIcon: ({ focused }) => (
              <Icon name="chatbubbles-outline" color={focused ? p.accent : p.soft} />
            ),
          }}
        />
      </Tabs>
    </TabChromeShell>
  );
}
