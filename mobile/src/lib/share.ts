import { Asset } from "expo-asset";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Share } from "react-native";
import type { Media } from "./types";

export async function shareMedia(media: Media, title: string) {
  if (!(await Sharing.isAvailableAsync())) {
    await Share.share({
      message: title,
      ...(typeof media.source === "string" ? { url: media.source } : {}),
    });
    return;
  }
  let uri: string;
  let temporaryFile: File | undefined;
  try {
    if (typeof media.source === "number") {
      const asset = await Asset.fromModule(media.source).downloadAsync();
      uri = asset.localUri ?? asset.uri;
    } else {
      const filename =
        new URL(media.source).pathname.split("/").pop() ?? "batik.webp";
      const extension =
        filename.match(/\.(webp|png|jpg|jpeg|mp4)$/i)?.[1] ??
        (media.kind === "video" ? "mp4" : "webp");
      temporaryFile = await File.downloadFileAsync(
        media.source,
        new File(Paths.cache, `titikbatik-${Date.now()}.${extension}`),
      );
      uri = temporaryFile.uri;
    }
    await Sharing.shareAsync(uri, { dialogTitle: title });
  } finally {
    if (temporaryFile?.exists) temporaryFile.delete();
  }
}
