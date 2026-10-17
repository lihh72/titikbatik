import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as SplashScreen from "expo-splash-screen";
import { Image } from "expo-image";
import { remainingBootHold } from "../lib/boot-timing";
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

const BootReady = createContext(true);
export const useBootReady = () => useContext(BootReady);

/** Root owns completion, so tabs, settings changes and foregrounding do not replay this. */
export default function BootEntrance({
  children,
  completed,
  ready,
  onComplete,
}: {
  children: ReactNode;
  completed: boolean;
  ready: boolean;
  onComplete: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(completed);
  const [imageReady, setImageReady] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const startedAt = useRef(0);
  const handleLayout = useCallback(() => {
    setLayoutReady(true);
  }, []);
  useEffect(() => {
    if (completed || !layoutReady || !imageReady) return;
    let active = true;
    void SplashScreen.hideAsync()
      .catch(() => {})
      .then(() => {
        if (!active) return;
        startedAt.current = Date.now();
        setVisible(true);
      });
    return () => {
      active = false;
    };
  }, [completed, layoutReady, imageReady]);
  const mark = useSharedValue(completed ? 1 : 0);
  const reveal = useSharedValue(completed ? 1 : 0);
  useEffect(() => {
    if (completed) {
      mark.value = 1;
      return;
    }
    if (!visible) return;
    mark.value = withTiming(1, {
      duration: reducedMotion ? 0 : 420,
      easing: Easing.out(Easing.cubic),
    });
    return () => cancelAnimation(mark);
  }, [completed, visible, mark, reducedMotion]);
  useEffect(() => {
    if (completed) {
      reveal.value = 1;
      return;
    }
    if (!visible || !ready) return;
    reveal.value = withDelay(
      remainingBootHold(Date.now() - startedAt.current, reducedMotion),
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
    return () => cancelAnimation(reveal);
  }, [completed, visible, ready, reveal, onComplete, reducedMotion]);
  const brandStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: reducedMotion ? 0 : -8 * mark.value },
      { scale: reducedMotion ? 1 : 1 + mark.value * 0.08 },
    ],
  }));
  const veilStyle = useAnimatedStyle(() => ({ opacity: 1 - reveal.value }));
  return (
    <BootReady.Provider value={completed}>
      <View
        onLayout={handleLayout}
        style={{ flex: 1, backgroundColor: "#000000" }}
      >
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
              <Image
                source={require("../../assets/logo.png")}
                style={{ width: 100, height: 100 }}
                contentFit="contain"
                transition={0}
                onDisplay={() => setImageReady(true)}
                onError={() => setImageReady(true)}
              />
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </BootReady.Provider>
  );
}
