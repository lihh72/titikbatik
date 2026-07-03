import type { Batik } from "@/lib/automation-types";
import Image from "next/image";

export function BatikMedia({ batik }: { batik: Batik }) {
  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden bg-black/30">
        {batik.preview_url ? <Image unoptimized fill sizes="(max-width: 768px) 100vw, 420px" src={batik.preview_url} alt={`Preview ${batik.keyword}`} className="object-cover" /> : <div className="grid h-full place-items-center text-sm text-white/35">Preview belum tersedia</div>}
      </div>
      {batik.costume_files.map((costume, index) => {
        const costumeUrl = batik.costume_urls[index];
        const templateName = costume.template?.name ?? `Template ${costume.template_id ?? index + 1}`;
        return <div key={costume.id} className="grid gap-3 sm:grid-cols-2">
          <div className="relative aspect-[3/4] overflow-hidden bg-black/30">
            {costumeUrl ? <Image unoptimized fill sizes="(max-width: 768px) 100vw, 320px" src={costumeUrl} alt={`Costume ${templateName}`} className="object-cover" /> : <div className="grid h-full place-items-center text-sm text-white/35">Costume belum tersedia</div>}
          </div>
          <div className="aspect-[9/16] overflow-hidden bg-black/30">
            {costume.video_url ? <video src={costume.video_url} muted controls playsInline preload="metadata" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-white/35">Video belum tersedia</div>}
          </div>
        </div>;
      })}
    </div>
  );
}
