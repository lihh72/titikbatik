"use client";

import { BatikMedia } from "@/components/batik-media";
import { deleteBatik, listAdminBatiks, publishBatik, regenerateCostume, regenerateVideo, unpublishBatik, updateBatik } from "@/lib/automation-api";
import type { Batik } from "@/lib/automation-types";
import { AlertCircle, Eye, EyeOff, LoaderCircle, RefreshCw, Save, Shirt, Trash2, Video } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

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
    const supportingMedia = items.reduce((total, item) => total + item.costume_urls.length + item.costume_files.filter((costume) => Boolean(costume.video_url)).length, 0);
    return { total: items.length, published, draft: items.length - published, supportingMedia };
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
    <section className="admin-resource" aria-labelledby="admin-gallery-title">
      <header className="admin-resource-hero">
        <div>
          <p className="admin-eyebrow">Output generative AI</p>
          <h1 id="admin-gallery-title">Kurasi hasil AI</h1>
          <h2 className="sr-only">Kurasi visual dan publikasi</h2>
          <p>Pilih hasil, cek motif serta costume, lalu tentukan mana yang siap tampil di galeri publik.</p>
        </div>
        <button type="button" onClick={() => void load(selected?.id)} disabled={loading} className="admin-secondary-action" aria-label="Muat ulang hasil batik">
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Muat ulang
        </button>
      </header>

      <div className="admin-metric-grid">
        <MetricCard label="Total hasil" value={`${metrics.total} hasil`} />
        <MetricCard label="Sudah tampil" value={`${metrics.published} publik`} />
        <MetricCard label="Masih ditahan" value={`${metrics.draft} draft`} />
        <MetricCard label="Kostum dan video" value={`${metrics.supportingMedia} media`} />
      </div>

      {error && <div role="alert" className="admin-alert"><AlertCircle size={17} aria-hidden="true" />{error}</div>}
      {notice && <div className="studio-success">{notice}</div>}

      {loading && !items.length ? <div className="admin-loading"><LoaderCircle size={17} className="animate-spin" aria-hidden="true" />Memuat hasil...</div> : (
        <div className="admin-resource-layout">
          <section className="admin-resource-list admin-gallery-list" aria-label="Daftar hasil batik">
            {items.map((batik) => (
              <button key={batik.id} type="button" onClick={() => select(batik)} aria-pressed={selected?.id === batik.id} className="admin-resource-list-item admin-gallery-item" data-active={selected?.id === batik.id}>
                <span data-testid={`admin-gallery-tile-${batik.id}`} className="admin-square-preview">
                  {batik.preview_url ? <Image fill sizes="76px" src={batik.preview_url} alt="" /> : null}
                </span>
                <span><strong>#{batik.id} {batik.keyword}</strong><small>{batik.style} / {batik.warna}</small></span>
                <b>{batik.is_published ? "Publik" : "Draft"}</b>
              </button>
            ))}
            {!items.length && <p className="admin-empty">Belum ada hasil batik.</p>}
          </section>

          {selected && (
            <section className="admin-resource-detail">
              <div className="admin-gallery-detail">
                <BatikMedia batik={selected} />
                <aside className="admin-detail-card">
                  <div className="admin-detail-head">
                    <div><p className="admin-eyebrow">Batik #{selected.id}</p><h2>{selected.keyword}</h2></div>
                    <span className="admin-status-pill">{selected.is_published ? "Publik" : "Draft"}</span>
                  </div>
                  <div className="admin-form-stack">
                    <label>Keyword<input className="admin-field" value={draft.keyword} onChange={(event) => setDraft((value) => ({ ...value, keyword: event.target.value }))} /></label>
                    <label>Warna<input className="admin-field" value={draft.warna} onChange={(event) => setDraft((value) => ({ ...value, warna: event.target.value }))} /></label>
                    <label>Style<input className="admin-field" value={draft.style} onChange={(event) => setDraft((value) => ({ ...value, style: event.target.value }))} /></label>
                  </div>
                  <button type="button" disabled={busy} onClick={() => void perform(() => updateBatik(selected.id, draft), "Metadata batik disimpan.")} className="admin-primary-action"><Save size={15} aria-hidden="true" />Simpan metadata</button>
                  <div className="admin-action-grid">
                    <button type="button" disabled={busy} onClick={() => void perform(() => selected.is_published ? unpublishBatik(selected.id) : publishBatik(selected.id), selected.is_published ? "Batik ditampilkan sebagai draft." : "Batik dipublikasikan.")} className="admin-secondary-action">
                      {selected.is_published ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                      {selected.is_published ? "Tampilkan sebagai draft" : "Publikasikan"}
                    </button>
                    <button type="button" disabled={busy} onClick={() => void perform(() => regenerateCostume(selected.id), "Buat ulang kostum masuk antrean.")} className="admin-secondary-action"><Shirt size={15} aria-hidden="true" />Buat ulang kostum</button>
                    <button type="button" disabled={busy} onClick={() => void perform(() => regenerateVideo(selected.id), "Buat ulang video masuk antrean.")} className="admin-secondary-action"><Video size={15} aria-hidden="true" />Buat ulang video</button>
                  </div>
                  <div className="admin-danger-zone">
                    <p>Area berisiko</p>
                    <button type="button" disabled={busy} onClick={() => { if (window.confirm(`Hapus batik #${selected.id}?`)) void perform(() => deleteBatik(selected.id), "Batik dihapus.", false); }} className="admin-danger-action"><Trash2 size={15} aria-hidden="true" />Hapus hasil</button>
                  </div>
                </aside>
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return <div className="admin-metric-card"><p>{label}</p><strong>{value}</strong></div>;
}
