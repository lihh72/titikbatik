"use client";

import { BatikMedia } from "@/components/batik-media";
import {
  deleteBatik,
  listAdminBatiks,
  publishBatik,
  regenerateCostume,
  regenerateVideo,
  unpublishBatik,
  updateBatik,
} from "@/lib/automation-api";
import type { Batik } from "@/lib/automation-types";
import { AlertCircle, Eye, EyeOff, LoaderCircle, RefreshCw, Save, Shirt, Trash2, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const inputClass = "mt-2 w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-[#ff9d42]/70 focus:bg-white/10";
const secondaryButtonClass = "flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/6 px-4 py-2.5 text-sm text-white/78 transition hover:border-white/28 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45";

export function AdminGalleryPage() {
  const [items, setItems] = useState<Batik[]>([]);
  const [selected, setSelected] = useState<Batik | null>(null);
  const [draft, setDraft] = useState({ keyword: "", warna: "", style: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const published = items.filter((item) => item.is_published).length;
    const supportingMedia = items.reduce((total, item) => {
      const videos = item.costume_files.filter((costume) => Boolean(costume.video_url)).length;
      return total + item.costume_urls.length + videos;
    }, 0);

    return {
      total: items.length,
      published,
      draft: items.length - published,
      supportingMedia,
    };
  }, [items]);

  const select = useCallback((batik: Batik | null) => {
    setSelected(batik);
    setDraft({ keyword: batik?.keyword ?? "", warna: batik?.warna ?? "", style: batik?.style ?? "" });
  }, []);

  const load = useCallback(async (preferredId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminBatiks({ limit: 200, offset: 0 });
      setItems(data);
      select(data.find((item) => item.id === preferredId) ?? data[0] ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Data batik gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [select]);

  useEffect(() => {
    let active = true;
    listAdminBatiks({ limit: 200, offset: 0 })
      .then((data) => {
        if (active) {
          setItems(data);
          select(data[0] ?? null);
        }
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Data batik gagal dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [select]);

  async function perform(action: () => Promise<unknown>, success: string, keepSelection = true) {
    if (!selected) return;
    const id = selected.id;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(success);
      await load(keepSelection ? id : undefined);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Aksi batik gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1500px] px-4 pb-12 sm:px-6 lg:px-8">
      <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-[#ffb66c]">Admin gallery</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Kurasi visual dan publikasi
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/52">
              Pilih hasil, cek motif serta kostum, lalu putuskan mana yang siap tampil di arsip publik.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load(selected?.id)}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-4 text-sm text-white/78 transition hover:border-white/30 hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="Muat ulang hasil batik"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Muat ulang
          </button>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total hasil" value={`${metrics.total} hasil`} />
          <MetricCard label="Sudah tampil" value={`${metrics.published} publik`} />
          <MetricCard label="Masih ditahan" value={`${metrics.draft} draft`} />
          <MetricCard label="Kostum dan video" value={`${metrics.supportingMedia} media`} />
        </div>
      </header>

      {error && (
        <div className="mt-5 flex gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100/85">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      {notice && (
        <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100/85">
          {notice}
        </div>
      )}

      {loading && !items.length ? (
        <div className="flex items-center gap-2 py-16 text-sm text-white/45">
          <LoaderCircle size={17} className="animate-spin" />
          Memuat hasil...
        </div>
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          <section
            className="max-h-[790px] overflow-auto rounded-[1.75rem] border border-white/10 bg-black/24 p-2"
            aria-label="Daftar hasil batik"
          >
            {items.map((batik) => (
              <button
                key={batik.id}
                type="button"
                onClick={() => select(batik)}
                aria-pressed={selected?.id === batik.id}
                className={`mb-2 block w-full rounded-[1.35rem] border p-4 text-left transition ${
                  selected?.id === batik.id
                    ? "border-[#ff9d42]/48 bg-[#ff9d42]/13 shadow-[0_18px_50px_rgba(255,157,66,0.08)]"
                    : "border-white/8 bg-white/[0.035] hover:border-white/18 hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      #{batik.id} {batik.keyword}
                    </span>
                    <span className="mt-2 block truncate text-xs text-white/42">
                      {batik.style} / {batik.warna}
                    </span>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ${batik.is_published ? "bg-emerald-300/13 text-emerald-200" : "bg-white/8 text-white/48"}`}>
                    {batik.is_published ? "Publik" : "Draft"}
                  </span>
                </div>
              </button>
            ))}

            {!items.length && <p className="p-6 text-sm text-white/42">Belum ada hasil batik.</p>}
          </section>

          {selected && (
            <section className="min-w-0 space-y-5">
              <div className="grid gap-5 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-5">
                <BatikMedia batik={selected} />

                <aside className="rounded-[1.4rem] border border-white/10 bg-black/24 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#ffb66c]">Batik #{selected.id}</p>
                      <h2 className="mt-2 text-xl font-semibold text-white">{selected.keyword}</h2>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs ${selected.is_published ? "bg-emerald-300/13 text-emerald-200" : "bg-white/8 text-white/48"}`}>
                      {selected.is_published ? "Publik" : "Draft"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <FieldLabel label="Keyword">
                      <input
                        className={inputClass}
                        value={draft.keyword}
                        onChange={(event) => setDraft((value) => ({ ...value, keyword: event.target.value }))}
                      />
                    </FieldLabel>
                    <FieldLabel label="Warna">
                      <input
                        className={inputClass}
                        value={draft.warna}
                        onChange={(event) => setDraft((value) => ({ ...value, warna: event.target.value }))}
                      />
                    </FieldLabel>
                    <FieldLabel label="Style">
                      <input
                        className={inputClass}
                        value={draft.style}
                        onChange={(event) => setDraft((value) => ({ ...value, style: event.target.value }))}
                      />
                    </FieldLabel>
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void perform(() => updateBatik(selected.id, draft), "Metadata batik disimpan.")}
                    className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff9d42] px-4 py-2.5 text-sm font-semibold text-[#201307] transition hover:bg-[#ffb66c] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Save size={15} />
                    Simpan metadata
                  </button>

                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void perform(
                        () => selected.is_published ? unpublishBatik(selected.id) : publishBatik(selected.id),
                        selected.is_published ? "Batik ditampilkan sebagai draft." : "Batik dipublikasikan.",
                      )}
                      className={secondaryButtonClass}
                    >
                      {selected.is_published ? <EyeOff size={15} /> : <Eye size={15} />}
                      {selected.is_published ? "Tampilkan sebagai draft" : "Publikasikan ke galeri"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void perform(() => regenerateCostume(selected.id), "Buat ulang kostum masuk antrean.")}
                      className={secondaryButtonClass}
                    >
                      <Shirt size={15} />
                      Buat ulang kostum
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void perform(() => regenerateVideo(selected.id), "Buat ulang video masuk antrean.")}
                      className={secondaryButtonClass}
                    >
                      <Video size={15} />
                      Buat ulang video
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(`Hapus batik #${selected.id}?`)) {
                          void perform(() => deleteBatik(selected.id), "Batik dihapus.", false);
                        }
                      }}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-400/6 px-4 py-2.5 text-sm text-red-100/82 transition hover:border-red-200/35 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Trash2 size={15} />
                      Hapus hasil
                    </button>
                  </div>

                  <dl className="mt-5 grid gap-3 border-t border-white/10 pt-5 text-xs text-white/42">
                    <div>
                      <dt>Seed</dt>
                      <dd className="mt-1 font-mono text-white/72">{selected.seed}</dd>
                    </div>
                    <div>
                      <dt>Prompt hash</dt>
                      <dd className="mt-1 truncate font-mono text-white/72">{selected.prompt_hash}</dd>
                    </div>
                    <div>
                      <dt>Dibuat</dt>
                      <dd className="mt-1 text-white/72">{new Date(selected.created_at).toLocaleString("id-ID")}</dd>
                    </div>
                  </dl>
                </aside>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-white/42">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-white/48">
      {label}
      {children}
    </label>
  );
}
