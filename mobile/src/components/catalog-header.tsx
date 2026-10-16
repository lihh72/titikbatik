import { useEffect } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { feedback } from "../lib/haptics";
import { Glass, Icon, useAccessibility, usePalette } from "./ui";
import { useTabChrome } from "./tab-chrome";

export type CatalogChromeProps = {
  query: string;
  onQueryChange: (value: string) => void;
  detailed: boolean;
  onDetailedChange: (value: boolean) => void;
};

export default function CatalogHeader({
  query,
  onQueryChange,
  detailed,
  onDetailedChange,
}: CatalogChromeProps) {
  const p = usePalette();
  const { reducedMotion } = useAccessibility();
  const { menuOpen: expanded, height: headerHeight } = useTabChrome();
  const { fontScale } = useWindowDimensions();
  const choiceHeight = Math.max(46, Math.ceil(36 * fontScale));
  const progress = useSharedValue(0);
  const choice = useSharedValue(detailed ? 0 : 1);
  const choiceWidth = useSharedValue(0);
  useEffect(() => {
    choice.value = withTiming(detailed ? 0 : 1, {
      duration: reducedMotion ? 0 : 240,
    });
  }, [detailed, choice, reducedMotion]);
  const selectionStyle = useAnimatedStyle(() => ({
    width: choiceWidth.value,
    transform: [{ translateX: choice.value * (choiceWidth.value + 5) }],
  }));
  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, {
      duration: reducedMotion ? 0 : 240,
    });
  }, [expanded, progress, reducedMotion]);
  const panelStyle = useAnimatedStyle(() => ({
    height: progress.value * (choiceHeight + 14),
    overflow: "hidden",
  }));
  const headerBounds = useAnimatedStyle(() => ({
    height: 64 + progress.value * (choiceHeight + 14),
  }));
  return (
    <Animated.View
      style={[
        {
          paddingHorizontal: 16,
          position: "absolute",
          top: headerHeight,
          left: 0,
          right: 0,
          zIndex: 20,
          paddingBottom: 16,
          gap: 14,
          backgroundColor: "transparent",
        },
        headerBounds,
      ]}
    >
      <View style={{ gap: 0 }}>
        <Glass
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 24,
            paddingLeft: 14,
            gap: 8,
          }}
        >
          <Icon name="search" size={18} color={p.soft} />
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            accessibilityLabel="Cari motif, warna, gaya"
            placeholder="Cari motif, warna, gaya"
            placeholderTextColor={p.soft}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectionColor={p.accent}
            style={{
              flex: 1,
              minHeight: 46,
              fontSize: 15,
              color: p.ink,
              paddingVertical: 8,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hapus pencarian"
            disabled={!query}
            onPress={() => {
              feedback();
              onQueryChange("");
            }}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              opacity: query ? 1 : 0,
            }}
          >
            <Icon name="close-circle" size={18} color={p.soft} />
          </Pressable>
        </Glass>
        <Animated.View
          aria-hidden={!expanded}
          pointerEvents={expanded ? "auto" : "none"}
          accessibilityElementsHidden={!expanded}
          importantForAccessibility={expanded ? "auto" : "no-hide-descendants"}
          style={[
            { position: "absolute", top: 62, left: 0, right: 0 },
            panelStyle,
          ]}
        >
          <Glass
            style={{
              flexDirection: "row",
              padding: 5,
              gap: 5,
              borderRadius: 22,
            }}
          >
            <View
              onLayout={(event) => {
                choiceWidth.set(
                  Math.max(0, (event.nativeEvent.layout.width - 5) / 2),
                );
              }}
              style={{
                position: "absolute",
                left: 5,
                right: 5,
                top: 5,
                bottom: 5,
              }}
              pointerEvents="none"
            >
              <Animated.View
                style={[
                  {
                    height: "100%",
                    borderRadius: 17,
                    backgroundColor: "#f4f1e9",
                  },
                  selectionStyle,
                ]}
              />
            </View>
            {[true, false].map((value) => (
              <Pressable
                key={String(value)}
                disabled={!expanded}
                accessibilityRole="button"
                accessibilityLabel={value ? "Dua kolom" : "Tiga kolom"}
                accessibilityState={{ selected: detailed === value }}
                onPress={() => {
                  if (detailed !== value) {
                    feedback();
                    onDetailedChange(value);
                  }
                }}
                style={{
                  flex: 1,
                  minHeight: choiceHeight,
                  borderRadius: 17,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Icon
                  name={value ? "grid-outline" : "apps-outline"}
                  size={18}
                  color={detailed === value ? "#18201c" : p.soft}
                />
                <Text
                  style={{
                    color: detailed === value ? "#18201c" : p.soft,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {value ? "Nyaman" : "Rapat"}
                </Text>
              </Pressable>
            ))}
          </Glass>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
