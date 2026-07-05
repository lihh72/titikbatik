import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AboutPage from "@/app/(public)/about/page";
import { SiteShell } from "@/components/site-shell";

const navigationMock = vi.hoisted(() => ({ pathname: "/gallery" }));
vi.mock("next/navigation", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/navigation")>(),
  usePathname: () => navigationMock.pathname,
}));

describe("public site shell", () => {
  beforeEach(() => {
    navigationMock.pathname = "/gallery";
    document.body.style.overflow = "";
  });

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

  it("behaves as a modal dialog and restores the page on close", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SiteShell><p>Isi halaman</p></SiteShell>);
    const trigger = screen.getByRole("button", { name: "Buka navigasi" });

    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Navigasi utama" });
    const closeButton = within(dialog).getByRole("button", { name: "Tutup dialog navigasi" });
    const links = within(dialog).getAllByRole("link");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(closeButton).toHaveFocus();
    expect(document.body).toHaveStyle({ overflow: "hidden" });
    expect(document.querySelector("#main-content")).toHaveAttribute("inert");
    expect(screen.getByRole("contentinfo", { hidden: true })).toHaveAttribute("inert");

    closeButton.focus();
    await user.tab({ shift: true });
    expect(links.at(-1)).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();

    links.at(-1)?.focus();
    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Navigasi utama" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buka navigasi" })).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
    expect(document.querySelector("#main-content")).not.toHaveAttribute("inert");
    expect(screen.getByRole("contentinfo")).not.toHaveAttribute("inert");

    await user.click(screen.getByRole("button", { name: "Buka navigasi" }));
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("makes every control outside the dialog inert while the drawer is open", async () => {
    const user = userEvent.setup();
    render(<SiteShell><p>Isi halaman</p></SiteShell>);

    await user.click(screen.getByRole("button", { name: "Buka navigasi" }));
    const controls = document.querySelector(".public-navbar-controls");
    expect(controls).toHaveAttribute("inert");

    await user.click(within(screen.getByRole("dialog", { name: "Navigasi utama" })).getByRole("button", { name: "Tutup dialog navigasi" }));
    expect(controls).not.toHaveAttribute("inert");
  });

  it("preserves inert state that existed before the drawer opened", async () => {
    const user = userEvent.setup();
    render(<SiteShell><p>Isi halaman</p></SiteShell>);
    const main = document.querySelector("#main-content");
    main?.setAttribute("inert", "");

    await user.click(screen.getByRole("button", { name: "Buka navigasi" }));
    await user.keyboard("{Escape}");

    expect(main).toHaveAttribute("inert");
  });

  it("keeps a rendered drawer visible outside the mobile breakpoint", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const drawerRules = [...css.matchAll(/\.public-mobile-nav\s*\{([^}]*)\}/g)].map((match) => match[1]);
    const baseRule = drawerRules[0] ?? "";

    expect(baseRule).toMatch(/position:\s*fixed/);
    expect(baseRule).toMatch(/display:\s*grid/);
    expect(baseRule).toMatch(/overflow-y:\s*auto/);
    expect(drawerRules).not.toHaveLength(0);
    drawerRules.forEach((rule) => expect(rule).not.toMatch(/display:\s*none/));
  });

  it("does not restore focus to the menu trigger when a navigation link closes the dialog", async () => {
    const user = userEvent.setup();
    render(<SiteShell><p>Isi halaman</p></SiteShell>);

    await user.click(screen.getByRole("button", { name: "Buka navigasi" }));
    const dialog = screen.getByRole("dialog", { name: "Navigasi utama" });
    const aboutLink = within(dialog).getByRole("link", { name: "Tentang" });
    aboutLink.addEventListener("click", (event) => event.preventDefault());
    aboutLink.focus();
    fireEvent.click(aboutLink);

    expect(screen.queryByRole("dialog", { name: "Navigasi utama" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buka navigasi" })).not.toHaveFocus();
  });

  it("matches collection routes only on path boundaries", () => {
    navigationMock.pathname = "/gallery/example-slug";
    const { unmount } = render(<SiteShell><p>Isi halaman</p></SiteShell>);
    expect(within(screen.getByRole("navigation", { name: "Navigasi utama" })).getByRole("link", { name: "Koleksi" })).toHaveAttribute("aria-current", "page");

    unmount();
    navigationMock.pathname = "/gallery-old";
    render(<SiteShell><p>Isi halaman</p></SiteShell>);
    expect(within(screen.getByRole("navigation", { name: "Navigasi utama" })).getByRole("link", { name: "Koleksi" })).not.toHaveAttribute("aria-current");
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

  it("provides a real target for the visual sources footer link", () => {
    render(<AboutPage />);

    expect(document.querySelector("#sumber-visual")).toBeInTheDocument();
  });
});
