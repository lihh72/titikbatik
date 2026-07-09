"use client";

import { adminClass } from "@/components/admin-styles";
import { createWordlistCategory, createWordlistItem, deleteWordlistCategory, deleteWordlistItem, importWordlistItems, listWordlistCategories, listWordlistItems, updateWordlistCategory, updateWordlistItem } from "@/lib/automation-api";
import { parseImportLines } from "@/lib/admin-resource-forms";
import type { WordlistCategory, WordlistItem } from "@/lib/automation-types";
import { AlertCircle, LoaderCircle, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export function WordlistAdmin() {
  const [categories, setCategories] = useState<WordlistCategory[]>([]);
  const [items, setItems] = useState<WordlistItem[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({ code: "", name: "" });
  const [itemForm, setItemForm] = useState({ value: "", label: "", weight: "1" });
  const [importText, setImportText] = useState("");
  const [replace, setReplace] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((categoryData: WordlistCategory[], itemData: WordlistItem[]) => {
    setCategories(categoryData);
    setItems(itemData);
    setCategoryId((current) => current && categoryData.some((item) => item.id === current) ? current : categoryData[0]?.id ?? null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoryData, itemData] = await Promise.all([listWordlistCategories(), listWordlistItems()]);
      apply(categoryData, itemData);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Wordlist gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    let active = true;
    Promise.all([listWordlistCategories(), listWordlistItems()])
      .then(([categoryData, itemData]) => {
        if (active) apply(categoryData, itemData);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Wordlist gagal dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [apply]);

  const selectedCategory = categories.find((item) => item.id === categoryId) ?? null;
  const visibleItems = useMemo(() => items.filter((item) => item.category_id === categoryId), [items, categoryId]);

  async function action(operation: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await operation();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Operasi wordlist gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={adminClass("admin-resource")} aria-labelledby="wordlist-title">
      <header className={adminClass("admin-resource-hero")}>
        <div><p className={adminClass("admin-eyebrow")}>Prompt sources</p><h1 id="wordlist-title">Sumber Wordlist</h1><p>Kategori, bobot, dan nilai yang dipakai prompt generator.</p></div>
        <button type="button" onClick={() => void load()} className={adminClass("admin-icon-action")} aria-label="Muat ulang wordlist"><RefreshCw size={17} className={loading ? "animate-spin" : ""} aria-hidden="true" /></button>
      </header>
      {error && <div role="alert" className={adminClass("admin-alert")}><AlertCircle size={17} aria-hidden="true" />{error}</div>}
      {loading ? <div className={adminClass("admin-loading")}><LoaderCircle className="animate-spin" size={17} aria-hidden="true" />Memuat wordlist...</div> : (
        <div className={adminClass("admin-resource-layout")}>
          <section className={adminClass("admin-resource-list")} aria-label="Kategori wordlist">
            <form onSubmit={(event) => { event.preventDefault(); void action(async () => { await createWordlistCategory({ code: categoryForm.code.trim(), name: categoryForm.name.trim(), description: null, is_required: true, selection_min: 1, selection_max: 1, sort_order: categories.length, is_active: true }); setCategoryForm({ code: "", name: "" }); }); }} className={adminClass("admin-form-stack")}>
              <label>Kode kategori<input required className={adminClass("admin-field")} value={categoryForm.code} onChange={(event) => setCategoryForm((value) => ({ ...value, code: event.target.value }))} /></label>
              <label>Nama kategori<input required className={adminClass("admin-field")} value={categoryForm.name} onChange={(event) => setCategoryForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <button type="submit" disabled={busy} className={adminClass("admin-primary-action")}><Plus size={15} aria-hidden="true" />Tambah kategori</button>
            </form>
            <div className={adminClass("admin-list-stack")}>{categories.map((category) => <button key={category.id} type="button" onClick={() => setCategoryId(category.id)} className={adminClass("admin-resource-list-item")} data-active={categoryId === category.id}><strong>{category.name}</strong><small>{category.code}</small><b>{category.is_active ? "Aktif" : "Nonaktif"}</b></button>)}</div>
          </section>

          <section className={adminClass("admin-resource-detail")}>
            {selectedCategory ? <div className={adminClass("admin-detail-card")}>
              <div className={adminClass("admin-detail-head")}><div><p className={adminClass("admin-eyebrow")}>{visibleItems.length} item</p><h2>{selectedCategory.name}</h2></div><div className={adminClass("admin-action-row")}><button disabled={busy} onClick={() => void action(() => updateWordlistCategory(selectedCategory.id, { is_active: !selectedCategory.is_active }))} className={adminClass("admin-secondary-action")}>{selectedCategory.is_active ? "Nonaktifkan kategori" : "Aktifkan kategori"}</button><button disabled={busy} onClick={() => { if (window.confirm("Hapus kategori dan item terkait?")) void action(() => deleteWordlistCategory(selectedCategory.id)); }} className={adminClass("admin-danger-action")}><Trash2 size={14} aria-hidden="true" />Hapus kategori</button></div></div>
              <form onSubmit={(event) => { event.preventDefault(); void action(async () => { await createWordlistItem({ category_id: selectedCategory.id, value: itemForm.value.trim(), label: itemForm.label.trim() || null, weight: Number(itemForm.weight), is_active: true, metadata_json: null }); setItemForm({ value: "", label: "", weight: "1" }); }); }} className={adminClass("admin-inline-form")}>
                <label>Value item<input required className={adminClass("admin-field")} value={itemForm.value} onChange={(event) => setItemForm((value) => ({ ...value, value: event.target.value }))} /></label>
                <label>Label item<input className={adminClass("admin-field")} value={itemForm.label} onChange={(event) => setItemForm((value) => ({ ...value, label: event.target.value }))} /></label>
                <label>Bobot<input required min="0.0001" step="0.1" type="number" className={adminClass("admin-field")} value={itemForm.weight} onChange={(event) => setItemForm((value) => ({ ...value, weight: event.target.value }))} /></label>
              <button type="button" disabled={busy} onClick={() => void action(async () => { if (!selectedCategory || !itemForm.value.trim()) return; await createWordlistItem({ category_id: selectedCategory.id, value: itemForm.value.trim(), label: itemForm.label.trim() || null, weight: Number(itemForm.weight), is_active: true, metadata_json: null }); setItemForm({ value: "", label: "", weight: "1" }); })} className={adminClass("admin-primary-action")}><Plus size={15} aria-hidden="true" />Tambah item</button>
              </form>
              <div className={adminClass("admin-table-wrap")}><table className={adminClass("admin-table")}><thead><tr><th>Value</th><th>Label</th><th>Bobot</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{visibleItems.map((item) => <tr key={item.id}><td>{item.value}</td><td>{item.label ?? "-"}</td><td>{item.weight}</td><td>{item.is_active ? "Aktif" : "Nonaktif"}</td><td><button type="button" onClick={() => void action(() => updateWordlistItem(item.id, { is_active: !item.is_active }))} className={adminClass("admin-secondary-action")}>{item.is_active ? "Nonaktifkan item" : "Aktifkan item"}</button><button type="button" onClick={() => { if (window.confirm("Hapus item?")) void action(() => deleteWordlistItem(item.id)); }} className={adminClass("admin-danger-action")}>Hapus item</button></td></tr>)}</tbody></table></div>
              <div className={adminClass("admin-form-stack")}><label>Import per baris<textarea className={adminClass("admin-field admin-textarea")} value={importText} onChange={(event) => setImportText(event.target.value)} /></label><label className={adminClass("admin-check")}><input type="checkbox" checked={replace} onChange={(event) => setReplace(event.target.checked)} />Ganti seluruh item kategori</label><button type="button" disabled={busy || !parseImportLines(importText).length} onClick={() => void action(async () => { await importWordlistItems({ category_code: selectedCategory.code, items: parseImportLines(importText), replace }); setImportText(""); })} className={adminClass("admin-secondary-action")}><Upload size={14} aria-hidden="true" />Import item</button></div>
            </div> : <p className={adminClass("admin-empty")}>Pilih kategori.</p>}
          </section>
        </div>
      )}
    </section>
  );
}
