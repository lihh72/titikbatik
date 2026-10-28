/** Let SDK 58 use its native bar instead of opting into a legacy transparent bar. */
export function nativeHeaderAppearance(
  platform: string,
  version: string | number,
  reducedTransparency: boolean,
  paper: string,
) {
  const major = Number.parseInt(String(version), 10);
  const systemBar = platform === "ios" && major >= 26 && !reducedTransparency;
  return {
    headerTransparent: systemBar
      ? undefined
      : platform === "ios" && !reducedTransparency,
    headerStyle: systemBar
      ? undefined
      : {
          backgroundColor:
            platform === "ios" && !reducedTransparency ? "transparent" : paper,
        },
    scrollEdgeEffects: {
      top: reducedTransparency
        ? ("hidden" as const)
        : platform === "ios" && major >= 27
          ? ("soft" as const)
          : ("automatic" as const),
    },
  };
}
