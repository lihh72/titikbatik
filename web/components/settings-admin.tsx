"use client";

import { adminClass } from "@/components/admin-styles";
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

  function apply(data: Record<string, Record<string, unknown>>) {
    setSettings(data);
    const first = Object.keys(data)[0];
    if (first) {
      setKey(first);
      setValue(JSON.stringify(data[first], null, 2));
    }
  }

  useEffect(() => {
    let active = true;
    listSettings()
      .then((data) => {
        if (active) apply(data);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Settings gagal dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    if (!key.trim()) {
      setError("Key settings wajib diisi.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await putSetting(key.trim(), parseSettingObject(value));
      apply(await listSettings());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Settings gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={adminClass("admin-resource")} aria-labelledby="settings-title">
      <header className={adminClass("admin-resource-hero")}>
        <div><p className={adminClass("admin-eyebrow")}>Application state</p><h1 id="settings-title">Pengaturan Sistem</h1><p>Nilai JSON yang disimpan oleh automation.</p></div>
      </header>
      {error && <div role="alert" className={adminClass("admin-alert")}><AlertCircle size={17} aria-hidden="true" />{error}</div>}
      {loading ? <div className={adminClass("admin-loading")}><LoaderCircle className="animate-spin" size={17} aria-hidden="true" />Memuat settings...</div> : (
        <div className={adminClass("admin-resource-layout")}>
          <section className={adminClass("admin-resource-list")} aria-label="Daftar settings">
            {Object.keys(settings).map((item) => <button key={item} type="button" onClick={() => { setKey(item); setValue(JSON.stringify(settings[item], null, 2)); }} className={adminClass("admin-resource-list-item")} data-active={key === item}><strong>{item}</strong></button>)}
            <button type="button" onClick={() => { setKey(""); setValue("{}"); }} className={adminClass("admin-secondary-action")}><Plus size={14} aria-hidden="true" />Setting baru</button>
          </section>
          <section className={adminClass("admin-resource-detail")}>
            <div className={adminClass("admin-detail-card admin-form-stack")}>
              <label>Key settings<input className={adminClass("admin-field")} value={key} onChange={(event) => setKey(event.target.value)} /></label>
              <label>JSON settings<textarea className={adminClass("admin-field admin-textarea admin-code-field")} value={value} onChange={(event) => setValue(event.target.value)} /></label>
              <button type="button" disabled={busy} onClick={() => void save()} className={adminClass("admin-primary-action")}><Save size={15} aria-hidden="true" />Simpan settings</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
