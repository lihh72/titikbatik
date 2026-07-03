"use client";

import { cancelBatch, getBatch, listBatchJobs, listBatches, retryFailedBatch } from "@/lib/automation-api";
import type { GenerationBatch, GenerationJob } from "@/lib/automation-types";
import { AlertCircle, Ban, LoaderCircle, RefreshCw, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const activeStatuses = new Set(["queued", "running"]);

function date(value: string | null) {
  return value ? new Date(value).toLocaleString("id-ID") : "-";
}

export function HistoryPage() {
  const [batches, setBatches] = useState<GenerationBatch[]>([]);
  const [selected, setSelected] = useState<GenerationBatch | null>(null);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async (id: string) => {
    const [batch, jobData] = await Promise.all([getBatch(id), listBatchJobs(id)]);
    setSelected(batch);
    setJobs(jobData);
  }, []);

  const load = useCallback(async (preferredId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBatches({ limit: 100, offset: 0 });
      setBatches(data);
      const id = preferredId && data.some((item) => item.id === preferredId) ? preferredId : data[0]?.id;
      if (id) await loadDetails(id);
      else { setSelected(null); setJobs([]); }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Riwayat batch gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [loadDetails]);

  useEffect(() => {
    let active = true;
    listBatches({ limit: 100, offset: 0 })
      .then(async (data) => {
        if (!active) return;
        setBatches(data);
        const requested = new URLSearchParams(window.location.search).get("batch");
        const id = requested && data.some((item) => item.id === requested) ? requested : data[0]?.id;
        if (id) await loadDetails(id);
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Riwayat batch gagal dimuat."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadDetails]);

  useEffect(() => {
    if (!selected || !activeStatuses.has(selected.status)) return;
    const timer = window.setInterval(() => {
      void loadDetails(selected.id).catch((reason) => setError(reason instanceof Error ? reason.message : "Polling gagal."));
    }, 2000);
    return () => window.clearInterval(timer);
  }, [loadDetails, selected]);

  async function action(kind: "cancel" | "retry") {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      if (kind === "cancel") await cancelBatch(selected.id);
      else await retryFailedBatch(selected.id);
      await load(selected.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Aksi batch gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1480px] px-4 pb-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div><p className="text-xs uppercase text-[#ffb66c]">Durable Worker</p><h1 className="mt-3 text-3xl font-semibold">Batch dan job</h1><p className="mt-3 text-sm text-white/45">Status nyata termasuk retry, error ComfyUI, dan output setiap tahap.</p></div>
        <button onClick={() => void load(selected?.id)} disabled={loading} className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/6" title="Muat ulang"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button>
      </header>
      {error && <div className="mt-5 flex gap-2 border border-red-400/20 bg-red-400/8 p-4 text-sm text-red-100/80"><AlertCircle size={17} />{error}</div>}
      {loading && !batches.length ? <div className="flex items-center gap-2 py-16 text-sm text-white/45"><LoaderCircle size={17} className="animate-spin" />Memuat batch...</div> :
        <div className="mt-6 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="max-h-[720px] overflow-auto border border-white/10">
            {batches.map((batch) => <button key={batch.id} onClick={() => void loadDetails(batch.id)} className={`block w-full border-b border-white/8 p-4 text-left ${selected?.id === batch.id ? "bg-[#ff9d42]/12" : "bg-black/15 hover:bg-white/5"}`}><div className="flex items-center justify-between gap-2"><span className="text-xs text-[#ffb66c]">{batch.status}</span><span className="text-xs text-white/35">{batch.progress_percent}%</span></div><p className="mt-2 truncate text-sm">{batch.id}</p><p className="mt-2 text-xs text-white/35">{date(batch.created_at)} · {batch.requested_count} motif</p></button>)}
            {!batches.length && <p className="p-6 text-sm text-white/40">Belum ada batch.</p>}
          </section>

          <section className="min-w-0">
            {selected ? <>
              <div className="border border-white/10 bg-white/4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase text-[#ffb66c]">{selected.status}</p><h2 className="mt-2 break-all text-lg font-medium">{selected.id}</h2></div><div className="flex gap-2">{activeStatuses.has(selected.status) && <button disabled={busy} onClick={() => void action("cancel")} className="flex items-center gap-2 border border-red-300/20 px-3 py-2 text-xs text-red-200"><Ban size={14} />Batalkan</button>}{selected.failed_count > 0 && <button disabled={busy} onClick={() => void action("retry")} className="flex items-center gap-2 border border-white/12 px-3 py-2 text-xs"><RotateCcw size={14} />Retry gagal</button>}</div></div>
                <div className="mt-5 grid grid-cols-3 gap-px bg-white/10 sm:grid-cols-5">{[["Antre", selected.queued_count], ["Berjalan", selected.running_count], ["Selesai", selected.completed_count], ["Gagal", selected.failed_count], ["Batal", selected.cancelled_count]].map(([label, value]) => <div key={String(label)} className="bg-[#11110f] p-3"><p className="text-xs text-white/35">{label}</p><p className="mt-1 text-xl">{value}</p></div>)}</div>
              </div>
              <div className="mt-4 overflow-x-auto border border-white/10"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-white/6 text-xs text-white/40"><tr><th className="p-3">Urutan</th><th className="p-3">Tahap</th><th className="p-3">Status</th><th className="p-3">Percobaan</th><th className="p-3">Output</th><th className="p-3">ComfyUI</th><th className="p-3">Error</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.id} className="border-t border-white/8"><td className="p-3">{job.sequence_number}</td><td className="p-3">{job.job_type}</td><td className="p-3 text-[#ffb66c]">{job.status}</td><td className="p-3">{job.attempt_count}/{job.max_attempts}</td><td className="max-w-48 truncate p-3">{job.output_filename ?? "-"}</td><td className="max-w-40 truncate p-3">{job.comfyui_prompt_id ?? "-"}</td><td className="max-w-72 p-3 text-red-200/75">{job.error_message ?? "-"}</td></tr>)}</tbody></table></div>
            </> : <p className="py-16 text-center text-sm text-white/40">Pilih batch untuk melihat job.</p>}
          </section>
        </div>}
    </main>
  );
}
