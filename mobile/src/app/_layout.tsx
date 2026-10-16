import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  NavigationChromeProvider,
  useNavigationChrome,
} from "../components/tab-chrome";
import HeaderTitle from "../components/header-title";
import HeaderActions from "../components/header-actions";
import { DarkTheme, Stack, ThemeProvider, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "../state/app";
import { useAccessibility, usePalette } from "../components/ui";

function Navigation() {
  const p = usePalette();
  const { reducedMotion, reducedTransparency } = useAccessibility();
  const chrome = useNavigationChrome();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const title =
    chrome.tab === "catalog"
      ? "TitikBatik"
      : chrome.tab === "saved"
        ? "Tersimpan"
        : "Asisten";
  const actions = () => <HeaderActions mode={chrome.tab} />;
  const detailActions = () => <HeaderActions mode="detail" />;
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerTintColor: p.accent,
          headerTransparent: Platform.OS === "ios" && !reducedTransparency,
          headerStyle: {
            backgroundColor:
              Platform.OS === "ios" && !reducedTransparency
                ? "transparent"
                : p.paper,
          },
          headerLargeTitleEnabled: false,
          scrollEdgeEffects: {
            top: reducedTransparency ? "hidden" : "automatic",
          },
          contentStyle: { backgroundColor: p.paper },
          headerShadowVisible: false,
          animation: reducedMotion ? "none" : "default",
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: Platform.OS !== "ios",
            title,
            headerTitle: () => <HeaderTitle mode={chrome.tab} catalogOnly />,
            headerRight: Platform.OS !== "ios" ? actions : undefined,
          }}
        />
        <Stack.Screen
          name="batik/[slug]"
          listeners={{
            transitionStart: (event) => {
              chrome.setReturning(event.data.closing);
            },
            transitionEnd: (event) => {
              // Successful pop keeps the destination icons until route segments catch up.
              if (!event.data.closing) chrome.setReturning(false);
            },
            gestureCancel: () => chrome.setReturning(false),
          }}
          options={{
            title: "Detail karya",
            headerStyle: {
              backgroundColor:
                Platform.OS === "ios" && !reducedTransparency
                  ? "#000000b3"
                  : p.paper,
            },
            scrollEdgeEffects: { top: "hidden" },
            gestureEnabled: true,
            headerBackTitle: title,
            headerTitle: () => <HeaderTitle mode="detail" />,
            headerRight: Platform.OS !== "ios" ? detailActions : undefined,
          }}
        />
        <Stack.Screen
          name="info"
          options={{
            title: "Pengaturan",
            headerTransparent: false,
            headerStyle: { backgroundColor: p.paper },
            presentation: "formSheet",
            sheetAllowedDetents: [0.75, 1],
            sheetGrabberVisible: true,
            headerShown: true,
          }}
        />
      </Stack>
      {Platform.OS === "ios" &&
        !segments.some((segment) => segment === "info") && (
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              top: insets.top,
              right: insets.right + 16,
              width: 96,
              height: 44,
              zIndex: 50,
            }}
          >
            <HeaderActions mode={chrome.page} />
          </View>
        )}
    </>
  );
}
export default function RootLayout() {
  return (
    <ThemeProvider
      value={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: "#000000",
          card: "#000000",
          text: "#f4f1e9",
          primary: "#f28b72",
        },
      }}
    >
      <AppProvider>
        <NavigationChromeProvider>
          <Navigation />
        </NavigationChromeProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
