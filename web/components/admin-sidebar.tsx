"use client";

import { LogoMark } from "@/components/logo";
import { Database, GalleryHorizontalEnd, Home, Images, LayoutDashboard, ListChecks, LogOut, Menu, Settings, Shirt, WandSparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
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
        <button type="button" className="admin-menu-button" aria-label="Buka menu admin" onClick={() => setOpen(true)}>
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="admin-mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigasi admin">
          <div className="admin-mobile-drawer-panel">
            <button type="button" className="admin-menu-button" aria-label="Tutup menu admin" onClick={() => setOpen(false)}>
              <X size={20} aria-hidden="true" />
            </button>
            <AdminNavGroups onNavigate={() => setOpen(false)} />
            <div className="admin-sidebar-bottom">
              <Link href="/" className="admin-nav-link" onClick={() => setOpen(false)}>
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
