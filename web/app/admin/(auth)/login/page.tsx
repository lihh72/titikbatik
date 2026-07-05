import { AdminLoginPage } from "@/components/admin-login-page";
import { Feedback } from "@/components/ui/feedback";
import { Suspense } from "react";

export const metadata = { title: "Curator Workbench" };

export default function Page() {
  return (
    <Suspense fallback={<Feedback>Memuat halaman admin.</Feedback>}>
      <AdminLoginPage />
    </Suspense>
  );
}
