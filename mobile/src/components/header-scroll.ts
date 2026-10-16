import {
  useAnimatedScrollHandler,
  useSharedValue,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";
import { headerFadeProgress } from "../lib/header-fade";

export function useHeaderScroll(
  onPosition?: (offset: number, size: number, viewport: number) => void,
  externalProgress?: SharedValue<number>,
) {
  const internalProgress = useSharedValue(0);
  const initialOffset = useSharedValue<number | null>(null);
  const hasDragged = useSharedValue(false);
  const progress = externalProgress ?? internalProgress;
  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      hasDragged.value = true;
    },
    onScroll: (event) => {
      const offset = event.contentOffset.y;
      // UIKit can report automatic adjusted insets separately from event.contentInset.
      // Capture its initial resting offset before the first gesture, never during overscroll.
      if (externalProgress && !hasDragged.value)
        initialOffset.value = Math.min(initialOffset.value ?? 0, offset);
      progress.value = externalProgress
        ? headerFadeProgress(offset, -(initialOffset.value ?? 0))
        : headerFadeProgress(offset, event.contentInset?.top ?? 0);
      if (onPosition)
        runOnJS(onPosition)(
          event.contentOffset.y,
          event.contentSize.height,
          event.layoutMeasurement.height,
        );
    },
  });
  return { progress, onScroll };
}
