"use client";

import { createGenerationBatch, listCostumeTemplates, listWordlistCategories, listWordlistItems } from "@/lib/automation-api";
import type { CostumeTemplate, CostumeTemplateMode, GenerationMode, WordlistCategory, WordlistItem } from "@/lib/automation-types";
import { buildGenerationPayload } from "@/lib/generation-form";
import { AlertCircle, CheckCircle2, LoaderCircle, Play, Workflow } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const inputClass = "w-full border border-white/12 bg-black/25 px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff9d42]/60";

export function ExploreWorkspace() {
  const [templates, setTemplates] = useState<CostumeTemplate[]>([]);
  const [categories, setCategories] = useState<WordlistCategory[]>([]);
  const [items, setItems] = useState<WordlistItem[]>([]);
  const [amount, setAmount] = useState(1);
  const [mode, setMode] = useState<GenerationMode>("random");
  const [combineEnabled, setCombineEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [templateMode, setTemplateMode] = useState<CostumeTemplateMode>("random_one");
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<number[]>([]);
  const [fixedSelections, setFixedSelections] = useState<Record<string, number>>({});
  const [randomSeed, setRandomSeed] = useState("");
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([listCostumeTemplates(), listWordlistCategories(), listWordlistItems()])
      .then(([templateData, categoryData, itemData]) => {
        if (!active) return;
        setTemplates(templateData);
        setCategories(categoryData);
        setItems(itemData);
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Data generation gagal dimuat."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const activeTemplates = useMemo(() => templates.filter((item) => item.is_active), [templates]);
  const selectableCategories = useMemo(() => categories.filter((item) => item.is_active), [categories]);

  function toggleTemplate(id: number) {
    setSelectedTemplateIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    setBatchId(null);
    try {
      const fixedWordlistItems = Object.fromEntries(
        Object.entries(fixedSelections).filter(([, value]) => Number.isInteger(value) && value > 0),
      );
      if (mode === "fixed" && selectableCategories.some((category) => category.is_required && !fixedWordlistItems[category.code])) {
        throw new Error("Mode fixed membutuhkan pilihan pada seluruh kategori wajib.");
      }
      const request = buildGenerationPayload({
        amount,
        mode,
        combineEnabled,
        videoEnabled,
        templateMode,
        selectedTemplateIds,
        activeTemplateCount: activeTemplates.length,
        randomSeed,
        allowDuplicates,
        fixedWordlistItems: mode === "random" ? {} : fixedWordlistItems,
      });
      const queued = await createGenerationBatch(request);
      setBatchId(queued.batch_id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Batch gagal dibuat.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1180px] px-4 pb-10 sm:px-6 lg:px-8">
      <header className="border-b border-white/10 pb-6">
        <p className="text-xs uppercase text-[#ffb66c]">Generation Pipeline</p>
        <h1 className="mt-3 text-3xl font-semibold">Buat batch automation</h1>
        <p className="mt-3 text-sm text-white/45">Satu pipeline dapat menjalankan generate motif, combine costume, lalu video 720x1280 tanpa audio.</p>
      </header>

      {loading ? <div className="flex items-center gap-2 py-14 text-sm text-white/45"><LoaderCircle size={17} className="animate-spin" />Memuat konfigurasi backend...</div> :
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-6 border border-white/10 bg-white/4 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-xs text-white/50">Jumlah<input className={`${inputClass} mt-2`} type="number" min={1} max={500} value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label>
              <label className="text-xs text-white/50">Mode<select className={`${inputClass} mt-2`} value={mode} onChange={(event) => setMode(event.target.value as GenerationMode)}><option value="random">Random</option><option value="mixed">Mixed</option><option value="fixed">Fixed</option></select></label>
              <label className="text-xs text-white/50">Random seed<input className={`${inputClass} mt-2`} inputMode="numeric" value={randomSeed} onChange={(event) => setRandomSeed(event.target.value)} placeholder="Opsional" /></label>
            </div>

            {mode !== "random" && <div>
              <h2 className="text-sm font-medium">Pilihan wordlist</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {selectableCategories.map((category) => <label key={category.id} className="text-xs text-white/50">{category.name}{category.is_required && mode === "fixed" ? " *" : ""}<select className={`${inputClass} mt-2`} value={fixedSelections[category.code] ?? ""} onChange={(event) => setFixedSelections((current) => ({ ...current, [category.code]: Number(event.target.value) }))}><option value="">Random</option>{items.filter((item) => item.category_id === category.id && item.is_active).map((item) => <option key={item.id} value={item.id}>{item.label || item.value}</option>)}</select></label>)}
              </div>
            </div>}

            <div className="border-t border-white/10 pt-5">
              <h2 className="text-sm font-medium">Tahapan output</h2>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked readOnly />Generate motif</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={combineEnabled} onChange={(event) => { setCombineEnabled(event.target.checked); if (!event.target.checked) setVideoEnabled(false); }} />Combine costume</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={videoEnabled} onChange={(event) => { setVideoEnabled(event.target.checked); if (event.target.checked) { setCombineEnabled(true); setTemplateMode("random_one"); } }} />Video tanpa audio</label>
              </div>
            </div>

            {combineEnabled && <div>
              <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-medium">Template costume</h2><Link href="/admin/templates" className="text-xs text-[#ffb66c]">Kelola template</Link></div>
              <select className={`${inputClass} mt-3`} value={templateMode} onChange={(event) => setTemplateMode(event.target.value as CostumeTemplateMode)}><option value="random_one">Pilih satu secara acak</option><option value="selected">Pilih manual</option><option value="all" disabled={videoEnabled}>Gunakan semua</option></select>
              {templateMode === "selected" && <div className="mt-3 grid gap-2 sm:grid-cols-2">{activeTemplates.map((template) => <label key={template.id} className="flex items-center gap-2 border border-white/10 px-3 py-2 text-sm"><input type="checkbox" checked={selectedTemplateIds.includes(template.id)} onChange={() => toggleTemplate(template.id)} />{template.name}</label>)}</div>}
              {!activeTemplates.length && <p className="mt-3 text-sm text-red-200/80">Belum ada template aktif. Upload template sebelum combine.</p>}
            </div>}

            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allowDuplicates} onChange={(event) => setAllowDuplicates(event.target.checked)} />Izinkan prompt duplikat</label>

            <button disabled={submitting} onClick={() => void submit()} className="flex items-center gap-2 bg-[#ff9d42] px-5 py-3 text-sm font-semibold text-[#201307] disabled:opacity-50">{submitting ? <LoaderCircle size={17} className="animate-spin" /> : <Play size={17} />}Antrekan batch</button>
            {error && <div className="flex gap-2 border border-red-400/20 bg-red-400/8 p-4 text-sm text-red-100/80"><AlertCircle size={17} className="shrink-0" />{error}</div>}
            {batchId && <div className="flex items-center justify-between gap-4 border border-emerald-400/20 bg-emerald-400/8 p-4 text-sm text-emerald-100/80"><span className="flex items-center gap-2"><CheckCircle2 size={17} />Batch {batchId} sudah masuk antrean.</span><Link href={`/admin/history?batch=${encodeURIComponent(batchId)}`} className="font-medium text-emerald-200">Pantau</Link></div>}
          </section>

          <aside className="border border-white/10 bg-black/20 p-5">
            <Workflow size={19} className="text-[#ffad5d]" />
            <h2 className="mt-4 font-medium">Kontrak worker</h2>
            <ol className="mt-4 space-y-3 text-sm text-white/50"><li>1. Generate motif WebP</li><li>2. Combine ke template aktif</li><li>3. Video potret 720x1280</li><li>4. Retry otomatis saat ComfyUI mati</li></ol>
          </aside>
        </div>}
    </main>
  );
}
