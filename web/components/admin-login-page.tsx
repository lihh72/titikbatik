"use client";

import { LogoMark } from "@/components/logo";
import { Action } from "@/components/ui/action";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
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
    <main className="min-h-[100dvh] bg-[color:var(--paper)] px-4 py-8 text-[color:var(--ink)] sm:px-6">
      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper-raised)] shadow-[0_24px_80px_rgba(88,70,49,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border-b border-[color:var(--line)] p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
          <div className="flex items-center gap-3">
            <LogoMark decorative />
            <div>
              <strong className="block">TitikBatik AI</strong>
              <span className="text-xs text-[color:var(--ink-soft)]">Curator Workbench</span>
            </div>
          </div>

          <div className="mt-14 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--line)] px-3 py-2 text-xs font-semibold text-[color:var(--terracotta-dark)]">
              <ShieldCheck size={14} aria-hidden="true" />
              Area administrator
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-none tracking-[-0.045em] sm:text-5xl">
              Masuk ke ruang kerja kurasi dan produksi.
            </h1>
            <p className="mt-5 text-sm leading-7 text-[color:var(--ink-soft)]">
              Kelola generation, batch, hasil batik, wordlist, template costume, dan pengaturan sistem dari satu panel internal.
            </p>
          </div>

          <div className="mt-10">
            <Action href="/" variant="secondary">
              <ArrowLeft size={15} aria-hidden="true" />
              Kembali ke galeri AI publik
            </Action>
          </div>
        </div>

        <div className="flex items-center p-7 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <p className="text-sm font-semibold text-[color:var(--terracotta-dark)]">Autentikasi administrator</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Masuk ke panel automation</h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
              Gunakan akun admin yang ditentukan pada file konfigurasi lokal.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="admin-email" className="text-sm font-semibold">Email administrator</label>
                <div className="mt-2 flex min-h-12 items-center gap-3 rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4">
                  <Mail size={17} className="text-[color:var(--ink-soft)]" aria-hidden="true" />
                  <input
                    id="admin-email"
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin-password" className="text-sm font-semibold">Password administrator</label>
                <div className="mt-2 flex min-h-12 items-center gap-3 rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4">
                  <LockKeyhole size={17} className="text-[color:var(--ink-soft)]" aria-hidden="true" />
                  <input
                    id="admin-password"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-[color:var(--ink-soft)] transition hover:text-[color:var(--ink)]"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="rounded-[var(--radius-sm)] border border-[color:var(--danger)] bg-[color:var(--paper)] px-4 py-3 text-sm text-[color:var(--danger)]">
                  {error}
                </div>
              )}

              <button
                disabled={busy}
                className="flex min-h-12 w-full items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--terracotta)] px-5 text-sm font-semibold text-white transition hover:bg-[color:var(--terracotta-dark)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Memeriksa akun..." : "Masuk sebagai admin"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
