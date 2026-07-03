import { Bookmark, CircleHelp, Heart, Search } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Pusat Bantuan" };

const steps = [
  { title: "Cari koleksi", text: "Gunakan kolom pencarian, kategori, dan pengurutan pada halaman galeri.", icon: Search },
  { title: "Lihat detail", text: "Buka kartu motif untuk melihat komposisi, palet, inspirasi, dan status kurasi.", icon: CircleHelp },
  { title: "Simpan favorit", text: "Gunakan tombol suka atau bookmark untuk menyimpan pilihan di perangkat Anda.", icon: Bookmark },
];

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-8 sm:px-6 lg:px-8">
      <section className="glass-panel rounded-[36px] p-6 sm:p-10"><CircleHelp size={28} className="text-[#ffad5d]" /><h1 className="mt-5 text-4xl font-semibold tracking-[-.04em]">Cara menggunakan galeri TitikBatik AI</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-white/48">Area publik dibuat khusus untuk menjelajahi karya yang telah dikurasi. Fitur produksi AI tidak tersedia bagi pengunjung umum.</p><div className="mt-9 grid gap-4 md:grid-cols-3">{steps.map(({ title, text, icon: Icon }, index) => <article key={title} className="glass-soft rounded-[26px] p-5"><div className="flex items-center justify-between"><Icon size={20} className="text-[#ffad5d]" /><span className="text-xs text-white/25">0{index + 1}</span></div><h2 className="mt-5 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-white/42">{text}</p></article>)}</div><div className="mt-8 flex flex-wrap gap-3"><Link href="/gallery" className="inline-flex rounded-full bg-[#ff9d42] px-6 py-3 text-sm font-semibold text-[#201307] transition hover:scale-105 hover:bg-[#ffb363]">Buka Galeri</Link><span className="glass-soft inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm text-white/50"><Heart size={15} />Favorit tersimpan secara lokal</span></div></section>
    </main>
  );
}
