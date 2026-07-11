"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import type { Batik } from "@/lib/automation-types";

const serifClass = "font-[family-name:var(--font-serif)]";
const kickerClass =
  "m-0 text-[0.75rem] font-extrabold tracking-[0.1em] text-[color:var(--terracotta-dark)] uppercase";
const chapterClass =
  "mt-[clamp(8rem,16vw,16rem)] grid grid-cols-12 items-center gap-[clamp(2rem,5vw,6rem)] max-[52rem]:mt-28 max-[52rem]:grid-cols-1 max-[52rem]:gap-8";
const figureClass =
  "group m-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] max-[52rem]:col-span-1";
const imageMaskClass =
  "relative overflow-hidden bg-[#ddd4c4]";
const captionClass =
  "mt-[0.85rem] max-w-[44rem] text-[0.75rem] leading-[1.55] text-[color:var(--ink-soft)]";
const copyClass = "grid content-center max-[52rem]:col-span-1";
const copyTitleClass =
  `${serifClass} mt-4 text-[clamp(2.1rem,4vw,4.3rem)] leading-none font-semibold tracking-[-0.045em] text-[color:var(--ink)] text-balance`;
const copyTextClass = "mt-6 max-w-[31rem] text-[1rem] leading-[1.75] text-[color:var(--ink-soft)]";
const stageClass =
  "relative overflow-hidden rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--line)_80%,transparent)] bg-[color-mix(in_srgb,var(--paper-raised)_90%,white)] p-[clamp(0.58rem,1vw,0.75rem)] shadow-[0_22px_70px_rgba(49,37,25,0.08)] before:pointer-events-none before:absolute before:inset-0 before:translate-x-[-36%] before:bg-[linear-gradient(110deg,transparent_0%,color-mix(in_srgb,var(--terracotta)_10%,transparent)_48%,transparent_100%)] before:opacity-0 before:transition-[opacity,transform] before:duration-[620ms] hover:before:translate-x-[12%] hover:before:opacity-100";
const labTitleClass =
  `${serifClass} mt-4 text-[clamp(2.35rem,5vw,5.5rem)] leading-[0.98] font-semibold tracking-[-0.05em] text-[color:var(--ink)] text-balance`;
const stageHeadingClass =
  "relative z-10 mt-[0.45rem] max-w-[24rem] text-[clamp(1rem,1.28vw,1.22rem)] leading-[1.08] font-semibold tracking-[-0.035em] text-[color:var(--ink)] text-balance";
const tokenClass =
  "rounded-full border border-[color-mix(in_srgb,var(--line)_72%,transparent)] px-3 py-2 text-xs font-bold text-[color:var(--ink-soft)]";

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
  const usageFallbackImages: ShowcaseImage[] = [
    {
      ...showcaseImages[1],
      alt: `Preview pemakaian ${showcaseImages[1].alt}`,
    },
    {
      ...fallbackImages[1],
      alt: "Preview pemakaian visual generatif pada material tekstil",
    },
  ];
  const costumeImages: ShowcaseImage[] = items
    .flatMap((item) =>
      item.costume_urls.slice(0, 2).map((src, index) => ({
        src,
        alt: `Costume preview ${item.keyword}`,
        caption:
          index === 0
            ? `${item.keyword} saat motif masuk ke konteks pemakaian.`
            : `Variasi pemakaian ${item.keyword} untuk membaca warna dan ritme visual.`,
      })),
    )
    .slice(0, 2);
  const usageImages = [...costumeImages, ...usageFallbackImages].slice(0, 2);
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
      className="mx-auto w-[min(100%,90rem)] px-[clamp(1rem,4vw,4rem)] pt-[clamp(6rem,10vw,10rem)] pb-[clamp(1.5rem,3vw,3rem)]"
    >
      <motion.header className="ml-[clamp(0rem,8vw,8rem)] max-w-[57rem] max-[52rem]:ml-0" style={{ opacity: textOpacity, y: introY }}>
        <p className={kickerClass}>Showcase hasil AI</p>
        <h2 className={`${serifClass} mt-[0.85rem] text-[clamp(2.6rem,5.6vw,5.8rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-[color:var(--ink)] text-balance`}>
          Yang utama adalah visual yang langsung terasa layak tampil.
        </h2>
        <p className="mt-7 max-w-[44rem] text-[clamp(1rem,1.4vw,1.15rem)] leading-[1.75] text-[color:var(--ink-soft)]">
          Beranda ini menonjolkan output generative AI: motif, variasi costume, video, dan
          metadata yang membantu pengunjung menemukan kandidat visual terbaik.
        </p>
      </motion.header>

      <div className={chapterClass}>
        <motion.figure
          className={`${figureClass} col-span-6`}
          data-motion="image-from-left"
          style={{ rotate: leftImageRotate, scale: imageScale, x: leftImageX, y: imageY }}
        >
          <div className={`${imageMaskClass} mx-auto aspect-[5/4] max-h-[clamp(18rem,42vw,30rem)] w-[min(100%,34rem)] rounded-[18px] max-[52rem]:aspect-[4/3] max-[52rem]:w-full`}>
            <Image
              src={showcaseImages[0].src}
              alt={showcaseImages[0].alt}
              fill
              sizes="(max-width: 768px) 100vw, 38vw"
              className="editorial-image rounded-[inherit] object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
            />
          </div>
          <figcaption className={captionClass}>
            {showcaseImages[0].caption}
          </figcaption>
        </motion.figure>
        <motion.div
          className={`${copyClass} col-span-6`}
          data-motion="text-from-right"
          style={{ opacity: textOpacity, x: leftTextX, y: copyY }}
        >
          <p className={kickerClass}>Motif utama</p>
          <h3 className={copyTitleClass}>Output AI harus kuat bahkan sebelum dijelaskan.</h3>
          <p className={copyTextClass}>
            Pola, palet, dan komposisi menjadi bukti pertama. Motif terbaik terasa
            siap dipilih sejak gambar pertama muncul.
          </p>
        </motion.div>
      </div>

      <div className={chapterClass}>
        <motion.div
          className={`${copyClass} col-span-5 pl-[8%] max-[52rem]:pl-0`}
          data-motion="text-from-left"
          style={{ opacity: textOpacity, x: rightTextX, y: copyY }}
        >
          <p className={kickerClass}>Preview pemakaian</p>
          <h3 className={copyTitleClass}>Costume preview membuat hasil AI terasa hidup.</h3>
          <p className={copyTextClass}>
            Preview membawa motif ke konteks pemakaian. Warna, ritme, dan karakter
            visualnya bisa dibandingkan dengan lebih cepat.
          </p>
        </motion.div>
        <motion.div
          className={`${figureClass} col-span-7`}
          data-motion="image-from-right"
          style={{ rotate: rightImageRotate, scale: imageScale, x: rightImageX, y: imageY }}
        >
          <div className="grid grid-cols-[minmax(0,0.88fr)_minmax(0,0.68fr)] items-start gap-[clamp(0.9rem,2vw,1.6rem)] max-[52rem]:grid-cols-2 max-[36rem]:grid-cols-1">
            {usageImages.map((image, index) => (
              <figure
                className={`m-0 ${index === 1 ? "mt-[clamp(2rem,5vw,4.4rem)] max-[36rem]:mt-0" : ""}`}
                key={`${image.src}-${index}`}
              >
                <div className={`${imageMaskClass} aspect-[4/5] rounded-[18px]`}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes={index === 0 ? "(max-width: 768px) 52vw, 34vw" : "(max-width: 768px) 44vw, 26vw"}
                    className="editorial-image rounded-[inherit] object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
                  />
                </div>
                <figcaption className={captionClass}>
                  {image.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </motion.div>
      </div>

      <section className="mt-[clamp(5rem,9vw,8rem)] max-[52rem]:mt-28" aria-label="Pipeline generative AI">
        <div className="relative top-auto grid min-h-0 grid-cols-[minmax(0,0.88fr)_minmax(20rem,0.86fr)] items-center gap-[clamp(1.5rem,5vw,5rem)] overflow-hidden rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--line)_76%,transparent)] bg-[radial-gradient(circle_at_14%_18%,color-mix(in_srgb,var(--terracotta)_9%,transparent),transparent_24rem),color-mix(in_srgb,var(--paper-raised)_84%,white)] p-[clamp(0.9rem,2.3vw,2.1rem)] max-[52rem]:grid-cols-1 max-[52rem]:gap-10 max-[52rem]:overflow-visible max-[52rem]:p-[1.1rem]">
          <motion.div className="max-w-[42rem]" style={{ opacity: textOpacity, y: labCopyY }}>
            <p className={kickerClass}>Kurasi output AI</p>
            <h3 className={labTitleClass}>Setiap gerak mengarahkan mata ke kualitas output.</h3>
            <p className="mt-[1.35rem] max-w-[38rem] leading-[1.72] text-[color:var(--ink-soft)]">
              Motion mengikuti tiga bukti yang dilihat pengunjung: motif utama, preview
              pemakaian, lalu detail generasi untuk membaca karakter output.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-[0.55rem]"
            data-motion="generative-stage-track"
            style={{ x: labTrackX, y: labRailY }}
          >
            <motion.article className={stageClass} data-motion="generative-stage" style={{ opacity: inputOpacity, y: inputY }}>
              <span className="relative z-10 text-[0.78rem] font-extrabold text-[color:var(--terracotta-dark)]">Motif utama</span>
              <h4 className={stageHeadingClass}>Gambar pertama harus menjual pola, warna, dan komposisi.</h4>
              <div className="relative z-10 mt-3 flex flex-wrap gap-2" aria-label="Parameter input">
                <span className={tokenClass}>pola terbaca</span>
                <span className={tokenClass}>warna kuat</span>
                <span className={tokenClass}>komposisi rapi</span>
              </div>
            </motion.article>

            <motion.article className={`${stageClass} ml-[clamp(0rem,7vw,5rem)] bg-[radial-gradient(circle_at_92%_8%,color-mix(in_srgb,var(--terracotta)_13%,transparent),transparent_18rem),color-mix(in_srgb,var(--paper-raised)_93%,white)] max-[52rem]:ml-0`} data-motion="generative-stage" style={{ opacity: modelOpacity, y: modelY }}>
              <span className="relative z-10 text-[0.78rem] font-extrabold text-[color:var(--terracotta-dark)]">Costume preview</span>
              <h4 className={stageHeadingClass}>Output yang bagus tetap menarik saat masuk ke konteks pemakaian.</h4>
              <div className="relative z-10 mt-3 grid h-[4.5rem] grid-cols-3 gap-2" aria-hidden="true">
                <i className="rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--terracotta)_18%,var(--paper))]" />
                <i className="translate-y-3 rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--terracotta)_12%,var(--paper))]" />
                <i className="-translate-y-2 rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--terracotta)_22%,var(--paper))]" />
              </div>
            </motion.article>

            <motion.article className={stageClass} data-motion="generative-stage" style={{ opacity: curationOpacity, y: curationY }}>
              <span className="relative z-10 text-[0.78rem] font-extrabold text-[color:var(--terracotta-dark)]">Detail generasi</span>
              <h4 className={stageHeadingClass}>Metadata membantu membedakan hasil yang kuat dari hasil yang biasa.</h4>
              <div className="relative z-10 mt-3 flex flex-wrap gap-2" aria-label="Parameter kurasi">
                <span className={tokenClass}>seed</span>
                <span className={tokenClass}>prompt</span>
                <span className={tokenClass}>tanggal</span>
              </div>
            </motion.article>
          </motion.div>
        </div>
      </section>
    </section>
  );
}
