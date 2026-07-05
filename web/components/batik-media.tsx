"use client";

import type { Batik } from "@/lib/automation-types";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type MediaItem = {
  id: string;
  kind: "image" | "video";
  url: string;
  label: string;
};

export function BatikMedia({ batik }: { batik: Batik }) {
  const mediaItems = useMemo(() => buildMediaItems(batik), [batik]);
  const [selection, setSelection] = useState({ batikId: batik.id, mediaId: "" });
  const [hasOverflow, setHasOverflow] = useState(false);
  const thumbnailStrip = useRef<HTMLDivElement>(null);
  const selectedId = selection.batikId === batik.id ? selection.mediaId : "";
  const selected = mediaItems.find((item) => item.id === selectedId) ?? mediaItems[0];

  useEffect(() => {
    const updateOverflow = () => {
      const strip = thumbnailStrip.current;
      setHasOverflow(Boolean(strip && strip.scrollWidth > strip.clientWidth));
    };
    const timer = window.setTimeout(updateOverflow, 0);
    window.addEventListener("resize", updateOverflow);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateOverflow);
    };
  }, [batik.id, mediaItems.length]);

  function scrollThumbnails(direction: -1 | 1) {
    thumbnailStrip.current?.scrollBy({ left: direction * 240, behavior: "smooth" });
  }

  return (
    <section className="batik-media" aria-label={`Media batik ${batik.keyword}`}>
      <div className="batik-media-viewer">
        {!selected ? (
          <div className="batik-media-empty" role="status">Media belum tersedia</div>
        ) : selected.kind === "image" ? (
          <Image
            unoptimized
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 760px"
            src={selected.url}
            alt={selected.label}
            className="batik-media-main-image"
            data-testid="main-image"
          />
        ) : (
          <video
            key={selected.url}
            data-testid="main-video"
            src={selected.url}
            muted
            controls
            playsInline
            preload="metadata"
            className="batik-media-main-video"
          />
        )}
      </div>

      {mediaItems.length > 0 && (
        <div className="batik-media-strip-row">
          {hasOverflow && (
            <button
              type="button"
              onClick={() => scrollThumbnails(-1)}
              className="batik-media-scroll-button"
              aria-label="Thumbnail sebelumnya"
              title="Thumbnail sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          <div ref={thumbnailStrip} className="batik-media-thumbnails">
            {mediaItems.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Tampilkan ${item.label}`}
                aria-pressed={item.id === selected?.id}
                data-selected={item.id === selected?.id}
                className="batik-media-thumbnail relative aspect-[4/5] w-20 sm:w-24"
                onClick={() => setSelection({ batikId: batik.id, mediaId: item.id })}
              >
                {item.kind === "image" ? (
                  <Image
                    unoptimized
                    fill
                    sizes="96px"
                    src={item.url}
                    alt={`Thumbnail ${item.label}`}
                    className="batik-media-thumbnail-image"
                  />
                ) : (
                  <>
                    <video
                      src={item.url}
                      muted
                      playsInline
                      preload="metadata"
                      className="batik-media-thumbnail-video"
                    />
                    <span className="batik-media-play-layer" aria-hidden="true">
                      <Play size={20} fill="currentColor" />
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>

          {hasOverflow && (
            <button
              type="button"
              onClick={() => scrollThumbnails(1)}
              className="batik-media-scroll-button"
              aria-label="Thumbnail berikutnya"
              title="Thumbnail berikutnya"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function buildMediaItems(batik: Batik): MediaItem[] {
  const items: MediaItem[] = [];
  if (batik.preview_url) {
    items.push({ id: "preview", kind: "image", url: batik.preview_url, label: `Motif ${batik.keyword}` });
  }
  batik.costume_files.forEach((costume, index) => {
    const templateName = costume.template?.name ?? `Template ${costume.template_id ?? index + 1}`;
    const costumeUrl = batik.costume_urls[index];
    if (costumeUrl) {
      items.push({ id: `costume-${costume.id}`, kind: "image", url: costumeUrl, label: `Costume ${templateName}` });
    }
    if (costume.video_url) {
      items.push({ id: `video-${costume.id}`, kind: "video", url: costume.video_url, label: `Video ${templateName}` });
    }
  });
  return items;
}
