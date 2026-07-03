"use client";

import { BatikMedia } from "@/components/batik-media";
import { useApp } from "@/components/app-provider";
import type { Batik } from "@/lib/automation-types";
import { Bookmark, Heart } from "lucide-react";
import Link from "next/link";

export function MotifDetail({ batik }: { batik: Batik }) {
  const { likedIds, bookmarkedIds, toggleLike, toggleBookmark } = useApp();
  const id = String(batik.id);
  return <main className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
    <Link href="/gallery" className="text-sm text-[#ffb66c]">Kembali ke galeri</Link>
    <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
      <BatikMedia batik={batik} />
      <aside className="border border-white/10 bg-white/4 p-5">
        <p className="text-xs uppercase text-[#ffb66c]">Batik #{batik.id}</p><h1 className="mt-3 text-3xl font-semibold">{batik.keyword}</h1><p className="mt-3 text-sm text-white/45">{batik.style} · {batik.warna}</p>
        <div className="mt-5 flex gap-2"><button onClick={() => toggleLike(id)} className="flex items-center gap-2 border border-white/12 px-3 py-2 text-sm"><Heart size={15} fill={likedIds.includes(id) ? "currentColor" : "none"} />Sukai</button><button onClick={() => toggleBookmark(id)} className="flex items-center gap-2 border border-white/12 px-3 py-2 text-sm"><Bookmark size={15} fill={bookmarkedIds.includes(id) ? "currentColor" : "none"} />Simpan</button></div>
        <dl className="mt-6 space-y-3 text-sm"><div><dt className="text-white/35">Seed</dt><dd className="mt-1">{batik.seed}</dd></div><div><dt className="text-white/35">Dibuat</dt><dd className="mt-1">{new Date(batik.created_at).toLocaleString("id-ID")}</dd></div><div><dt className="text-white/35">Costume</dt><dd className="mt-1">{batik.costume_files.length}</dd></div></dl>
        {batik.positive_prompt && <div className="mt-6 border-t border-white/10 pt-5"><p className="text-xs text-white/35">Prompt</p><p className="mt-2 text-sm leading-6 text-white/60">{batik.positive_prompt}</p></div>}
      </aside>
    </div>
  </main>;
}
