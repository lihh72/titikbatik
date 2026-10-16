import CatalogTileContent from "./catalog-tile-content";
import BatikPreviewLink from "./batik-preview-link";
import { useApp } from "../state/app";
import type { Batik } from "../lib/types";
export default function CatalogTile({ item }: { item: Batik }) {
  const { preferences } = useApp();
  const saved = preferences.saved.some((value) => value.id === item.id);
  return (
    <BatikPreviewLink item={item}>
      <CatalogTileContent item={item} saved={saved} />
    </BatikPreviewLink>
  );
}
