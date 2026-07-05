"use client";

import { MotifCard } from "@/components/motif-card";
import { Feedback } from "@/components/ui/feedback";
import { PageHeading } from "@/components/ui/page-heading";
import { listPublicBatiks } from "@/lib/automation-api";
import type { Batik, Pagination } from "@/lib/automation-types";
import { Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

const pageButtonClass = "min-h-11 rounded-[var(--radius-sm)] border border-[color:var(--line)] px-4 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--terracotta-dark)] hover:text-[color:var(--terracotta-dark)] disabled:cursor-not-allowed disabled:opacity-40";

export function GalleryPage() {
  const [items, setItems] = useState<Batik[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, per_page: 32, total: 0, total_pages: 0 });
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listPublicBatiks({ page, perPage: 32, query: activeQuery })
      .then((result) => {
        if (active) {
          setItems(result.items);
          setPagination(result.pagination);
          setError(null);
        }
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Galeri gagal dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeQuery, page]);

  function search(event: FormEvent) {
    event.preventDefault();
    const nextQuery = query.trim();
    if (nextQuery === activeQuery && page === 1) return;
    setLoading(true);
    setError(null);
    setPage(1);
    setActiveQuery(nextQuery);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8" data-page-surface="archive-light">
      <section className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper-raised)] p-5 shadow-[0_24px_70px_rgba(88,70,49,0.10)] sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
          <PageHeading
            eyebrow="Arsip motif"
            title="Galeri motif terkurasi"
            description="Jelajahi motif yang sudah dipublikasikan. Preview kostum muncul saat kartu diarahkan, sementara motif tetap menjadi arsip utama."
          />

          <form
            onSubmit={search}
            className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
            role="search"
            aria-label="Pencarian koleksi"
          >
            <div className="flex min-h-14 items-center gap-2">
              <label htmlFor="gallery-query" className="sr-only">Cari motif, warna, atau style</label>
              <Search size={18} className="ml-3 text-[color:var(--ink-soft)]" aria-hidden="true" />
              <input
                id="gallery-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari motif, warna, atau style"
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:var(--ink-soft)]"
              />
              <button
                type="submit"
                className="min-h-11 rounded-[var(--radius-sm)] bg-[color:var(--ink)] px-5 text-sm font-semibold text-[color:var(--paper-raised)] transition hover:bg-[color:var(--terracotta-dark)]"
              >
                Cari
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm text-[color:var(--ink-soft)]">
          <span className="rounded-[var(--radius-sm)] border border-[color:var(--line)] px-4 py-2">{pagination.total} karya tersedia</span>
          <span className="rounded-[var(--radius-sm)] border border-[color:var(--line)] px-4 py-2">Halaman {pagination.page} dari {Math.max(pagination.total_pages, 1)}</span>
        </div>
      </section>

      {error && (
        <div className="mt-6">
          <Feedback kind="error">{error}</Feedback>
        </div>
      )}

      {loading ? (
        <div className="py-20">
          <Feedback>Menata motif dan metadata koleksi...</Feedback>
        </div>
      ) : error ? null : items.length ? (
        <>
          <section className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Daftar motif">
            {items.map((batik) => <MotifCard key={batik.id} batik={batik} />)}
          </section>

          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setLoading(true);
                setError(null);
                setPage((value) => value - 1);
              }}
              className={pageButtonClass}
            >
              Sebelumnya
            </button>
            <span className="text-sm text-[color:var(--ink-soft)]">
              {pagination.page} / {Math.max(pagination.total_pages, 1)}
            </span>
            <button
              type="button"
              disabled={page >= pagination.total_pages}
              onClick={() => {
                setLoading(true);
                setError(null);
                setPage((value) => value + 1);
              }}
              className={pageButtonClass}
            >
              Berikutnya
            </button>
          </div>
        </>
      ) : (
        <div className="py-20">
          <Feedback kind="empty">
            <strong>Belum ada batik terpublikasi.</strong>
            <span>Admin dapat mempublikasikan hasil dari halaman gallery internal.</span>
          </Feedback>
        </div>
      )}
    </main>
  );
}
