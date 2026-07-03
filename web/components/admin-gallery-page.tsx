"use client";

import { BatikMedia } from "@/components/batik-media";
import { deleteBatik, listAdminBatiks, publishBatik, regenerateCostume, regenerateVideo, unpublishBatik, updateBatik } from "@/lib/automation-api";
import type { Batik } from "@/lib/automation-types";
import { AlertCircle, Eye, EyeOff, LoaderCircle, RefreshCw, Save, Shirt, Trash2, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const inputClass = "w-full border border-white/12 bg-black/25 px-3 py-2 text-sm outline-none focus:border-[#ff9d42]/60";

export function AdminGalleryPage() {
  const [items, setItems] = useState<Batik[]>([]);
  const [selected, setSelected] = useState<Batik | null>(null);
  const [draft, setDraft] = useState({ keyword: "", warna: "", style: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
      .then((data) => { if (active) { setItems(data); select(data[0] ?? null); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Data batik gagal dimuat."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
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
    <main className="mx-auto max-w-[1480px] px-4 pb-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6"><div><p className="text-xs uppercase text-[#ffb66c]">Batik Results</p><h1 className="mt-3 text-3xl font-semibold">Preview, costume, video, dan publikasi</h1><p className="mt-3 text-sm text-white/45">Seluruh media dan status berasal dari SQLite serta storage automation.</p></div><button onClick={() => void load(selected?.id)} disabled={loading} className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/6" title="Muat ulang"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button></header>
      {error && <div className="mt-5 flex gap-2 border border-red-400/20 bg-red-400/8 p-4 text-sm text-red-100/80"><AlertCircle size={17} />{error}</div>}
      {notice && <div className="mt-5 border border-emerald-400/20 bg-emerald-400/8 p-4 text-sm text-emerald-100/80">{notice}</div>}
      {loading && !items.length ? <div className="flex items-center gap-2 py-16 text-sm text-white/45"><LoaderCircle size={17} className="animate-spin" />Memuat hasil...</div> :
        <div className="mt-6 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="max-h-[780px] overflow-auto border border-white/10">{items.map((batik) => <button key={batik.id} onClick={() => select(batik)} className={`block w-full border-b border-white/8 p-4 text-left ${selected?.id === batik.id ? "bg-[#ff9d42]/12" : "bg-black/15 hover:bg-white/5"}`}><div className="flex items-center justify-between gap-3"><span className="truncate text-sm">#{batik.id} {batik.keyword}</span><span className={batik.is_published ? "text-xs text-emerald-300" : "text-xs text-white/35"}>{batik.is_published ? "Publik" : "Draft"}</span></div><p className="mt-2 truncate text-xs text-white/35">{batik.style} · {batik.warna}</p></button>)}{!items.length && <p className="p-6 text-sm text-white/40">Belum ada hasil batik.</p>}</section>

          {selected && <section className="min-w-0 space-y-5">
            <div className="grid gap-5 border border-white/10 bg-white/4 p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <BatikMedia batik={selected} />
              <div>
                <p className="text-xs uppercase text-[#ffb66c]">Batik #{selected.id}</p>
                <div className="mt-4 space-y-3"><label className="block text-xs text-white/45">Keyword<input className={`${inputClass} mt-1`} value={draft.keyword} onChange={(event) => setDraft((value) => ({ ...value, keyword: event.target.value }))} /></label><label className="block text-xs text-white/45">Warna<input className={`${inputClass} mt-1`} value={draft.warna} onChange={(event) => setDraft((value) => ({ ...value, warna: event.target.value }))} /></label><label className="block text-xs text-white/45">Style<input className={`${inputClass} mt-1`} value={draft.style} onChange={(event) => setDraft((value) => ({ ...value, style: event.target.value }))} /></label></div>
                <button disabled={busy} onClick={() => void perform(() => updateBatik(selected.id, draft), "Metadata batik disimpan.")} className="mt-4 flex w-full items-center justify-center gap-2 border border-white/12 px-4 py-2.5 text-sm"><Save size={15} />Simpan metadata</button>
                <div className="mt-5 grid gap-2">
                  <button disabled={busy} onClick={() => void perform(() => selected.is_published ? unpublishBatik(selected.id) : publishBatik(selected.id), selected.is_published ? "Batik ditarik dari galeri publik." : "Batik dipublikasikan.")} className="flex items-center justify-center gap-2 bg-[#ff9d42] px-4 py-2.5 text-sm font-semibold text-[#201307]">{selected.is_published ? <EyeOff size={15} /> : <Eye size={15} />}{selected.is_published ? "Unpublish" : "Publish"}</button>
                  <button disabled={busy} onClick={() => void perform(() => regenerateCostume(selected.id), "Regenerate costume masuk antrean.")} className="flex items-center justify-center gap-2 border border-white/12 px-4 py-2.5 text-sm"><Shirt size={15} />Regenerate costume</button>
                  <button disabled={busy} onClick={() => void perform(() => regenerateVideo(selected.id), "Regenerate video masuk antrean.")} className="flex items-center justify-center gap-2 border border-white/12 px-4 py-2.5 text-sm"><Video size={15} />Regenerate video</button>
                  <button disabled={busy} onClick={() => { if (window.confirm(`Hapus batik #${selected.id}?`)) void perform(() => deleteBatik(selected.id), "Batik dihapus.", false); }} className="flex items-center justify-center gap-2 border border-red-300/20 px-4 py-2.5 text-sm text-red-200"><Trash2 size={15} />Hapus</button>
                </div>
                <div className="mt-5 text-xs leading-5 text-white/35"><p>Seed: {selected.seed}</p><p>Prompt hash: {selected.prompt_hash}</p><p>Dibuat: {new Date(selected.created_at).toLocaleString("id-ID")}</p></div>
              </div>
            </div>
          </section>}
        </div>}
    </main>
  );
}
