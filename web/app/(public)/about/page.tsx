import { Action } from "@/components/ui/action";
import { BrainCircuit, GalleryHorizontalEnd, ShieldCheck, Workflow } from "lucide-react";

export const metadata = { title: "Tentang" };

const architecture = [
  {
    title: "Galeri publik",
    text: "Pengunjung melihat karya yang sudah dipublikasikan, mencari motif, membuka detail, lalu menyimpan pilihan secara lokal.",
    icon: GalleryHorizontalEnd,
  },
  {
    title: "Studio administrator",
    text: "Tim internal mengelola produksi, riwayat batch, kurasi, template costume, wordlist, dan pengaturan sistem.",
    icon: ShieldCheck,
  },
  {
    title: "Pipeline AI",
    text: "FastAPI dan proses generatif berjalan di belakang layar. Fitur produksi tidak dibuka sebagai layanan publik.",
    icon: BrainCircuit,
  },
  {
    title: "Kurasi manusia",
    text: "Hasil baru tidak otomatis menjadi arsip publik. Administrator memilih karya yang layak tampil.",
    icon: Workflow,
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper-raised)] p-6 sm:p-10 lg:p-14">
        <p className="text-sm font-semibold text-[color:var(--terracotta-dark)]">Tentang sistem</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-none tracking-[-0.045em] text-[color:var(--ink)] sm:text-6xl">
          TitikBatik AI memisahkan arsip publik dari studio produksi.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-[color:var(--ink-soft)]">
          Pengunjung umum melihat karya yang sudah dikurasi. Proses pembuatan motif, pengolahan costume, dan pengaturan pipeline tetap berada di area administrator.
        </p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Arsitektur sistem">
        {architecture.map(({ title, text, icon: Icon }) => (
          <article key={title} className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper-raised)] p-6">
            <Icon size={22} className="text-[color:var(--terracotta-dark)]" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.025em] text-[color:var(--ink)]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">{text}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper-raised)] p-7 sm:p-9">
          <h2 className="text-3xl font-semibold tracking-[-0.035em] text-[color:var(--ink)]">Etika penggunaan visual</h2>
          <div className="mt-5 space-y-4 text-sm leading-7 text-[color:var(--ink-soft)]">
            <p>Motif tradisional memiliki konteks sejarah, filosofi, dan aturan penggunaan yang perlu dihormati.</p>
            <p>Hasil generatif diperlakukan sebagai eksperimen visual yang harus dikurasi manusia sebelum tampil ke publik.</p>
            <p>Foto dokumenter dan visual konseptual diberi pemisahan jelas agar pengunjung memahami asal gambar yang mereka lihat.</p>
          </div>
        </article>

        <article id="sumber-visual" className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper-raised)] p-7 sm:p-9">
          <h2 className="text-2xl font-semibold tracking-[-0.025em] text-[color:var(--ink)]">Sumber visual</h2>
          <p className="mt-4 text-sm leading-7 text-[color:var(--ink-soft)]">
            Gambar dokumenter digunakan sesuai lisensi dan kredit sumber yang tersedia. Visual konseptual yang dibuat dengan bantuan AI diberi label agar asalnya mudah dikenali.
          </p>
          <div className="mt-7">
            <Action href="/editorial/CREDITS.md" variant="secondary">Lihat kredit visual</Action>
          </div>
        </article>
      </section>
    </main>
  );
}
