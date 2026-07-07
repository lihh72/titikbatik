import { Action } from "@/components/ui/action";
import { MotionArticle, MotionDiv, MotionFigure, MotionSection } from "@/components/public-motion";
import { BrainCircuit, GalleryHorizontalEnd, ShieldCheck, Workflow } from "lucide-react";
import Image from "next/image";

export const metadata = { title: "Tentang" };

const architecture = [
  {
    title: "Motif yang siap dilihat",
    text: "Setiap kartu menampilkan motif AI sebagai objek utama, bukan catatan proses.",
    icon: GalleryHorizontalEnd,
  },
  {
    title: "Preview yang menjual bentuk",
    text: "Costume preview dan video membantu melihat apakah motif tetap kuat saat masuk ke konteks visual lain.",
    icon: ShieldCheck,
  },
  {
    title: "Variasi generative AI",
    text: "Galeri memperlihatkan variasi warna, pola, dan gaya yang lahir dari eksplorasi AI.",
    icon: BrainCircuit,
  },
  {
    title: "Kurasi visual",
    text: "Yang tampil dipilih karena komposisi dan detailnya cukup kuat untuk dipamerkan.",
    icon: Workflow,
  },
];

const principles = [
  "Motif harus terbaca kuat sebagai gambar utama.",
  "Preview costume dipakai untuk menguji daya tarik visual.",
  "Metadata membantu membandingkan karakter tiap output AI.",
];

export default function AboutPage() {
  return (
    <main className="public-narrative-page about-page">
      <section className="public-narrative-hero about-hero">
        <MotionDiv className="public-narrative-copy">
          <p className="public-kicker">Tentang galeri AI</p>
          <h1>TitikBatik AI memamerkan motif generatif yang sudah dipilih.</h1>
          <p>
            Halaman ini dibuat untuk melihat kualitas hasil: motif utama, preview costume,
            video, dan metadata yang membantu membaca karakter setiap generasi.
          </p>
          <div className="public-narrative-actions">
            <Action href="/gallery">Buka koleksi</Action>
            <Action href="/help" variant="quiet">Cara menilai output</Action>
          </div>
        </MotionDiv>

        <MotionFigure className="about-image-stack" delay={0.08}>
          <div className="about-image-card about-image-card-main">
            <Image
              src="/editorial/generative-transition.webp"
              alt="Visual tekstil generatif dengan garis organik di atas kain"
              fill
              sizes="(max-width: 900px) 100vw, 38vw"
            />
          </div>
          <div className="about-system-rhythm" aria-label="Alur ringkas sistem AI">
            <span>Motif utama</span>
            <span>Costume preview</span>
            <span>Video</span>
            <span>Metadata</span>
          </div>
          <figcaption>
            Fokus halaman publik adalah melihat hasil akhir, bukan membongkar dapur produksinya.
          </figcaption>
        </MotionFigure>
      </section>

      <section className="about-system-map" aria-label="Arsitektur TitikBatik AI">
        {architecture.map(({ title, text, icon: Icon }, index) => (
          <MotionArticle className="about-system-card" data-featured={index === 0} delay={index * 0.06} key={title}>
            <Icon size={22} aria-hidden="true" />
            <h2>{title}</h2>
            <p>{text}</p>
          </MotionArticle>
        ))}
      </section>

      <MotionSection id="sumber-visual" className="about-ethics-panel">
        <div>
          <p className="public-kicker">Prinsip tampilan</p>
          <h2>Output AI harus terlihat layak sebelum diberi penjelasan panjang.</h2>
        </div>
        <div className="about-principles">
          {principles.map((principle) => (
            <p key={principle}>{principle}</p>
          ))}
          <Action href="/editorial/CREDITS.md" variant="secondary">Lihat kredit visual</Action>
        </div>
      </MotionSection>
    </main>
  );
}
