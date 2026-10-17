import CatalogTileContent from "./catalog-tile-content";
import BatikPreviewLink from "./batik-preview-link";
import { useSaved } from "../state/app";
import type { Batik } from "../lib/types";
export default function CatalogTile({ item }: { item: Batik }) {
  const { saved: savedItems } = useSaved();
  const saved = savedItems.some((value) => value.id === item.id);
  return (
    <BatikPreviewLink item={item}>
      <CatalogTileContent item={item} saved={saved} />
    </BatikPreviewLink>
  );
}
