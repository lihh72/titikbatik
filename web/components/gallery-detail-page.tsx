"use client";

import { MotifDetail } from "@/components/motif-detail";
import { getPublicBatik } from "@/lib/automation-api";
import type { Batik } from "@/lib/automation-types";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function GalleryDetailPage({ slug }: { slug: string }) {
  const [batik, setBatik] = useState<Batik | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug.trim()) return;
    let active = true;
    getPublicBatik(slug).then((result) => { if (active) setBatik(result); }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Batik tidak tersedia."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  if (!slug.trim()) return <NotFound message="Slug batik tidak valid." />;
  if (loading) return <main className="mx-auto max-w-4xl px-4 py-20"><p className="flex items-center justify-center gap-2 text-sm text-white/45"><LoaderCircle size={17} className="animate-spin" />Memuat batik...</p></main>;
  if (!batik) return <NotFound message={error ?? "Batik tidak tersedia."} />;
  return <MotifDetail batik={batik} />;
}

function NotFound({ message }: { message: string }) { return <main className="mx-auto max-w-4xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">Batik tidak tersedia</h1><p className="mt-3 text-sm text-white/45">{message}</p><Link href="/gallery" className="mt-6 inline-flex bg-[#ff9d42] px-5 py-3 text-sm font-semibold text-[#201307]">Kembali ke galeri</Link></main>; }
