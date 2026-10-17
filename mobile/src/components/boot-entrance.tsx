import { createContext, useContext, useEffect, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import BrandTitle from "./brand-title";

const BootReady = createContext(true);
export const useBootReady = () => useContext(BootReady);

/** Root owns completion, so tabs, settings changes and foregrounding do not replay this. */
export default function BootEntrance({
  children,
  completed,
  onComplete,
}: {
  children: ReactNode;
  completed: boolean;
  onComplete: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const mark = useSharedValue(completed ? 1 : 0);
  const reveal = useSharedValue(completed ? 1 : 0);
  useEffect(() => {
    if (completed) {
      mark.value = 1;
      reveal.value = 1;
      return;
    }
    mark.value = withTiming(1, {
      duration: reducedMotion ? 0 : 420,
      easing: Easing.out(Easing.cubic),
    });
    reveal.value = withDelay(
      reducedMotion ? 0 : 520,
      withTiming(
        1,
        {
          duration: reducedMotion ? 0 : 360,
          easing: Easing.inOut(Easing.cubic),
        },
        (finished) => {
          if (finished) runOnJS(onComplete)();
        },
      ),
    );
    return () => {
      cancelAnimation(mark);
      cancelAnimation(reveal);
    };
  }, [completed, mark, reveal, onComplete, reducedMotion]);
  const brandStyle = useAnimatedStyle(() => ({
    opacity: mark.value,
    transform: [
      { translateY: reducedMotion ? 0 : 12 * (1 - mark.value) },
      { scale: 1.35 + mark.value * 0.1 },
    ],
  }));
  const veilStyle = useAnimatedStyle(() => ({ opacity: 1 - reveal.value }));
  return (
    <BootReady.Provider value={completed}>
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        <View
          style={{ flex: 1 }}
          accessibilityElementsHidden={!completed}
          importantForAccessibility={completed ? "auto" : "no-hide-descendants"}
        >
          {children}
        </View>
        {!completed && (
          <Animated.View
            accessibilityLabel="Membuka TitikBatik"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "#000000",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              },
              veilStyle,
            ]}
          >
            <Animated.View style={brandStyle}>
              <BrandTitle />
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </BootReady.Provider>
  );
}
