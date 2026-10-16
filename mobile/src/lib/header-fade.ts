/** Automatic UIKit insets start at a negative scroll offset; manual list padding starts at zero. */
export function headerFadeProgress(offset: number, inset: number) {
  "worklet";
  return Math.min(1, Math.max(0, (offset + inset) / 64));
}
