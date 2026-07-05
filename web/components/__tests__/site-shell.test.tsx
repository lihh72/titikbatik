import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteShell } from "@/components/site-shell";

vi.mock("next/navigation", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/navigation")>(),
  usePathname: () => "/gallery",
}));

describe("public site shell", () => {
  it("renders the public routes, active route, CTA, brand, and skip link", () => {
    render(<SiteShell><p>Isi halaman</p></SiteShell>);

    const navigation = screen.getByRole("navigation", { name: "Navigasi utama" });
    const expectedRoutes = [
      ["Beranda", "/"],
      ["Koleksi", "/gallery"],
      ["Tentang", "/about"],
      ["Bantuan", "/help"],
    ] as const;

    for (const [label, href] of expectedRoutes) {
      expect(within(navigation).getByRole("link", { name: label })).toHaveAttribute("href", href);
    }

    expect(within(navigation).getByRole("link", { name: "Koleksi" })).toHaveAttribute("aria-current", "page");
    for (const label of ["Beranda", "Tentang", "Bantuan"]) {
      expect(within(navigation).getByRole("link", { name: label })).not.toHaveAttribute("aria-current");
    }

    expect(screen.getByRole("link", { name: "Jelajahi koleksi" })).toHaveAttribute("href", "/gallery");
    const brand = screen.getByRole("link", { name: "TitikBatik AI" });
    expect(brand).toHaveAttribute("href", "/");
    expect(brand.querySelector(".logo-mark")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("link", { name: "Lewati ke konten" })).toHaveAttribute("href", "#main-content");
  });

  it("opens and closes the accessible mobile navigation", () => {
    render(<SiteShell><p>Isi halaman</p></SiteShell>);

    const menuButton = screen.getByRole("button", { name: "Buka navigasi" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog", { name: "Navigasi utama" })).not.toBeInTheDocument();

    fireEvent.click(menuButton);
    const dialog = screen.getByRole("dialog", { name: "Navigasi utama" });
    expect(screen.getByRole("button", { name: "Tutup navigasi" })).toHaveAttribute("aria-expanded", "true");

    const drawerRoute = within(dialog).getByRole("link", { name: "Tentang" });
    drawerRoute.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(drawerRoute);
    expect(screen.queryByRole("dialog", { name: "Navigasi utama" })).not.toBeInTheDocument();
  });

  it("renders the public footer routes and archive context", () => {
    render(<SiteShell><p>Isi halaman</p></SiteShell>);

    const footer = screen.getByRole("contentinfo");
    for (const [label, href] of [
      ["Beranda", "/"],
      ["Koleksi", "/gallery"],
      ["Tentang", "/about"],
      ["Bantuan", "/help"],
    ]) {
      expect(within(footer).getByRole("link", { name: label })).toHaveAttribute("href", href);
    }

    expect(within(footer).getByRole("link", { name: "Akses Admin" })).toHaveAttribute("href", "/admin/login");
    expect(within(footer).getByText(/kurasi manusia dan etika AI/i)).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "Sumber visual" })).toHaveAttribute("href", "/about#sumber-visual");
  });
});
