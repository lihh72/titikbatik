import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AccessibilityInfo, Platform, View } from "react-native";

type Preferences = { reducedMotion: boolean; reducedTransparency: boolean };
const defaults: Preferences = {
  reducedMotion: false,
  reducedTransparency: true,
};
const AccessibilityContext = createContext<Preferences>(defaults);

/** Resolve native preferences before UIKit creates any navigation bars. */
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaults);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    let motionEvent: boolean | undefined;
    let transparencyEvent: boolean | undefined;
    const motion = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        motionEvent = value;
        if (active)
          setPreferences((current) => ({ ...current, reducedMotion: value }));
      },
    );
    const transparency =
      Platform.OS === "ios"
        ? AccessibilityInfo.addEventListener(
            "reduceTransparencyChanged",
            (value) => {
              transparencyEvent = value;
              if (active)
                setPreferences((current) => ({
                  ...current,
                  reducedTransparency: value,
                }));
            },
          )
        : null;
    Promise.all([
      AccessibilityInfo.isReduceMotionEnabled().catch(
        () => defaults.reducedMotion,
      ),
      Platform.OS === "ios"
        ? AccessibilityInfo.isReduceTransparencyEnabled().catch(
            () => defaults.reducedTransparency,
          )
        : Promise.resolve(defaults.reducedTransparency),
    ]).then(([reducedMotion, reducedTransparency]) => {
      if (!active) return;
      setPreferences({
        reducedMotion: motionEvent ?? reducedMotion,
        reducedTransparency: transparencyEvent ?? reducedTransparency,
      });
      setReady(true);
    });
    return () => {
      active = false;
      motion.remove();
      transparency?.remove();
    };
  }, []);
  return (
    <AccessibilityContext.Provider value={preferences}>
      {ready ? (
        children
      ) : (
        <View style={{ flex: 1, backgroundColor: "#000000" }} />
      )}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
