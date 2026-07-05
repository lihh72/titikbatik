import { Action } from "@/components/ui/action";
import { BrainCircuit, GalleryHorizontalEnd, ShieldCheck, Workflow } from "lucide-react";
import Image from "next/image";

export const metadata = { title: "Tentang" };

const architecture = [
  {
    title: "Arsip publik",
    text: "Karya yang sudah dipilih kurator tampil sebagai koleksi, lengkap dengan motif, costume, video, dan metadata yang tersedia.",
    icon: GalleryHorizontalEnd,
  },
  {
    title: "Ruang kerja internal",
    text: "Tim mengelola batch, hasil, template costume, wordlist, dan pengaturan tanpa membuka proses produksi ke pengunjung umum.",
    icon: ShieldCheck,
  },
  {
    title: "Pipeline automation",
    text: "FastAPI, worker, SQLite, dan ComfyUI berjalan sebagai mesin produksi di belakang arsip.",
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
  "Motif generatif tidak otomatis mewakili komunitas atau makna sakral.",
];

export default function AboutPage() {
  return (
    <main className="public-narrative-page about-page">
      <section className="public-narrative-hero about-hero">
        <div className="public-narrative-copy motion-reveal">
          <p className="public-kicker">Tentang sistem</p>
          <h1>TitikBatik AI adalah arsip yang punya ruang kerja sendiri.</h1>
          <p>
            Pengunjung membaca koleksi yang sudah dikurasi. Tim internal mengelola produksi,
            batch, dan sumber data tanpa mencampur ruang publik dengan ruang kerja.
          </p>
          <div className="public-narrative-actions">
            <Action href="/gallery">Buka koleksi</Action>
            <Action href="/help" variant="quiet">Pelajari cara baca</Action>
          </div>
        </div>

        <figure className="about-image-stack motion-reveal">
          <div className="about-image-card about-image-card-main">
            <Image
              src="/editorial/batik-malam-tools.jpg"
              alt="Malam batik dipanaskan bersama canting di bengkel tradisional Trusmi, Cirebon"
              fill
              sizes="(max-width: 900px) 100vw, 38vw"
            />
          </div>
          <div className="about-image-card about-image-card-secondary">
            <Image
              src="/editorial/generative-transition.webp"
              alt="Interpretasi konseptual lapisan kain dan garis malam berwarna hijau tinta"
              fill
              sizes="(max-width: 900px) 65vw, 22vw"
            />
          </div>
          <figcaption>
            Proses material dan visual konseptual dipisahkan agar asal gambar tetap terbaca.
          </figcaption>
        </figure>
      </section>

      <section className="about-system-map" aria-label="Arsitektur TitikBatik AI">
        {architecture.map(({ title, text, icon: Icon }, index) => (
          <article className="about-system-card motion-reveal" data-featured={index === 0} key={title}>
            <Icon size={22} aria-hidden="true" />
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section id="sumber-visual" className="about-ethics-panel motion-reveal">
        <div>
          <p className="public-kicker">Prinsip kurasi</p>
          <h2>Teknologi boleh cepat. Arsip tetap perlu jeda baca.</h2>
        </div>
        <div className="about-principles">
          {principles.map((principle) => (
            <p key={principle}>{principle}</p>
          ))}
          <Action href="/editorial/CREDITS.md" variant="secondary">Lihat kredit visual</Action>
        </div>
      </section>
    </main>
  );
}
