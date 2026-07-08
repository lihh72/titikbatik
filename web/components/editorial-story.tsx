"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import type { Batik } from "@/lib/automation-types";

type ShowcaseImage = {
  src: string;
  alt: string;
  caption: string;
};

export function EditorialStory({ items = [] }: { items?: Batik[] }) {
  const outputImages: ShowcaseImage[] = items
    .filter((item) => Boolean(item.preview_url))
    .slice(0, 2)
    .map((item) => ({
      src: item.preview_url as string,
      alt: `Output AI ${item.keyword}`,
      caption: `${item.keyword}. ${item.warna || "Palet generatif siap kurasi"}.`,
    }));
  const fallbackImages: ShowcaseImage[] = [
    {
      src: "/editorial/generative-transition.webp",
      alt: "Visual tekstil generatif dengan garis organik di atas kain",
      caption: "Visual generatif yang menekankan arah estetika koleksi AI.",
    },
    {
      src: "/editorial/generative-transition.webp",
      alt: "Detail garis generatif pada permukaan kain",
      caption: "Ritme garis dan tekstur dipakai sebagai bahasa visual AI.",
    },
  ];
  const showcaseImages = [...outputImages, ...fallbackImages].slice(0, 2);
  const reduceMotion = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [70, -45]);
  const leftImageX = useTransform(scrollYProgress, [0.12, 0.36], reduceMotion ? [0, 0] : [-90, 0]);
  const rightImageX = useTransform(scrollYProgress, [0.34, 0.62], reduceMotion ? [0, 0] : [90, 0]);
  const leftTextX = useTransform(scrollYProgress, [0.12, 0.36], reduceMotion ? [0, 0] : [70, 0]);
  const rightTextX = useTransform(scrollYProgress, [0.34, 0.62], reduceMotion ? [0, 0] : [-70, 0]);
  const introY = useTransform(scrollYProgress, [0.02, 0.22], reduceMotion ? [0, 0] : [42, 0]);
  const imageScale = useTransform(
    scrollYProgress,
    [0.08, 0.28, 0.72, 0.9],
    reduceMotion ? [1, 1, 1, 1] : [0.88, 1, 1, 0.96],
  );
  const leftImageRotate = useTransform(scrollYProgress, [0.12, 0.36], reduceMotion ? [0, 0] : [-2.5, 0]);
  const rightImageRotate = useTransform(scrollYProgress, [0.34, 0.62], reduceMotion ? [0, 0] : [2.5, 0]);
  const textOpacity = useTransform(
    scrollYProgress,
    [0.08, 0.28, 0.72, 0.92],
    reduceMotion ? [1, 1, 1, 1] : [0.68, 1, 1, 0.78],
  );
  const copyY = useTransform(scrollYProgress, [0.12, 0.36, 0.62], reduceMotion ? [0, 0, 0] : [36, 0, -12]);
  const labCopyY = useTransform(scrollYProgress, [0.58, 0.86], reduceMotion ? [0, 0] : [42, -28]);
  const labTrackX = useTransform(scrollYProgress, [0.58, 0.88], reduceMotion ? [0, 0] : [44, -34]);
  const labRailY = useTransform(scrollYProgress, [0.58, 0.88], reduceMotion ? [0, 0] : [70, -70]);
  const inputOpacity = useTransform(scrollYProgress, [0.54, 0.62, 0.7], reduceMotion ? [1, 1, 1] : [0.42, 1, 0.52]);
  const modelOpacity = useTransform(scrollYProgress, [0.62, 0.72, 0.82], reduceMotion ? [1, 1, 1] : [0.38, 1, 0.55]);
  const curationOpacity = useTransform(scrollYProgress, [0.7, 0.8, 0.9], reduceMotion ? [1, 1, 1] : [0.34, 1, 0.6]);
  const inputY = useTransform(scrollYProgress, [0.54, 0.68], reduceMotion ? [0, 0] : [26, -10]);
  const modelY = useTransform(scrollYProgress, [0.62, 0.8], reduceMotion ? [0, 0] : [36, -14]);
  const curationY = useTransform(scrollYProgress, [0.7, 0.9], reduceMotion ? [0, 0] : [46, -18]);

  return (
    <section
      ref={section}
      aria-label="Showcase output AI"
      className={`editorial-story${reduceMotion ? " editorial-story-reduced" : ""}`}
    >
      <motion.header className="editorial-story-intro" style={{ opacity: textOpacity, y: introY }}>
        <p className="editorial-kicker">Showcase hasil AI</p>
        <h2 className="serif">Yang utama adalah visual yang langsung terasa layak tampil.</h2>
        <p>
          Beranda ini menonjolkan output generative AI: motif, variasi costume, video, dan
          metadata yang membantu pengunjung menemukan kandidat visual terbaik.
        </p>
      </motion.header>

      <div className="editorial-chapter editorial-chapter-artisan">
        <motion.figure
          className="editorial-figure editorial-figure-portrait"
          data-motion="image-from-left"
          style={{ rotate: leftImageRotate, scale: imageScale, x: leftImageX, y: imageY }}
        >
          <div className="editorial-image-mask">
            <Image
              src={showcaseImages[0].src}
              alt={showcaseImages[0].alt}
              fill
              sizes="(max-width: 768px) 100vw, 54vw"
              className="editorial-image"
            />
          </div>
          <figcaption>
            {showcaseImages[0].caption}
          </figcaption>
        </motion.figure>
        <motion.div
          className="editorial-copy"
          data-motion="text-from-right"
          style={{ opacity: textOpacity, x: leftTextX, y: copyY }}
        >
          <p className="editorial-step">Motif utama</p>
          <h3 className="serif">Output AI harus kuat bahkan sebelum dijelaskan.</h3>
          <p>
            Pola, palet, dan komposisi menjadi bukti pertama. Motif terbaik terasa
            siap dipilih sejak gambar pertama muncul.
          </p>
        </motion.div>
      </div>

      <div className="editorial-chapter editorial-chapter-tools">
        <motion.div
          className="editorial-copy"
          data-motion="text-from-left"
          style={{ opacity: textOpacity, x: rightTextX, y: copyY }}
        >
          <p className="editorial-step">Preview pemakaian</p>
          <h3 className="serif">Costume preview membuat hasil AI terasa hidup.</h3>
          <p>
            Preview membawa motif ke konteks pemakaian. Warna, ritme, dan karakter
            visualnya bisa dibandingkan dengan lebih cepat.
          </p>
        </motion.div>
        <motion.figure
          className="editorial-figure editorial-figure-landscape"
          data-motion="image-from-right"
          style={{ rotate: rightImageRotate, scale: imageScale, x: rightImageX, y: imageY }}
        >
          <div className="editorial-image-mask">
            <Image
              src={showcaseImages[1].src}
              alt={showcaseImages[1].alt}
              fill
              sizes="(max-width: 768px) 100vw, 58vw"
              className="editorial-image"
            />
          </div>
          <figcaption>
            {showcaseImages[1].caption}
          </figcaption>
        </motion.figure>
      </div>

      <section className="generative-scroll-lab" aria-label="Pipeline generative AI">
        <div className="generative-lab-sticky">
          <motion.div className="generative-lab-copy" style={{ opacity: textOpacity, y: labCopyY }}>
            <p className="editorial-step">Kurasi output AI</p>
            <h3 className="serif">Setiap gerak mengarahkan mata ke kualitas output.</h3>
            <p>
              Motion mengikuti tiga bukti yang dilihat pengunjung: motif utama, preview
              pemakaian, lalu detail generasi untuk membaca karakter output.
            </p>
          </motion.div>

          <motion.div
            className="generative-stage-track"
            data-motion="generative-stage-track"
            style={{ x: labTrackX, y: labRailY }}
          >
            <motion.article className="generative-stage" data-motion="generative-stage" style={{ opacity: inputOpacity, y: inputY }}>
              <span className="generative-stage-index">Motif utama</span>
              <h4>Gambar pertama harus menjual pola, warna, dan komposisi.</h4>
              <div className="generative-token-field" aria-label="Parameter input">
                <span>pola terbaca</span>
                <span>warna kuat</span>
                <span>komposisi rapi</span>
              </div>
            </motion.article>

            <motion.article className="generative-stage generative-stage-emphasis" data-motion="generative-stage" style={{ opacity: modelOpacity, y: modelY }}>
              <span className="generative-stage-index">Costume preview</span>
              <h4>Output yang bagus tetap menarik saat masuk ke konteks pemakaian.</h4>
              <div className="generative-signal" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            </motion.article>

            <motion.article className="generative-stage" data-motion="generative-stage" style={{ opacity: curationOpacity, y: curationY }}>
              <span className="generative-stage-index">Detail generasi</span>
              <h4>Metadata membantu membedakan hasil yang kuat dari hasil yang biasa.</h4>
              <div className="generative-token-field" aria-label="Parameter kurasi">
                <span>seed</span>
                <span>prompt</span>
                <span>tanggal</span>
              </div>
            </motion.article>
          </motion.div>
        </div>
      </section>
    </section>
  );
}
