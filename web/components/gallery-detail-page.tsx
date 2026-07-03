"use client";

import { useApp } from "@/components/app-provider";
import { MotifDetail } from "@/components/motif-detail";
import { generationToMotif, motifs } from "@/lib/data";
import type { Motif, GenerationResult } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export function GalleryDetailPage({ id }: { id: string }) {
  const { history, publishedIds } = useApp();
  const staticMotif = motifs.find((item) => item.id === id);
  const generated = history.find((item) => item.id === id && publishedIds.includes(item.id));
  const [remoteMotif, setRemoteMotif] = useState<Motif | null>(null);
  const [loading, setLoading] = useState(!staticMotif && !generated);

  useEffect(() => {
    if (staticMotif || generated) return;
    let active = true;
    fetch(`/api/public/gallery/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json() as { result?: GenerationResult };
        return payload.result ? generationToMotif(payload.result) : null;
      })
      .then((result) => { if (active) setRemoteMotif(result); })
      .catch(() => { if (active) setRemoteMotif(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, staticMotif, generated]);

  const motif = staticMotif ?? (generated ? generationToMotif(generated) : remoteMotif);
  if (loading) return <main className="mx-auto max-w-4xl px-4 pb-8 sm:px-6"><section className="glass-panel rounded-[34px] p-12 text-center"><p className="text-sm text-white/45">Memuat detail motif...</p></section></main>;
  if (!motif) return <main className="mx-auto max-w-4xl px-4 pb-8 sm:px-6"><section className="glass-panel rounded-[34px] p-12 text-center"><h1 className="text-3xl font-semibold">Motif tidak tersedia.</h1><p className="mt-3 text-sm text-white/45">Motif mungkin belum dipublikasikan atau telah ditarik dari galeri.</p><Link href="/gallery" className="mt-7 inline-flex rounded-full bg-[#ff9d42] px-5 py-3 text-sm font-semibold text-[#201307]">Kembali ke galeri</Link></section></main>;
  return <MotifDetail motif={motif} />;
}
