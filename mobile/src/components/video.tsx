import { useEvent } from "expo";
import { useIsFocused } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { AppState, View } from "react-native";
import { Copy, usePalette } from "./ui";

export function BatikVideo({
  source,
  height,
}: {
  source: number | string;
  height?: number;
}) {
  const p = usePalette();
  const focused = useIsFocused();
  const player = useVideoPlayer(source, (player) => {
    player.loop = false;
  });
  const { status, error } = useEvent(player, "statusChange", {
    status: player.status,
  });
  useEffect(() => {
    if (!focused) player.pause();
    // useVideoPlayer releases and stops playback on unmount. Calling pause in
    // an unmount cleanup would touch a shared object that may already be released.
  }, [focused, player]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") player.pause();
    });
    return () => subscription.remove();
  }, [player]);
  return (
    <View style={{ backgroundColor: p.raised }}>
      <VideoView
        player={player}
        nativeControls
        contentFit="contain"
        fullscreenOptions={{ enable: true }}
        style={
          height
            ? { width: "100%", height }
            : { width: "100%", aspectRatio: 0.8 }
        }
      />
      {status === "error" && (
        <Copy style={{ padding: 16, color: p.accent }}>
          {error?.message ??
            "Video gagal dimuat. Pilih media lain atau buka ulang video."}
        </Copy>
      )}
    </View>
  );
}
