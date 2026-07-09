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

const pageClass =
  "mx-auto w-[min(100%,88rem)] overflow-x-hidden px-[clamp(1rem,3.5vw,3rem)] pt-[clamp(2rem,5vw,4rem)] pb-[clamp(5rem,9vw,8rem)]";

const kickerClass =
  "m-0 text-[0.78rem] font-extrabold tracking-[0.08em] text-[color:var(--terracotta-dark)] uppercase";

export default function HelpPage() {
  return (
    <main className={pageClass}>
      <section className="grid min-h-[min(42rem,calc(100dvh_-_72px))] grid-cols-[minmax(0,0.9fr)_minmax(18rem,0.62fr)] items-center gap-[clamp(2rem,6vw,6rem)] rounded-[var(--radius-md)] border border-[var(--line)] bg-[radial-gradient(circle_at_84%_18%,color-mix(in_srgb,var(--terracotta)_10%,transparent),transparent_28rem),color-mix(in_srgb,var(--paper-raised)_90%,white)] p-[clamp(2rem,5vw,4rem)] max-[55rem]:min-h-[auto] max-[55rem]:grid-cols-1 max-[55rem]:p-6">
        <MotionDiv>
          <p className={kickerClass}>Panduan output AI</p>
          <h1 className="mt-4 max-w-[62rem] text-[clamp(2.8rem,5vw,5.2rem)] leading-[0.98] font-semibold tracking-[-0.06em] text-[color:var(--ink)] text-balance max-[55rem]:text-[clamp(2.3rem,13vw,4rem)]">Lihat motif AI seperti katalog visual yang siap dikurasi.</h1>
          <p className="mt-[1.4rem] max-w-[45rem] text-[clamp(1rem,1.35vw,1.15rem)] leading-[1.75] text-[color:var(--ink-soft)]">
            Fokus halaman ini sederhana: temukan motif yang paling kuat, cek preview costume,
            lalu buka detail jika ingin membandingkan karakter generasinya.
          </p>
          <div className="mt-[1.8rem] flex flex-wrap gap-3">
            <Action href="/gallery">Buka galeri</Action>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--line)_76%,transparent)] bg-[color-mix(in_srgb,var(--paper)_78%,white)] px-4 text-sm font-bold text-[color:var(--ink-soft)]">
              <Heart size={15} aria-hidden="true" />
              Favorit tersimpan lokal
            </span>
          </div>
        </MotionDiv>
        <MotionDiv className="relative grid min-h-80 content-center gap-3 overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[radial-gradient(circle_at_82%_18%,color-mix(in_srgb,var(--terracotta)_12%,transparent),transparent_18rem),color-mix(in_srgb,var(--paper-raised)_86%,white)] p-[clamp(1.4rem,4vw,3rem)]" delay={0.08} role="img" aria-label="Alur membaca motif AI dari galeri sampai detail">
          {["Lihat motif", "Cek costume", "Bandingkan detail", "Simpan favorit"].map((label, index) => (
            <span
              className="block rounded-full border border-[color-mix(in_srgb,var(--line)_78%,transparent)] bg-[color-mix(in_srgb,var(--paper)_80%,white)] px-[0.72rem] py-[0.58rem] text-[0.78rem] font-extrabold text-[color:var(--ink)] motion-safe:animate-[public-float-token_4.8s_ease-in-out_infinite_alternate]"
              key={label}
              style={{ animationDelay: `${index * 120}ms` }}
            >
              {label}
            </span>
          ))}
        </MotionDiv>
      </section>

      <section className="mt-[clamp(1.5rem,3vw,2.5rem)] grid grid-cols-2 gap-[clamp(1rem,2vw,1.5rem)] max-[55rem]:grid-cols-1" aria-label="Panduan membaca koleksi">
        {helpItems.map(({ title, text, icon: Icon }, index) => (
          <MotionArticle className="grid min-h-48 grid-cols-[2.8rem_minmax(0,1fr)] gap-4 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--paper-raised)] p-[clamp(1.2rem,2.4vw,2rem)] max-[55rem]:grid-cols-[2.3rem_minmax(0,1fr)]" delay={index * 0.06} key={title}>
            <Icon className="mt-1 text-[color:var(--terracotta-dark)]" size={22} aria-hidden="true" />
            <div>
              <h2 className="m-0 text-[clamp(1.25rem,2vw,1.8rem)] leading-[1.08] font-semibold tracking-[-0.04em] text-[color:var(--ink)]">{title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[color:var(--ink-soft)]">{text}</p>
            </div>
          </MotionArticle>
        ))}
      </section>

      <MotionSection className="mt-[clamp(1.5rem,3vw,2.5rem)] grid grid-cols-[0.8fr_1fr_auto] items-center gap-6 rounded-[var(--radius-md)] border border-[var(--line)] bg-[color-mix(in_srgb,var(--paper-raised)_82%,white)] p-[clamp(1.5rem,4vw,3rem)] max-[55rem]:grid-cols-1">
        <div>
          <p className={kickerClass}>Untuk kurator</p>
          <h2 className="mt-3 max-w-[20ch] text-[clamp(1.8rem,3vw,3rem)] leading-[1.02] font-semibold tracking-[-0.05em] text-[color:var(--ink)]">Kurator memilih output yang pantas tampil di galeri.</h2>
        </div>
        <p className="m-0 max-w-[45rem] text-[clamp(1rem,1.35vw,1.15rem)] leading-[1.75] text-[color:var(--ink-soft)]">
          Masuk hanya jika Anda menyeleksi hasil, memperbarui publikasi,
          atau menyiapkan koleksi baru untuk ditampilkan.
        </p>
        <Action href="/admin/login" variant="secondary">Masuk admin</Action>
      </MotionSection>
    </main>
  );
}
