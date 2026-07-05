"use client";

import { LogoMark } from "@/components/logo";
import { Database, GalleryHorizontalEnd, Home, Images, LayoutDashboard, ListChecks, LogOut, Menu, Settings, Shirt, WandSparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const groups = [
  {
    label: "Operasi",
    items: [
      { label: "Ringkasan", href: "/admin", icon: LayoutDashboard },
      { label: "Studio produksi", href: "/admin/studio", icon: WandSparkles },
      { label: "Batch dan job", href: "/admin/history", icon: ListChecks },
    ],
  },
  {
    label: "Kurasi",
    items: [
      { label: "Koleksi batik", href: "/admin/gallery", icon: Images },
      { label: "Template costume", href: "/admin/templates", icon: Shirt },
    ],
  },
  {
    label: "Sistem",
    items: [
      { label: "Wordlist", href: "/admin/wordlists", icon: Database },
      { label: "Pengaturan", href: "/admin/settings", icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function AdminNavGroups({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi admin" className="admin-nav-groups">
      {groups.map((group) => (
        <section key={group.label} className="admin-nav-group" aria-label={group.label}>
          <p className="admin-nav-group-label">{group.label}</p>
          <div className="admin-nav-items">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="admin-nav-link"
                  data-active={active}
                  onClick={onNavigate}
                >
                  <Icon size={17} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

export function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(true);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const dialog = document.querySelector<HTMLElement>("#admin-mobile-drawer");
    const desktopSidebar = document.querySelector<HTMLElement>(".admin-sidebar");
    const mobileBar = document.querySelector<HTMLElement>(".admin-mobile-bar");
    const note = document.querySelector<HTMLElement>(".admin-workbench-note");
    const content = document.querySelector<HTMLElement>("#admin-content");
    const inertTargets = [desktopSidebar, mobileBar, note, content]
      .filter((target): target is HTMLElement => Boolean(target))
      .map((target) => ({ target, wasInert: target.hasAttribute("inert") }));
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    inertTargets.forEach(({ target }) => target.setAttribute("inert", ""));
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
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
    }

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
    <>
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-sidebar-brand">
          <LogoMark decorative />
          <span>
            <strong>TitikBatik AI</strong>
            <small>Curator Workbench</small>
          </span>
        </Link>
        <AdminNavGroups />
        <div className="admin-sidebar-bottom">
          <Link href="/" className="admin-nav-link">
            <Home size={17} aria-hidden="true" />
            Arsip publik
          </Link>
          <button type="button" onClick={onLogout} className="admin-logout-button" aria-label="Keluar dari admin">
            <LogOut size={17} aria-hidden="true" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="admin-mobile-bar">
        <Link href="/admin" className="admin-sidebar-brand">
          <LogoMark decorative />
          <span>
            <strong>TitikBatik AI</strong>
            <small>Workbench</small>
          </span>
        </Link>
        <button
          type="button"
          className="admin-menu-button"
          aria-controls="admin-mobile-drawer"
          aria-expanded={open}
          aria-label="Buka menu admin"
          onClick={() => {
            restoreFocusRef.current = true;
            setOpen(true);
          }}
          ref={triggerRef}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="admin-mobile-drawer" id="admin-mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigasi admin">
          <div className="admin-mobile-drawer-panel">
            <button type="button" className="admin-menu-button" aria-label="Tutup menu admin" onClick={() => setOpen(false)} ref={closeButtonRef}>
              <X size={20} aria-hidden="true" />
            </button>
            <AdminNavGroups onNavigate={() => {
              restoreFocusRef.current = false;
              setOpen(false);
            }} />
            <div className="admin-sidebar-bottom">
              <Link href="/" className="admin-nav-link" onClick={() => {
                restoreFocusRef.current = false;
                setOpen(false);
              }}>
                <GalleryHorizontalEnd size={17} aria-hidden="true" />
                Arsip publik
              </Link>
              <button type="button" onClick={onLogout} className="admin-logout-button">
                <LogOut size={17} aria-hidden="true" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
