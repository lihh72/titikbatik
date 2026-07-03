import { AdminLoginPage } from "@/components/admin-login-page";
import { Suspense } from "react";

export const metadata = { title: "Login Admin" };

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090a0b] text-white grid place-items-center">Memuat halaman admin...</div>}>
      <AdminLoginPage />
    </Suspense>
  );
}
