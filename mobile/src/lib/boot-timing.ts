/** Preserve the approved minimum entrance while resources load behind it. */
export function remainingBootHold(elapsed: number, reducedMotion: boolean) {
  return reducedMotion ? 0 : Math.max(0, 520 - Math.max(0, elapsed));
}
