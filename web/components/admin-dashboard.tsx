"use client";

import { adminClass } from "@/components/admin-styles";
import { getDashboard } from "@/lib/automation-api";
import type { DashboardData } from "@/lib/automation-types";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Database, Eye, LoaderCircle, RefreshCw, Server, WandSparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function formatHeartbeat(value?: string | null) {
  if (!value) return "Belum ada heartbeat";
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getDashboard());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Dashboard gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getDashboard()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Dashboard gagal dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const metrics = data ? [
    { label: "Total batik", value: data.total_batik, icon: Database },
    { label: "Dipublikasikan", value: data.published_batik, icon: Eye },
    { label: "Batch aktif", value: data.active_batches, icon: Activity },
    { label: "Job gagal", value: data.job_failed, icon: AlertTriangle },
  ] : [];

  const pipeline = data ? [
    { label: "Prompt", value: data.active_batches, helper: "batch aktif", icon: WandSparkles },
    { label: "Generate", value: data.job_queued, helper: "job antre", icon: Clock3 },
    { label: "Combine", value: data.job_running, helper: "job berjalan", icon: Activity },
    { label: "Video", value: data.job_failed, helper: "perlu cek", icon: AlertTriangle },
  ] : [];

  return (
    <section className={adminClass("admin-dashboard")} aria-labelledby="admin-dashboard-title">
      <header className={adminClass("admin-dashboard-hero")}>
        <div>
          <p className={adminClass("admin-eyebrow")}>Pusat produksi</p>
          <h1 id="admin-dashboard-title">Status produksi Titik Batik</h1>
          <p>
            Pantau pipeline dari prompt, generate, combine, sampai video tanpa kehilangan konteks kurasi.
          </p>
        </div>
        <div className={adminClass("admin-dashboard-actions")}>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className={adminClass("admin-icon-action")}
            aria-label="Muat ulang dashboard"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          </button>
          <Link href="/admin/studio" className={adminClass("admin-primary-action")}>
            <WandSparkles size={16} aria-hidden="true" />
            Buat batch
          </Link>
        </div>
      </header>

      {loading && !data && (
        <div className={adminClass("admin-loading")}>
          <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
          Memuat dashboard...
        </div>
      )}

      {error && (
        <div role="alert" className={adminClass("admin-alert")}>
          <AlertTriangle size={17} aria-hidden="true" />
          {error}
        </div>
      )}

      {data && (
        <>
          <section className={adminClass("admin-pipeline-panel")} aria-labelledby="admin-pipeline-title">
            <div>
              <p className={adminClass("admin-eyebrow")}>Pipeline aktif</p>
              <h2 id="admin-pipeline-title">Tahap produksi hari ini</h2>
            </div>
            <ul aria-label="Tahap produksi" className={adminClass("admin-pipeline-list")}>
              {pipeline.map(({ label, value, helper, icon: Icon }) => (
                <li key={label} className={adminClass("admin-pipeline-item")}>
                  <span className={adminClass("admin-pipeline-icon")}><Icon size={17} aria-hidden="true" /></span>
                  <span>
                    <strong>{label}</strong>
                    <small>{helper}</small>
                  </span>
                  <b>{value}</b>
                </li>
              ))}
            </ul>
          </section>

          <section className={adminClass("admin-metric-grid")} aria-label="Ringkasan koleksi dan batch">
            {metrics.map(({ label, value, icon: Icon }) => (
              <article key={label} className={adminClass("admin-metric-card")}>
                <Icon size={18} aria-hidden="true" />
                <p>{label}</p>
                <strong>{value}</strong>
              </article>
            ))}
          </section>

          <section className={adminClass("admin-system-grid")} aria-label="Kesehatan sistem">
            <article className={adminClass("admin-system-card")}>
              <div className={adminClass("admin-system-card-heading")}>
                <span><Server size={17} aria-hidden="true" />ComfyUI</span>
                <strong data-state={data.comfyui === "connected" ? "good" : "bad"}>
                  {data.comfyui === "connected" ? "Terhubung" : "Terputus"}
                </strong>
              </div>
              <dl>
                <div>
                  <dt>Job antre</dt>
                  <dd>{data.job_queued}</dd>
                </div>
                <div>
                  <dt>Job berjalan</dt>
                  <dd>{data.job_running}</dd>
                </div>
              </dl>
            </article>

            <article className={adminClass("admin-system-card")}>
              <div className={adminClass("admin-system-card-heading")}>
                <span><CheckCircle2 size={17} aria-hidden="true" />Heartbeat worker</span>
                <strong>{data.last_worker_heartbeat?.worker_id ?? "Belum aktif"}</strong>
              </div>
              <p>{formatHeartbeat(data.last_worker_heartbeat?.heartbeat_at)}</p>
              <small>Sinkronisasi worker terakhir yang tercatat di backend.</small>
            </article>
          </section>
        </>
      )}
    </section>
  );
}
