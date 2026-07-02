"use client";

import { useApp } from "@/components/app-provider";
import { MotifArt } from "@/components/motif-art";
import type { Motif } from "@/lib/types";
import { ArrowRight, Bookmark, Heart, Sparkles } from "lucide-react";
import Link from "next/link";

export function MotifCard({ motif }: { motif: Motif }) {
  const { likedIds, bookmarkedIds, toggleLike, toggleBookmark } = useApp();
  const liked = likedIds.includes(motif.id);
  const bookmarked = bookmarkedIds.includes(motif.id);

  return (
    <article className="pattern-card glass-panel group overflow-hidden rounded-[28px] p-2.5 transition duration-500 hover:-translate-y-2 hover:border-white/30 hover:shadow-[0_30px_90px_rgba(0,0,0,.5)]">
      <div className="relative aspect-[1.36] overflow-hidden rounded-[22px] bg-black/20">
        <MotifArt id={`card-${motif.id}`} variant={motif.variant} colors={motif.colors} className="pattern-art h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/5" />
        <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-xs font-semibold tracking-wide text-white/85 backdrop-blur-xl">#{motif.id}</div>
        <button onClick={() => toggleBookmark(motif.id)} className={`absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/25 backdrop-blur-xl transition hover:scale-110 ${bookmarked ? "text-[#ffb363]" : "text-white/70 hover:text-white"}`} aria-label={`Simpan ${motif.title}`}><Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} /></button>
      </div>
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-[10px] uppercase tracking-[.16em] text-[#ffb66c]"><span>{motif.category}</span><span className="h-1 w-1 rounded-full bg-white/30" /><span>{motif.origin}</span></div><h3 className="mt-2 text-lg font-semibold tracking-tight text-white">{motif.title}</h3><div className="mt-2 flex items-center gap-2"><div className="flex -space-x-1">{motif.colors.map((color) => <span key={color} className="h-4 w-4 rounded-full border border-white/40" style={{ backgroundColor: color }} />)}</div><span className="text-[11px] text-white/42">{motif.palette}</span></div></div><Sparkles size={17} className="mt-1 text-[#ffad5d]" /></div>
        <p className="mt-4 min-h-[48px] text-sm leading-6 text-white/55">{motif.description}</p>
        <div className="mt-5 flex gap-2.5"><button onClick={() => toggleLike(motif.id)} className={`flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-medium transition duration-300 hover:scale-[1.03] ${liked ? "border-[#ff9d42]/50 bg-[#ff9d42]/18 text-[#ffc27d]" : "border-white/14 bg-white/6 text-white/70 hover:bg-white/10"}`}><Heart size={16} fill={liked ? "currentColor" : "none"} />Suka <span className="text-xs opacity-55">{motif.likes + (liked ? 1 : 0)}</span></button><Link href={`/gallery/${motif.id}`} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ff9d42] px-4 py-3 text-sm font-semibold text-[#1c1209] shadow-[0_10px_30px_rgba(255,157,66,.25)] transition duration-300 hover:scale-[1.03] hover:bg-[#ffb363]">Detail <ArrowRight size={15} /></Link></div>
      </div>
    </article>
  );
}
