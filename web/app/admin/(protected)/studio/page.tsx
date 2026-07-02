import { ExploreWorkspace } from "@/components/explore-workspace";
import { Suspense } from "react";

export const metadata = { title: "Studio Eksplorasi" };

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-20 text-center text-white/50">Memuat studio...</div>}>
      <ExploreWorkspace />
    </Suspense>
  );
}
