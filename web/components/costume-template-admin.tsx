"use client";

import { deleteCostumeTemplate, listCostumeTemplates, updateCostumeTemplate, uploadCostumeTemplate } from "@/lib/automation-api";
import type { CostumeTemplate } from "@/lib/automation-types";
import { AlertCircle, LoaderCircle, RefreshCw, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const field = "border border-white/12 bg-black/25 px-3 py-2 text-sm outline-none";

export function CostumeTemplateAdmin() {
  const [items, setItems] = useState<CostumeTemplate[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => { setLoading(true); setError(null); try { setItems(await listCostumeTemplates()); } catch (reason) { setError(reason instanceof Error ? reason.message : "Template gagal dimuat."); } finally { setLoading(false); } }, []);
  useEffect(() => { let active = true; listCostumeTemplates().then((data) => { if (active) setItems(data); }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Template gagal dimuat."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);

  async function action(operation: () => Promise<unknown>) { setBusy(true); setError(null); try { await operation(); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Operasi template gagal."); } finally { setBusy(false); } }

  return <main className="mx-auto max-w-[1280px] px-4 pb-10 sm:px-6 lg:px-8">
    <header className="flex items-end justify-between gap-4 border-b border-white/10 pb-6"><div><p className="text-xs uppercase text-[#ffb66c]">Combine Inputs</p><h1 className="mt-3 text-3xl font-semibold">Costume templates</h1><p className="mt-3 text-sm text-white/45">Gambar model atau pakaian polos untuk workflow combine.</p></div><button onClick={() => void load()} className="grid h-11 w-11 place-items-center rounded-full border border-white/12"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button></header>
    {error && <div className="mt-5 flex gap-2 border border-red-400/20 bg-red-400/8 p-4 text-sm text-red-100/80"><AlertCircle size={17} />{error}</div>}
    <form onSubmit={(event) => { event.preventDefault(); if (!file) { setError("Pilih gambar template."); return; } const form = new FormData(); form.set("file", file); form.set("name", name); form.set("description", description); form.set("is_active", "true"); form.set("sort_order", sortOrder); void action(async () => { await uploadCostumeTemplate(form); setFile(null); setName(""); setDescription(""); setSortOrder("0"); }); }} className="mt-6 grid gap-3 border border-white/10 p-5 md:grid-cols-2"><input required type="file" accept="image/*" className={field} onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><input required className={field} placeholder="Nama template" value={name} onChange={(event) => setName(event.target.value)} /><input className={field} placeholder="Deskripsi" value={description} onChange={(event) => setDescription(event.target.value)} /><input required type="number" className={field} placeholder="Urutan" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} /><button disabled={busy} className="flex items-center justify-center gap-2 bg-[#ff9d42] px-4 py-2.5 text-sm font-semibold text-[#201307] md:col-span-2"><Upload size={15} />Upload template</button></form>
    {loading && !items.length ? <div className="flex items-center gap-2 py-16 text-sm text-white/45"><LoaderCircle className="animate-spin" size={17} />Memuat template...</div> : <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="border border-white/10 bg-white/4 p-3"><div className="relative aspect-[3/4] overflow-hidden bg-black/30"><Image unoptimized fill sizes="(max-width: 768px) 100vw, 360px" src={`/api/automation/public/images/template/${encodeURIComponent(item.filename)}`} alt={item.name} className="object-cover" /></div><div className="p-2"><div className="flex items-start justify-between gap-3"><div><h2 className="font-medium">{item.name}</h2><p className="mt-1 text-xs text-white/35">Urutan {item.sort_order}</p></div><span className={item.is_active ? "text-xs text-emerald-300" : "text-xs text-white/30"}>{item.is_active ? "Aktif" : "Nonaktif"}</span></div><p className="mt-3 text-sm text-white/45">{item.description || "Tanpa deskripsi"}</p><div className="mt-4 flex gap-2"><button disabled={busy} onClick={() => void action(() => updateCostumeTemplate(item.id, { is_active: !item.is_active }))} className="flex-1 border border-white/12 px-3 py-2 text-xs">{item.is_active ? "Nonaktifkan" : "Aktifkan"}</button><button disabled={busy} onClick={() => { const order = window.prompt("Urutan", String(item.sort_order)); if (order !== null) void action(() => updateCostumeTemplate(item.id, { sort_order: Number(order) })); }} className="border border-white/12 px-3 py-2 text-xs">Urutan</button><button disabled={busy} onClick={() => { if (window.confirm(`Hapus ${item.name}?`)) void action(() => deleteCostumeTemplate(item.id)); }} className="border border-red-300/20 px-3 py-2 text-red-200"><Trash2 size={14} /></button></div></div></article>)}</section>}
  </main>;
}
