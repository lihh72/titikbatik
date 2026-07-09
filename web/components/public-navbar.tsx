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

const desktopLinkClass =
  "relative inline-flex h-full items-center whitespace-nowrap text-sm font-bold after:absolute after:right-0 after:bottom-[-1px] after:left-0 after:h-[3px] after:origin-center after:scale-x-0 after:bg-[var(--terracotta)] after:transition-transform after:duration-[180ms] hover:text-[color:var(--ink)]";

const inactiveDesktopLinkClass = "!text-[color:var(--ink-soft)]";
const activeDesktopLinkClass = "!text-[color:var(--ink)] after:scale-x-100";

const mobileLinkClass =
  "min-h-12 content-center border-b border-[color-mix(in_srgb,var(--line)_60%,transparent)] px-2 font-bold";

export function PublicNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(true);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const closeTimer = window.setTimeout(() => setOpen(false), 0);
    document.documentElement.classList.remove("public-menu-open");
    document.body.classList.remove("public-menu-open");
    document.body.style.overflow = "";
    return () => window.clearTimeout(closeTimer);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const dialog = document.querySelector<HTMLElement>("#public-mobile-nav");
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;

    document.documentElement.classList.add("public-menu-open");
    document.body.classList.add("public-menu-open");
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus({ preventScroll: true });

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
      document.documentElement.classList.remove("public-menu-open");
      document.body.classList.remove("public-menu-open");
      document.body.style.overflow = previousOverflow;
      if (restoreFocusRef.current && trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-[70] border-b border-[color-mix(in_srgb,var(--line)_82%,transparent)] bg-[color-mix(in_srgb,var(--paper-raised)_92%,transparent)] backdrop-blur-[18px] backdrop-saturate-[140%]">
      <div className="public-navbar-controls mx-auto flex h-[72px] w-[calc(100%_-_2rem)] max-w-7xl items-center justify-between gap-8 max-[55rem]:h-16">
        <Link
          className="inline-flex items-center gap-3 whitespace-nowrap font-extrabold tracking-[-0.02em]"
          href="/"
          aria-label="TitikBatik AI"
          onClick={() => setOpen(false)}
        >
          <LogoMark decorative />
          <span>TitikBatik AI</span>
        </Link>

        <nav className="flex self-stretch items-center gap-7 max-[55rem]:hidden" aria-label="Navigasi utama">
          {PUBLIC_NAV_ITEMS.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            return (
              <Link
                className={`${desktopLinkClass} ${active ? activeDesktopLinkClass : inactiveDesktopLinkClass}`}
                href={item.href}
                key={item.href}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center">
          <Action className="max-[55rem]:hidden" href="/gallery">Lihat output AI</Action>
          <button
            aria-controls="public-mobile-nav"
            aria-expanded={open}
            aria-label={open ? "Tutup navigasi" : "Buka navigasi"}
            className="hidden size-11 place-items-center rounded-[var(--radius-sm)] border border-[var(--line)] bg-transparent text-[color:var(--ink)] max-[55rem]:grid"
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
        <div
          className="fixed inset-x-0 top-[72px] bottom-0 z-[75] grid auto-rows-min overflow-y-auto overscroll-contain border-t border-[var(--line)] bg-[var(--paper-raised)] px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch] max-[55rem]:top-16 max-[55rem]:bottom-auto max-[55rem]:h-[calc(100svh-64px)]"
          id="public-mobile-nav"
          role="dialog"
          aria-label="Navigasi utama"
          aria-modal="true"
        >
          <button
            aria-label="Tutup dialog navigasi"
            className="ml-auto grid size-11 place-items-center rounded-[var(--radius-sm)] border border-[var(--line)] bg-transparent text-[color:var(--ink)]"
            onClick={() => setOpen(false)}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" size={22} />
          </button>
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              className={`${mobileLinkClass} ${isActiveRoute(pathname, item.href) ? "!text-[color:var(--terracotta-dark)]" : "!text-[color:var(--ink-soft)]"}`}
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
