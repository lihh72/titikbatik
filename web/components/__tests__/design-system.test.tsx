import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Action } from "@/components/ui/action";
import { Feedback } from "@/components/ui/feedback";
import { PageHeading } from "@/components/ui/page-heading";
import { LogoMark } from "@/components/logo";
import { SiteShell } from "@/components/site-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("design system", () => {
  it("keeps pressed action feedback after variant hover transforms in the CSS cascade", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const activeSelector = '.action:not(:disabled):not([aria-disabled="true"]):active';
    const activeIndex = css.lastIndexOf(activeSelector);
    const hoverTransformIndices = Array.from(
      css.matchAll(/\.action-[\w-]+:not\(:disabled\):not\(\[aria-disabled="true"\]\):hover\s*\{[^}]*\btransform\s*:/g),
      ({ index }) => index,
    );

    expect(hoverTransformIndices.length).toBeGreaterThan(0);
    expect(activeIndex).toBeGreaterThan(Math.max(...hoverTransformIndices));
  });

  it("renders semantic page and feedback regions", () => {
    render(<><PageHeading eyebrow="Koleksi" title="Jelajahi motif" /><Feedback kind="error">Galeri gagal dimuat.</Feedback></>);
    expect(screen.getByRole("heading", { name: "Jelajahi motif" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Galeri gagal dimuat.");
  });

  it("renders the brand mark and semantic action variants", () => {
    render(<><LogoMark /><Action href="/gallery">Jelajahi koleksi</Action></>);
    expect(screen.getByLabelText("TitikBatik AI")).toHaveClass("logo-mark");
    expect(screen.getByRole("link", { name: "Jelajahi koleksi" })).toHaveAttribute("href", "/gallery");
    expect(screen.getByRole("link", { name: "Jelajahi koleksi" })).toHaveAttribute("data-variant", "primary");
  });

  it("renders button actions with safe defaults and forwarded presentation", () => {
    render(
      <>
        <Action>Simpan konsep</Action>
        <Action type="submit" variant="danger" className="custom-action">Hapus konsep</Action>
      </>,
    );

    expect(screen.getByRole("button", { name: "Simpan konsep" })).toHaveAttribute("type", "button");
    expect(screen.getByRole("button", { name: "Hapus konsep" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("button", { name: "Hapus konsep" })).toHaveAttribute("data-variant", "danger");
    expect(screen.getByRole("button", { name: "Hapus konsep" })).toHaveClass("action", "action-danger", "custom-action");
  });

  it("can hide a decorative brand mark from assistive technology", () => {
    const { container } = render(<LogoMark decorative />);
    const mark = container.querySelector(".logo-mark");

    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark).not.toHaveAttribute("role");
    expect(mark).not.toHaveAttribute("aria-label");
  });

  it("announces a textual brand lockup exactly once", () => {
    render(<SiteShell><main /></SiteShell>);

    expect(screen.getByRole("link", { name: "TitikBatik AI" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("img", { name: "TitikBatik AI" })).not.toBeInTheDocument();
  });
});
