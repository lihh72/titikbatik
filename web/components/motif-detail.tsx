"use client";

import { useApp } from "@/components/app-provider";
import { MotifArt } from "@/components/motif-art";
import type { Motif } from "@/lib/types";
import { ArrowLeft, Bookmark, Check, Heart, MapPinned, Palette, Sparkles } from "lucide-react";
import Link from "next/link";

export function MotifDetail({ motif }: { motif: Motif }) {
  const { likedIds, bookmarkedIds, toggleLike, toggleBookmark } = useApp();
  const liked = likedIds.includes(motif.id);
  const bookmarked = bookmarkedIds.includes(motif.id);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <Link href="/gallery" className="glass-soft mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/60 transition hover:text-white"><ArrowLeft size={15} />Kembali ke galeri</Link>
      <div className="glass-panel grid overflow-hidden rounded-[34px] lg:grid-cols-[1.08fr_.92fr]">
        <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r sm:p-7"><div className="relative aspect-[1.16] overflow-hidden rounded-[28px] border border-white/12 bg-black/25"><MotifArt id={`detail-${motif.id}`} variant={motif.variant} colors={motif.colors} seamless className="h-full w-full" /><div className="absolute left-5 top-5 rounded-full border border-white/18 bg-black/35 px-3 py-1.5 text-xs text-white/75 backdrop-blur-xl">#{motif.id}</div></div><div className="mt-4 grid grid-cols-3 gap-3">{[false, true, false].map((seamless, index) => <div key={index} className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20"><MotifArt id={`detail-thumb-${motif.id}-${index}`} variant={motif.variant} colors={index === 2 ? [motif.colors[1], motif.colors[0], motif.colors[2]] : motif.colors} seamless={seamless} className="h-full w-full" /></div>)}</div></div>

        <div className="p-6 sm:p-9 lg:p-12"><div className="flex items-center gap-2 text-xs uppercase tracking-[.18em] text-[#ffb66c]"><Sparkles size={14} />{motif.category} · {motif.origin}</div><h1 className="mt-4 text-4xl font-semibold tracking-[-.04em]">{motif.title}</h1><p className="mt-5 text-base leading-8 text-white/52">{motif.description}</p>
          <div className="mt-7 flex items-center gap-3"><div className="flex -space-x-1.5">{motif.colors.map((color) => <span key={color} className="h-7 w-7 rounded-full border-2 border-[#171513]" style={{ backgroundColor: color }} />)}</div><span className="text-sm text-white/42">{motif.palette}</span></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="glass-soft rounded-2xl p-4"><MapPinned size={17} className="text-[#ffad5d]" /><div className="mt-3 text-[10px] uppercase tracking-[.15em] text-white/35">Inspirasi</div><div className="mt-1 text-sm font-medium">{motif.origin}</div></div><div className="glass-soft rounded-2xl p-4"><Palette size={17} className="text-[#ffad5d]" /><div className="mt-3 text-[10px] uppercase tracking-[.15em] text-white/35">Kategori</div><div className="mt-1 text-sm font-medium">{motif.category}</div></div><div className="glass-soft rounded-2xl p-4"><Check size={17} className="text-[#ffad5d]" /><div className="mt-3 text-[10px] uppercase tracking-[.15em] text-white/35">Status</div><div className="mt-1 text-sm font-medium">Terkurasi</div></div></div>
          <div className="mt-8 rounded-[24px] border border-white/10 bg-black/18 p-5"><div className="text-[10px] uppercase tracking-[.16em] text-white/34">Informasi publik</div><p className="mt-2 text-sm leading-6 text-white/55">Motif ini ditampilkan sebagai bagian dari galeri digital TitikBatik AI. Detail teknis, prompt, dan alur produksi hanya tersedia bagi tim administrator.</p></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2"><button onClick={() => toggleBookmark(motif.id)} className={`flex items-center justify-center gap-2 rounded-2xl border px-5 py-3.5 text-sm transition hover:scale-[1.02] ${bookmarked ? "border-[#ff9d42]/45 bg-[#ff9d42]/12 text-[#ffbd7e]" : "border-white/12 bg-white/6 text-white/65 hover:bg-white/10"}`}><Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />{bookmarked ? "Tersimpan" : "Simpan motif"}</button><button onClick={() => toggleLike(motif.id)} className={`flex items-center justify-center gap-2 rounded-2xl border px-5 py-3.5 text-sm transition hover:scale-[1.02] ${liked ? "border-rose-300/35 bg-rose-300/10 text-rose-200" : "border-white/10 bg-white/3 text-white/50 hover:bg-white/7 hover:text-white"}`}><Heart size={16} fill={liked ? "currentColor" : "none"} />{liked ? "Disukai" : "Suka motif ini"}</button></div>
        </div>
      </div>
    </main>
  );
}
