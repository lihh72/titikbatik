"use client";

import { useApp } from "@/components/app-provider";
import { MotifCard } from "@/components/motif-card";
import { generationToMotif, motifs } from "@/lib/data";
import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const categories = ["Semua", "Klasik", "Modern", "Keraton", "Pesisir"] as const;

export function GalleryPage() {
  const { history, publishedIds } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Semua");
  const [sort, setSort] = useState("populer");
  const [remotePublished, setRemotePublished] = useState<ReturnType<typeof generationToMotif>[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/public/gallery", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { results: [] })
      .then((payload: { results?: import("@/lib/types").GenerationResult[] }) => {
        if (active) setRemotePublished((payload.results ?? []).map(generationToMotif));
      })
      .catch(() => { if (active) setRemotePublished([]); });
    return () => { active = false; };
  }, []);

  const publishedMotifs = useMemo(() => history.filter((item) => publishedIds.includes(item.id)).map(generationToMotif), [history, publishedIds]);
  const allMotifs = useMemo(() => {
    const unique = new Map<string, (typeof motifs)[number]>();
    [...remotePublished, ...publishedMotifs, ...motifs].forEach((item) => unique.set(item.id, item));
    return [...unique.values()];
  }, [publishedMotifs, remotePublished]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = allMotifs.filter((motif) => {
      const matchQuery = !normalized || [motif.title, motif.origin, motif.category, motif.description].join(" ").toLowerCase().includes(normalized);
      const matchCategory = category === "Semua" || motif.category === category;
      return matchQuery && matchCategory;
    });
    return [...result].sort((a, b) => {
      if (sort === "judul") return a.title.localeCompare(b.title, "id");
      if (sort === "terbaru") return b.id.localeCompare(a.id);
      return b.likes - a.likes;
    });
  }, [query, category, sort, allMotifs]);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <section className="glass-panel rounded-[34px] p-5 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[.2em] text-[#ffb66c]"><span className="h-px w-8 bg-[#ff9d42]" />Galeri Motif</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-.035em] sm:text-5xl">Jelajahi koleksi batik digital terkurasi.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">Semua motif pada halaman ini telah dipilih untuk ditampilkan kepada pengguna umum. Fitur produksi dan pengolahan AI tidak tersedia pada area publik.</p>
          </div>
          <div className="glass-soft flex items-center gap-2 rounded-full px-4 py-2.5 text-xs text-white/55"><SlidersHorizontal size={14} className="text-[#ffad5d]" />{filtered.length} motif ditemukan</div>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label className="glass-soft flex items-center gap-3 rounded-2xl px-4 py-3"><Search size={17} className="text-white/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari Ceplok, Cirebon, modern..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/28" /></label>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="glass-soft rounded-2xl px-4 py-3 text-sm text-white outline-none"><option value="populer">Paling populer</option><option value="terbaru">Terbaru</option><option value="judul">Judul A–Z</option></select>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full border px-4 py-2 text-xs transition ${category === item ? "border-[#ff9d42]/45 bg-[#ff9d42]/14 text-[#ffbd7e]" : "border-white/10 bg-white/4 text-white/48 hover:bg-white/8 hover:text-white"}`}>{item}</button>)}</div>
      </section>

      <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((motif) => <MotifCard key={motif.id} motif={motif} />)}</section>
      {filtered.length === 0 && <div className="glass-panel mt-7 rounded-[30px] p-10 text-center"><p className="text-lg font-medium">Motif tidak ditemukan.</p><p className="mt-2 text-sm text-white/40">Coba kata kunci atau kategori lain.</p></div>}
    </main>
  );
}
