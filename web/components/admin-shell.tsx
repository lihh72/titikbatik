"use client";

import { adminClass } from "@/components/admin-styles";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className={adminClass("admin-workbench-shell")}>
      <AdminSidebar onLogout={logout} />
      <div className={adminClass("admin-workbench-main")}>
        <div className={adminClass("admin-workbench-note")} aria-label="Status area admin">
          <ShieldCheck size={14} aria-hidden="true" />
          Area administrator, tidak ditampilkan kepada pengguna umum
        </div>
        <main id="admin-content" className={adminClass("admin-workbench-content")}>
          {children}
        </main>
      </div>
    </div>
  );
}
