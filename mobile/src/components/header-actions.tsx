import { useEffect, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { router } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Glass, Icon, useAccessibility, usePalette } from "./ui";
import { useNavigationChrome } from "./tab-chrome";
import { feedback } from "../lib/haptics";
import {
  headerButtons,
  type HeaderIcon,
  type HeaderMode,
} from "../lib/header-buttons";

const glyphs = {
  ellipsis: "ellipsis-horizontal",
  xmark: "close",
  gearshape: "settings-outline",
  trash: "trash-outline",
  bookmark: "bookmark-outline",
  "bookmark.fill": "bookmark",
  "square.and.arrow.up": "share-outline",
} as const;

function Glyph({
  name,
  active,
  initial,
  disabled,
  reducedMotion,
}: {
  name: HeaderIcon;
  active: boolean;
  initial: boolean;
  disabled: boolean;
  reducedMotion: boolean;
}) {
  const p = usePalette();
  const opacity = useSharedValue(initial ? 1 : 0);
  const scale = useSharedValue(initial ? 1 : 0.72);
  useEffect(() => {
    opacity.value = reducedMotion
      ? Number(active)
      : active
        ? withDelay(45, withTiming(1, { duration: 200 }))
        : withTiming(0, { duration: 120 });
    scale.value = reducedMotion
      ? active
        ? 1
        : 0.72
      : withSpring(active ? 1 : 0.72, { duration: 300, dampingRatio: 0.92 });
  }, [active, reducedMotion, opacity, scale]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value * (disabled ? 0.35 : 1),
    transform: [{ scale: scale.value }],
  }));
  const color = name === "bookmark.fill" ? p.accent : p.ink;
  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      aria-hidden
      style={[
        {
          position: "absolute",
          width: 24,
          height: 24,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {Platform.OS === "ios" ? (
        <SymbolView
          name={name}
          size={20}
          weight="regular"
          tintColor={color}
          style={{ width: 24, height: 24 }}
        />
      ) : (
        <Icon name={glyphs[name]} size={21} color={color} />
      )}
    </Animated.View>
  );
}

type Item = ReturnType<typeof headerButtons>[number];
function Slot({
  item,
  seed,
  secondary = false,
  reducedMotion,
}: {
  item?: Item;
  seed?: HeaderIcon;
  secondary?: boolean;
  reducedMotion: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item?.label}
      accessibilityElementsHidden={!item}
      aria-hidden={!item}
      accessibilityState={{
        disabled: !item || item.disabled,
        selected: !!item?.selected,
      }}
      disabled={!item || item.disabled}
      onPress={() => {
        feedback("light");
        item?.onPress();
      }}
      style={{
        position: "absolute",
        top: 0,
        ...(secondary ? { left: 0 } : { right: 0 }),
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {(Object.keys(glyphs) as HeaderIcon[]).map((name) => (
        <Glyph
          key={name}
          name={name}
          active={item?.icon.name === name}
          initial={seed === name}
          disabled={!!item?.disabled}
          reducedMotion={reducedMotion}
        />
      ))}
    </Pressable>
  );
}

/** One fixed UIKit title-bar host, with a native glass surface and UI-thread icon transitions. */
export default function HeaderActions({ mode }: { mode?: HeaderMode }) {
  const chrome = useNavigationChrome();
  const page = mode ?? chrome.page;
  const { reducedMotion } = useAccessibility();
  const [seed] = useState(() =>
    headerButtons(mode === "detail" ? chrome.tab : page, { primary: () => {} }),
  );
  const items = headerButtons(
    page,
    {
      primary: () => {
        if (page === "detail") chrome.shareDetail();
        else if (page === "assistant") chrome.clearChat();
        else router.push("/info");
      },
      secondary: () => {
        if (page === "detail") chrome.saveDetail();
        else chrome.setMenuOpen(!chrome.menuOpen);
      },
    },
    page === "detail"
      ? chrome.detail
      : {
          menuOpen: chrome.menuOpen,
          disabled: page === "assistant" && chrome.clearDisabled,
        },
  );
  const hasSecondary = items.length > 1;
  const width = useSharedValue(seed.length > 1 ? 88 : 44);
  useEffect(() => {
    width.value = reducedMotion
      ? hasSecondary
        ? 88
        : 44
      : withSpring(hasSecondary ? 88 : 44, { duration: 320, dampingRatio: 1 });
  }, [hasSecondary, reducedMotion, width]);
  const capsule = useAnimatedStyle(() => ({ width: width.value }));
  return (
    <View collapsable={false} style={{ width: 96, height: 44 }}>
      <Animated.View
        style={[
          { position: "absolute", right: 0, top: 0, height: 44 },
          capsule,
        ]}
      >
        <Glass style={{ height: 44, borderRadius: 24 }}>
          <Slot
            reducedMotion={reducedMotion}
            secondary
            item={hasSecondary ? items[0] : undefined}
            seed={seed.length > 1 ? seed[0].icon.name : undefined}
          />
          <Slot
            reducedMotion={reducedMotion}
            item={items.at(-1)}
            seed={seed.at(-1)?.icon.name}
          />
        </Glass>
      </Animated.View>
    </View>
  );
}
