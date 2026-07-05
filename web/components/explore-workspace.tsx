"use client";

import { createGenerationBatch, listCostumeTemplates, listWordlistCategories, listWordlistItems } from "@/lib/automation-api";
import type { CostumeTemplate, CostumeTemplateMode, GenerationBatchCreate, GenerationMode, WordlistCategory, WordlistItem } from "@/lib/automation-types";
import { buildGenerationPayload } from "@/lib/generation-form";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, Play, Workflow } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type StudioStage = "batch" | "prompt" | "media" | "review";

const stages: { id: StudioStage; label: string }[] = [
  { id: "batch", label: "Konfigurasi batch" },
  { id: "prompt", label: "Aturan prompt" },
  { id: "media", label: "Media output" },
  { id: "review", label: "Review payload" },
];

function templateModeLabel(value: CostumeTemplateMode) {
  if (value === "random_one") return "Pilih satu secara acak";
  if (value === "selected") return "Pilih manual";
  if (value === "all") return "Gunakan semua";
  return "Tanpa costume";
}

function modeLabel(value: GenerationMode) {
  if (value === "fixed") return "fixed";
  if (value === "mixed") return "mixed";
  return "random";
}

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
  const [stage, setStage] = useState<StudioStage>("batch");
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
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Data generation gagal dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const activeTemplates = useMemo(() => templates.filter((item) => item.is_active), [templates]);
  const selectableCategories = useMemo(() => categories.filter((item) => item.is_active), [categories]);
  const fixedWordlistItems = useMemo(
    () => Object.fromEntries(
      Object.entries(fixedSelections).filter(([, value]) => Number.isInteger(value) && value > 0),
    ),
    [fixedSelections],
  );

  const payloadPreview: GenerationBatchCreate | null = (() => {
    try {
      return buildPayload();
    } catch {
      return null;
    }
  })();

  function buildPayload() {
    return buildGenerationPayload({
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
  }

  function validatePromptStage() {
    if (mode === "fixed" && selectableCategories.some((category) => category.is_required && !fixedWordlistItems[category.code])) {
      throw new Error("Mode fixed membutuhkan pilihan pada seluruh kategori wajib.");
    }
  }

  function toggleTemplate(id: number) {
    setSelectedTemplateIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function goBack() {
    setError(null);
    const index = stages.findIndex((item) => item.id === stage);
    setStage(stages[Math.max(0, index - 1)].id);
  }

  function goNext() {
    setError(null);
    try {
      if (stage === "prompt") validatePromptStage();
      if (stage === "media") buildPayload();
      const index = stages.findIndex((item) => item.id === stage);
      setStage(stages[Math.min(stages.length - 1, index + 1)].id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tahap ini belum lengkap.");
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    setBatchId(null);
    try {
      validatePromptStage();
      const request = buildPayload();
      const queued = await createGenerationBatch(request);
      setBatchId(queued.batch_id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Batch gagal dibuat.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="studio-flow" aria-labelledby="studio-title">
      <header className="studio-hero">
        <div>
          <p className="admin-eyebrow">Studio Produksi</p>
          <h1 id="studio-title">Buat batch automation</h1>
          <p>Rangkai jumlah motif, aturan prompt, costume, dan video dalam alur produksi yang lebih jelas.</p>
        </div>
        <Link href="/admin/history" className="admin-primary-action">Lihat batch</Link>
      </header>

      {loading ? (
        <div className="admin-loading">
          <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
          Memuat konfigurasi backend...
        </div>
      ) : (
        <div className="studio-layout">
          <section className="studio-panel">
            <div role="tablist" aria-label="Tahap studio" className="studio-tabs">
              {stages.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-label={item.label}
                  aria-selected={stage === item.id}
                  className="studio-tab"
                  data-active={stage === item.id}
                  onClick={() => setStage(item.id)}
                >
                  <span>{index + 1}</span>
                  {item.label}
                </button>
              ))}
            </div>

            {stage === "batch" && (
              <div className="studio-stage">
                <h2>Konfigurasi batch</h2>
                <p>Mulai dari ukuran batch dan identitas run. Bagian ini tidak menyentuh aturan prompt.</p>
                <div className="studio-field-grid">
                  <label>
                    Jumlah
                    <input className="studio-input" type="number" min={1} max={500} value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
                  </label>
                  <label>
                    Random seed
                    <input className="studio-input" inputMode="numeric" value={randomSeed} onChange={(event) => setRandomSeed(event.target.value)} placeholder="Opsional" />
                  </label>
                  <label className="studio-checkbox-card">
                    <input type="checkbox" checked={allowDuplicates} onChange={(event) => setAllowDuplicates(event.target.checked)} />
                    <span>
                      Izinkan prompt duplikat
                      <small>Biarkan worker membuat komposisi yang mungkin berulang.</small>
                    </span>
                  </label>
                </div>
              </div>
            )}

            {stage === "prompt" && (
              <div className="studio-stage">
                <h2>Aturan prompt</h2>
                <p>Pilih cara wordlist dipakai. Mode fixed wajib mengisi kategori bertanda wajib.</p>
                <label>
                  Mode
                  <select className="studio-input" value={mode} onChange={(event) => setMode(event.target.value as GenerationMode)}>
                    <option value="random">Random</option>
                    <option value="mixed">Mixed</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </label>

                {mode !== "random" && (
                  <div className="studio-field-grid">
                    {selectableCategories.map((category) => (
                      <label key={category.id}>
                        {category.name}{category.is_required && mode === "fixed" ? " wajib" : ""}
                        <select
                          className="studio-input"
                          value={fixedSelections[category.code] ?? ""}
                          onChange={(event) => setFixedSelections((current) => ({ ...current, [category.code]: Number(event.target.value) }))}
                        >
                          <option value="">Random</option>
                          {items.filter((item) => item.category_id === category.id && item.is_active).map((item) => (
                            <option key={item.id} value={item.id}>{item.label || item.value}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {stage === "media" && (
              <div className="studio-stage">
                <h2>Media output</h2>
                <p>Generate motif selalu aktif. Combine dan video mengikuti template yang tersedia.</p>
                <div className="studio-output-grid">
                  <label className="studio-checkbox-card">
                    <input type="checkbox" checked readOnly />
                    <span>Generate motif<small>Output motif WebP.</small></span>
                  </label>
                  <label className="studio-checkbox-card">
                    <input
                      type="checkbox"
                      checked={combineEnabled}
                      onChange={(event) => {
                        setCombineEnabled(event.target.checked);
                        if (!event.target.checked) setVideoEnabled(false);
                      }}
                    />
                    <span>Combine costume<small>Pasangkan motif ke template aktif.</small></span>
                  </label>
                  <label className="studio-checkbox-card">
                    <input
                      type="checkbox"
                      checked={videoEnabled}
                      onChange={(event) => {
                        setVideoEnabled(event.target.checked);
                        if (event.target.checked) {
                          setCombineEnabled(true);
                          setTemplateMode("random_one");
                        }
                      }}
                    />
                    <span>Video tanpa audio<small>Butuh tepat satu template costume.</small></span>
                  </label>
                </div>

                {combineEnabled && (
                  <div className="studio-template-panel">
                    <div className="studio-template-heading">
                      <h3>Template costume</h3>
                      <Link href="/admin/templates">Kelola template</Link>
                    </div>
                    <label>
                      Mode template
                      <select className="studio-input" value={templateMode} onChange={(event) => setTemplateMode(event.target.value as CostumeTemplateMode)}>
                        <option value="random_one">Pilih satu secara acak</option>
                        <option value="selected">Pilih manual</option>
                        <option value="all" disabled={videoEnabled}>Gunakan semua</option>
                      </select>
                    </label>
                    {templateMode === "selected" && (
                      <div className="studio-template-list">
                        {activeTemplates.map((template) => (
                          <label key={template.id} className="studio-checkbox-card">
                            <input type="checkbox" checked={selectedTemplateIds.includes(template.id)} onChange={() => toggleTemplate(template.id)} />
                            <span>{template.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {!activeTemplates.length && (
                      <p className="studio-warning">Belum ada template aktif. Upload template sebelum combine.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {stage === "review" && (
              <div className="studio-stage">
                <h2>Review payload</h2>
                <p>Cek lagi sebelum batch masuk antrean worker.</p>
                <section className="studio-review" aria-label="Ringkasan payload">
                  <dl>
                    <div><dt>Jumlah</dt><dd>{amount} motif</dd></div>
                    <div><dt>Mode</dt><dd>{modeLabel(mode)}</dd></div>
                    <div><dt>Pilihan kategori</dt><dd>{Object.keys(mode === "random" ? {} : fixedWordlistItems).length || "Random"}</dd></div>
                    <div><dt>Template costume</dt><dd>{templateModeLabel(payloadPreview?.costume_template_mode ?? templateMode)}</dd></div>
                    <div><dt>Combine</dt><dd>{payloadPreview?.combine_enabled ? "Aktif" : "Nonaktif"}</dd></div>
                    <div><dt>Video</dt><dd>{payloadPreview?.video_enabled ? "Aktif" : "Nonaktif"}</dd></div>
                    <div><dt>Seed</dt><dd>{payloadPreview?.random_seed ?? "Tanpa seed"}</dd></div>
                    <div><dt>Izinkan duplikat</dt><dd>{allowDuplicates ? "Ya" : "Tidak"}</dd></div>
                  </dl>
                </section>
              </div>
            )}

            <div className="studio-actions">
              {stage !== "batch" && (
                <button type="button" className="admin-logout-button" onClick={goBack}>
                  <ChevronLeft size={16} aria-hidden="true" />
                  Kembali
                </button>
              )}
              {stage !== "review" ? (
                <button type="button" className="admin-primary-action" onClick={goNext}>
                  {stage === "batch" ? "Lanjut ke prompt" : stage === "prompt" ? "Lanjut ke media" : "Review batch"}
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" disabled={submitting} onClick={() => void submit()} className="admin-primary-action">
                  {submitting ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
                  Jalankan batch
                </button>
              )}
            </div>

            {error && (
              <div role="alert" className="admin-alert">
                <AlertCircle size={17} className="shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}
            {batchId && (
              <div className="studio-success">
                <span><CheckCircle2 size={17} aria-hidden="true" />Batch {batchId} sudah masuk antrean.</span>
                <Link href={`/admin/history?batch=${encodeURIComponent(batchId)}`}>Pantau</Link>
              </div>
            )}
          </section>

          <aside className="studio-contract">
            <Workflow size={19} aria-hidden="true" />
            <h2>Kontrak worker</h2>
            <ol>
              <li><span>01</span>Generate motif WebP</li>
              <li><span>02</span>Combine ke template aktif</li>
              <li><span>03</span>Video potret 720x1280</li>
              <li><span>04</span>Retry otomatis saat ComfyUI mati</li>
            </ol>
          </aside>
        </div>
      )}
    </section>
  );
}
