"use client";

import { MotifCard } from "@/components/motif-card";
import { listPublicBatiks } from "@/lib/automation-api";
import type { Batik, Pagination } from "@/lib/automation-types";
import { AlertCircle, LoaderCircle, Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export function GalleryPage() {
  const [items, setItems] = useState<Batik[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, per_page: 32, total: 0, total_pages: 0 });
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listPublicBatiks({ page, perPage: 32, query: activeQuery })
      .then((result) => { if (active) { setItems(result.items); setPagination(result.pagination); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Galeri gagal dimuat."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [activeQuery, page]);

  function search(event: FormEvent) { event.preventDefault(); setLoading(true); setError(null); setPage(1); setActiveQuery(query.trim()); }

  return <main className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
    <header className="border-b border-white/10 pb-7"><p className="text-xs uppercase text-[#ffb66c]">Galeri Publik</p><div className="mt-3 flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-3xl font-semibold sm:text-4xl">Koleksi batik terpublikasi</h1><p className="mt-3 text-sm text-white/45">{pagination.total} karya tersedia dari server Titik Batik.</p></div><form onSubmit={search} className="flex min-w-[280px] border border-white/12 bg-white/5"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari keyword, warna, atau style" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none" /><button className="grid w-12 place-items-center" title="Cari"><Search size={17} /></button></form></div></header>
    {error && <div className="mt-5 flex gap-2 border border-red-400/20 bg-red-400/8 p-4 text-sm text-red-100/80"><AlertCircle size={17} />{error}</div>}
    {loading ? <div className="flex items-center gap-2 py-20 text-sm text-white/45"><LoaderCircle size={17} className="animate-spin" />Memuat galeri...</div> : items.length ? <><section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map((batik) => <MotifCard key={batik.id} batik={batik} />)}</section><div className="mt-7 flex items-center justify-center gap-3"><button disabled={page <= 1} onClick={() => { setLoading(true); setPage((value) => value - 1); }} className="border border-white/12 px-4 py-2 text-sm disabled:opacity-30">Sebelumnya</button><span className="text-sm text-white/45">{pagination.page} / {Math.max(pagination.total_pages, 1)}</span><button disabled={page >= pagination.total_pages} onClick={() => { setLoading(true); setPage((value) => value + 1); }} className="border border-white/12 px-4 py-2 text-sm disabled:opacity-30">Berikutnya</button></div></> : <div className="py-20 text-center"><h2 className="text-xl font-medium">Belum ada batik terpublikasi.</h2><p className="mt-2 text-sm text-white/40">Admin dapat mempublikasikan hasil dari halaman Batik.</p></div>}
  </main>;
}
