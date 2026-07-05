"use client";

import { useApp } from "@/components/app-provider";
import type { Batik } from "@/lib/automation-types";
import { Bookmark, Heart, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function MotifCard({ batik }: { batik: Batik }) {
  const { likedIds, bookmarkedIds, toggleLike, toggleBookmark } = useApp();
  const id = String(batik.id);
  const liked = likedIds.includes(id);
  const bookmarked = bookmarkedIds.includes(id);
  const [showCostumePreview, setShowCostumePreview] = useState(false);
  const costumePreviewUrl = batik.costume_urls[0] ?? null;
  const activePreviewUrl = showCostumePreview && costumePreviewUrl ? costumePreviewUrl : batik.preview_url;
  const activePreviewAlt = showCostumePreview && costumePreviewUrl
    ? `Kostum ${batik.keyword}`
    : `Motif ${batik.keyword}`;

  return (
    <article className="motif-card" data-surface="light">
      <Link
        href={`/gallery/${batik.slug}`}
        className="motif-card-primary-link"
        onMouseEnter={() => setShowCostumePreview(Boolean(costumePreviewUrl))}
        onMouseLeave={() => setShowCostumePreview(false)}
        onFocus={() => setShowCostumePreview(Boolean(costumePreviewUrl))}
        onBlur={() => setShowCostumePreview(false)}
      >
        <div className="motif-card-media" data-ratio="1:1" data-preview-mode={showCostumePreview && costumePreviewUrl ? "costume" : "motif"}>
          {activePreviewUrl ? (
            <Image
              unoptimized
              fill
              sizes="(max-width: 768px) 100vw, 420px"
              src={activePreviewUrl}
              alt={activePreviewAlt}
              className="motif-card-image"
            />
          ) : (
            <div className="motif-card-placeholder">
              <ImageOff size={28} aria-hidden="true" />
              <span>Pratinjau belum tersedia</span>
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
