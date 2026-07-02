"use client";

import { useApp } from "@/components/app-provider";
import { moduleItems } from "@/lib/data";
import { ArrowRight, Eye, GalleryHorizontalEnd, History, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import Link from "next/link";

export function AdminDashboard() {
  const { history, publishedIds } = useApp();
  const draftCount = history.filter((item) => !publishedIds.includes(item.id)).length;

  return (
    <main className="mx-auto max-w-[1480px] px-4 pb-10 sm:px-6 lg:px-8">
      <section className="glass-panel overflow-hidden rounded-[34px] p-6 sm:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[.2em] text-[#ffb66c]"><span className="h-px w-8 bg-[#ff9d42]" />Dashboard Administrator</div>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-.04em] sm:text-6xl">Kelola proses AI tanpa mengekspos fiturnya kepada pengguna umum.</h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/48">Seluruh hasil masuk sebagai draft. Hanya motif yang dipilih dan dipublikasikan oleh admin yang muncul di galeri publik.</p>
          </div>
          <Link href="/admin/studio" className="flex w-fit items-center gap-2 rounded-full bg-[#ff9d42] px-6 py-3.5 text-sm font-semibold text-[#201307] transition hover:scale-105 hover:bg-[#ffb363]"><WandSparkles size={17} />Buka Studio AI</Link>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Modul internal", value: "7", note: "FR-01—FR-07", icon: ShieldCheck },
            { label: "Total hasil", value: String(history.length), note: "Riwayat lokal", icon: History },
            { label: "Menunggu kurasi", value: String(draftCount), note: "Status draft", icon: Sparkles },
            { label: "Dipublikasikan", value: String(publishedIds.length), note: "Tampil publik", icon: Eye },
          ].map(({ label, value, note, icon: Icon }) => <article key={label} className="glass-soft rounded-[24px] p-5"><Icon size={18} className="text-[#ffad5d]" /><div className="mt-5 text-xs uppercase tracking-[.16em] text-white/38">{label}</div><div className="mt-2 text-3xl font-semibold">{value}</div><p className="mt-2 text-xs text-white/35">{note}</p></article>)}
        </div>
      </section>

      <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {moduleItems.map((item) => <Link key={item.id} href={`/admin/studio?module=${item.id}`} className="glass-panel group rounded-[26px] p-5 transition hover:-translate-y-1 hover:border-white/25"><div className="flex items-center justify-between"><span className="rounded-full border border-[#ff9d42]/25 bg-[#ff9d42]/10 px-3 py-1 text-[10px] font-semibold tracking-[.16em] text-[#ffbd7e]">{item.code}</span><ArrowRight size={15} className="text-white/25 transition group-hover:translate-x-1 group-hover:text-[#ffad5d]" /></div><h2 className="mt-5 font-semibold">{item.label}</h2><p className="mt-2 text-sm leading-6 text-white/42">{item.description}</p></Link>)}
      </section>

      <section className="mt-7 grid gap-5 lg:grid-cols-2">
        <Link href="/admin/history" className="glass-panel group rounded-[30px] p-7 transition hover:border-white/25"><History size={22} className="text-[#ffad5d]" /><h2 className="mt-5 text-2xl font-semibold">Periksa riwayat hasil</h2><p className="mt-3 text-sm leading-6 text-white/45">Lihat metadata dan hasil dari seluruh modul internal.</p><span className="mt-5 flex items-center gap-2 text-sm text-[#ffb363]">Buka riwayat <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span></Link>
        <Link href="/admin/gallery" className="glass-panel group rounded-[30px] p-7 transition hover:border-white/25"><GalleryHorizontalEnd size={22} className="text-[#ffad5d]" /><h2 className="mt-5 text-2xl font-semibold">Kurasi dan publikasi galeri</h2><p className="mt-3 text-sm leading-6 text-white/45">Pilih hasil yang layak untuk ditampilkan kepada pengguna umum.</p><span className="mt-5 flex items-center gap-2 text-sm text-[#ffb363]">Kelola publikasi <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span></Link>
      </section>
    </main>
  );
}
