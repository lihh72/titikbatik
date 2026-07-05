"use client";

import { useApp } from "@/components/app-provider";
import { BatikMedia } from "@/components/batik-media";
import { Action } from "@/components/ui/action";
import type { Batik } from "@/lib/automation-types";
import { Bookmark, Heart } from "lucide-react";
import Link from "next/link";

export function MotifDetail({ batik }: { batik: Batik }) {
  const { likedIds, bookmarkedIds, toggleLike, toggleBookmark } = useApp();
  const id = String(batik.id);
  const liked = likedIds.includes(id);
  const bookmarked = bookmarkedIds.includes(id);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/gallery" className="text-sm font-semibold text-[color:var(--terracotta-dark)] underline-offset-4 hover:underline">
          Kembali ke galeri
        </Link>
      </div>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.62fr)] lg:items-start">
        <BatikMedia batik={batik} />

        <aside className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper-raised)] p-6 shadow-[0_24px_70px_rgba(88,70,49,0.09)] sm:p-8">
          <p className="text-sm font-semibold text-[color:var(--terracotta-dark)]">Batik #{batik.id}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-none tracking-[-0.045em] text-[color:var(--ink)] sm:text-5xl">
            {batik.keyword}
          </h1>
          <p className="mt-5 text-base leading-7 text-[color:var(--ink-soft)]">
            {batik.style || "Batik digital"} dengan palet {batik.warna || "warna belum tercatat"}.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => toggleLike(id)}
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--line)] px-4 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--terracotta-dark)] hover:text-[color:var(--terracotta-dark)]"
              aria-pressed={liked}
            >
              <Heart size={16} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
              Sukai
            </button>
            <button
              type="button"
              onClick={() => toggleBookmark(id)}
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--line)] px-4 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--terracotta-dark)] hover:text-[color:var(--terracotta-dark)]"
              aria-pressed={bookmarked}
            >
              <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} aria-hidden="true" />
              Simpan
            </button>
          </div>

          <dl className="mt-8 grid gap-4 border-t border-[color:var(--line)] pt-6 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-[color:var(--ink)]">Seed</dt>
              <dd className="mt-1 text-[color:var(--ink-soft)]">{batik.seed}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[color:var(--ink)]">Dibuat</dt>
              <dd className="mt-1 text-[color:var(--ink-soft)]">{new Date(batik.created_at).toLocaleString("id-ID")}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[color:var(--ink)]">Style</dt>
              <dd className="mt-1 text-[color:var(--ink-soft)]">{batik.style || "Tidak tercatat"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[color:var(--ink)]">Media costume</dt>
              <dd className="mt-1 text-[color:var(--ink-soft)]">{batik.costume_files.length}</dd>
            </div>
          </dl>

          {batik.positive_prompt && (
            <details className="mt-7 rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[color:var(--paper)] p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[color:var(--ink)]">Prompt sumber</summary>
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">{batik.positive_prompt}</p>
            </details>
          )}

          <div className="mt-7">
            <Action href="/gallery" variant="secondary">Lihat koleksi lain</Action>
          </div>
        </aside>
      </section>
    </main>
  );
}
