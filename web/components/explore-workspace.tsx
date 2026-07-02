"use client";

import { useApp } from "@/components/app-provider";
import { GarmentPreview, HumanPreview, MotifArt } from "@/components/motif-art";
import { motifOptions, motifs, moduleItems } from "@/lib/data";
import { downloadResultMetadata } from "@/lib/download";
import { generateMotifs, getApiMode } from "@/lib/api";
import type { GenerationConfig, GenerationResult, GenerationStage } from "@/lib/types";
import { cn, createId, slugLabel } from "@/lib/utils";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Download,
  Gauge,
  Image as ImageIcon,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
  Save,
  Sparkles,
  WandSparkles,
  Workflow,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type ModuleId = (typeof moduleItems)[number]["id"];
const validModules = new Set<ModuleId>(moduleItems.map((item) => item.id));
function isModuleId(value: string): value is ModuleId {
  return validModules.has(value as ModuleId);
}

const sample: GenerationResult = {
  id: "sample-2435",
  title: motifs[0].title,
  variant: motifs[0].variant,
  stage: "motif",
  prompt: motifs[0].prompt,
  colors: [motifs[0].colors[0], motifs[0].colors[1], motifs[0].colors[2] ?? "#d7a85f"],
  createdAt: new Date(0).toISOString(),
  resolution: "1024 × 1024",
  style: "Modern",
  composition: "Simetris",
  density: "Seimbang",
};

const defaultConfig: GenerationConfig = {
  motif: "ceplok",
  primaryColor: "#153f42",
  secondaryColor: "#ead7b9",
  accentColor: "#d7a85f",
  style: "Modern",
  composition: "Simetris",
  density: "Seimbang",
  count: 1,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-medium uppercase tracking-[.16em] text-white/42">{label}</span>
      {children}
    </label>
  );
}

const selectClass = "w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-white outline-none transition focus:border-[#ff9d42]/60 focus:ring-2 focus:ring-[#ff9d42]/10";

function Preview({ active, result, playing }: { active: string; result: GenerationResult; playing: boolean }) {
  if (active === "garment") {
    return <GarmentPreview id={result.id} variant={result.variant} colors={result.colors} className="h-full w-full" />;
  }
  if (active === "human" || active === "video") {
    return <HumanPreview id={result.id} variant={result.variant} colors={result.colors} animated={active === "video" && playing} className="h-full w-full" />;
  }
  return <MotifArt id={`${result.id}-${active}`} variant={result.variant} colors={result.colors} seamless={active === "seamless"} className="h-full w-full" />;
}

export function ExploreWorkspace() {
  const searchParams = useSearchParams();
  const moduleParam = searchParams.get("module") ?? "motif";
  const [active, setActive] = useState<ModuleId>(isModuleId(moduleParam) ? moduleParam : "motif");
  const [config, setConfig] = useState<GenerationConfig>(defaultConfig);
  const [results, setResults] = useState<GenerationResult[]>([sample]);
  const [selectedId, setSelectedId] = useState(sample.id);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addHistory, history } = useApp();
  const apiMode = getApiMode();


  const selected = useMemo(() => results.find((item) => item.id === selectedId) ?? results[0], [results, selectedId]);
  const activeItem = moduleItems.find((item) => item.id === active) ?? moduleItems[0];

  async function withProgress(task: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setMessage(null);
    setProgress(5);
    const timer = window.setInterval(() => setProgress((value) => Math.min(value + Math.ceil(Math.random() * 9), 91)), 180);
    try {
      await task();
      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 350));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Proses tidak dapat diselesaikan.");
    } finally {
      window.clearInterval(timer);
      setBusy(false);
      window.setTimeout(() => setProgress(0), 450);
    }
  }

  async function handleGenerate() {
    const stage: GenerationStage = active === "auto-generate" ? "auto-generate" : "motif";
    const request = { ...config, count: active === "auto-generate" ? 4 : config.count } as GenerationConfig;
    await withProgress(async () => {
      const generated = await generateMotifs(request, stage);
      setResults(generated);
      setSelectedId(generated[0].id);
      addHistory(generated);
      setMessage(`${generated.length} variasi ${slugLabel(config.motif)} berhasil dibuat dan disimpan ke riwayat.`);
    });
  }

  async function handleProcess(stage: GenerationStage) {
    await withProgress(async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const output: GenerationResult = {
        ...selected,
        id: createId(stage),
        title: `${selected.title} · ${moduleItems.find((item) => item.id === stage)?.label ?? slugLabel(stage)}`,
        stage,
        sourceId: selected.id,
        createdAt: new Date().toISOString(),
        resolution: stage === "upscale" ? "4096 × 4096" : selected.resolution,
      };
      setResults((current) => [output, ...current]);
      setSelectedId(output.id);
      addHistory(output);
      setMessage(`${activeItem.label} selesai dan tersimpan di riwayat.`);
    });
  }

  const generatorActive = active === "motif" || active === "auto-generate";

  return (
    <main className="mx-auto max-w-[1480px] px-4 pb-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[.2em] text-[#ffb66c]"><span className="h-px w-8 bg-[#ff9d42]" />Studio Eksplorasi</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">TitikBatik AI Workspace</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">Pilih parameter visual, hasilkan motif, lalu lanjutkan ke seamless pattern, busana, model manusia, video, dan upscaling.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="glass-soft flex items-center gap-2 rounded-full px-3 py-2 text-white/60"><span className={`h-2 w-2 rounded-full ${apiMode.includes("API") ? "bg-emerald-400" : "bg-[#ff9d42]"}`} /> Mode: {apiMode}</span>
          <span className="glass-soft flex items-center gap-2 rounded-full px-3 py-2 text-white/60"><Save size={14} /> {history.length} hasil tersimpan</span>
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-[34px] p-3 sm:p-4">
        <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
          <aside className="glass-soft rounded-[27px] p-3">
            <div className="px-3 pb-3 pt-2 text-[11px] font-medium uppercase tracking-[.18em] text-white/35">Modul Fungsional</div>
            <div className="space-y-2">
              {moduleItems.map((item) => (
                <button key={item.id} onClick={() => setActive(item.id)} className={cn("w-full rounded-[20px] border p-3 text-left transition", active === item.id ? "border-[#ff9d42]/35 bg-[#ff9d42]/12" : "border-transparent hover:border-white/10 hover:bg-white/6")}>
                  <div className="flex items-center justify-between gap-2"><span className={cn("text-[10px] font-semibold tracking-[.16em]", active === item.id ? "text-[#ffb76f]" : "text-white/32")}>{item.code}</span><ChevronRight size={14} className={active === item.id ? "text-[#ffb76f]" : "text-white/20"} /></div>
                  <div className="mt-2 text-sm font-medium text-white/85">{item.label}</div>
                  <p className="mt-1 text-xs leading-5 text-white/38">{item.description}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="min-w-0 rounded-[27px] border border-white/8 bg-black/12 p-4 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-white/8 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2"><span className="rounded-full border border-[#ff9d42]/25 bg-[#ff9d42]/10 px-2.5 py-1 text-[10px] font-semibold tracking-[.14em] text-[#ffbd7e]">{activeItem.code}</span><span className="text-xs text-white/35">Modul aktif</span></div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">{activeItem.label}</h2>
                <p className="mt-2 text-sm text-white/45">{activeItem.description}</p>
              </div>
              {!generatorActive && (
                <button onClick={() => setActive("motif")} className="glass-soft flex items-center gap-2 rounded-full px-4 py-2.5 text-xs text-white/65 transition hover:scale-105 hover:text-white"><RefreshCw size={14} /> Ganti motif sumber</button>
              )}
            </div>

            {generatorActive ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
                <div className="space-y-4">
                  <Field label="Jenis motif">
                    <select value={config.motif} onChange={(event) => setConfig((value) => ({ ...value, motif: event.target.value as GenerationConfig["motif"] }))} className={selectClass}>
                      {motifOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Warna utama"><input type="color" value={config.primaryColor} onChange={(event) => setConfig((value) => ({ ...value, primaryColor: event.target.value }))} className="h-12 w-full cursor-pointer rounded-2xl border border-white/12 bg-black/25 p-1.5" /></Field>
                    <Field label="Sekunder"><input type="color" value={config.secondaryColor} onChange={(event) => setConfig((value) => ({ ...value, secondaryColor: event.target.value }))} className="h-12 w-full cursor-pointer rounded-2xl border border-white/12 bg-black/25 p-1.5" /></Field>
                    <Field label="Aksen"><input type="color" value={config.accentColor} onChange={(event) => setConfig((value) => ({ ...value, accentColor: event.target.value }))} className="h-12 w-full cursor-pointer rounded-2xl border border-white/12 bg-black/25 p-1.5" /></Field>
                  </div>
                  <Field label="Gaya visual">
                    <select value={config.style} onChange={(event) => setConfig((value) => ({ ...value, style: event.target.value as GenerationConfig["style"] }))} className={selectClass}>
                      {["Tradisional", "Modern", "Minimalis", "Eksperimental"].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Komposisi"><select value={config.composition} onChange={(event) => setConfig((value) => ({ ...value, composition: event.target.value as GenerationConfig["composition"] }))} className={selectClass}>{["Simetris", "Diagonal", "Berulang", "Organik"].map((item) => <option key={item}>{item}</option>)}</select></Field>
                    <Field label="Kepadatan"><select value={config.density} onChange={(event) => setConfig((value) => ({ ...value, density: event.target.value as GenerationConfig["density"] }))} className={selectClass}>{["Renggang", "Seimbang", "Padat"].map((item) => <option key={item}>{item}</option>)}</select></Field>
                  </div>
                  {active === "motif" && (
                    <Field label="Jumlah hasil"><select value={config.count} onChange={(event) => setConfig((value) => ({ ...value, count: Number(event.target.value) as 1 | 2 | 4 }))} className={selectClass}>{[1,2,4].map((item) => <option key={item} value={item}>{item} motif</option>)}</select></Field>
                  )}
                  <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-white/65"><Workflow size={15} className="text-[#ffad5d]" /> Prompt disusun otomatis</div>
                    <p className="mt-2 text-xs leading-5 text-white/36">Pengguna memilih parameter; sistem menyusun instruksi teknis tanpa mewajibkan prompt bebas.</p>
                  </div>
                  <button disabled={busy} onClick={handleGenerate} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff9d42] px-5 py-3.5 text-sm font-semibold text-[#201307] shadow-[0_12px_35px_rgba(255,157,66,.22)] transition hover:scale-[1.02] hover:bg-[#ffb363] disabled:cursor-not-allowed disabled:opacity-60">
                    {busy ? <LoaderCircle size={17} className="animate-spin" /> : <WandSparkles size={17} />}{active === "auto-generate" ? "Generate 4 Variasi" : "Generate Motif"}
                  </button>
                </div>

                <div>
                  <div className="relative aspect-[1.18] overflow-hidden rounded-[28px] border border-white/12 bg-black/25">
                    <MotifArt id={`config-${config.motif}`} variant={config.motif} colors={[config.primaryColor, config.secondaryColor, config.accentColor]} seamless={config.composition === "Berulang"} className="h-full w-full" />
                    <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-xs backdrop-blur-xl">
                      <span className="text-white/65">Preview parameter</span><span className="text-[#ffbd7e]">1024 × 1024</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <div className="relative mx-auto aspect-[1.08] max-h-[620px] overflow-hidden rounded-[28px] border border-white/12 bg-black/25">
                  <Preview active={active} result={selected} playing={playing} />
                  {active === "video" && (
                    <button onClick={() => setPlaying((value) => !value)} className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-white/16 bg-black/45 px-4 py-2.5 text-sm text-white/75 backdrop-blur-xl transition hover:scale-105 hover:text-white">
                      {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Jeda preview" : "Putar preview"}
                    </button>
                  )}
                  {active === "upscale" && <div className="absolute right-5 top-5 rounded-full border border-[#ff9d42]/30 bg-[#ff9d42]/14 px-3 py-1.5 text-xs font-semibold text-[#ffbd7e]">Target 4096 × 4096</div>}
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-white/48">Sumber: <span className="text-white/80">{selected.title}</span> · {selected.resolution}</div>
                  <button disabled={busy} onClick={() => handleProcess(active as GenerationStage)} className="flex items-center gap-2 rounded-full bg-[#ff9d42] px-5 py-3 text-sm font-semibold text-[#201307] transition hover:scale-105 hover:bg-[#ffb363] disabled:opacity-60">
                    {busy ? <LoaderCircle size={16} className="animate-spin" /> : active === "upscale" ? <Gauge size={16} /> : <Sparkles size={16} />} Proses & Simpan
                  </button>
                </div>
              </div>
            )}

            {(busy || progress > 0) && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-4">
                <div className="mb-2 flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-white/60"><LoaderCircle size={14} className="animate-spin text-[#ffad5d]" /> Memproses modul</span><span className="text-[#ffbd7e]">{progress}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-white/7"><div className="h-full rounded-full bg-gradient-to-r from-[#ff8424] to-[#ffc178] transition-all duration-200" style={{ width: `${progress}%` }} /></div>
              </div>
            )}
            {message && <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4 text-sm text-emerald-100/75"><Check size={17} className="mt-0.5 shrink-0 text-emerald-300" />{message}</div>}
            {error && <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/8 p-4 text-sm text-red-100/75"><AlertCircle size={17} className="mt-0.5 shrink-0 text-red-300" />{error}</div>}
          </section>

          <aside className="glass-soft rounded-[27px] p-4">
            <div className="flex items-center justify-between"><span className="text-[11px] font-medium uppercase tracking-[.18em] text-white/35">Hasil Aktif</span><ImageIcon size={16} className="text-white/28" /></div>
            <div className="mt-4 aspect-square overflow-hidden rounded-[22px] border border-white/10 bg-black/25"><MotifArt id={`active-${selected.id}`} variant={selected.variant} colors={selected.colors} seamless className="h-full w-full" /></div>
            <h3 className="mt-4 font-semibold">{selected.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[.12em] text-white/40"><span className="rounded-full border border-white/10 px-2.5 py-1">{selected.stage}</span><span className="rounded-full border border-white/10 px-2.5 py-1">{selected.resolution}</span></div>
            <p className="mt-4 line-clamp-4 text-xs leading-5 text-white/38">{selected.prompt}</p>
            <button onClick={() => downloadResultMetadata(selected)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white/65 transition hover:bg-white/10 hover:text-white"><Download size={15} /> Unduh metadata</button>

            <div className="mt-6 border-t border-white/8 pt-5">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[.18em] text-white/35">Variasi Sesi</div>
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {results.map((item) => (
                  <button key={item.id} onClick={() => setSelectedId(item.id)} className={cn("flex w-full items-center gap-3 rounded-2xl border p-2 text-left transition", selected.id === item.id ? "border-[#ff9d42]/35 bg-[#ff9d42]/10" : "border-white/8 bg-white/3 hover:bg-white/6")}>
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl"><MotifArt id={`thumb-${item.id}`} variant={item.variant} colors={item.colors} className="h-full w-full" /></div>
                    <div className="min-w-0"><div className="truncate text-xs font-medium text-white/80">{item.title}</div><div className="mt-1 text-[10px] text-white/34">{item.stage} · {item.resolution}</div></div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
