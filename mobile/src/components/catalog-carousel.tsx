import type { Batik } from "../lib/types";
import CatalogIntro from "./catalog-intro";
import LoopCarousel from "./loop-carousel";

export default function CatalogCarousel({ items }: { items: Batik[] }) {
  return (
    <LoopCarousel
      items={items}
      label={(item, index) =>
        `Sorotan ${index + 1} dari ${items.length}: ${item.title}`
      }
      renderSlide={(item, index) => (
        <CatalogIntro
          item={item}
          variant={index}
          hasPagination={items.length > 1}
        />
      )}
    />
  );
}
