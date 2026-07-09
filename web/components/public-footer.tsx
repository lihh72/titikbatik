import Link from "next/link";

import { LogoMark } from "@/components/logo";

const FOOTER_NAV_ITEMS = [
  { label: "Beranda", href: "/" },
  { label: "Koleksi", href: "/gallery" },
  { label: "Tentang", href: "/about" },
  { label: "Bantuan", href: "/help" },
] as const;

const CONTACT_EMAIL = "halo@titikbatik.ai";

const footerLinkClass =
  "underline decoration-transparent underline-offset-4 transition hover:decoration-[color:var(--terracotta)]";

export function PublicFooter() {
  return (
    <footer className="border-t border-[color-mix(in_srgb,var(--line)_82%,transparent)] bg-[color-mix(in_srgb,var(--paper-raised)_96%,var(--paper))] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex min-h-17 flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div aria-label="TitikBatik AI">
            <div className="inline-flex items-center gap-3 whitespace-nowrap font-extrabold tracking-[-0.02em]">
              <LogoMark decorative />
              <strong>TitikBatik AI</strong>
            </div>
            <p className="mt-2 max-w-120 text-[0.95rem] leading-[1.45] text-[color:var(--ink-soft)]">
              Output generative AI untuk motif, preview costume, video, dan metadata kurasi.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-start gap-x-5 gap-y-2 lg:justify-center" aria-label="Navigasi footer">
            {FOOTER_NAV_ITEMS.map((item) => (
              <Link className={`${footerLinkClass} font-bold text-[color:var(--ink)]`} href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <a className={`${footerLinkClass} whitespace-nowrap font-bold text-[color:var(--ink)]`} href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </div>

        <div
          className="mt-4 flex flex-col items-start gap-x-6 gap-y-3 border-t border-[color-mix(in_srgb,var(--line)_72%,transparent)] pt-3 text-[0.8125rem] text-[color:var(--ink-soft)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
          aria-label="Informasi situs"
        >
          <p className="m-0">© 2026 TitikBatik.</p>
          <div className="inline-flex flex-wrap gap-x-6 gap-y-2">
            <Link className={footerLinkClass} href="/about#sumber-visual">
              Sumber visual
            </Link>
            <Link className={footerLinkClass} href="/admin/login">
              Akses Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
