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
      aria-label="Proses batik"
      className={`editorial-story${reduceMotion ? " editorial-story-reduced" : ""}`}
    >
      <motion.header className="editorial-story-intro" style={{ opacity: textOpacity, y: introY }}>
        <p className="editorial-kicker">Dari proses ke model AI</p>
        <h2 className="serif">Generasi visual tetap butuh konteks material.</h2>
        <p>
          TitikBatik AI membaca warna, ornamen, dan ritme visual sebagai parameter.
          Foto proses menjadi pengingat bahwa output digital tetap perlu kurasi manusia.
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
        <motion.div
          className="editorial-copy"
          data-motion="text-from-right"
          style={{ opacity: textOpacity, x: leftTextX, y: copyY }}
        >
          <p className="editorial-step">Garis yang menyimpan keputusan</p>
          <h3 className="serif">Canting menerjemahkan ingatan menjadi batas.</h3>
          <p>
            Setiap aliran malam mengatur bagian kain yang menerima warna. Tekanan tangan,
            suhu, dan pengulangan membentuk karakter yang tidak pernah sepenuhnya seragam.
          </p>
        </motion.div>
      </div>

      <div className="editorial-chapter editorial-chapter-tools">
        <motion.div
          className="editorial-copy"
          data-motion="text-from-left"
          style={{ opacity: textOpacity, x: rightTextX, y: copyY }}
        >
          <p className="editorial-step">Material ikut berbicara</p>
          <h3 className="serif">Panas dan malam menentukan ritme kerja.</h3>
          <p>
            Peralatan bukan sekadar latar. Suhu malam dan bentuk canting memengaruhi
            ketebalan garis, jeda, serta kemungkinan koreksi pada kain.
          </p>
        </motion.div>
        <motion.figure
          className="editorial-figure editorial-figure-landscape"
          data-motion="image-from-right"
          style={{ rotate: rightImageRotate, scale: imageScale, x: rightImageX, y: imageY }}
        >
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

      <section className="generative-scroll-lab" aria-label="Pipeline generative AI">
        <div className="generative-lab-sticky">
          <motion.div className="generative-lab-copy" style={{ opacity: textOpacity, y: labCopyY }}>
            <p className="editorial-step">Pipeline generative AI</p>
            <h3 className="serif">Scroll story ini mengikuti perubahan keputusan, bukan dekorasi.</h3>
            <p>
              Input visual dipadatkan menjadi parameter, model membuat kandidat, lalu kurator
              memilih hasil yang cukup jelas untuk masuk galeri.
            </p>
          </motion.div>

          <motion.div
            className="generative-stage-track"
            data-motion="generative-stage-track"
            style={{ x: labTrackX, y: labRailY }}
          >
            <motion.article className="generative-stage" data-motion="generative-stage" style={{ opacity: inputOpacity, y: inputY }}>
              <span className="generative-stage-index">Input visual</span>
              <h4>Warna, ornamen, dan ritme garis dibaca sebagai bahan awal.</h4>
              <div className="generative-token-field" aria-label="Parameter input">
                <span>nila tua</span>
                <span>kontras rendah</span>
                <span>repeat organik</span>
              </div>
            </motion.article>

            <motion.article className="generative-stage generative-stage-emphasis" data-motion="generative-stage" style={{ opacity: modelOpacity, y: modelY }}>
              <span className="generative-stage-index">Model membuat kandidat</span>
              <h4>Satu prompt menghasilkan beberapa arah visual untuk dibandingkan.</h4>
              <div className="generative-signal" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            </motion.article>

            <motion.article className="generative-stage" data-motion="generative-stage" style={{ opacity: curationOpacity, y: curationY }}>
              <span className="generative-stage-index">Kurasi ke galeri</span>
              <h4>Hanya output yang terbaca, rapi, dan tidak menyesatkan yang dipublikasikan.</h4>
              <div className="generative-token-field" aria-label="Parameter kurasi">
                <span>motif utama</span>
                <span>costume preview</span>
                <span>metadata</span>
              </div>
            </motion.article>
          </motion.div>
        </div>
      </section>
    </section>
  );
}
