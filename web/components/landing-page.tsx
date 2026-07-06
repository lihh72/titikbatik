"use client";

import { EditorialStory } from "@/components/editorial-story";
import { MotifCard } from "@/components/motif-card";
import { Action } from "@/components/ui/action";
import { Feedback } from "@/components/ui/feedback";
import { listPublicBatiks } from "@/lib/automation-api";
import type { Batik } from "@/lib/automation-types";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function LandingPage() {
  const [items, setItems] = useState<Batik[]>([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroTextX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -54]);
  const heroTextY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -18]);
  const heroTextOpacity = useTransform(scrollYProgress, [0, 0.82], reduceMotion ? [1, 1] : [1, 0.64]);
  const heroImageX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 48]);
  const heroImageY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -34]);
  const heroImageScale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1, 0.94]);

  useEffect(() => {
    let active = true;
    listPublicBatiks({ page: 1, perPage: 3 })
      .then((result) => { if (active) setItems(result.items); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="landing-page">
      <section className="landing-hero" aria-label="Pengantar arsip" ref={heroRef}>
        <div className="landing-hero-inner">
          <motion.div
            className="landing-hero-copyblock"
            style={{ opacity: heroTextOpacity, x: heroTextX, y: heroTextY }}
          >
          <p className="landing-hero-kicker">Generative Batik AI</p>
          <h1 className="serif">Motif batik baru, dibuat oleh AI.</h1>
          <p className="landing-hero-copy">
            TitikBatik AI membantu menghasilkan motif batik digital melalui proses generative AI,
            mulai dari pemilihan warna, bentuk, gaya visual, hingga variasi motif yang dapat
            dikurasi dan dipublikasikan.
          </p>
          <Action href="/gallery" className="landing-hero-action">
            Lihat hasil generasi AI
          </Action>
          </motion.div>
          <motion.figure
            className="landing-hero-figure"
            style={{ scale: heroImageScale, x: heroImageX, y: heroImageY }}
          >
            <div className="landing-hero-image">
              <Image
                src="/editorial/batik-artisan-canting.jpg"
                alt="Perajin batik menggambar malam dengan canting di Trusmi, Cirebon"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 34vw"
              />
            </div>
            <figcaption>
              Proses mencanting di Trusmi, Cirebon. Foto Ahaetulla, CC BY-SA 4.0.
            </figcaption>
          </motion.figure>
        </div>
      </section>

      <EditorialStory />

      <section className="landing-latest" aria-label="Hasil generasi terbaru">
        <header className="landing-section-heading">
          <div>
            <p>Hasil generasi terbaru</p>
            <h2 className="serif">Motif batik yang baru dibuat oleh AI.</h2>
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

      <section className="landing-ethics">
        <p className="landing-ethics-kicker">Prinsip AI</p>
        <h2 className="serif">AI sebagai alat eksplorasi, bukan pengganti tradisi.</h2>
        <div className="landing-ethics-copy">
          <p>
            Setiap motif yang dihasilkan TitikBatik AI berasal dari kombinasi parameter
            visual seperti warna, bentuk, ornamen, dan gaya batik yang diproses melalui
            alur generative AI.
          </p>
          <p>
            Hasil AI tetap dikurasi manusia sebelum dipublikasikan, agar visual yang
            ditampilkan tetap menghargai konteks budaya, estetika batik, dan etika
            penggunaan teknologi.
          </p>
        </div>
      </section>

      <section className="landing-collection-cta">
        <h2 className="serif">Jelajahi motif batik digital hasil generative AI.</h2>
        <Action href="/gallery">Buka galeri AI</Action>
      </section>
    </main>
  );
}
