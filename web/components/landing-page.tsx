"use client";

import { EditorialStory } from "@/components/editorial-story";
import { MotifCard } from "@/components/motif-card";
import { Action } from "@/components/ui/action";
import { Feedback } from "@/components/ui/feedback";
import { listPublicBatiks } from "@/lib/automation-api";
import type { Batik } from "@/lib/automation-types";
import { useEffect, useState } from "react";

export function LandingPage() {
  const [items, setItems] = useState<Batik[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listPublicBatiks({ page: 1, perPage: 3 })
      .then((result) => { if (active) setItems(result.items); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <p className="landing-hero-kicker">Arsip Tekstil Nusantara</p>
          <h1 className="serif">Motif lama. Bahasa baru.</h1>
          <p className="landing-hero-copy">
            Arsip batik yang menghubungkan kerja tangan, pengetahuan material, dan eksperimen generatif yang dikurasi manusia.
          </p>
          <Action href="/gallery" className="landing-hero-action">Jelajahi koleksi</Action>
        </div>
      </section>

      <EditorialStory />

      <section className="landing-latest" aria-label="Koleksi terbaru">
        <header className="landing-section-heading">
          <div>
            <p>Koleksi terbaru</p>
            <h2 className="serif">Motif yang baru masuk arsip.</h2>
          </div>
          <Action href="/gallery" variant="quiet">Lihat seluruh koleksi</Action>
        </header>
        {loading ? (
          <Feedback>Memuat karya terbaru.</Feedback>
        ) : items.length ? (
          <div className="landing-motif-grid">
            {items.slice(0, 3).map((batik) => <MotifCard key={batik.id} batik={batik} />)}
          </div>
        ) : (
          <Feedback kind="empty">Belum ada karya yang dipublikasikan.</Feedback>
        )}
      </section>

      <section className="landing-ethics">
        <p className="landing-ethics-kicker">Prinsip arsip</p>
        <h2 className="serif">Etika visual, bukan catatan kaki.</h2>
        <div className="landing-ethics-copy">
          <p>
            Foto dokumenter diberi sumber dan lisensi. Visual buatan AI selalu ditandai,
            agar pengunjung dapat membedakan rekaman proses dari interpretasi konseptual.
          </p>
          <p>
            Hasil generatif diperlakukan sebagai eksperimen kuratorial, bukan klaim atas
            tradisi, komunitas, atau makna sakral tertentu.
          </p>
        </div>
      </section>

      <section className="landing-collection-cta">
        <h2 className="serif">Temukan bahasa visual yang tumbuh dari proses.</h2>
        <Action href="/gallery">Buka koleksi motif</Action>
      </section>
    </main>
  );
}
