import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";
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
  it("keeps transitional archive surfaces opaque and readable for current light text", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const archivePanel = css.match(/\.archive-panel\s*\{([^}]*)\}/)?.[1];
    const archiveSoft = css.match(/\.archive-soft\s*\{([^}]*)\}/)?.[1];

    expect(archivePanel).toMatch(/\bbackground\s*:\s*var\(--ink\)\s*;/);
    expect(archivePanel).toMatch(/\bcolor\s*:\s*var\(--paper\)\s*;/);
    expect(archiveSoft).toMatch(/\bbackground\s*:\s*#26312b\s*;/i);
    expect(archiveSoft).toMatch(/\bcolor\s*:\s*var\(--paper\)\s*;/);
    expect(archivePanel).not.toMatch(/backdrop-filter/);
    expect(archiveSoft).not.toMatch(/backdrop-filter/);
  });

  it("contains no legacy glass surface class tokens in TSX", () => {
    const legacyTokens = new RegExp(`\\b(?:${["glass", "panel"].join("-")}|${["glass", "soft"].join("-")}|${["ambient", "noise"].join("-")})\\b`);
    const findLegacyConsumers = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      if (entry.name === "node_modules" || entry.name === ".next") return [];

      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return findLegacyConsumers(path);
      if (!entry.name.endsWith(".tsx")) return [];

      return legacyTokens.test(readFileSync(path, "utf8")) ? [path] : [];
    });

    expect(findLegacyConsumers(process.cwd())).toEqual([]);
  });

  it("keeps pressed action feedback after variant hover transforms in the CSS cascade", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const activeRule = css.match(/\.action:active:not\(:disabled\):not\(\[aria-disabled="true"\]\)\s*\{([^}]*)\}/);
    const hoverTransformIndices = Array.from(
      css.matchAll(/\.action-[\w-]+:not\(:disabled\):not\(\[aria-disabled="true"\]\):hover\s*\{[^}]*\btransform\s*:/g),
      ({ index }) => index,
    );

    expect(activeRule).not.toBeNull();
    expect(activeRule?.[1]).toMatch(/\btransform\s*:\s*translateY\(1px\)\s+scale\(0\.98\)\s*;/);
    expect(hoverTransformIndices.length).toBeGreaterThan(0);
    expect(activeRule?.index).toBeGreaterThan(Math.max(...hoverTransformIndices));
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

  it("makes aria-disabled link actions inert", () => {
    const onClick = vi.fn();
    render(<Action href="/gallery" aria-disabled="true" onClick={onClick}>Jelajahi koleksi</Action>);
    const action = screen.getByText("Jelajahi koleksi");

    expect(screen.queryByRole("link", { name: "Jelajahi koleksi" })).not.toBeInTheDocument();
    expect(action).not.toHaveAttribute("href");
    expect(action).toHaveAttribute("aria-disabled", "true");
    expect(action).toHaveAttribute("tabindex", "-1");
    fireEvent.click(action);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps enabled link actions navigable", () => {
    render(<Action href="/gallery">Jelajahi koleksi</Action>);

    expect(screen.getByRole("link", { name: "Jelajahi koleksi" })).toHaveAttribute("href", "/gallery");
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
