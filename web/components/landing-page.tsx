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
    <main className="landing-page">
      <section className="landing-hero" aria-label="Pengantar AI generatif" ref={heroRef}>
        <motion.div className="landing-hero-orb landing-hero-orb-a" aria-hidden="true" style={{ x: heroOrbX, y: heroOrbY }} />
        <motion.div className="landing-hero-orb landing-hero-orb-b" aria-hidden="true" style={{ x: heroImageX, y: heroImageY }} />
        <div className="landing-hero-inner">
          <motion.div
            className="landing-hero-copyblock"
            style={{ opacity: heroTextOpacity, x: heroTextX, y: heroTextY }}
          >
          <p className="landing-hero-kicker">Generative AI output gallery</p>
          <h1 className="serif">Galeri motif AI yang siap dipamerkan.</h1>
          <p className="landing-hero-copy">
            Lihat motif, costume preview, video, dan metadata dari output generative AI yang sudah dikurasi.
          </p>
          <Action href="/gallery" className="landing-hero-action">
            Lihat output AI
          </Action>
          </motion.div>
          <motion.figure
            className="landing-hero-figure"
            style={{ scale: heroImageScale, x: heroImageX, y: heroImageY }}
          >
            <div className="landing-hero-image">
              <Image
                src="/editorial/generative-transition.webp"
                alt="Visual tekstil generatif dengan garis organik di atas kain"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 34vw"
              />
            </div>
            <figcaption>
              Tekstur, garis, dan komposisi generatif yang membuka arah visual koleksi.
            </figcaption>
          </motion.figure>
        </div>
      </section>

      <EditorialStory items={items} />

      <section className="landing-latest" aria-label="Koleksi AI terbaru">
        <header className="landing-section-heading">
          <div>
            <p>Output terkurasi</p>
            <h2 className="serif">Hasil AI yang sudah layak masuk galeri.</h2>
          </div>
          <Action href="/gallery" variant="quiet">Lihat semua hasil AI</Action>
        </header>
        {loading ? (
          <Feedback>Memuat karya terbaru.</Feedback>
        ) : items.length ? (
          <div className="landing-motif-grid">
            {items.slice(0, 3).map((batik) => <MotifCard key={batik.id} batik={batik} />)}
          </div>
        ) : (
          <Feedback kind="empty">Belum ada karya yang dipublikasikan.</Feedback>
        )}
      </section>

      <section className="landing-ethics" aria-label="Prinsip AI" ref={ethicsRef}>
        <motion.p className="landing-ethics-kicker" style={{ y: ethicsKickerY }}>Prinsip AI</motion.p>
        <motion.h2 className="serif" style={{ y: ethicsTitleY }}>
          AI membuka variasi visual yang tajam, cepat, dan mudah dibandingkan.
        </motion.h2>
        <motion.div className="landing-ethics-copy" style={{ y: ethicsCopyY }}>
          <p>
            Halaman publik harus menjual hasilnya: motif yang jelas, variasi yang terasa hidup,
            dan preview yang membuat output AI mudah dibayangkan sebagai koleksi.
          </p>
          <p>
            Kurasi tetap menjaga standar. Output yang tampil dipilih karena komposisi,
            warna, dan detailnya kuat saat dilihat sebagai motif, costume, atau video.
          </p>
        </motion.div>
        <motion.div
          className="landing-ethics-proof"
          style={{ opacity: ethicsProofOpacity, x: ethicsProofX, y: ethicsProofY }}
          aria-label="Bukti kualitas output AI"
        >
          <article>
            <span>Motif</span>
            <strong>Pola utama terbaca dalam satu lihat.</strong>
          </article>
          <article>
            <span>Costume</span>
            <strong>Preview menunjukkan motif hidup di media.</strong>
          </article>
          <article>
            <span>Detail</span>
            <strong>Metadata membantu menilai karakter generasi.</strong>
          </article>
        </motion.div>
      </section>

      <section className="landing-collection-cta">
        <h2 className="serif">Buka koleksi dan nilai langsung hasil visual AI.</h2>
        <Action href="/gallery">Buka galeri AI</Action>
      </section>
    </main>
  );
}
