import * as Haptics from "expo-haptics";
import { AppState, Platform } from "react-native";
import { createFeedback } from "./feedback-policy";
export type { FeedbackKind } from "./feedback-policy";

// Never block an action on hardware feedback; coalesce nested press handlers.
export const feedback = createFeedback({
  enabled: () =>
    Platform.OS !== "web" &&
    (!AppState.currentState || AppState.currentState === "active"),
  emit: (kind) =>
    kind === "selection"
      ? Haptics.selectionAsync()
      : kind === "light"
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        : Haptics.notificationAsync(
            kind === "success"
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Error,
          ),
});
