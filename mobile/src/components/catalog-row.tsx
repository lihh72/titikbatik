import { memo, type ComponentProps } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import type { Batik } from "../lib/types";
import { BatikCard } from "./ui";
import CatalogTile from "./catalog-tile";

function CatalogRow({
  row,
  detailed,
  reducedMotion,
  transition,
}: {
  row: (Batik | null)[];
  detailed: boolean;
  reducedMotion: boolean;
  transition: ComponentProps<typeof Animated.View>["layout"];
}) {
  return (
    <Animated.View
      layout={transition}
      style={{
        flexDirection: "row",
        gap: detailed ? 12 : 8,
        paddingHorizontal: 16,
      }}
    >
      {row.map((item, index) => (
        <Animated.View
          layout={transition}
          entering={reducedMotion ? undefined : FadeIn.duration(220)}
          exiting={reducedMotion ? undefined : FadeOut.duration(160)}
          key={item?.id ?? `space-${index}`}
          style={{ flex: 1 }}
        >
          {item &&
            (detailed ? (
              <BatikCard item={item} />
            ) : (
              <CatalogTile item={item} />
            ))}
        </Animated.View>
      ))}
    </Animated.View>
  );
}
export default memo(CatalogRow);
