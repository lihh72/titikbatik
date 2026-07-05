import { Action } from "@/components/ui/action";
import { Bookmark, CircleHelp, Heart, Image, Search } from "lucide-react";

export const metadata = { title: "Bantuan" };

const helpItems = [
  {
    title: "Cari koleksi",
    text: "Gunakan kolom pencarian di galeri untuk mencari keyword, warna, atau style yang didukung backend.",
    icon: Search,
  },
  {
    title: "Baca kartu 1:1",
    text: "Setiap kartu memakai motif sebagai arsip utama. Di desktop, preview costume muncul setelah hover singkat.",
    icon: Image,
  },
  {
    title: "Buka detail",
    text: "Halaman detail menampilkan motif, costume, video, metadata, seed, tanggal, dan prompt bila tersedia.",
    icon: CircleHelp,
  },
  {
    title: "Simpan pilihan",
    text: "Tombol suka dan bookmark menyimpan pilihan di perangkat Anda melalui state lokal browser.",
    icon: Bookmark,
  },
];

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper-raised)] p-6 sm:p-10">
        <CircleHelp size={30} className="text-[color:var(--terracotta-dark)]" aria-hidden="true" />
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-none tracking-[-0.04em] text-[color:var(--ink)] sm:text-6xl">
          Cara menggunakan galeri TitikBatik AI
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
          Area publik dibuat untuk menjelajahi karya terkurasi. Fitur produksi AI tetap berada di panel administrator.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Action href="/gallery">Buka galeri</Action>
          <span className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--line)] px-4 text-sm text-[color:var(--ink-soft)]">
            <Heart size={15} aria-hidden="true" />
            Favorit tersimpan lokal
          </span>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Panduan galeri">
        {helpItems.map(({ title, text, icon: Icon }) => (
          <article key={title} className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper-raised)] p-6">
            <Icon size={22} className="text-[color:var(--terracotta-dark)]" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.025em] text-[color:var(--ink)]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">{text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
