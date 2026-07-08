import Link from "next/link";

import { LogoMark } from "@/components/logo";

const FOOTER_NAV_ITEMS = [
  { label: "Beranda", href: "/" },
  { label: "Koleksi", href: "/gallery" },
  { label: "Tentang", href: "/about" },
  { label: "Bantuan", href: "/help" },
] as const;

const CONTACT_EMAIL = "halo@titikbatik.ai";

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-inner">
        <div className="public-footer-top">
          <div className="public-footer-intro" aria-label="TitikBatik AI">
            <div className="public-footer-brand">
              <LogoMark decorative />
              <strong>TitikBatik AI</strong>
            </div>
            <p>Output generative AI untuk motif, preview costume, video, dan metadata kurasi.</p>
          </div>

          <nav className="public-footer-nav" aria-label="Navigasi footer">
            {FOOTER_NAV_ITEMS.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          </nav>

          <a className="public-footer-contact" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </div>

        <div className="public-footer-meta" aria-label="Informasi situs">
          <p>© 2026 TitikBatik.</p>
          <div>
            <Link href="/about#sumber-visual">Sumber visual</Link>
            <Link href="/admin/login">Akses Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
