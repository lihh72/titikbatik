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
    const frame = window.requestAnimationFrame(updateOverflow);
    window.addEventListener("resize", updateOverflow);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateOverflow);
    };
  }, [mediaItems.length]);

  function scrollThumbnails(direction: -1 | 1) {
    thumbnailStrip.current?.scrollBy({ left: direction * 240, behavior: "smooth" });
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden bg-black/30">
        {!selected ? (
          <div className="grid h-full place-items-center text-sm text-white/35">Media belum tersedia</div>
        ) : selected.kind === "image" ? (
          <Image
            unoptimized
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 760px"
            src={selected.url}
            alt={selected.label}
            className="object-contain"
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
            className="h-full w-full object-contain"
          />
        )}
      </div>

      {mediaItems.length > 0 && (
        <div className="flex items-center gap-2">
          {hasOverflow && (
            <button
              type="button"
              onClick={() => scrollThumbnails(-1)}
              className="grid h-10 w-10 shrink-0 place-items-center border border-white/12 text-white/65 hover:border-white/30 hover:text-white"
              aria-label="Thumbnail sebelumnya"
              title="Thumbnail sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          <div ref={thumbnailStrip} className="flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth pb-1">
            {mediaItems.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Tampilkan ${item.label}`}
                aria-pressed={item.id === selected?.id}
                className={`relative aspect-[4/5] w-20 shrink-0 overflow-hidden border bg-black/30 sm:w-24 ${
                  item.id === selected?.id ? "border-[#ff9d42]" : "border-white/12 hover:border-white/35"
                }`}
                onClick={() => setSelection({ batikId: batik.id, mediaId: item.id })}
              >
                {item.kind === "image" ? (
                  <Image
                    unoptimized
                    fill
                    sizes="96px"
                    src={item.url}
                    alt={`Thumbnail ${item.label}`}
                    className="object-cover"
                  />
                ) : (
                  <>
                    <video
                      src={item.url}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/20" aria-hidden="true">
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
              className="grid h-10 w-10 shrink-0 place-items-center border border-white/12 text-white/65 hover:border-white/30 hover:text-white"
              aria-label="Thumbnail berikutnya"
              title="Thumbnail berikutnya"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      )}
    </div>
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
