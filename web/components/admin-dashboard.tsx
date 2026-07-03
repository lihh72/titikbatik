"use client";

import { getDashboard } from "@/lib/automation-api";
import type { DashboardData } from "@/lib/automation-types";
import { Activity, AlertTriangle, Database, Eye, LoaderCircle, RefreshCw, Server, WandSparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
      .then((result) => { if (active) setData(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Dashboard gagal dimuat."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const metrics = data ? [
    { label: "Total batik", value: data.total_batik, icon: Database },
    { label: "Dipublikasikan", value: data.published_batik, icon: Eye },
    { label: "Batch aktif", value: data.active_batches, icon: Activity },
    { label: "Job gagal", value: data.job_failed, icon: AlertTriangle },
  ] : [];

  return (
    <main className="mx-auto max-w-[1480px] px-4 pb-10 sm:px-6 lg:px-8">
      <section className="border-b border-white/10 pb-7">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs uppercase text-[#ffb66c]">Dashboard Automation</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Status produksi Titik Batik</h1>
            <p className="mt-3 text-sm text-white/45">Data langsung dari FastAPI, SQLite, worker, dan ComfyUI.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void load()} disabled={loading} className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/6 text-white/65" title="Muat ulang"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button>
            <Link href="/admin/studio" className="flex items-center gap-2 rounded-full bg-[#ff9d42] px-5 py-3 text-sm font-semibold text-[#201307]"><WandSparkles size={16} />Buat batch</Link>
          </div>
        </div>
      </section>

      {loading && !data && <div className="flex items-center gap-2 py-16 text-sm text-white/45"><LoaderCircle size={17} className="animate-spin" />Memuat dashboard...</div>}
      {error && <div className="mt-6 border border-red-400/20 bg-red-400/8 p-4 text-sm text-red-100/80">{error}</div>}

      {data && <>
        <section className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, icon: Icon }) => <article key={label} className="bg-[#11110f] p-5"><Icon size={18} className="text-[#ffad5d]" /><p className="mt-5 text-xs uppercase text-white/35">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></article>)}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="border border-white/10 bg-white/4 p-5">
            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-medium"><Server size={17} className="text-[#ffad5d]" />ComfyUI</span><span className={data.comfyui === "connected" ? "text-emerald-300" : "text-red-300"}>{data.comfyui === "connected" ? "Terhubung" : "Terputus"}</span></div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><p className="text-white/35">Job antre</p><p className="mt-1 text-xl">{data.job_queued}</p></div><div><p className="text-white/35">Job berjalan</p><p className="mt-1 text-xl">{data.job_running}</p></div></div>
          </div>
          <div className="border border-white/10 bg-white/4 p-5">
            <p className="flex items-center gap-2 text-sm font-medium"><Activity size={17} className="text-[#ffad5d]" />Heartbeat worker</p>
            <p className="mt-5 text-sm text-white/60">{data.last_worker_heartbeat?.heartbeat_at ? new Date(data.last_worker_heartbeat.heartbeat_at).toLocaleString("id-ID") : "Belum ada heartbeat"}</p>
            <p className="mt-1 text-xs text-white/30">{data.last_worker_heartbeat?.worker_id ?? "Worker belum teridentifikasi"}</p>
          </div>
        </section>
      </>}
    </main>
  );
}
