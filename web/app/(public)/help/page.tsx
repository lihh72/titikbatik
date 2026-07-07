import { Action } from "@/components/ui/action";
import { MotionArticle, MotionDiv, MotionSection } from "@/components/public-motion";
import { Bookmark, CircleHelp, Heart, Image, Search } from "lucide-react";

export const metadata = { title: "Bantuan" };

const helpItems = [
  {
    title: "Mulai dari visual yang paling kuat",
    text: "Cari keyword, warna, atau style untuk menemukan motif AI yang langsung cocok dengan arah visual yang dicari.",
    icon: Search,
  },
  {
    title: "Arahkan kartu untuk melihat preview",
    text: "Motif tetap menjadi pusat. Costume preview muncul untuk menunjukkan bagaimana output terasa saat masuk ke media lain.",
    icon: Image,
  },
  {
    title: "Buka detail untuk membandingkan karakter",
    text: "Halaman detail memperlihatkan media, seed, tanggal, dan prompt agar tiap output bisa dinilai lebih tajam.",
    icon: CircleHelp,
  },
  {
    title: "Simpan output yang paling menarik",
    text: "Tombol suka dan bookmark membantu menandai motif yang pantas dilihat lagi.",
    icon: Bookmark,
  },
];

export default function HelpPage() {
  return (
    <main className="public-narrative-page help-page">
      <section className="help-hero">
        <MotionDiv>
          <p className="public-kicker">Panduan output AI</p>
          <h1>Lihat motif AI seperti katalog visual, bukan dokumentasi proses.</h1>
          <p>
            Fokus halaman ini sederhana: temukan motif yang paling kuat, cek preview costume,
            lalu buka detail jika ingin membandingkan karakter generasinya.
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
          <span>Lihat motif</span>
          <span>Cek costume</span>
          <span>Bandingkan detail</span>
          <span>Simpan favorit</span>
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
          <h2>Kurator memilih output yang pantas tampil di galeri.</h2>
        </div>
        <p>
          Masuk hanya jika Anda menyeleksi hasil, memperbarui publikasi,
          atau menyiapkan koleksi baru untuk ditampilkan.
        </p>
        <Action href="/admin/login" variant="secondary">Masuk admin</Action>
      </MotionSection>
    </main>
  );
}
