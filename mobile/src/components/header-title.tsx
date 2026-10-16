import type { ReactNode } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useNavigationChrome } from "./tab-chrome";
import { useAccessibility, usePalette } from "./ui";
import BrandTitle from "./brand-title";
import type { HeaderMode } from "../lib/header-buttons";

function Layer({
  active,
  children,
  leading,
}: {
  active: boolean;
  children: ReactNode;
  leading: boolean;
}) {
  return (
    <View
      accessibilityElementsHidden={!active}
      aria-hidden={!active}
      style={[
        {
          position: "absolute",
          width: "100%",
          height: 32,
          alignItems: leading ? "flex-start" : "center",
          justifyContent: "center",
          opacity: Number(active),
        },
      ]}
    >
      {children}
    </View>
  );
}

export default function HeaderTitle({
  mode,
  collapsible = false,
  width = 168,
  catalogOnly = false,
}: {
  mode?: HeaderMode;
  collapsible?: boolean;
  width?: number;
  catalogOnly?: boolean;
}) {
  const chrome = useNavigationChrome();
  const page = mode ?? chrome.page;
  const scroll = chrome.catalogScroll;
  const p = usePalette();
  const { reducedMotion } = useAccessibility();
  const presentation = useSharedValue(collapsible ? 0 : 1);
  const settling = useSharedValue(0);
  // Scroll tracks the finger. A tab change interpolates from the displayed pose,
  // including when the destination tab retained a different scroll position.
  useAnimatedReaction(
    () => ({
      page,
      amount: collapsible
        ? Math.min(1, Math.max(0, (scroll.value * 64) / 52))
        : 1,
    }),
    (next, previous) => {
      if (previous && next.page !== previous.page && !reducedMotion) {
        settling.value = 1;
        settling.value = withDelay(320, withTiming(0, { duration: 0 }));
        presentation.value = withTiming(next.amount, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      } else if (
        !previous ||
        next.amount !== previous.amount ||
        reducedMotion
      ) {
        // Native insets and chat auto-scroll may settle just after tab focus.
        // Retarget the in-flight title instead of snapping to that late offset.
        presentation.value =
          settling.value > 0 && !reducedMotion
            ? withTiming(next.amount, {
                duration: 180,
                easing: Easing.out(Easing.cubic),
              })
            : next.amount;
      }
    },
  );
  const position = useAnimatedStyle(() => ({
    transform: [{ translateY: 44 * (1 - presentation.value) }],
  }));
  const brandScale = useAnimatedStyle(() => {
    const scale = reducedMotion ? 1 : 1 + 0.35 * (1 - presentation.value);
    return { transform: [{ translateX: (scale - 1) * 84 }, { scale }] };
  });
  const typography = useAnimatedStyle(() => ({
    fontSize: 32 - 15 * presentation.value,
    lineHeight: 38 - 16 * presentation.value,
    letterSpacing: -0.65 + 0.4 * presentation.value,
  }));
  const titles: Record<Exclude<HeaderMode, "catalog">, string> = {
    saved: "Tersimpan",
    assistant: "Asisten",
    detail: "Detail karya",
  };
  return (
    <Animated.View
      collapsable={false}
      style={[
        {
          width,
          height: 32,
          alignItems: collapsible ? "flex-start" : "center",
          justifyContent: "center",
          overflow: collapsible ? "visible" : "hidden",
        },
        position,
      ]}
    >
      <Layer leading={collapsible} active={page === "catalog"}>
        <Animated.View
          style={[
            {
              width: 168,
              height: 32,
              justifyContent: "center",
              alignItems: collapsible ? "flex-start" : "center",
            },
            brandScale,
          ]}
        >
          <BrandTitle />
        </Animated.View>
      </Layer>
      {(Object.keys(titles) as Exclude<HeaderMode, "catalog">[]).map(
        (titleMode) => (
          <Layer
            key={titleMode}
            leading={collapsible}
            active={!catalogOnly && page === titleMode}
          >
            <Animated.Text
              accessibilityRole="header"
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
              style={[
                { color: p.ink, fontWeight: "600", maxWidth: width },
                typography,
              ]}
            >
              {titles[titleMode]}
            </Animated.Text>
          </Layer>
        ),
      )}
    </Animated.View>
  );
}
