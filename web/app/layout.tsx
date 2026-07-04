import type { Metadata } from "next";
import { Manrope, Source_Serif_4 } from "next/font/google";
import { AppProvider } from "@/components/app-provider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TitikBatik AI - Galeri Batik Digital",
    template: "%s | TitikBatik AI",
  },
  description: "Galeri publik motif batik digital terkurasi dari TitikBatik AI.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${manrope.variable} ${sourceSerif.variable}`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
