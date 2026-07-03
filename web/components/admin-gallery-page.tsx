"use client";

import { useApp } from "@/components/app-provider";
import { MotifArt } from "@/components/motif-art";
import { CheckCircle2, Eye, EyeOff, GalleryHorizontalEnd, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export function AdminGalleryPage() {
  const { history, publishedIds, publishResult, unpublishResult } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  async function changePublication(id: string, published: boolean) {
    setBusyId(id);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/gallery/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
      });
      if (!response.ok && response.status !== 404 && response.status !== 503) {
        const payload = await response.json().catch(() => ({})) as { detail?: string };
        throw new Error(payload.detail ?? "Status publikasi gagal diperbarui.");
      }
      if (published) publishResult(id); else unpublishResult(id);
      setNotice(response.ok
        ? (published ? "Karya berhasil dipublikasikan ke galeri backend." : "Karya berhasil ditarik dari galeri backend.")
        : "FastAPI belum menyimpan hasil ini; status publikasi tetap diterapkan pada mode lokal.");
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Status publikasi gagal diperbarui.");
    } finally {
      setBusyId(null);
    }
  }

  const visible = useMemo(() => history.filter((item) => {
    const published = publishedIds.includes(item.id);
    const matchFilter = filter === "all" || (filter === "published" ? published : !published);
    const normalized = query.trim().toLowerCase();
    const matchQuery = !normalized || [item.title, item.stage, item.prompt].join(" ").toLowerCase().includes(normalized);
    return matchFilter && matchQuery;
  }), [history, publishedIds, query, filter]);

  return (
    <main className="mx-auto max-w-[1480px] px-4 pb-10 sm:px-6 lg:px-8">
      <section className="glass-panel rounded-[34px] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-xs uppercase tracking-[.2em] text-[#ffb66c]"><span className="h-px w-8 bg-[#ff9d42]" />Kurasi Galeri</div><h1 className="mt-4 text-3xl font-semibold tracking-[-.035em] sm:text-5xl">Tentukan karya yang boleh dilihat publik.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">Hasil baru bersifat draft. Tekan Publikasikan hanya setelah motif selesai diperiksa.</p></div><div className="glass-soft flex items-center gap-2 rounded-full px-4 py-2.5 text-xs text-white/55"><ShieldCheck size={14} className="text-[#ffad5d]" />{publishedIds.length} karya publik</div></div>
        <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]"><label className="glass-soft flex items-center gap-3 rounded-2xl px-4 py-3"><Search size={17} className="text-white/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari hasil generate..." className="w-full bg-transparent text-sm outline-none placeholder:text-white/28" /></label><div className="flex gap-2">{(["all", "draft", "published"] as const).map((value) => <button key={value} onClick={() => setFilter(value)} className={`rounded-full border px-4 py-2 text-xs capitalize transition ${filter === value ? "border-[#ff9d42]/45 bg-[#ff9d42]/14 text-[#ffbd7e]" : "border-white/10 bg-white/4 text-white/45 hover:text-white"}`}>{value === "all" ? "Semua" : value === "draft" ? "Draft" : "Published"}</button>)}</div></div>
      </section>
      {notice && <div className="mt-4 rounded-2xl border border-[#ff9d42]/20 bg-[#ff9d42]/8 px-4 py-3 text-sm text-[#ffd2a2]">{notice}</div>}

      {visible.length ? <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((item) => { const published = publishedIds.includes(item.id); return <article key={item.id} className="glass-panel overflow-hidden rounded-[28px] p-2.5"><div className="relative aspect-[1.3] overflow-hidden rounded-[22px] bg-black/25"><MotifArt id={`publish-${item.id}`} variant={item.variant} colors={item.colors} seamless={item.stage === "seamless"} className="h-full w-full" /><span className={`absolute left-4 top-4 flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.14em] backdrop-blur-xl ${published ? "border-emerald-300/25 bg-emerald-400/15 text-emerald-100" : "border-white/15 bg-black/35 text-white/60"}`}>{published ? <Eye size={13} /> : <EyeOff size={13} />}{published ? "Published" : "Draft"}</span></div><div className="p-4"><div className="text-[10px] uppercase tracking-[.15em] text-[#ffb66c]">{item.stage}</div><h2 className="mt-2 font-semibold">{item.title}</h2><p className="mt-3 line-clamp-2 text-xs leading-5 text-white/38">{item.prompt}</p><button onClick={() => changePublication(item.id, !published)} disabled={busyId === item.id} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition hover:scale-[1.02] ${published ? "border border-white/12 bg-white/6 text-white/65 hover:bg-white/10" : "bg-[#ff9d42] text-[#201307] hover:bg-[#ffb363]"}`}>{published ? <EyeOff size={15} /> : <CheckCircle2 size={15} />}{busyId === item.id ? "Menyimpan..." : published ? "Tarik dari Galeri" : "Publikasikan"}</button></div></article>; })}</section> : <section className="glass-panel mt-7 rounded-[34px] p-12 text-center"><GalleryHorizontalEnd size={38} className="mx-auto text-white/20" /><h2 className="mt-5 text-xl font-semibold">Belum ada hasil untuk dikurasi.</h2><p className="mt-2 text-sm text-white/40">Buat hasil baru melalui Studio AI.</p><Link href="/admin/studio" className="mt-6 inline-flex rounded-full bg-[#ff9d42] px-5 py-3 text-sm font-semibold text-[#201307]">Buka Studio AI</Link></section>}
    </main>
  );
}
