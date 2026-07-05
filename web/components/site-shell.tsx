import { PublicFooter } from "@/components/public-footer";
import { PublicNavbar } from "@/components/public-navbar";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell">
      <a className="skip-link" href="#main-content">Lewati ke konten</a>
      <PublicNavbar />
      <div id="main-content" tabIndex={-1}>{children}</div>
      <PublicFooter />
    </div>
  );
}
