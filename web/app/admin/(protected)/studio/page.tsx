import { ExploreWorkspace } from "@/components/explore-workspace";
import { Feedback } from "@/components/ui/feedback";
import { Suspense } from "react";

export const metadata = { title: "Studio Produksi" };

export default function ExplorePage() {
  return (
    <Suspense fallback={<Feedback>Memuat studio produksi.</Feedback>}>
      <ExploreWorkspace />
    </Suspense>
  );
}
