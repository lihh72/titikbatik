"use client";

import { EditorialStory } from "@/components/editorial-story";
import { MotifCard } from "@/components/motif-card";
import { Action } from "@/components/ui/action";
import { Feedback } from "@/components/ui/feedback";
import { listPublicBatiks, readPublicBatiksCache } from "@/lib/automation-api";
import type { Batik } from "@/lib/automation-types";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const LANDING_PUBLIC_OPTIONS = { page: 1, perPage: 9, query: "" };
const serifClass = "font-[family-name:var(--font-serif)]";
const sectionKickerClass =
  "m-0 text-[0.78rem] font-extrabold tracking-[0.12em] text-[color:var(--terracotta-dark)] uppercase";

export function LandingPage() {
  const [initialResult] = useState(() => readPublicBatiksCache(LANDING_PUBLIC_OPTIONS));
  const [items, setItems] = useState<Batik[]>(() => initialResult?.items ?? []);
  const [loading, setLoading] = useState(() => !initialResult);
  const heroRef = useRef<HTMLElement>(null);
  const ethicsRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const { scrollYProgress: ethicsProgress } = useScroll({
    target: ethicsRef,
    offset: ["start end", "end start"],
  });
  const heroTextX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -84]);
  const heroTextY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -30]);
  const heroTextOpacity = useTransform(scrollYProgress, [0, 0.82], reduceMotion ? [1, 1] : [1, 0.54]);
  const heroImageX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 76]);
  const heroImageY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -58]);
  const heroImageScale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1, 0.9]);
  const heroOrbX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -120]);
  const heroOrbY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 80]);
  const ethicsKickerY = useTransform(ethicsProgress, [0.1, 0.48], reduceMotion ? [0, 0] : [34, -26]);
  const ethicsTitleY = useTransform(ethicsProgress, [0.08, 0.52], reduceMotion ? [0, 0] : [72, -18]);
  const ethicsCopyY = useTransform(ethicsProgress, [0.18, 0.66], reduceMotion ? [0, 0] : [56, -34]);
  const ethicsProofX = useTransform(ethicsProgress, [0.14, 0.78], reduceMotion ? [0, 0] : [72, -42]);
  const ethicsProofY = useTransform(ethicsProgress, [0.14, 0.78], reduceMotion ? [0, 0] : [82, -44]);
  const ethicsProofOpacity = useTransform(ethicsProgress, [0.12, 0.34, 0.84], reduceMotion ? [1, 1, 1] : [0.36, 1, 0.72]);

  useEffect(() => {
    let active = true;
    listPublicBatiks(LANDING_PUBLIC_OPTIONS)
      .then((result) => { if (active) setItems(result.items); })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="overflow-hidden">
      <section className="relative grid min-h-[calc(100dvh_-_72px)] place-items-center overflow-hidden border-b border-[var(--line)] bg-[radial-gradient(circle_at_12%_8%,color-mix(in_srgb,var(--terracotta)_10%,transparent),transparent_26rem),linear-gradient(180deg,color-mix(in_srgb,var(--paper-raised)_70%,transparent),var(--paper))] px-4 py-[clamp(1.75rem,4vw,3.5rem)] max-[52rem]:min-h-[calc(100svh_-_64px)] max-[52rem]:py-[clamp(1.25rem,4svh,2.25rem)]" aria-label="Pengantar AI generatif" ref={heroRef}>
        <motion.div className="absolute rounded-full border border-[color-mix(in_srgb,var(--terracotta)_18%,transparent)] bg-[color-mix(in_srgb,var(--terracotta)_6%,transparent)] blur-[0.5px] left-[6vw] top-[9rem] size-[clamp(7rem,15vw,14rem)]" aria-hidden="true" style={{ x: heroOrbX, y: heroOrbY }} />
        <motion.div className="absolute rounded-full border border-[color-mix(in_srgb,var(--terracotta)_18%,transparent)] bg-[color-mix(in_srgb,var(--terracotta)_6%,transparent)] blur-[0.5px] right-[10vw] bottom-[12vh] size-[clamp(5rem,11vw,10rem)]" aria-hidden="true" style={{ x: heroImageX, y: heroImageY }} />
        <div className="relative z-10 grid w-[min(100%,80rem)] grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.6fr)] items-center gap-[clamp(2rem,5vw,5rem)] max-[52rem]:grid-cols-1 max-[52rem]:gap-[clamp(1rem,3svh,1.5rem)]">
          <motion.div
            className="max-w-[67rem]"
            style={{ opacity: heroTextOpacity, x: heroTextX, y: heroTextY }}
          >
          <p className={sectionKickerClass}>Generative AI output gallery</p>
          <h1 className={`${serifClass} mt-[1.1rem] max-w-[67rem] text-[clamp(3.4rem,6.15vw,6.35rem)] leading-[0.91] font-semibold tracking-[-0.02em] text-[color:var(--ink)] max-[52rem]:mt-[0.78rem] max-[52rem]:text-[clamp(2.4rem,11vw,3.55rem)] max-[52rem]:leading-[0.94]`}>
            Galeri motif AI yang siap dipamerkan.
          </h1>
          <p className="mt-7 max-w-[43rem] text-[clamp(1rem,1.6vw,1.25rem)] leading-[1.65] text-[color:var(--ink-soft)] max-[52rem]:mt-4 max-[52rem]:max-w-[27rem] max-[52rem]:text-base max-[52rem]:leading-[1.55]">
            Lihat motif, costume preview, video, dan metadata dari output generative AI yang sudah dikurasi.
          </p>
          <Action href="/gallery" className="mt-7">
            Lihat output AI
          </Action>
          </motion.div>
          <motion.figure
            className="relative m-0 justify-self-end max-[52rem]:w-full max-[52rem]:justify-self-start"
            style={{ scale: heroImageScale, x: heroImageX, y: heroImageY }}
          >
            <div className="relative min-h-[520px] w-[min(100%,26.5rem)] overflow-hidden rounded-[28px] border border-[rgba(120,80,40,0.18)] bg-[var(--paper-raised)] shadow-[0_18px_45px_rgba(0,0,0,0.12)] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(180deg,transparent_45%,rgba(20,18,14,0.22)),radial-gradient(circle_at_78%_16%,rgba(255,255,255,0.28),transparent_36%)] max-[52rem]:h-[clamp(11rem,27svh,15rem)] max-[52rem]:min-h-0 max-[52rem]:max-h-[15rem] max-[52rem]:w-[min(100%,25rem)]">
              <Image
                src="/editorial/generative-transition.webp"
                alt="Visual tekstil generatif dengan garis organik di atas kain"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 34vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-[0.85rem] max-w-[18rem] text-[0.78rem] leading-[1.5] text-[color:var(--ink-soft)] max-[52rem]:mt-[0.55rem] max-[52rem]:max-w-[22rem] max-[52rem]:text-[0.68rem] max-[52rem]:leading-[1.4]">
              Tekstur, garis, dan komposisi generatif yang membuka arah visual koleksi.
            </figcaption>
          </motion.figure>
        </div>
      </section>

      <EditorialStory items={items} />

      <section className="mx-auto w-[min(100%,92rem)] px-[clamp(1rem,3vw,3rem)] py-[clamp(5rem,9vw,9rem)]" aria-label="Koleksi AI terbaru">
        <header className="flex items-end justify-between gap-8 max-[52rem]:block">
          <div>
            <p className={sectionKickerClass}>Output terkurasi</p>
            <h2 className={`${serifClass} mt-[0.85rem] max-w-[15ch] text-[clamp(2.5rem,5vw,5rem)] leading-none font-semibold tracking-[-0.045em] text-[color:var(--ink)] text-balance`}>
              Hasil AI yang sudah layak masuk galeri.
            </h2>
          </div>
          <Action href="/gallery" variant="quiet">Lihat semua hasil AI</Action>
        </header>
        {loading ? (
          <Feedback>Memuat karya terbaru.</Feedback>
        ) : items.length ? (
          <div className="mt-12 grid grid-cols-3 gap-[clamp(1rem,2.5vw,2rem)] max-[52rem]:grid-cols-1">
            {items.slice(0, 3).map((batik) => <MotifCard key={batik.id} batik={batik} />)}
          </div>
        ) : (
          <Feedback kind="empty">Belum ada karya yang dipublikasikan.</Feedback>
        )}
      </section>

      <section className="mx-auto grid w-[min(100%,92rem)] grid-cols-12 gap-x-8 gap-y-6 border-t border-[var(--line)] px-[clamp(1rem,3vw,3rem)] py-[clamp(5rem,9vw,9rem)] max-[52rem]:grid-cols-1" aria-label="Prinsip AI" ref={ethicsRef}>
        <motion.p className={`${sectionKickerClass} col-span-3`} style={{ y: ethicsKickerY }}>Prinsip AI</motion.p>
        <motion.h2 className={`${serifClass} col-span-5 max-w-[12ch] text-[clamp(2.5rem,5vw,5rem)] leading-none font-semibold tracking-[-0.045em] text-[color:var(--ink)] text-balance`} style={{ y: ethicsTitleY }}>
          AI membuka variasi visual yang tajam, cepat, dan mudah dibandingkan.
        </motion.h2>
        <motion.div className="col-span-4 grid content-start gap-5 text-[1rem] leading-[1.75] text-[color:var(--ink-soft)]" style={{ y: ethicsCopyY }}>
          <p className="m-0">
            Halaman publik harus menjual hasilnya: motif yang jelas, variasi yang terasa hidup,
            dan preview yang membuat output AI mudah dibayangkan sebagai koleksi.
          </p>
          <p className="m-0">
            Kurasi tetap menjaga standar. Output yang tampil dipilih karena komposisi,
            warna, dan detailnya kuat saat dilihat sebagai motif, costume, atau video.
          </p>
        </motion.div>
        <motion.div
          className="col-span-9 col-start-4 mt-8 grid grid-cols-3 gap-4 max-[52rem]:col-span-1 max-[52rem]:col-start-auto max-[52rem]:grid-cols-1"
          style={{ opacity: ethicsProofOpacity, x: ethicsProofX, y: ethicsProofY }}
          aria-label="Bukti kualitas output AI"
        >
          <article className="min-h-40 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--paper-raised)] p-5">
            <span className="block text-[0.72rem] font-extrabold tracking-[0.12em] text-[color:var(--terracotta-dark)] uppercase">Motif</span>
            <strong className="mt-8 block text-[clamp(1.1rem,2vw,1.7rem)] leading-[1.08] tracking-[-0.04em] text-[color:var(--ink)]">Pola utama terbaca dalam satu lihat.</strong>
          </article>
          <article className="min-h-40 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--paper-raised)] p-5 translate-y-8 max-[52rem]:translate-y-0">
            <span className="block text-[0.72rem] font-extrabold tracking-[0.12em] text-[color:var(--terracotta-dark)] uppercase">Costume</span>
            <strong className="mt-8 block text-[clamp(1.1rem,2vw,1.7rem)] leading-[1.08] tracking-[-0.04em] text-[color:var(--ink)]">Preview menunjukkan motif hidup di media.</strong>
          </article>
          <article className="min-h-40 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--paper-raised)] p-5 translate-y-[-1.5rem] max-[52rem]:translate-y-0">
            <span className="block text-[0.72rem] font-extrabold tracking-[0.12em] text-[color:var(--terracotta-dark)] uppercase">Detail</span>
            <strong className="mt-8 block text-[clamp(1.1rem,2vw,1.7rem)] leading-[1.08] tracking-[-0.04em] text-[color:var(--ink)]">Metadata membantu menilai karakter generasi.</strong>
          </article>
        </motion.div>
      </section>

      <section className="mx-auto mb-[clamp(4rem,7vw,7rem)] flex w-[min(calc(100%_-_2rem),88rem)] items-end justify-between gap-8 rounded-[var(--radius-md)] border border-[var(--line)] bg-[color-mix(in_srgb,var(--paper-raised)_88%,white)] p-[clamp(1.5rem,4vw,3rem)] max-[52rem]:block">
        <h2 className={`${serifClass} max-w-[16ch] text-[clamp(2.25rem,4.8vw,4.8rem)] leading-none font-semibold tracking-[-0.045em] text-[color:var(--ink)] text-balance`}>Buka koleksi dan nilai langsung hasil visual AI.</h2>
        <Action href="/gallery">Buka galeri AI</Action>
      </section>
    </main>
  );
}
