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
    <section className="batik-media flex h-full w-full min-w-0" aria-label={`Media batik ${batik.keyword}`}>
      <div className="grid h-full w-full content-start rounded-[var(--radius-md)] border border-[var(--line)] bg-[radial-gradient(circle_at_84%_12%,color-mix(in_srgb,var(--terracotta)_8%,transparent),transparent_17rem),color-mix(in_srgb,var(--paper-raised)_91%,white)] p-[clamp(0.65rem,1.5vw,0.95rem)] shadow-[0_24px_70px_rgba(88,70,49,0.08)]">
        <div className="relative mx-auto aspect-square w-[min(100%,21.75rem)] overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line)] bg-[color-mix(in_srgb,var(--ink)_6%,var(--paper-raised))]">
          {!selected ? (
            <div className="grid h-full place-items-center text-sm text-[color:var(--ink-soft)]" role="status">Media belum tersedia</div>
          ) : selected.kind === "image" ? (
            <Image
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 640px"
              src={selected.url}
              alt={selected.label}
              className="h-full w-full object-contain"
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
              poster={batik.preview_url ?? undefined}
              preload="metadata"
              aria-label={selected.label}
              className="h-full w-full object-contain"
            />
          )}
        </div>

        {mediaItems.length > 0 && (
          <div className="mx-auto mt-3 w-[min(100%,21.75rem)] border-t border-[color-mix(in_srgb,var(--line)_72%,transparent)] pt-[0.7rem]" aria-label="Media koleksi">
            <div className="flex items-center justify-between gap-4 text-[0.76rem] font-extrabold text-[color:var(--ink)]">
              <span>Media koleksi</span>
              <small className="text-[0.72rem] font-bold text-[color:var(--ink-soft)]">{mediaItems.length} aset</small>
            </div>

            <div className="mt-[0.55rem] flex items-center gap-[0.65rem]">
              {hasOverflow && (
                <button
                  type="button"
                  onClick={() => scrollThumbnails(-1)}
                  className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--paper-raised)] text-[color:var(--ink-soft)] transition-[border-color,color,transform] duration-[180ms] hover:border-[color:var(--terracotta-dark)] hover:text-[color:var(--terracotta-dark)]"
                  aria-label="Thumbnail sebelumnya"
                  title="Thumbnail sebelumnya"
                >
                  <ChevronLeft size={18} />
                </button>
              )}

              <div ref={thumbnailStrip} className="flex min-w-0 flex-1 gap-[0.65rem] overflow-x-auto scroll-smooth pb-[0.15rem]">
                {mediaItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Tampilkan ${item.label}`}
                    aria-pressed={item.id === selected?.id}
                    data-selected={item.id === selected?.id}
                    className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line)] bg-[color-mix(in_srgb,var(--ink)_5%,var(--paper-raised))] transition-[border-color,transform,box-shadow] duration-[180ms] hover:border-[color:color-mix(in_srgb,var(--terracotta)_55%,var(--line))] focus-visible:border-[color:color-mix(in_srgb,var(--terracotta)_55%,var(--line))] data-[selected=true]:border-[color:var(--terracotta-dark)] data-[selected=true]:shadow-[0_0_0_2px_color-mix(in_srgb,var(--terracotta)_16%,transparent)] sm:w-24"
                    onClick={() => setSelection({ batikId: batik.id, mediaId: item.id })}
                  >
                    {item.kind === "image" ? (
                      <Image
                        fill
                        sizes="96px"
                        src={item.url}
                        alt={`Thumbnail ${item.label}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        <video
                          src={item.url}
                          muted
                          playsInline
                          poster={batik.preview_url ?? undefined}
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--ink)_42%,transparent)] text-[color:var(--paper-raised)]" aria-hidden="true">
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
                  className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--paper-raised)] text-[color:var(--ink-soft)] transition-[border-color,color,transform] duration-[180ms] hover:border-[color:var(--terracotta-dark)] hover:text-[color:var(--terracotta-dark)]"
                  aria-label="Thumbnail berikutnya"
                  title="Thumbnail berikutnya"
                >
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
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
