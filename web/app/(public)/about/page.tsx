import { BrainCircuit, GalleryHorizontalEnd, Layers3, ShieldCheck, Sparkles, Workflow } from "lucide-react";

export const metadata = { title: "Tentang" };

const architecture = [
  { title: "Galeri Publik", text: "Pengunjung dapat melihat, mencari, memfilter, menyukai, dan menyimpan koleksi yang telah dipublikasikan.", icon: GalleryHorizontalEnd },
  { title: "Area Administrator", text: "Studio internal digunakan untuk mengelola proses produksi, riwayat, kurasi, dan publikasi hasil.", icon: ShieldCheck },
  { title: "Backend & AI Engine", text: "FastAPI dan pipeline AI bekerja di belakang layar dan tidak diekspos sebagai fitur publik.", icon: BrainCircuit },
  { title: "Proses Kurasi", text: "Hasil baru berstatus draft dan hanya tampil di galeri setelah disetujui oleh administrator.", icon: Workflow },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <section className="archive-panel overflow-hidden rounded-[36px] p-6 sm:p-10 lg:p-14">
        <div className="max-w-3xl"><div className="flex items-center gap-2 text-xs uppercase tracking-[.2em] text-[#ffb66c]"><span className="h-px w-8 bg-[#ff9d42]" />Tentang Sistem</div><h1 className="mt-5 text-4xl font-semibold tracking-[-.045em] sm:text-6xl">TitikBatik AI memisahkan galeri publik dan studio produksi internal.</h1><p className="mt-6 text-base leading-8 text-white/52">Pengunjung umum hanya melihat karya yang sudah dikurasi. Proses pembuatan motif dan pengolahan lanjutan dijalankan oleh tim melalui area administrator yang dilindungi autentikasi.</p></div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">{architecture.map(({ title, text, icon: Icon }) => <article key={title} className="archive-soft rounded-[26px] p-6"><Icon size={21} className="text-[#ffad5d]" /><h2 className="mt-5 text-xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-white/44">{text}</p></article>)}</div>
      </section>
      <section className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="archive-panel rounded-[32px] p-7 sm:p-9"><div className="flex items-center gap-2 text-xs uppercase tracking-[.18em] text-[#ffb66c]"><ShieldCheck size={15} />Etika Penggunaan</div><h2 className="mt-4 text-3xl font-semibold tracking-tight">AI digunakan sebagai alat bantu, bukan pengganti perajin.</h2><div className="mt-6 space-y-4 text-sm leading-7 text-white/48"><p>Motif tradisional memiliki konteks sejarah, filosofi, dan aturan penggunaan yang perlu dihormati.</p><p>Hasil generatif dikurasi manusia sebelum digunakan untuk publikasi atau kepentingan lain.</p><p>Motif sakral, identitas komunitas, dan karya perajin tidak boleh diklaim tanpa atribusi dan verifikasi.</p></div></div><div className="archive-panel rounded-[32px] p-7 sm:p-9"><Layers3 size={21} className="text-[#ffad5d]" /><h2 className="mt-5 text-2xl font-semibold">Pengalaman publik yang sederhana</h2><p className="mt-4 text-sm leading-7 text-white/48">Antarmuka publik difokuskan pada pengalaman menjelajah koleksi. Detail teknis, prompt, riwayat produksi, dan kontrol AI disimpan pada lingkungan internal.</p><div className="mt-6 flex items-center gap-2 text-xs text-[#ffb363]"><Sparkles size={14} />Publikasi dilakukan setelah pemeriksaan admin</div></div></section>
    </main>
  );
}
