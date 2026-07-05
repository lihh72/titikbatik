"use client";

import { MotifDetail } from "@/components/motif-detail";
import { Action } from "@/components/ui/action";
import { Feedback } from "@/components/ui/feedback";
import { getPublicBatik } from "@/lib/automation-api";
import type { Batik } from "@/lib/automation-types";
import { useEffect, useState } from "react";

export function GalleryDetailPage({ slug }: { slug: string }) {
  const [batik, setBatik] = useState<Batik | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug.trim()) return;
    let active = true;
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
    return (
      <main className="mx-auto max-w-4xl px-4 py-20">
        <Feedback>Memuat detail batik.</Feedback>
      </main>
    );
  }
  if (!batik) return <NotFound message={error ?? "Batik tidak tersedia."} />;
  return <MotifDetail batik={batik} />;
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
