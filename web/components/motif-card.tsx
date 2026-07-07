"use client";

import { useApp } from "@/components/app-provider";
import type { Batik } from "@/lib/automation-types";
import { Bookmark, Heart, ImageOff } from "lucide-react";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { FocusEvent } from "react";
import { useEffect, useState } from "react";

export const HOVER_INTENT_MS = 350;
export const COSTUME_CYCLE_MS = 1500;

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
    if (hasFinePointer()) startPreview();
  }

  function handleFocus() {
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
      className="motif-card"
      data-surface="light"
      onMouseEnter={handlePointerEnter}
      onMouseLeave={stopPreview}
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
    >
      <Link
        href={`/gallery/${batik.slug}`}
        className="motif-card-primary-link"
      >
        <div
          className="motif-card-media aspect-square"
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
              className="motif-card-image"
              data-testid="motif-preview"
            />
          ) : (
            <div className="motif-card-placeholder">
              <ImageOff size={28} aria-hidden="true" />
              <span>Pratinjau belum tersedia</span>
            </div>
          )}
          {costumePreviewUrl && (
            <div className="motif-card-costume-layer" aria-hidden="true">
              <Image
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                src={costumePreviewUrl}
                alt=""
                className="motif-card-costume-image"
                data-testid="costume-preview"
              />
            </div>
          )}
        </div>
        <div className="motif-card-content">
          <p className="motif-card-style">{batik.style || "Batik digital"}</p>
          <h2>{batik.keyword}</h2>
          <p className="motif-card-meta">{batik.warna}</p>
          <time dateTime={batik.created_at}>
            {new Date(batik.created_at).toLocaleDateString("id-ID")}
          </time>
        </div>
      </Link>
      <div className="motif-card-actions">
        <button
          type="button"
          onClick={() => toggleLike(id)}
          className="motif-card-icon-button"
          data-active={liked}
          aria-label="Sukai"
          aria-pressed={liked}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => toggleBookmark(id)}
          className="motif-card-icon-button"
          data-active={bookmarked}
          aria-label="Simpan"
          aria-pressed={bookmarked}
        >
          <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} aria-hidden="true" />
        </button>
        <Link href={`/gallery/${batik.slug}`} className="motif-card-detail-link">
          Lihat detail
        </Link>
      </div>
    </article>
  );
}
