"use client";

import { useApp } from "@/components/app-provider";
import type { Batik } from "@/lib/automation-types";
import { Bookmark, Heart, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function MotifCard({ batik }: { batik: Batik }) {
  const { likedIds, bookmarkedIds, toggleLike, toggleBookmark } = useApp();
  const id = String(batik.id);
  const liked = likedIds.includes(id);
  const bookmarked = bookmarkedIds.includes(id);

  return <article className="overflow-hidden border border-white/10 bg-white/4">
    <Link href={`/gallery/${batik.slug}`} className="block">
      <div className="relative aspect-square overflow-hidden bg-black/25">
        {batik.preview_url ? <Image unoptimized fill sizes="(max-width: 768px) 100vw, 420px" src={batik.preview_url} alt={batik.keyword} className="object-cover transition duration-500 hover:scale-[1.03]" /> : <div className="grid h-full place-items-center text-white/30"><ImageOff size={28} /></div>}
      </div>
      <div className="p-4"><p className="text-xs text-[#ffb66c]">{batik.style || "Batik digital"}</p><h2 className="mt-2 line-clamp-2 font-semibold">{batik.keyword}</h2><p className="mt-2 line-clamp-1 text-xs text-white/40">{batik.warna}</p><p className="mt-3 text-xs text-white/30">{new Date(batik.created_at).toLocaleDateString("id-ID")}</p></div>
    </Link>
    <div className="flex gap-2 border-t border-white/8 p-3"><button onClick={() => toggleLike(id)} className={`grid h-9 w-9 place-items-center rounded-full border ${liked ? "border-red-300/30 bg-red-400/10 text-red-200" : "border-white/10 text-white/40"}`} title="Sukai"><Heart size={15} fill={liked ? "currentColor" : "none"} /></button><button onClick={() => toggleBookmark(id)} className={`grid h-9 w-9 place-items-center rounded-full border ${bookmarked ? "border-[#ff9d42]/35 bg-[#ff9d42]/10 text-[#ffb66c]" : "border-white/10 text-white/40"}`} title="Simpan"><Bookmark size={15} fill={bookmarked ? "currentColor" : "none"} /></button><Link href={`/gallery/${batik.slug}`} className="ml-auto flex items-center px-3 text-xs text-[#ffb66c]">Lihat detail</Link></div>
  </article>;
}
