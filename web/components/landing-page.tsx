"use client";

import { MotifCard } from "@/components/motif-card";
import { motifs } from "@/lib/data";
import { ArrowRight, Eye, GalleryHorizontalEnd, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="glass-soft rounded-[22px] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/9"><span className="text-xs font-medium uppercase tracking-[0.18em] text-white/48">{label}</span><div className="mt-4 flex items-end justify-between gap-3"><strong className="text-3xl font-semibold tracking-tight text-white">{value}</strong><span className="rounded-full border border-[#ffad5d]/25 bg-[#ff9d42]/12 px-2.5 py-1 text-[10px] font-semibold text-[#ffbd7e]">{note}</span></div></div>;
}

function GalleryWave() {
  return (
    <div className="relative mt-5 min-h-[300px] overflow-hidden rounded-[26px] border border-white/12 bg-black/20 p-5">
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)", backgroundSize: "100% 25%, 12.5% 100%" }} />
      <div className="relative z-10"><div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/42"><span className="h-2 w-2 rounded-full bg-[#ff9d42] shadow-[0_0_12px_#ff9d42]" />Koleksi digital terkurasi</div><h3 className="mt-2 text-2xl font-semibold">Batik Nusantara Modern</h3><p className="mt-2 max-w-xl text-sm leading-6 text-white/45">Setiap karya ditinjau sebelum ditampilkan kepada publik.</p></div>
      <svg viewBox="0 0 900 290" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[70%] w-full" aria-label="Visual gelombang koleksi motif"><defs><linearGradient id="publicArea" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff9d42" stopOpacity=".35" /><stop offset="1" stopColor="#ff9d42" stopOpacity="0" /></linearGradient><linearGradient id="publicLine" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#ffbd7b" /><stop offset=".55" stopColor="#ff8a2b" /><stop offset="1" stopColor="#ffd19a" /></linearGradient></defs><path d="M0 230 C80 220 110 180 170 188 C235 198 270 120 335 138 C402 156 435 74 505 92 C575 110 610 57 680 74 C752 92 785 42 900 48 L900 290 L0 290 Z" fill="url(#publicArea)" /><path className="chart-line" d="M0 230 C80 220 110 180 170 188 C235 198 270 120 335 138 C402 156 435 74 505 92 C575 110 610 57 680 74 C752 92 785 42 900 48" fill="none" stroke="url(#publicLine)" strokeWidth="5" strokeLinecap="round" /></svg>
      <div className="absolute bottom-4 left-5 right-5 z-10 flex justify-between text-[10px] uppercase tracking-[0.18em] text-white/30"><span>Tradisi</span><span>Eksplorasi</span><span>Kurasi</span><span>Publikasi</span></div>
    </div>
  );
}

export function LandingPage() {
  const [shuffle, setShuffle] = useState(0);
  const featured = useMemo(() => { const start = shuffle % motifs.length; return [motifs[start], motifs[(start + 1) % motifs.length], motifs[(start + 2) % motifs.length]]; }, [shuffle]);

  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="glass-panel relative overflow-hidden rounded-[32px] p-4 sm:rounded-[38px] sm:p-6 lg:p-8">
          <div className="absolute right-[-8%] top-[-20%] h-80 w-80 rounded-full bg-[#ff9d42]/10 blur-[90px]" />
          <div className="relative grid gap-8 xl:grid-cols-[1.05fr_.95fr] xl:items-center">
            <div className="py-4 sm:py-10"><div className="mb-5 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#ffb970]"><span className="h-px w-8 bg-[#ff9d42]" />Galeri Batik Nusantara Modern</div><h1 className="max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">Tradisi yang hidup dalam <span className="bg-gradient-to-r from-[#fff2df] via-[#ffbc75] to-[#ff8d31] bg-clip-text text-transparent">koleksi digital terkurasi.</span></h1><p className="mt-6 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">TitikBatik AI menampilkan hasil eksplorasi motif batik yang telah dipilih oleh tim internal. Pengunjung dapat menjelajahi koleksi, melihat detail visual, dan menyimpan motif favorit.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/gallery" className="flex items-center gap-2 rounded-full bg-[#ff9d42] px-6 py-3.5 text-sm font-semibold text-[#201307] shadow-[0_12px_35px_rgba(255,157,66,.25)] transition hover:scale-105 hover:bg-[#ffb363]"><GalleryHorizontalEnd size={17} />Jelajahi Galeri</Link><Link href="/about" className="glass-soft flex items-center gap-2 rounded-full px-6 py-3.5 text-sm text-white/70 transition hover:scale-105 hover:bg-white/10 hover:text-white">Tentang Proyek <ArrowRight size={16} /></Link></div><div className="mt-9 flex flex-wrap gap-3 text-xs text-white/45"><span className="glass-soft flex items-center gap-2 rounded-full px-3 py-2"><ShieldCheck size={14} className="text-[#ffad5d]" />Melalui kurasi admin</span><span className="glass-soft flex items-center gap-2 rounded-full px-3 py-2"><Eye size={14} className="text-[#ffad5d]" />Akses publik hanya galeri</span><span className="glass-soft flex items-center gap-2 rounded-full px-3 py-2"><Sparkles size={14} className="text-[#ffad5d]" />Inspirasi Nusantara</span></div></div>
            <div className="glass-soft rounded-[30px] p-4 sm:p-5"><div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3"><StatCard label="Koleksi Terkurasi" value={String(motifs.length)} note="Publik" /><StatCard label="Kategori" value="4" note="Nusantara" /><StatCard label="Akses" value="Galeri" note="Read only" /></div><GalleryWave /></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-xs uppercase tracking-[.2em] text-[#ffb66c]"><span className="h-px w-8 bg-[#ff9d42]" />Koleksi Favorit</div><h2 className="mt-4 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">Pilihan motif untuk ditemukan hari ini.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Urutan koleksi dapat diacak tanpa membuka fitur produksi internal.</p></div><button onClick={() => setShuffle((value) => value + 1)} className="glass-soft flex w-fit items-center gap-2 rounded-full px-4 py-2.5 text-xs text-white/60 transition hover:scale-105 hover:text-white"><RefreshCw size={14} />Acak koleksi</button></div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{featured.map((motif) => <MotifCard key={`${motif.id}-${shuffle}`} motif={motif} />)}</div>
        <div className="mt-8 text-center"><Link href="/gallery" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm text-white/65 transition hover:scale-105 hover:bg-white/10 hover:text-white">Lihat semua koleksi <ArrowRight size={16} /></Link></div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="glass-panel grid overflow-hidden rounded-[34px] lg:grid-cols-[.9fr_1.1fr]"><div className="relative min-h-[360px] overflow-hidden border-b border-white/10 lg:border-b-0 lg:border-r"><div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_45%,rgba(255,157,66,.23),transparent_28%),linear-gradient(135deg,rgba(18,53,52,.9),rgba(17,17,19,.8))]" /><div className="absolute inset-0 grid place-items-center"><div className="float-slow relative h-64 w-64 rounded-full border border-white/10 bg-white/5 shadow-[0_30px_80px_rgba(0,0,0,.35)] backdrop-blur-xl"><div className="absolute inset-7 rotate-45 rounded-[34px] border border-[#ffb464]/45" /><div className="absolute inset-[4.5rem] -rotate-12 rounded-full border-2 border-[#ead7b9]/65" /><div className="absolute inset-[6.5rem] rounded-[22px] bg-[#ff9d42] shadow-[0_0_35px_rgba(255,157,66,.4)]" /></div></div></div><div className="p-6 sm:p-10 lg:p-14"><span className="inline-flex rounded-full border border-[#ff9d42]/25 bg-[#ff9d42]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#ffbd7e]">Tentang TitikBatik AI</span><h2 className="mt-6 max-w-xl text-3xl font-semibold leading-tight tracking-[-.035em] sm:text-4xl">Teknologi bekerja di belakang layar, galeri tetap sederhana untuk pengunjung.</h2><p className="mt-5 max-w-2xl leading-7 text-white/52">Proses pembuatan, visualisasi, video, seamless pattern, dan peningkatan resolusi hanya tersedia pada area administrator. Pengunjung umum hanya menerima hasil yang sudah dipilih untuk dipublikasikan.</p><Link href="/about" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-[#ffb363]">Pelajari pendekatan kami <ArrowRight size={15} /></Link></div></div></section>
    </main>
  );
}
