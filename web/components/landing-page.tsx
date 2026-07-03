"use client";

import { MotifCard } from "@/components/motif-card";
import { listPublicBatiks } from "@/lib/automation-api";
import type { Batik } from "@/lib/automation-types";
import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function LandingPage() {
  const [items, setItems] = useState<Batik[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listPublicBatiks({ page: 1, perPage: 3 })
      .then((result) => { if (active) setItems(result.items); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <main className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
    <section className="flex min-h-[52vh] flex-col justify-center border-b border-white/10 py-14">
      <p className="text-xs uppercase text-[#ffb66c]">Indonesian Generative Textile</p>
      <h1 className="mt-4 max-w-5xl text-5xl font-semibold sm:text-7xl">TitikBatik AI</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-white/50">Galeri motif, costume, dan visualisasi video yang telah dikurasi dari pipeline automation Titik Batik.</p>
      <Link href="/gallery" className="mt-8 flex w-fit items-center gap-2 bg-[#ff9d42] px-6 py-3.5 text-sm font-semibold text-[#201307]">Jelajahi galeri <ArrowRight size={16} /></Link>
    </section>
    <section className="py-10"><div className="flex items-end justify-between gap-4"><div><p className="text-xs uppercase text-[#ffb66c]">Terbaru</p><h2 className="mt-2 text-2xl font-semibold">Batik terpublikasi</h2></div><Link href="/gallery" className="text-sm text-[#ffb66c]">Lihat semua</Link></div>{loading ? <p className="mt-8 flex items-center gap-2 text-sm text-white/45"><LoaderCircle size={16} className="animate-spin" />Memuat karya...</p> : items.length ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map((batik) => <MotifCard key={batik.id} batik={batik} />)}</div> : <p className="mt-8 text-sm text-white/40">Belum ada karya yang dipublikasikan.</p>}</section>
  </main>;
}
