import { GalleryDetailPage } from "@/components/gallery-detail-page";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GalleryDetailPage slug={slug} />;
}
