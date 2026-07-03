"use client";

import { createWordlistCategory, createWordlistItem, deleteWordlistCategory, deleteWordlistItem, importWordlistItems, listWordlistCategories, listWordlistItems, updateWordlistCategory, updateWordlistItem } from "@/lib/automation-api";
import { parseImportLines } from "@/lib/admin-resource-forms";
import type { WordlistCategory, WordlistItem } from "@/lib/automation-types";
import { AlertCircle, LoaderCircle, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const field = "border border-white/12 bg-black/25 px-3 py-2 text-sm outline-none";

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
    try { apply(...await Promise.all([listWordlistCategories(), listWordlistItems()])); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Wordlist gagal dimuat."); }
    finally { setLoading(false); }
  }, [apply]);

  useEffect(() => {
    let active = true;
    Promise.all([listWordlistCategories(), listWordlistItems()])
      .then(([categoryData, itemData]) => { if (active) apply(categoryData, itemData); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Wordlist gagal dimuat."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [apply]);

  const selectedCategory = categories.find((item) => item.id === categoryId) ?? null;
  const visibleItems = useMemo(() => items.filter((item) => item.category_id === categoryId), [items, categoryId]);

  async function action(operation: () => Promise<unknown>) {
    setBusy(true); setError(null);
    try { await operation(); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Operasi wordlist gagal."); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-[1480px] px-4 pb-10 sm:px-6 lg:px-8">
    <header className="flex items-end justify-between gap-4 border-b border-white/10 pb-6"><div><p className="text-xs uppercase text-[#ffb66c]">Prompt Sources</p><h1 className="mt-3 text-3xl font-semibold">Wordlist</h1><p className="mt-3 text-sm text-white/45">Kategori, bobot, dan nilai yang dipakai prompt generator.</p></div><button onClick={() => void load()} className="grid h-11 w-11 place-items-center rounded-full border border-white/12"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button></header>
    {error && <div className="mt-5 flex gap-2 border border-red-400/20 bg-red-400/8 p-4 text-sm text-red-100/80"><AlertCircle size={17} />{error}</div>}
    {loading ? <div className="flex items-center gap-2 py-16 text-sm text-white/45"><LoaderCircle className="animate-spin" size={17} />Memuat wordlist...</div> : <div className="mt-6 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="border border-white/10 p-4">
        <form onSubmit={(event) => { event.preventDefault(); void action(async () => { await createWordlistCategory({ code: categoryForm.code.trim(), name: categoryForm.name.trim(), description: null, is_required: true, selection_min: 1, selection_max: 1, sort_order: categories.length, is_active: true }); setCategoryForm({ code: "", name: "" }); }); }} className="grid gap-2"><input required className={field} placeholder="Kode kategori" value={categoryForm.code} onChange={(event) => setCategoryForm((value) => ({ ...value, code: event.target.value }))} /><input required className={field} placeholder="Nama kategori" value={categoryForm.name} onChange={(event) => setCategoryForm((value) => ({ ...value, name: event.target.value }))} /><button disabled={busy} className="flex items-center justify-center gap-2 bg-[#ff9d42] px-3 py-2 text-sm font-semibold text-[#201307]"><Plus size={15} />Tambah kategori</button></form>
        <div className="mt-4 border-t border-white/10">{categories.map((category) => <button key={category.id} onClick={() => setCategoryId(category.id)} className={`flex w-full items-center justify-between border-b border-white/8 px-3 py-3 text-left text-sm ${categoryId === category.id ? "bg-[#ff9d42]/12" : ""}`}><span>{category.name}<small className="mt-1 block text-white/30">{category.code}</small></span><span className={category.is_active ? "text-emerald-300" : "text-white/30"}>{category.is_active ? "Aktif" : "Nonaktif"}</span></button>)}</div>
      </section>
      <section className="min-w-0 border border-white/10 p-4">
        {selectedCategory ? <>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-medium">{selectedCategory.name}</h2><p className="text-xs text-white/35">{visibleItems.length} item</p></div><div className="flex gap-2"><button disabled={busy} onClick={() => void action(() => updateWordlistCategory(selectedCategory.id, { is_active: !selectedCategory.is_active }))} className="border border-white/12 px-3 py-2 text-xs">{selectedCategory.is_active ? "Nonaktifkan" : "Aktifkan"}</button><button disabled={busy} onClick={() => { if (window.confirm("Hapus kategori dan item terkait?")) void action(() => deleteWordlistCategory(selectedCategory.id)); }} className="border border-red-300/20 px-3 py-2 text-xs text-red-200"><Trash2 size={14} /></button></div></div>
          <form onSubmit={(event) => { event.preventDefault(); void action(async () => { await createWordlistItem({ category_id: selectedCategory.id, value: itemForm.value.trim(), label: itemForm.label.trim() || null, weight: Number(itemForm.weight), is_active: true, metadata_json: null }); setItemForm({ value: "", label: "", weight: "1" }); }); }} className="mt-5 grid gap-2 sm:grid-cols-[1fr_1fr_100px_auto]"><input required className={field} placeholder="Value" value={itemForm.value} onChange={(event) => setItemForm((value) => ({ ...value, value: event.target.value }))} /><input className={field} placeholder="Label" value={itemForm.label} onChange={(event) => setItemForm((value) => ({ ...value, label: event.target.value }))} /><input required min="0.0001" step="0.1" type="number" className={field} value={itemForm.weight} onChange={(event) => setItemForm((value) => ({ ...value, weight: event.target.value }))} /><button disabled={busy} className="bg-[#ff9d42] px-3 text-[#201307]"><Plus size={16} /></button></form>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="text-xs text-white/35"><tr><th className="p-2">Value</th><th className="p-2">Label</th><th className="p-2">Bobot</th><th className="p-2">Status</th><th className="p-2"></th></tr></thead><tbody>{visibleItems.map((item) => <tr key={item.id} className="border-t border-white/8"><td className="p-2">{item.value}</td><td className="p-2 text-white/45">{item.label ?? "-"}</td><td className="p-2"><button onClick={() => { const value = window.prompt("Bobot baru", String(item.weight)); if (value) void action(() => updateWordlistItem(item.id, { weight: Number(value) })); }}>{item.weight}</button></td><td className="p-2"><button onClick={() => void action(() => updateWordlistItem(item.id, { is_active: !item.is_active }))} className={item.is_active ? "text-emerald-300" : "text-white/30"}>{item.is_active ? "Aktif" : "Nonaktif"}</button></td><td className="p-2"><button onClick={() => void action(() => deleteWordlistItem(item.id))} className="text-red-200"><Trash2 size={14} /></button></td></tr>)}</tbody></table></div>
          <div className="mt-6 border-t border-white/10 pt-5"><h3 className="text-sm font-medium">Import per baris</h3><textarea className={`${field} mt-3 min-h-28 w-full`} value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Satu nilai per baris" /><div className="mt-2 flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={replace} onChange={(event) => setReplace(event.target.checked)} />Ganti seluruh item kategori</label><button disabled={busy || !parseImportLines(importText).length} onClick={() => void action(async () => { await importWordlistItems({ category_code: selectedCategory.code, items: parseImportLines(importText), replace }); setImportText(""); })} className="flex items-center gap-2 border border-white/12 px-3 py-2 text-xs"><Upload size={14} />Import</button></div></div>
        </> : <p className="text-sm text-white/40">Pilih kategori.</p>}
      </section>
    </div>}
  </main>;
}
