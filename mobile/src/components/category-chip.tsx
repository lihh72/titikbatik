import { useEffect, type ReactNode } from "react";
import { Pressable } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useAccessibility, usePalette } from "./ui";

export default function CategoryChip({
  active,
  label,
  onPress,
  children,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  children?: ReactNode;
}) {
  const p = usePalette();
  const { reducedMotion } = useAccessibility();
  const progress = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: reducedMotion ? 0 : 220,
    });
  }, [active, progress, reducedMotion]);
  const surface = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [p.raised, p.ink],
    ),
    borderColor: interpolateColor(progress.value, [0, 1], [p.line, p.ink]),
  }));
  const text = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [p.ink, p.paper]),
  }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === "Semua" ? "Semua gaya" : `Gaya ${label}`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <Animated.View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 9,
            minHeight: 44,
            borderRadius: 24,
            borderWidth: 1,
          },
          surface,
        ]}
      >
        {children}
        <Animated.Text
          style={[{ fontSize: 13, lineHeight: 18, fontWeight: "600" }, text]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}
