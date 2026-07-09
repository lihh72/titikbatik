"use client";

import { useApp } from "@/components/app-provider";
import { prefetchPublicBatik } from "@/lib/automation-api";
import type { Batik } from "@/lib/automation-types";
import { Bookmark, Heart, ImageOff } from "lucide-react";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { FocusEvent } from "react";
import { useEffect, useState } from "react";

export const HOVER_INTENT_MS = 350;
export const COSTUME_CYCLE_MS = 1500;

const cardClass =
  "motif-card group overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--paper-raised)] text-[color:var(--ink)] transition-[border-color,transform] duration-[180ms] hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--terracotta-dark)_58%,var(--line))]";

const primaryLinkClass = "block focus-visible:outline-offset-[-4px]";

const iconButtonClass =
  "motif-card-icon-button grid size-11 place-items-center rounded-[var(--radius-sm)] border border-[var(--line)] bg-transparent text-[color:var(--ink-soft)] transition-[color,background-color,border-color,transform] duration-[180ms] hover:border-[color:var(--ink-soft)] hover:bg-[color-mix(in_srgb,var(--line)_22%,transparent)] hover:text-[color:var(--ink)] active:translate-y-px active:scale-[0.98]";

const activeIconButtonClass =
  "border-[color:color-mix(in_srgb,var(--terracotta-dark)_55%,var(--line))] bg-[color-mix(in_srgb,var(--terracotta)_11%,var(--paper-raised))] text-[color:var(--terracotta-dark)]";

function hasFinePointer() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function MotifCard({ batik }: { batik: Batik }) {
  const { likedIds, bookmarkedIds, toggleLike, toggleBookmark } = useApp();
  const id = String(batik.id);
  const liked = likedIds.includes(id);
  const bookmarked = bookmarkedIds.includes(id);
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(false);
  const [costumeIndex, setCostumeIndex] = useState(-1);
  const hasCostumePreviews = batik.costume_urls.length > 0;
  const costumePreviewUrl = costumeIndex >= 0 ? batik.costume_urls[costumeIndex] : null;

  useEffect(() => {
    if (!active || !hasCostumePreviews || reduceMotion) return;

    const intent = window.setTimeout(() => setCostumeIndex(0), HOVER_INTENT_MS);
    return () => window.clearTimeout(intent);
  }, [active, hasCostumePreviews, reduceMotion]);

  useEffect(() => {
    if (costumeIndex < 0 || reduceMotion || batik.costume_urls.length < 2) return;

    const cycle = window.setInterval(() => {
      setCostumeIndex((value) => (value + 1) % batik.costume_urls.length);
    }, COSTUME_CYCLE_MS);

    return () => window.clearInterval(cycle);
  }, [batik.costume_urls.length, costumeIndex, reduceMotion]);

  function startPreview() {
    if (!hasCostumePreviews) return;
    setActive(true);
    if (reduceMotion) setCostumeIndex(0);
  }

  function stopPreview() {
    setActive(false);
    setCostumeIndex(-1);
  }

  function handlePointerEnter() {
    prefetchPublicBatik(batik.slug);
    if (hasFinePointer()) startPreview();
  }

  function handleFocus() {
    prefetchPublicBatik(batik.slug);
    startPreview();
  }

  function handleBlur(event: FocusEvent<HTMLElement>) {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    stopPreview();
  }

  return (
    <article
      aria-label={batik.keyword}
      className={cardClass}
      data-surface="light"
      onMouseEnter={handlePointerEnter}
      onMouseLeave={stopPreview}
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
    >
      <Link
        href={`/gallery/${batik.slug}`}
        prefetch
        scroll
        className={primaryLinkClass}
        onPointerEnter={() => prefetchPublicBatik(batik.slug)}
        onFocus={() => prefetchPublicBatik(batik.slug)}
      >
        <div
          className="relative aspect-square overflow-hidden bg-[color-mix(in_srgb,var(--line)_35%,var(--paper))]"
          data-preview-mode={costumePreviewUrl ? "costume" : "motif"}
          data-ratio="1:1"
          data-testid="motif-frame"
        >
          {batik.preview_url ? (
            <Image
              fill
              sizes="(max-width: 768px) 100vw, 420px"
              src={batik.preview_url}
              alt={`Motif ${batik.keyword}`}
              className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.025] group-focus-visible:scale-[1.025]"
              data-testid="motif-preview"
            />
          ) : (
            <div className="grid h-full place-content-center justify-items-center gap-[0.65rem] text-[0.78rem] text-[color:var(--ink-soft)]">
              <ImageOff size={28} aria-hidden="true" />
              <span>Pratinjau belum tersedia</span>
            </div>
          )}
          {costumePreviewUrl && (
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <Image
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                src={costumePreviewUrl}
                alt=""
                className="animate-[motif-costume-fade_260ms_ease_both] object-cover"
                data-testid="costume-preview"
              />
            </div>
          )}
        </div>
        <div className="min-h-[10.75rem] p-5">
          <p className="m-0 text-xs font-bold text-[color:var(--terracotta-dark)]">{batik.style || "Batik digital"}</p>
          <h2 className="mt-2 line-clamp-2 text-[1.05rem] leading-[1.35] font-bold">{batik.keyword}</h2>
          <p className="motif-card-meta mt-[0.65rem] truncate text-[0.78rem] text-[color:var(--ink-soft)]">{batik.warna}</p>
          <time className="mt-4 block text-xs text-[color:color-mix(in_srgb,var(--ink-soft)_88%,var(--ink))]" dateTime={batik.created_at}>
            {new Date(batik.created_at).toLocaleDateString("id-ID")}
          </time>
        </div>
      </Link>
      <div className="flex items-center gap-2 border-t border-[var(--line)] p-3">
        <button
          type="button"
          onClick={() => toggleLike(id)}
          className={`${iconButtonClass} ${liked ? activeIconButtonClass : ""}`}
          data-active={liked}
          aria-label="Sukai"
          aria-pressed={liked}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => toggleBookmark(id)}
          className={`${iconButtonClass} ${bookmarked ? activeIconButtonClass : ""}`}
          data-active={bookmarked}
          aria-label="Simpan"
          aria-pressed={bookmarked}
        >
          <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} aria-hidden="true" />
        </button>
        <Link
          href={`/gallery/${batik.slug}`}
          prefetch
          scroll
          className="ml-auto inline-flex min-h-11 items-center px-[0.65rem] text-[0.78rem] font-bold text-[color:var(--terracotta-dark)] underline decoration-transparent underline-offset-4 hover:decoration-current focus-visible:decoration-current"
          onPointerEnter={() => prefetchPublicBatik(batik.slug)}
          onFocus={() => prefetchPublicBatik(batik.slug)}
        >
          Lihat detail
        </Link>
      </div>
    </article>
  );
}
