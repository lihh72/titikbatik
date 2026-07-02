"use client";

import { useApp } from "@/components/app-provider";
import { MotifArt } from "@/components/motif-art";
import { downloadResultMetadata } from "@/lib/download";
import type { GenerationStage } from "@/lib/types";
import { Download, History, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const filters: Array<{ value: "all" | GenerationStage; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "motif", label: "Motif" },
  { value: "auto-generate", label: "Auto Generate" },
  { value: "seamless", label: "Seamless" },
  { value: "garment", label: "Batik Baju" },
  { value: "human", label: "Model" },
  { value: "video", label: "Video" },
  { value: "upscale", label: "Upscale" },
];

export function HistoryPage() {
  const { history, removeHistory, clearHistory, publishedIds } = useApp();
  const [filter, setFilter] = useState<"all" | GenerationStage>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return history.filter((item) => {
      const matchStage = filter === "all" || item.stage === filter;
      const matchQuery = !normalized || [item.title, item.prompt, item.stage].join(" ").toLowerCase().includes(normalized);
      return matchStage && matchQuery;
    });
  }, [history, filter, query]);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <section className="glass-panel rounded-[34px] p-5 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[.2em] text-[#ffb66c]"><span className="h-px w-8 bg-[#ff9d42]" />Riwayat Hasil Generate</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-.035em] sm:text-5xl">Hasil eksplorasi tersimpan di perangkat.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">Riwayat ini hanya tersedia pada area administrator. Status publikasi setiap hasil dikelola melalui menu Publikasi Galeri.</p>
          </div>
          {history.length > 0 && <button onClick={clearHistory} className="glass-soft flex w-fit items-center gap-2 rounded-full px-4 py-2.5 text-sm text-white/55 transition hover:border-red-300/20 hover:bg-red-400/8 hover:text-red-200"><Trash2 size={15} /> Hapus semua</button>}
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="glass-soft flex items-center gap-3 rounded-2xl px-4 py-3"><Search size={17} className="text-white/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul atau proses..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/28" /></label>
          <div className="flex flex-wrap gap-2">{filters.map((item) => <button key={item.value} onClick={() => setFilter(item.value)} className={`rounded-full border px-3.5 py-2 text-xs transition ${filter === item.value ? "border-[#ff9d42]/45 bg-[#ff9d42]/14 text-[#ffbd7e]" : "border-white/10 bg-white/4 text-white/45 hover:text-white"}`}>{item.label}</button>)}</div>
        </div>
      </section>

      {visible.length > 0 ? (
        <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <article key={item.id} className="glass-panel overflow-hidden rounded-[28px] p-2.5">
              <div className="aspect-[1.3] overflow-hidden rounded-[22px] bg-black/25"><MotifArt id={`history-${item.id}`} variant={item.variant} colors={item.colors} seamless={item.stage === "seamless"} className="h-full w-full" /></div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3"><div><span className="text-[10px] uppercase tracking-[.15em] text-[#ffb66c]">{item.stage}</span><h2 className="mt-2 font-semibold">{item.title}</h2></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/36">{item.resolution}</span></div>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/38">{item.prompt}</p>
                <div className="mt-4 flex items-center justify-between gap-3 text-[10px] text-white/28"><span>{new Date(item.createdAt).toLocaleString("id-ID")}</span><span className={publishedIds.includes(item.id) ? "text-emerald-300/70" : "text-white/28"}>{publishedIds.includes(item.id) ? "Published" : "Draft"}</span></div>
                <div className="mt-5 flex gap-2">
                  <button onClick={() => downloadResultMetadata(item)} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-2.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"><Download size={14} /> Metadata</button>
                  <button onClick={() => removeHistory(item.id)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/4 text-white/35 transition hover:border-red-300/20 hover:bg-red-400/8 hover:text-red-200" aria-label="Hapus hasil"><Trash2 size={14} /></button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="glass-panel mt-7 rounded-[34px] p-12 text-center">
          <History size={38} className="mx-auto text-white/20" />
          <h2 className="mt-5 text-xl font-semibold">Belum ada hasil pada filter ini.</h2>
          <p className="mt-2 text-sm text-white/40">Jalankan salah satu modul untuk menyimpan hasil baru.</p>
          <Link href="/admin/studio" className="mt-6 inline-flex rounded-full bg-[#ff9d42] px-5 py-3 text-sm font-semibold text-[#201307] transition hover:scale-105 hover:bg-[#ffb363]">Buka Studio AI</Link>
        </section>
      )}
    </main>
  );
}
