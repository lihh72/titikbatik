"use client";

import { MotifDetail } from "@/components/motif-detail";
import { Action } from "@/components/ui/action";
import { getPublicBatik, readPublicBatikCache } from "@/lib/automation-api";
import type { Batik } from "@/lib/automation-types";
import { useEffect, useState } from "react";

const skeletonSurfaceClass = "relative overflow-hidden bg-[linear-gradient(110deg,transparent_0%,color-mix(in_srgb,var(--paper-raised)_78%,white)_48%,transparent_100%),color-mix(in_srgb,var(--line)_30%,var(--paper))] bg-[length:220%_100%] animate-[skeleton-shimmer_1.35s_ease-in-out_infinite]";
const skeletonLineClass = `${skeletonSurfaceClass} h-3 w-full rounded-full`;
const skeletonButtonClass = `${skeletonSurfaceClass} h-11 w-32 rounded-[var(--radius-sm)]`;

export function GalleryDetailPage({ slug }: { slug: string }) {
  const initialBatik = readPublicBatikCache(slug);
  const [batik, setBatik] = useState<Batik | null>(() => initialBatik);
  const [loading, setLoading] = useState(() => !initialBatik);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug.trim()) return;
    let active = true;

    const cached = readPublicBatikCache(slug);
    if (cached) {
      queueMicrotask(() => {
        if (!active) return;
        setBatik(cached);
        setError(null);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    queueMicrotask(() => {
      if (!active) return;
      setBatik(null);
      setLoading(true);
      setError(null);
    });

    getPublicBatik(slug)
      .then((result) => {
        if (active) {
          setBatik(result);
          setError(null);
        }
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Batik tidak tersedia.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (!slug.trim()) return <NotFound message="Slug batik tidak valid." />;
  if (loading) {
    return <DetailSkeleton />;
  }
  if (!batik) return <NotFound message={error ?? "Batik tidak tersedia."} />;
  return <MotifDetail batik={batik} />;
}

function DetailSkeleton() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-10 pt-3 sm:px-6 sm:pb-14 sm:pt-5 lg:px-8" aria-busy="true">
      <span className="sr-only">Memuat detail batik.</span>
      <div className={`${skeletonSurfaceClass} mb-3 h-5 w-32 rounded-full sm:mb-4`} />
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--paper-raised)]">
          <div className={`${skeletonSurfaceClass} aspect-[1/0.76] min-h-[min(58vh,32rem)]`} />
          <div className="grid grid-cols-4 gap-3 border-t border-[var(--line)] p-[0.9rem]">
            {Array.from({ length: 4 }, (_, index) => (
              <div className={`${skeletonSurfaceClass} aspect-[4/5] rounded-[var(--radius-sm)]`} key={index} />
            ))}
          </div>
        </div>
        <aside className="grid content-start gap-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--paper-raised)] p-5">
          <div className={`${skeletonLineClass} max-w-28`} />
          <div className={`${skeletonLineClass} h-8 w-[86%]`} />
          <div className={skeletonLineClass} />
          <div className={`${skeletonLineClass} h-5 max-w-[88%]`} />
          <div className="flex flex-wrap gap-[0.65rem]">
            <div className={skeletonButtonClass} />
            <div className={skeletonButtonClass} />
          </div>
          <div className="grid grid-cols-2 gap-[0.9rem] border-t border-[var(--line)] pt-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div className={skeletonLineClass} key={index} />
            ))}
          </div>
          <div className={`${skeletonSurfaceClass} h-28 rounded-[var(--radius-sm)]`} />
        </aside>
      </section>
    </main>
  );
}

function NotFound({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20 text-center">
      <div className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper-raised)] p-8">
        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-[color:var(--ink)]">Batik tidak tersedia</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[color:var(--ink-soft)]">{message}</p>
        <div className="mt-7">
          <Action href="/gallery">Kembali ke galeri</Action>
        </div>
      </div>
    </main>
  );
}
