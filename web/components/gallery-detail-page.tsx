"use client";

import { MotifDetail } from "@/components/motif-detail";
import { Action } from "@/components/ui/action";
import { getPublicBatik, readPublicBatikCache } from "@/lib/automation-api";
import type { Batik } from "@/lib/automation-types";
import { useEffect, useState } from "react";

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
      <div className="mb-3 h-5 w-32 rounded-full skeleton-surface sm:mb-4" />
      <section className="detail-skeleton grid gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(22rem,0.58fr)] xl:grid-cols-[minmax(0,0.72fr)_minmax(22rem,0.52fr)]">
        <div className="detail-skeleton-media">
          <div className="skeleton-block detail-skeleton-main" />
          <div className="detail-skeleton-strip">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="skeleton-block detail-skeleton-thumb" key={index} />
            ))}
          </div>
        </div>
        <aside className="detail-skeleton-panel">
          <div className="skeleton-line skeleton-line-short" />
          <div className="skeleton-line detail-skeleton-title" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-line-title" />
          <div className="detail-skeleton-buttons">
            <div className="skeleton-button-wide" />
            <div className="skeleton-button-wide" />
          </div>
          <div className="detail-skeleton-specs">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="skeleton-line" key={index} />
            ))}
          </div>
          <div className="skeleton-block detail-skeleton-prompt" />
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
