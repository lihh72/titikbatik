"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { LogoMark } from "@/components/logo";
import { Action } from "@/components/ui/action";

export const PUBLIC_NAV_ITEMS = [
  { label: "Beranda", href: "/" },
  { label: "Koleksi", href: "/gallery" },
  { label: "Tentang", href: "/about" },
  { label: "Bantuan", href: "/help" },
] as const;

function isActiveRoute(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function PublicNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="public-header">
      <div className="public-navbar">
        <Link className="public-brand" href="/" aria-label="TitikBatik AI">
          <LogoMark decorative />
          <span>TitikBatik AI</span>
        </Link>

        <nav className="public-desktop-nav" aria-label="Navigasi utama">
          {PUBLIC_NAV_ITEMS.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            return (
              <Link
                className="public-nav-link"
                href={item.href}
                key={item.href}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="public-navbar-actions">
          <Action className="public-navbar-cta" href="/gallery">Jelajahi koleksi</Action>
          <button
            aria-controls="public-mobile-nav"
            aria-expanded={open}
            aria-label={open ? "Tutup navigasi" : "Buka navigasi"}
            className="public-menu-button"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="public-mobile-nav" id="public-mobile-nav" role="dialog" aria-label="Navigasi utama">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              aria-current={isActiveRoute(pathname, item.href) ? "page" : undefined}
              href={item.href}
              key={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
