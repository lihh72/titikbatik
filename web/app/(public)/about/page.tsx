import { Action } from "@/components/ui/action";
import { MotionArticle, MotionDiv, MotionFigure, MotionSection } from "@/components/public-motion";
import { cn } from "@/lib/utils";
import { BrainCircuit, GalleryHorizontalEnd, ShieldCheck, Workflow } from "lucide-react";
import Image from "next/image";

export const metadata = { title: "Tentang" };

const architecture = [
  {
    title: "Motif yang siap dilihat",
    text: "Setiap kartu menampilkan motif AI sebagai objek utama dengan palet dan komposisi yang jelas.",
    icon: GalleryHorizontalEnd,
  },
  {
    title: "Preview yang menjual bentuk",
    text: "Costume preview dan video membantu melihat apakah motif tetap kuat saat masuk ke konteks visual lain.",
    icon: ShieldCheck,
  },
  {
    title: "Variasi generative AI",
    text: "Galeri memperlihatkan variasi warna, pola, dan gaya yang lahir dari eksplorasi AI.",
    icon: BrainCircuit,
  },
  {
    title: "Kurasi visual",
    text: "Yang tampil dipilih karena komposisi dan detailnya cukup kuat untuk dipamerkan.",
    icon: Workflow,
  },
];

const principles = [
  "Motif harus terbaca kuat sebagai gambar utama.",
  "Preview costume dipakai untuk menguji daya tarik visual.",
  "Metadata membantu membandingkan karakter tiap output AI.",
];

const pageClass =
  "mx-auto w-[min(100%,88rem)] overflow-x-hidden px-[clamp(1rem,3.5vw,3rem)] pt-[clamp(2rem,5vw,4rem)] pb-[clamp(5rem,9vw,8rem)]";

const kickerClass =
  "m-0 text-[0.78rem] font-extrabold tracking-[0.08em] text-[color:var(--terracotta-dark)] uppercase";

const heroClass =
  "grid min-h-[min(42rem,calc(100dvh_-_72px))] items-center gap-[clamp(2rem,6vw,6rem)] rounded-[var(--radius-md)] border border-[var(--line)] bg-[radial-gradient(circle_at_84%_18%,color-mix(in_srgb,var(--terracotta)_10%,transparent),transparent_28rem),color-mix(in_srgb,var(--paper-raised)_90%,white)] p-[clamp(2rem,5vw,4rem)] min-[55.01rem]:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.72fr)] max-[55rem]:min-h-[auto] max-[55rem]:grid-cols-1 max-[55rem]:p-6";

const heroTitleClass =
  "mt-4 max-w-[62rem] text-[clamp(2.8rem,5vw,5.2rem)] leading-[0.98] font-semibold tracking-[-0.06em] text-[color:var(--ink)] text-balance max-[55rem]:text-[clamp(2.3rem,13vw,4rem)]";

const heroCopyClass =
  "mt-[1.4rem] max-w-[45rem] text-[clamp(1rem,1.35vw,1.15rem)] leading-[1.75] text-[color:var(--ink-soft)]";

export default function AboutPage() {
  return (
    <main className={pageClass}>
      <section className={heroClass}>
        <MotionDiv>
          <p className={kickerClass}>Tentang galeri AI</p>
          <h1 className={heroTitleClass}>TitikBatik AI memamerkan motif generatif yang sudah dipilih.</h1>
          <p className={heroCopyClass}>
            Halaman ini dibuat untuk melihat kualitas hasil: motif utama, preview costume,
            video, dan metadata yang membantu membaca karakter setiap generasi.
          </p>
          <div className="mt-[1.8rem] flex flex-wrap gap-3">
            <Action href="/gallery">Buka koleksi</Action>
            <Action href="/help" variant="quiet">Cara menilai output</Action>
          </div>
        </MotionDiv>

        <MotionFigure className="relative m-0 min-h-[clamp(20rem,32vw,27rem)]" delay={0.08}>
          <div className="relative h-[clamp(17rem,28vw,23.5rem)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[radial-gradient(circle_at_82%_18%,color-mix(in_srgb,var(--terracotta)_12%,transparent),transparent_18rem),color-mix(in_srgb,var(--paper-raised)_86%,white)]">
            <Image
              src="/editorial/generative-transition.webp"
              alt="Visual tekstil generatif dengan garis organik di atas kain"
              fill
              sizes="(max-width: 900px) 100vw, 38vw"
              className="object-cover"
            />
          </div>
          <div className="absolute right-[clamp(0.8rem,4vw,3rem)] bottom-[clamp(3.6rem,5vw,5rem)] grid w-[min(54%,18rem)] gap-[0.55rem] rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--line)_78%,transparent)] bg-[color-mix(in_srgb,var(--paper-raised)_92%,transparent)] p-[0.85rem] shadow-[0_24px_64px_color-mix(in_srgb,var(--ink)_18%,transparent)] backdrop-blur-[14px] max-[55rem]:relative max-[55rem]:right-auto max-[55rem]:bottom-auto max-[55rem]:mt-[-4rem] max-[55rem]:ml-auto max-[55rem]:w-[min(calc(100%_-_2rem),18rem)]" aria-label="Alur ringkas sistem AI">
            {["Motif utama", "Costume preview", "Video", "Metadata"].map((label) => (
              <span className="block rounded-full border border-[color-mix(in_srgb,var(--line)_78%,transparent)] bg-[color-mix(in_srgb,var(--paper)_80%,white)] px-[0.72rem] py-[0.58rem] text-[0.78rem] font-extrabold text-[color:var(--ink)] motion-safe:animate-[public-float-token_5.8s_ease-in-out_infinite_alternate]" key={label}>
                {label}
              </span>
            ))}
          </div>
          <figcaption className="mt-4 max-w-md text-[0.78rem] leading-[1.55] text-[color:var(--ink-soft)]">
            Galeri publik dirancang sebagai ruang pamer untuk motif, costume preview, video, dan metadata.
          </figcaption>
        </MotionFigure>
      </section>

      <section className="mt-[clamp(1.5rem,3vw,2.5rem)] grid grid-cols-12 gap-[clamp(1rem,2vw,1.5rem)] max-[55rem]:grid-cols-1" aria-label="Arsitektur TitikBatik AI">
        {architecture.map(({ title, text, icon: Icon }, index) => (
          <MotionArticle
            className={cn(
              "min-h-60 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--paper-raised)] p-[clamp(1.2rem,2.4vw,2rem)] transition-[border-color,background-color,transform] duration-[220ms] hover:-translate-y-1 hover:border-[color:var(--terracotta-dark)] max-[55rem]:col-span-1 max-[55rem]:min-h-0",
              index === 0 && "col-span-5 row-span-2 bg-[color-mix(in_srgb,var(--paper-raised)_86%,white)]",
              index === 1 && "col-span-7",
              index === 2 && "col-span-4",
              index === 3 && "col-span-3",
            )}
            data-featured={index === 0}
            delay={index * 0.06}
            key={title}
          >
            <Icon className="text-[color:var(--terracotta-dark)]" size={22} aria-hidden="true" />
            <h2 className="mt-12 max-w-[16rem] text-[clamp(1.45rem,2.5vw,2.2rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-[color:var(--ink)]">{title}</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[color:var(--ink-soft)]">{text}</p>
          </MotionArticle>
        ))}
      </section>

      <MotionSection id="sumber-visual" className="mt-[clamp(1.5rem,3vw,2.5rem)] grid grid-cols-[0.85fr_1.15fr] gap-[clamp(1.5rem,4vw,4rem)] rounded-[var(--radius-md)] border border-[var(--line)] bg-[color-mix(in_srgb,var(--paper-raised)_82%,white)] p-[clamp(1.5rem,4vw,3rem)] max-[55rem]:grid-cols-1">
        <div>
          <p className={kickerClass}>Prinsip tampilan</p>
          <h2 className="mt-4 max-w-[18ch] text-[clamp(2rem,4vw,3.8rem)] leading-none font-semibold tracking-[-0.055em] text-[color:var(--ink)]">Output AI harus terlihat layak sebelum diberi penjelasan panjang.</h2>
        </div>
        <div className="grid content-start gap-3">
          {principles.map((principle) => (
            <p className="m-0 rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--line)_70%,transparent)] bg-[color-mix(in_srgb,var(--paper)_80%,white)] p-4 text-sm leading-6 text-[color:var(--ink-soft)]" key={principle}>{principle}</p>
          ))}
          <p className="m-0 border-t border-[color-mix(in_srgb,var(--line)_72%,transparent)] pt-4 text-sm leading-6 text-[color:var(--ink-soft)]">
            Kredit visual: beberapa foto editorial bersumber dari{" "}
            <a
              className="font-semibold text-[color:var(--ink)] underline decoration-[color-mix(in_srgb,var(--terracotta)_45%,transparent)] underline-offset-4 transition hover:text-[color:var(--terracotta-dark)]"
              href="https://commons.wikimedia.org/wiki/Category:Batik_in_Cirebon"
              rel="noreferrer"
              target="_blank"
            >
              Wikimedia Commons
            </a>
            ; visual generatif dibuat khusus untuk TitikBatik AI.
          </p>
        </div>
      </MotionSection>
    </main>
  );
}
