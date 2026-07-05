"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";

export function EditorialStory() {
  const reduceMotion = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [70, -45]);
  const textOpacity = useTransform(
    scrollYProgress,
    [0.08, 0.28, 0.72, 0.92],
    reduceMotion ? [1, 1, 1, 1] : [0.35, 1, 1, 0.45],
  );
  const transitionScale = useTransform(
    scrollYProgress,
    [0.35, 0.75],
    reduceMotion ? [1, 1] : [0.94, 1.04],
  );

  return (
    <section
      ref={section}
      aria-label="Proses batik"
      className={`editorial-story${reduceMotion ? " editorial-story-reduced" : ""}`}
    >
      <motion.header className="editorial-story-intro" style={{ opacity: textOpacity }}>
        <p className="editorial-kicker">Dari tangan ke arsip</p>
        <h2 className="serif">Sebuah motif dimulai jauh sebelum layar menyala.</h2>
        <p>
          Arsip ini menempatkan pengetahuan perajin dan material di depan proses generatif.
          Teknologi hadir sebagai alat baca baru, bukan pengganti asal-usulnya.
        </p>
      </motion.header>

      <div className="editorial-chapter editorial-chapter-artisan">
        <motion.figure className="editorial-figure editorial-figure-portrait" style={{ y: imageY }}>
          <div className="editorial-image-mask">
            <Image
              src="/editorial/batik-artisan-canting.jpg"
              alt="Perajin batik menggambar malam dengan canting di Trusmi, Cirebon"
              fill
              sizes="(max-width: 768px) 100vw, 54vw"
              className="editorial-image"
            />
          </div>
          <figcaption>
            Proses mencanting di Trusmi, Cirebon. Foto Ahaetulla, CC BY-SA 4.0.
          </figcaption>
        </motion.figure>
        <motion.div className="editorial-copy" style={{ opacity: textOpacity }}>
          <p className="editorial-step">Garis yang menyimpan keputusan</p>
          <h3 className="serif">Canting menerjemahkan ingatan menjadi batas.</h3>
          <p>
            Setiap aliran malam mengatur bagian kain yang menerima warna. Tekanan tangan,
            suhu, dan pengulangan membentuk karakter yang tidak pernah sepenuhnya seragam.
          </p>
        </motion.div>
      </div>

      <div className="editorial-chapter editorial-chapter-tools">
        <motion.div className="editorial-copy" style={{ opacity: textOpacity }}>
          <p className="editorial-step">Material ikut berbicara</p>
          <h3 className="serif">Panas dan malam menentukan ritme kerja.</h3>
          <p>
            Peralatan bukan sekadar latar. Suhu malam dan bentuk canting memengaruhi
            ketebalan garis, jeda, serta kemungkinan koreksi pada kain.
          </p>
        </motion.div>
        <motion.figure className="editorial-figure editorial-figure-landscape" style={{ y: imageY }}>
          <div className="editorial-image-mask">
            <Image
              src="/editorial/batik-malam-tools.jpg"
              alt="Malam batik dipanaskan bersama canting di bengkel tradisional Trusmi, Cirebon"
              fill
              sizes="(max-width: 768px) 100vw, 58vw"
              className="editorial-image"
            />
          </div>
          <figcaption>
            Peralatan dan malam di bengkel Trusmi, Cirebon. Foto Ahaetulla, CC BY-SA 4.0.
          </figcaption>
        </motion.figure>
      </div>

      <motion.figure
        className="editorial-transition"
        style={{ scale: transitionScale, opacity: textOpacity }}
      >
        <div className="editorial-transition-image">
          <Image
            src="/editorial/generative-transition.webp"
            alt="Interpretasi konseptual lapisan kain dan garis malam berwarna hijau tinta"
            fill
            sizes="(max-width: 768px) 100vw, 78vw"
            className="editorial-image"
          />
        </div>
        <figcaption>
          <strong>Visual konseptual AI</strong>
          <span>
            Dibuat sebagai jembatan visual menuju koleksi generatif. Gambar ini bukan dokumentasi proses atau motif tradisional tertentu.
          </span>
        </figcaption>
      </motion.figure>
    </section>
  );
}
