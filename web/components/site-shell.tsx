import { PublicFooter } from "@/components/public-footer";
import { PublicNavbar } from "@/components/public-navbar";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--paper)] pt-[72px] text-[color:var(--ink)] max-[55rem]:pt-16">
      <a
        className="fixed top-3 left-3 z-[90] -translate-y-[200%] bg-[var(--ink)] px-4 py-3 text-[color:var(--paper-raised)] focus:translate-y-0"
        href="#main-content"
      >
        Lewati ke konten
      </a>
      <PublicNavbar />
      <div className="flex-1" id="main-content" tabIndex={-1}>
        {children}
      </div>
      <PublicFooter />
    </div>
  );
}
