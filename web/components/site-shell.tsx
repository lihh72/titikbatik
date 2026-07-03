"use client";

import { LogoMark } from "@/components/logo";
import { BookOpen, CircleHelp, Grid2X2, Home, Menu, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Beranda", href: "/", icon: Home },
  { label: "Galeri", href: "/gallery", icon: Grid2X2 },
  { label: "Tentang", href: "/about", icon: BookOpen },
  { label: "Bantuan", href: "/help", icon: CircleHelp },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090a0b] text-white">
      <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_10%,rgba(255,180,102,.16),transparent_27%),radial-gradient(circle_at_15%_36%,rgba(65,86,67,.23),transparent_32%),linear-gradient(135deg,#080a0b_0%,#171411_48%,#090a0b_100%)]" />
        <div className="absolute left-[-8%] top-[19%] h-[40rem] w-[18rem] -rotate-12 rounded-[50%] bg-[#395038]/18 blur-[65px]" />
        <div className="absolute right-[5%] top-[7%] h-44 w-44 rounded-full bg-[#ffb05c]/15 blur-[55px]" />
        <div className="absolute bottom-[-13%] left-[20%] h-72 w-[62%] rounded-[50%] bg-black/90 blur-[35px]" />
        <div className="absolute right-[-2rem] top-[26%] h-[30rem] w-28 rounded-full bg-[#243624]/45 blur-[20px]" />
        {[0, 1, 2, 3, 4].map((i) => <span key={i} className="absolute right-[2.5rem] top-[22%] h-40 w-14 origin-bottom rounded-[100%_0_100%_0] bg-[#526c4d]/25 blur-[2px]" style={{ transform: `rotate(${i * 25 - 48}deg) translateY(${i * 12}px)` }} />)}
        <div className="absolute inset-0 bg-black/28 backdrop-blur-[3px]" />
      </div>
      <div className="ambient-noise" />

      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-6">
        <nav className="glass-panel mx-auto flex max-w-7xl items-center justify-between rounded-full px-3 py-2.5 sm:px-4">
          <Link href="/" className="flex items-center gap-2.5 pl-1" aria-label="TitikBatik AI Beranda"><LogoMark /><div className="leading-none"><span className="block text-sm font-semibold tracking-tight sm:text-base">TitikBatik AI</span><span className="mt-1 hidden text-[9px] uppercase tracking-[0.22em] text-white/38 sm:block">Galeri Batik Digital</span></div></Link>

          <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/15 p-1 lg:flex">
            {navItems.map((item) => { const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={`rounded-full px-4 py-2 text-sm transition ${active ? "bg-white/11 text-white" : "text-white/55 hover:bg-white/7 hover:text-white"}`}>{item.label}</Link>; })}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/gallery" className="hidden rounded-full bg-[#ff9d42] px-5 py-2.5 text-sm font-semibold text-[#1b1109] shadow-[0_8px_30px_rgba(255,157,66,.25)] transition hover:scale-105 hover:bg-[#ffb363] sm:inline-flex">Lihat Galeri</Link>
            <button onClick={() => setOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/7 text-white lg:hidden" aria-label="Buka menu">{open ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </nav>

        {open && <div className="glass-panel mx-auto mt-3 max-w-sm rounded-[26px] p-3 lg:hidden">{navItems.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/70 hover:bg-white/8 hover:text-white"><Icon size={16} />{item.label}</Link>; })}</div>}
      </header>

      <div className="relative z-10 min-h-screen pt-24 sm:pt-28">{children}</div>

      <footer className="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-[32px] p-6 sm:p-8">
          <div className="flex flex-col gap-8 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><LogoMark /><div><strong className="block">TitikBatik AI</strong><span className="text-xs text-white/40">Galeri publik hasil eksplorasi batik digital terkurasi</span></div></div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/52"><Link href="/about" className="transition hover:text-[#ffb363]">Tentang Kami</Link><Link href="/gallery" className="transition hover:text-[#ffb363]">Galeri</Link><Link href="/help" className="transition hover:text-[#ffb363]">Pusat Bantuan</Link><a href="mailto:titikbatik@example.com" className="transition hover:text-[#ffb363]">Kontak</a></div>
          </div>
          <div className="flex flex-col gap-3 pt-6 text-xs text-white/34 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 TitikBatik AI. Mengubah tradisi ke inovasi digital.</p><div className="flex flex-wrap items-center gap-4"><p className="flex items-center gap-2"><Sparkles size={12} className="text-[#ff9d42]" />Karya dipublikasikan setelah proses kurasi.</p><Link href="/admin/login" className="text-white/24 transition hover:text-white/50">Akses Admin</Link></div></div>
        </div>
      </footer>
    </div>
  );
}
