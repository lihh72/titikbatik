"use client";

import { LogoMark } from "@/components/logo";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json().catch(() => ({}))) as { detail?: string };
      if (!response.ok) throw new Error(payload.detail ?? "Login admin gagal.");

      const destination = searchParams.get("from");
      router.replace(destination?.startsWith("/admin") ? destination : "/admin");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login admin gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090a0b] px-4 py-8 text-white sm:px-6">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_68%_12%,rgba(255,157,66,.18),transparent_28%),radial-gradient(circle_at_15%_48%,rgba(53,90,74,.24),transparent_33%),linear-gradient(135deg,#080a0b,#171411_50%,#090a0b)]" />
      <div className="ambient-noise" />

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <section className="glass-panel grid w-full overflow-hidden rounded-[36px] lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative min-h-[360px] overflow-hidden border-b border-white/10 p-8 lg:min-h-[650px] lg:border-b-0 lg:border-r sm:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_26%,rgba(255,157,66,.22),transparent_25%),linear-gradient(145deg,rgba(20,55,52,.88),rgba(12,12,14,.75))]" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="flex items-center gap-3"><LogoMark decorative /><div><strong className="block">TitikBatik AI</strong><span className="text-xs text-white/38">Automation Admin</span></div></div>
                <span className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#ff9d42]/25 bg-[#ff9d42]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#ffbd7e]"><ShieldCheck size={14} />Area terbatas</span>
                <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">Automation Titik Batik hanya untuk administrator.</h1>
                <p className="mt-5 max-w-lg leading-7 text-white/50">Kelola generation, batch, hasil batik, wordlist, template costume, dan settings dari satu panel internal.</p>
              </div>
              <Link href="/" className="mt-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"><ArrowLeft size={15} />Kembali ke galeri publik</Link>
            </div>
          </div>

          <div className="p-7 sm:p-12 lg:p-14">
            <div className="mx-auto max-w-md">
              <div className="text-xs uppercase tracking-[.18em] text-[#ffb66c]">Autentikasi administrator</div>
              <h2 className="mt-3 text-3xl font-semibold">Masuk ke panel automation</h2>
              <p className="mt-3 text-sm leading-6 text-white/42">Gunakan akun admin yang ditentukan pada file <code className="text-white/65">.env.local</code>.</p>

              <form onSubmit={submit} className="mt-8 space-y-4">
                <label className="glass-soft flex items-center gap-3 rounded-2xl px-4 py-3.5"><Mail size={17} className="text-white/35" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email administrator" autoComplete="username" className="w-full bg-transparent text-sm outline-none placeholder:text-white/28" /></label>
                <label className="glass-soft flex items-center gap-3 rounded-2xl px-4 py-3.5"><LockKeyhole size={17} className="text-white/35" /><input required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password administrator" autoComplete="current-password" className="w-full bg-transparent text-sm outline-none placeholder:text-white/28" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="text-white/35 hover:text-white" aria-label="Tampilkan password">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></label>
                {error && <div className="rounded-2xl border border-red-300/20 bg-red-400/8 px-4 py-3 text-sm text-red-100">{error}</div>}
                <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff9d42] px-5 py-3.5 text-sm font-semibold text-[#201307] transition hover:scale-[1.02] hover:bg-[#ffb363] disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Memeriksa akun..." : "Masuk sebagai Admin"}</button>
              </form>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/4 p-4 text-xs leading-5 text-white/38">Untuk pengembangan lokal, kredensial bawaan tercantum di README. Ganti seluruh nilai admin sebelum aplikasi dipublikasikan.</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
