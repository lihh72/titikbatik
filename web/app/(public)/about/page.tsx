import { Action } from "@/components/ui/action";
import { MotionArticle, MotionDiv, MotionFigure, MotionSection } from "@/components/public-motion";
import { BrainCircuit, GalleryHorizontalEnd, ShieldCheck, Workflow } from "lucide-react";
import Image from "next/image";

export const metadata = { title: "Tentang" };

const architecture = [
  {
    title: "Output AI publik",
    text: "Kandidat motif yang lolos kurasi tampil sebagai koleksi, lengkap dengan motif, costume preview, video, dan metadata.",
    icon: GalleryHorizontalEnd,
  },
  {
    title: "Ruang kerja internal",
    text: "Tim mengelola batch, hasil, template costume, wordlist, dan pengaturan tanpa membuka proses produksi ke pengunjung umum.",
    icon: ShieldCheck,
  },
  {
    title: "Pipeline generative AI",
    text: "FastAPI, worker, SQLite, dan ComfyUI bekerja sebagai mesin produksi visual untuk membuat kandidat motif baru.",
    icon: BrainCircuit,
  },
  {
    title: "Kurasi manusia",
    text: "Hasil baru tidak langsung tampil. Administrator memilih mana yang layak dibaca sebagai bagian dari koleksi.",
    icon: Workflow,
  },
];

const principles = [
  "Foto proses diberi konteks sumber dan lisensi.",
  "Visual AI ditandai sebagai interpretasi, bukan dokumentasi tradisi.",
  "Motif generatif adalah kandidat visual, bukan klaim budaya otomatis.",
];

export default function AboutPage() {
  return (
    <main className="public-narrative-page about-page">
      <section className="public-narrative-hero about-hero">
        <MotionDiv className="public-narrative-copy">
          <p className="public-kicker">Tentang mesin AI</p>
          <h1>TitikBatik AI membuat kandidat motif, lalu manusia memilih arah terbaiknya.</h1>
          <p>
            Pengunjung melihat hasil generative AI yang sudah dipilih. Tim internal mengatur
            batch, wordlist, costume template, dan publikasi dari ruang kerja terpisah.
          </p>
          <div className="public-narrative-actions">
            <Action href="/gallery">Buka koleksi</Action>
            <Action href="/help" variant="quiet">Pelajari cara baca</Action>
          </div>
        </MotionDiv>

        <MotionFigure className="about-image-stack" delay={0.08}>
          <div className="about-image-card about-image-card-main">
            <Image
              src="/editorial/batik-malam-tools.jpg"
              alt="Malam batik dipanaskan bersama canting di bengkel tradisional Trusmi, Cirebon"
              fill
              sizes="(max-width: 900px) 100vw, 38vw"
            />
          </div>
          <div className="about-system-rhythm" aria-label="Alur ringkas sistem AI">
            <span>Input visual</span>
            <span>Batch generatif</span>
            <span>Kurasi manusia</span>
            <span>Galeri publik</span>
          </div>
          <figcaption>
            Proses material dan visual AI dipisahkan agar asal gambar tetap terbaca.
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
          <p className="public-kicker">Prinsip kurasi</p>
          <h2>Mesin boleh cepat. Kurasi tetap menentukan apa yang layak tampil.</h2>
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
