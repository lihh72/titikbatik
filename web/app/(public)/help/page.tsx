import { Action } from "@/components/ui/action";
import { MotionArticle, MotionDiv, MotionSection } from "@/components/public-motion";
import { Bookmark, CircleHelp, Heart, Image, Search } from "lucide-react";

export const metadata = { title: "Bantuan" };

const helpItems = [
  {
    title: "Cari output AI berdasarkan bahasa visual",
    text: "Gunakan keyword, warna, atau style. Hasil yang muncul berasal dari pipeline automation yang sudah dipublikasikan.",
    icon: Search,
  },
  {
    title: "Arahkan kartu untuk preview costume",
    text: "Motif AI tetap menjadi gambar utama. Di desktop, costume muncul saat kartu diarahkan.",
    icon: Image,
  },
  {
    title: "Baca detail generasi sebelum menyimpan",
    text: "Halaman detail memuat metadata, media, seed, tanggal, dan prompt generatif jika data tersedia.",
    icon: CircleHelp,
  },
  {
    title: "Simpan pilihan di perangkat",
    text: "Tombol suka dan bookmark menyimpan referensi di browser yang sedang dipakai.",
    icon: Bookmark,
  },
];

export default function HelpPage() {
  return (
    <main className="public-narrative-page help-page">
      <section className="help-hero">
        <MotionDiv>
          <p className="public-kicker">Panduan output AI</p>
          <h1>Mulai dari motif AI, lalu lihat bagaimana ia bergerak ke costume.</h1>
          <p>
            Galeri publik dibuat untuk membaca hasil generative AI yang sudah dikurasi.
            Produksi batch dan pengaturan model tetap berada di panel administrator.
          </p>
          <div className="public-narrative-actions">
            <Action href="/gallery">Buka galeri</Action>
            <span className="help-local-chip">
              <Heart size={15} aria-hidden="true" />
              Favorit tersimpan lokal
            </span>
          </div>
        </MotionDiv>
        <MotionDiv className="help-visual-card help-guide-card" delay={0.08} role="img" aria-label="Alur membaca motif AI dari galeri sampai detail">
          <span>Motif AI</span>
          <span>Hover costume</span>
          <span>Detail generasi</span>
          <span>Simpan lokal</span>
        </MotionDiv>
      </section>

      <section className="help-flow" aria-label="Panduan membaca koleksi">
        {helpItems.map(({ title, text, icon: Icon }, index) => (
          <MotionArticle className="help-flow-item" delay={index * 0.06} key={title}>
            <Icon size={22} aria-hidden="true" />
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </MotionArticle>
        ))}
      </section>

      <MotionSection className="help-admin-note">
        <div>
          <p className="public-kicker">Untuk kurator</p>
          <h2>Panel admin mengatur produksi AI dari jalur terpisah.</h2>
        </div>
        <p>
          Masuk hanya jika Anda mengelola batch generatif, publikasi hasil,
          template costume, wordlist, atau pengaturan sistem.
        </p>
        <Action href="/admin/login" variant="secondary">Masuk admin</Action>
      </MotionSection>
    </main>
  );
}
