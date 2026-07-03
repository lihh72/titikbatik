"use client";

import { listSettings, putSetting } from "@/lib/automation-api";
import { parseSettingObject } from "@/lib/admin-resource-forms";
import { AlertCircle, LoaderCircle, Plus, Save } from "lucide-react";
import { useEffect, useState } from "react";

export function SettingsAdmin() {
  const [settings, setSettings] = useState<Record<string, Record<string, unknown>>>({});
  const [key, setKey] = useState("");
  const [value, setValue] = useState("{}");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function apply(data: Record<string, Record<string, unknown>>) { setSettings(data); const first = Object.keys(data)[0]; if (first) { setKey(first); setValue(JSON.stringify(data[first], null, 2)); } }
  useEffect(() => { let active = true; listSettings().then((data) => { if (active) apply(data); }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Settings gagal dimuat."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);

  async function save() { if (!key.trim()) { setError("Key settings wajib diisi."); return; } setBusy(true); setError(null); try { await putSetting(key.trim(), parseSettingObject(value)); apply(await listSettings()); } catch (reason) { setError(reason instanceof Error ? reason.message : "Settings gagal disimpan."); } finally { setBusy(false); } }

  return <main className="mx-auto max-w-[1100px] px-4 pb-10 sm:px-6 lg:px-8"><header className="border-b border-white/10 pb-6"><p className="text-xs uppercase text-[#ffb66c]">Application State</p><h1 className="mt-3 text-3xl font-semibold">Settings</h1><p className="mt-3 text-sm text-white/45">Nilai JSON yang disimpan oleh automation.</p></header>{error && <div className="mt-5 flex gap-2 border border-red-400/20 bg-red-400/8 p-4 text-sm text-red-100/80"><AlertCircle size={17} />{error}</div>}{loading ? <div className="flex items-center gap-2 py-16 text-sm text-white/45"><LoaderCircle className="animate-spin" size={17} />Memuat settings...</div> : <div className="mt-6 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]"><section className="border border-white/10">{Object.keys(settings).map((item) => <button key={item} onClick={() => { setKey(item); setValue(JSON.stringify(settings[item], null, 2)); }} className={`block w-full border-b border-white/8 px-4 py-3 text-left text-sm ${key === item ? "bg-[#ff9d42]/12" : ""}`}>{item}</button>)}<button onClick={() => { setKey(""); setValue("{}"); }} className="flex w-full items-center gap-2 px-4 py-3 text-sm text-[#ffb66c]"><Plus size={14} />Setting baru</button></section><section className="border border-white/10 p-5"><label className="text-xs text-white/45">Key<input className="mt-2 w-full border border-white/12 bg-black/25 px-3 py-2 text-sm outline-none" value={key} onChange={(event) => setKey(event.target.value)} /></label><label className="mt-4 block text-xs text-white/45">JSON<textarea className="mt-2 min-h-80 w-full border border-white/12 bg-black/25 p-3 font-mono text-sm outline-none" value={value} onChange={(event) => setValue(event.target.value)} /></label><button disabled={busy} onClick={() => void save()} className="mt-4 flex items-center gap-2 bg-[#ff9d42] px-5 py-2.5 text-sm font-semibold text-[#201307]"><Save size={15} />Simpan</button></section></div>}</main>;
}
