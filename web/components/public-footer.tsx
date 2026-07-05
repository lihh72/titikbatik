import Link from "next/link";

import { LogoMark } from "@/components/logo";

const FOOTER_NAV_ITEMS = [
  { label: "Beranda", href: "/" },
  { label: "Koleksi", href: "/gallery" },
  { label: "Tentang", href: "/about" },
  { label: "Bantuan", href: "/help" },
] as const;

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-inner">
        <div className="public-footer-intro">
          <div className="public-footer-brand"><LogoMark decorative /><strong>TitikBatik AI</strong></div>
          <p>Koleksi batik digital dipublikasikan melalui kurasi manusia dan etika AI yang bertanggung jawab.</p>
        </div>
        <nav className="public-footer-nav" aria-label="Navigasi footer">
          {FOOTER_NAV_ITEMS.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <div className="public-footer-meta">
          <Link href="/about#sumber-visual">Sumber visual</Link>
          <Link href="/admin/login">Akses Admin</Link>
        </div>
      </div>
    </footer>
  );
}
