"use client";

import { LogoMark } from "@/components/logo";
import { GalleryHorizontalEnd, History, Home, LayoutDashboard, LogOut, Menu, ShieldCheck, WandSparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Studio AI", href: "/admin/studio", icon: WandSparkles },
  { label: "Riwayat", href: "/admin/history", icon: History },
  { label: "Publikasi Galeri", href: "/admin/gallery", icon: GalleryHorizontalEnd },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090a0b] text-white">
      <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_10%,rgba(255,180,102,.16),transparent_27%),radial-gradient(circle_at_15%_36%,rgba(65,86,67,.23),transparent_32%),linear-gradient(135deg,#080a0b_0%,#171411_48%,#090a0b_100%)]" />
        <div className="absolute right-[5%] top-[7%] h-44 w-44 rounded-full bg-[#ffb05c]/15 blur-[55px]" />
        <div className="absolute inset-0 bg-black/28 backdrop-blur-[3px]" />
      </div>
      <div className="ambient-noise" />

      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-6">
        <nav className="glass-panel mx-auto flex max-w-[1480px] items-center justify-between rounded-full px-3 py-2.5 sm:px-4">
          <Link href="/admin" className="flex items-center gap-2.5 pl-1"><LogoMark /><div className="leading-none"><span className="block text-sm font-semibold sm:text-base">TitikBatik AI</span><span className="mt-1 hidden text-[9px] uppercase tracking-[0.22em] text-[#ffb66c] sm:block">Admin Studio</span></div></Link>

          <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/15 p-1 lg:flex">
            {navItems.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return <Link key={item.href} href={item.href} className={`rounded-full px-4 py-2 text-sm transition ${active ? "bg-[#ff9d42]/15 text-[#ffc27d]" : "text-white/55 hover:bg-white/7 hover:text-white"}`}>{item.label}</Link>;
            })}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" className="hidden items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white sm:flex"><Home size={15} />Galeri publik</Link>
            <button onClick={logout} className="hidden items-center gap-2 rounded-full bg-[#ff9d42] px-4 py-2.5 text-xs font-semibold text-[#201307] transition hover:scale-105 hover:bg-[#ffb363] sm:flex"><LogOut size={15} />Keluar</button>
            <button onClick={() => setOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/7 text-white lg:hidden" aria-label="Buka menu admin">{open ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </nav>

        {open && <div className="glass-panel mx-auto mt-3 max-w-sm rounded-[26px] p-3 lg:hidden">{navItems.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/70 hover:bg-white/8 hover:text-white"><Icon size={16} />{item.label}</Link>; })}<Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/70 hover:bg-white/8 hover:text-white"><Home size={16} />Galeri publik</Link><button onClick={logout} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff9d42] px-4 py-3 text-sm font-semibold text-[#201307]"><LogOut size={16} />Keluar</button></div>}
      </header>

      <div className="relative z-10 min-h-screen pt-24 sm:pt-28">
        <div className="mx-auto mb-4 flex max-w-[1480px] items-center gap-2 px-4 text-[10px] uppercase tracking-[.18em] text-white/30 sm:px-6 lg:px-8"><ShieldCheck size={13} className="text-[#ff9d42]" />Area administrator — tidak ditampilkan kepada pengguna umum</div>
        {children}
      </div>
    </div>
  );
}
