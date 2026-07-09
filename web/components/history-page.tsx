"use client";

import { adminClass } from "@/components/admin-styles";
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
      else {
        setSelected(null);
        setJobs([]);
      }
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
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Riwayat batch gagal dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
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
    <section className={adminClass("admin-resource")} aria-labelledby="history-title">
      <header className={adminClass("admin-resource-hero")}>
        <div>
          <p className={adminClass("admin-eyebrow")}>Durable worker</p>
          <h1 id="history-title">Batch dan job</h1>
          <p>Status nyata untuk antrean, retry, error ComfyUI, dan output setiap tahap.</p>
        </div>
        <button type="button" onClick={() => void load(selected?.id)} disabled={loading} className={adminClass("admin-icon-action")} aria-label="Muat ulang batch">
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} aria-hidden="true" />
        </button>
      </header>
      {error && <div role="alert" className={adminClass("admin-alert")}><AlertCircle size={17} aria-hidden="true" />{error}</div>}
      {loading && !batches.length ? <div className={adminClass("admin-loading")}><LoaderCircle size={17} className="animate-spin" aria-hidden="true" />Memuat batch...</div> :
        <div className={adminClass("admin-resource-layout")}>
          <section className={adminClass("admin-resource-list")} aria-label="Daftar batch">
            {batches.map((batch) => (
              <button key={batch.id} type="button" onClick={() => void loadDetails(batch.id)} aria-pressed={selected?.id === batch.id} className={adminClass("admin-resource-list-item")} data-active={selected?.id === batch.id}>
                <span className={adminClass("admin-resource-list-meta")}><b>{batch.status}</b><small>{batch.progress_percent}%</small></span>
                <strong>{batch.id}</strong>
                <small>{date(batch.created_at)} · {batch.requested_count} motif</small>
              </button>
            ))}
            {!batches.length && <p className={adminClass("admin-empty")}>Belum ada batch.</p>}
          </section>

          <section className={adminClass("admin-resource-detail")}>
            {selected ? <>
              <div className={adminClass("admin-detail-card")}>
                <div className={adminClass("admin-detail-head")}>
                  <div><p className={adminClass("admin-eyebrow")}>{selected.status}</p><h2>{selected.id}</h2></div>
                  <div className={adminClass("admin-action-row")}>{activeStatuses.has(selected.status) && <button type="button" disabled={busy} onClick={() => void action("cancel")} className={adminClass("admin-danger-action")}><Ban size={14} aria-hidden="true" />Batalkan batch</button>}{selected.failed_count > 0 && <button type="button" disabled={busy} onClick={() => void action("retry")} className={adminClass("admin-secondary-action")}><RotateCcw size={14} aria-hidden="true" />Retry gagal</button>}</div>
                </div>
                <div className={adminClass("admin-stat-grid")}>{[["Antre", selected.queued_count], ["Berjalan", selected.running_count], ["Selesai", selected.completed_count], ["Gagal", selected.failed_count], ["Batal", selected.cancelled_count]].map(([label, value]) => <div key={String(label)}><p>{label}</p><strong>{value}</strong></div>)}</div>
              </div>
              <div className={adminClass("admin-table-wrap")}><table className={adminClass("admin-table")}><thead><tr><th>Urutan</th><th>Tahap</th><th>Status</th><th>Percobaan</th><th>Output</th><th>ComfyUI</th><th>Error</th></tr></thead><tbody>{jobs.map((item) => <tr key={item.id}><td>{item.sequence_number}</td><td>{item.job_type}</td><td>{item.status}</td><td>{item.attempt_count}/{item.max_attempts}</td><td>{item.output_filename ?? "-"}</td><td>{item.comfyui_prompt_id ?? "-"}</td><td>{item.error_message ?? "-"}</td></tr>)}</tbody></table></div>
            </> : <p className={adminClass("admin-empty")}>Pilih batch untuk melihat job.</p>}
          </section>
        </div>}
    </section>
  );
}
