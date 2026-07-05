import { Action } from "@/components/ui/action";
import { Bookmark, CircleHelp, Heart, Image, Search } from "lucide-react";
import ImageFrame from "next/image";

export const metadata = { title: "Bantuan" };

const helpItems = [
  {
    title: "Cari berdasarkan bahasa visual",
    text: "Gunakan keyword, warna, atau style. Hasil yang muncul berasal dari data automation yang sudah dipublikasikan.",
    icon: Search,
  },
  {
    title: "Arahkan kartu untuk preview costume",
    text: "Motif tetap menjadi gambar utama. Di desktop, costume muncul saat kartu diarahkan.",
    icon: Image,
  },
  {
    title: "Baca detail sebelum menyimpan",
    text: "Halaman detail memuat metadata, media, seed, tanggal, dan prompt jika data tersedia.",
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
      <section className="help-hero motion-reveal">
        <div>
          <p className="public-kicker">Panduan galeri</p>
          <h1>Mulai dari motif, lalu lihat bagaimana ia bergerak ke costume.</h1>
          <p>
            Galeri publik dibuat untuk membaca karya terkurasi. Produksi batch dan pengaturan
            sistem tetap berada di panel administrator.
          </p>
          <div className="public-narrative-actions">
            <Action href="/gallery">Buka galeri</Action>
            <span className="help-local-chip">
              <Heart size={15} aria-hidden="true" />
              Favorit tersimpan lokal
            </span>
          </div>
        </div>
        <figure className="help-visual-card">
          <ImageFrame
            src="/editorial/generative-transition.webp"
            alt="Interpretasi konseptual lapisan kain dan garis malam berwarna hijau tinta"
            fill
            sizes="(max-width: 900px) 100vw, 34vw"
          />
        </figure>
      </section>

      <section className="help-flow" aria-label="Panduan membaca koleksi">
        {helpItems.map(({ title, text, icon: Icon }) => (
          <article className="help-flow-item motion-reveal" key={title}>
            <Icon size={22} aria-hidden="true" />
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="help-admin-note motion-reveal">
        <div>
          <p className="public-kicker">Untuk kurator</p>
          <h2>Panel admin berada di jalur terpisah.</h2>
        </div>
        <p>
          Masuk hanya jika Anda mengelola batch, publikasi hasil, template costume,
          wordlist, atau pengaturan sistem.
        </p>
        <Action href="/admin/login" variant="secondary">Masuk admin</Action>
      </section>
    </main>
  );
}
