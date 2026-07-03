import type { Metadata } from "next";
import { AppProvider } from "@/components/app-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TitikBatik AI — Galeri Batik Digital",
    template: "%s | TitikBatik AI",
  },
  description: "Galeri publik motif batik digital terkurasi dari TitikBatik AI.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
