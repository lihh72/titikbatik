"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { LogoMark } from "@/components/logo";
import { Action } from "@/components/ui/action";

export const PUBLIC_NAV_ITEMS = [
  { label: "Beranda", href: "/" },
  { label: "Koleksi", href: "/gallery" },
  { label: "Tentang", href: "/about" },
  { label: "Bantuan", href: "/help" },
] as const;

function isActiveRoute(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(true);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const dialog = document.querySelector<HTMLElement>("#public-mobile-nav");
    const skipLink = document.querySelector<HTMLElement>(".skip-link");
    const controls = document.querySelector<HTMLElement>(".public-navbar-controls");
    const main = document.querySelector<HTMLElement>("#main-content");
    const footer = document.querySelector<HTMLElement>(".public-footer");
    const inertTargets = [skipLink, controls, main, footer].filter((target): target is HTMLElement => Boolean(target)).map((target) => ({
      target,
      wasInert: target.hasAttribute("inert"),
    }));
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    inertTargets.forEach(({ target }) => target.setAttribute("inert", ""));
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("button, a[href]"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      inertTargets.forEach(({ target, wasInert }) => {
        if (!wasInert) target.removeAttribute("inert");
      });
      if (restoreFocusRef.current && trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  return (
    <header className="public-header">
      <div className="public-navbar public-navbar-controls">
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
            onClick={() => {
              restoreFocusRef.current = true;
              setOpen((current) => !current);
            }}
            ref={triggerRef}
            type="button"
          >
            {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="public-mobile-nav" id="public-mobile-nav" role="dialog" aria-label="Navigasi utama" aria-modal="true">
          <button
            aria-label="Tutup dialog navigasi"
            className="public-dialog-close"
            onClick={() => setOpen(false)}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" size={22} />
          </button>
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              aria-current={isActiveRoute(pathname, item.href) ? "page" : undefined}
              href={item.href}
              key={item.href}
              onClick={() => {
                restoreFocusRef.current = false;
                setOpen(false);
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
