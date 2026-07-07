"use client";

import { deleteCostumeTemplate, listCostumeTemplates, updateCostumeTemplate, uploadCostumeTemplate } from "@/lib/automation-api";
import type { CostumeTemplate } from "@/lib/automation-types";
import { AlertCircle, LoaderCircle, RefreshCw, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export function CostumeTemplateAdmin() {
  const [items, setItems] = useState<CostumeTemplate[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listCostumeTemplates());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Template gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    listCostumeTemplates()
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Template gagal dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function action(operation: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await operation();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Operasi template gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-resource" aria-labelledby="template-title">
      <header className="admin-resource-hero">
        <div><p className="admin-eyebrow">Combine inputs</p><h1 id="template-title">Template Costume</h1><p>Gambar model atau pakaian polos untuk workflow combine.</p></div>
        <button type="button" onClick={() => void load()} className="admin-icon-action" aria-label="Muat ulang template"><RefreshCw size={17} className={loading ? "animate-spin" : ""} aria-hidden="true" /></button>
      </header>
      {error && <div role="alert" className="admin-alert"><AlertCircle size={17} aria-hidden="true" />{error}</div>}
      <form onSubmit={(event) => { event.preventDefault(); if (!file) { setError("Pilih gambar template."); return; } const form = new FormData(); form.set("file", file); form.set("name", name); form.set("description", description); form.set("is_active", "true"); form.set("sort_order", sortOrder); void action(async () => { await uploadCostumeTemplate(form); setFile(null); setName(""); setDescription(""); setSortOrder("0"); }); }} className="admin-detail-card admin-template-form">
        <label>File template<input required type="file" accept="image/*" className="admin-field" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
        <label>Nama template<input required className="admin-field" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Deskripsi<input className="admin-field" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>Urutan<input required type="number" className="admin-field" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} /></label>
        <button type="button" disabled={busy} onClick={() => { if (!file) { setError("Pilih gambar template."); return; } const form = new FormData(); form.set("file", file); form.set("name", name); form.set("description", description); form.set("is_active", "true"); form.set("sort_order", sortOrder); void action(async () => { await uploadCostumeTemplate(form); setFile(null); setName(""); setDescription(""); setSortOrder("0"); }); }} className="admin-primary-action"><Upload size={15} aria-hidden="true" />Upload template</button>
      </form>
      {loading && !items.length ? <div className="admin-loading"><LoaderCircle className="animate-spin" size={17} aria-hidden="true" />Memuat template...</div> : (
        <section className="admin-template-grid" aria-label="Daftar template costume">
          {items.map((item) => (
            <article key={item.id} className="admin-template-card">
              <div data-testid={`template-preview-${item.id}`} className="admin-portrait-preview">
                <Image fill sizes="(max-width: 768px) 100vw, 360px" src={`/api/automation/public/images/template/${encodeURIComponent(item.filename)}`} alt={item.name} className="object-cover" />
              </div>
              <div className="admin-template-body">
                <div className="admin-detail-head"><div><h2>{item.name}</h2><p>Urutan {item.sort_order}</p></div><span className="admin-status-pill">{item.is_active ? "Aktif" : "Nonaktif"}</span></div>
                <p>{item.description || "Tanpa deskripsi"}</p>
                <div className="admin-action-row"><button type="button" disabled={busy} onClick={() => void action(() => updateCostumeTemplate(item.id, { is_active: !item.is_active }))} className="admin-secondary-action">{item.is_active ? "Nonaktifkan template" : "Aktifkan template"}</button><button type="button" disabled={busy} onClick={() => { if (window.confirm(`Hapus ${item.name}?`)) void action(() => deleteCostumeTemplate(item.id)); }} className="admin-danger-action"><Trash2 size={14} aria-hidden="true" />Hapus template</button></div>
              </div>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
